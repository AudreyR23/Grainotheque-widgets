// ===== ÉTAT GLOBAL =====
let recordsParId = new Map();     // id Grist -> ligne
let nonSauvegarde = false;        // vrai dès qu'une attribution est en attente
let attributions = new Map();     // id -> numéro attribué (utilisé aux étapes suivantes)
let analyse = null;               // résultat de analyserNumeros()
let texteRecherche = '';          // contenu du champ de recherche
const LIMITE_LISTE = 200;         // nombre max de lignes affichées
let enCours = false;              // vrai pendant l'écriture dans Grist
let colonnes = null;              // noms réels des colonnes associées (mappings)

// ===== STATUT =====
function majStatut() {
  const el = document.getElementById('statut');
  if (nonSauvegarde) {
    el.textContent = 'Non sauvegardé';
    el.classList.add('non-sauvegarde');
  } else {
    el.textContent = 'À jour';
    el.classList.remove('non-sauvegarde');
  }
}

// ===== OUTILS =====
function estNumeroValide(valeur) {
  return typeof valeur === 'number' && Number.isInteger(valeur) && valeur >= 1;
}

function estVide(valeur) {
  return valeur === null || valeur === undefined || valeur === '';
}

function nomAffichage(ligne) {
  return String(ligne.NomVariete || '').replace(/\n/g, ' - ');
}

function analyserNumeros() {
  const parNumero = new Map();   // numéro -> lignes qui le portent
  const sansNumero = [];
  const invalides = [];

  for (const ligne of recordsParId.values()) {
    const valeur = ligne.Num_epingle;
    if (estVide(valeur)) {
      sansNumero.push(ligne);
    } else if (estNumeroValide(valeur)) {
      if (!parNumero.has(valeur)) parNumero.set(valeur, []);
      parNumero.get(valeur).push(ligne);
    } else {
      invalides.push(ligne);
    }
  }

  let max = 0;
  for (const numero of parNumero.keys()) {
    if (numero > max) max = numero;
  }

  const trous = [];
  for (let n = 1; n <= max; n++) {
    if (!parNumero.has(n)) trous.push(n);
  }

  const doublons = [];
  for (const [numero, lignes] of parNumero) {
    if (lignes.length > 1) doublons.push({ numero: numero, lignes: lignes });
  }
  doublons.sort(function (a, b) { return a.numero - b.numero; });

  return {
    parNumero: parNumero,
    sansNumero: sansNumero,
    invalides: invalides,
    max: max,
    trous: trous,
    doublons: doublons,
    prochain: trous.length > 0 ? trous[0] : max + 1
  };
}

function normaliser(texte) {
  return String(texte || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Prochain numéro libre, en tenant compte des attributions en attente
function calculerProchain() {
  const pris = new Set(analyse.parNumero.keys());
  for (const numero of attributions.values()) pris.add(numero);

  let max = 0;
  for (const numero of pris) {
    if (numero > max) max = numero;
  }
  for (let n = 1; n <= max; n++) {
    if (!pris.has(n)) return { numero: n, nouveau: false };
  }
  return { numero: max + 1, nouveau: true };
}

// Retire les attributions devenues incohérentes après un changement dans Grist
function nettoyerAttributions() {
  for (const [id, numero] of Array.from(attributions)) {
    const ligne = recordsParId.get(id);
    if (!ligne || !estVide(ligne.Num_epingle) || analyse.parNumero.has(numero)) {
      attributions.delete(id);
    }
  }
  nonSauvegarde = attributions.size > 0;
}

// ===== AFFICHAGE =====
function ajouterLigne(parent, texte, classe) {
  const p = document.createElement('p');
  p.textContent = texte;
  if (classe) p.className = classe;
  parent.appendChild(p);
}

function afficherAnalyse() {
  const a = analyse;
  const nbProblemes = a.doublons.length + a.invalides.length;
  document.getElementById('alerte-titre').textContent =
    nbProblemes > 0 ? '⚠ Attention (' + nbProblemes + ')' : '';
  document.getElementById('resume').textContent =
    recordsParId.size + ' variétés lues : ' +
    a.parNumero.size + ' numéros valides distincts, ' +
    a.sansNumero.length + ' sans numéro, ' +
    a.invalides.length + ' invalides.';

  const zone = document.getElementById('analyse');
  zone.textContent = '';

  ajouterLigne(zone, 'Numéro maximum : ' + a.max);

  ajouterLigne(zone, 'Trous (' + a.trous.length + ')', 'titre');
  if (a.trous.length === 0) {
    ajouterLigne(zone, 'Aucun trou : la liste est complète.', 'info');
  } else {
    const limite = 100;
    let texte = a.trous.slice(0, limite).join(', ');
    if (a.trous.length > limite) texte += ' … (+' + (a.trous.length - limite) + ')';
    ajouterLigne(zone, texte, 'info');
  }

  ajouterLigne(zone, 'Prochain numéro à attribuer : ' + a.prochain +
    (a.trous.length === 0 ? ' (nouveau, max + 1)' : ' (premier trou)'), 'titre');

  ajouterLigne(zone, 'Doublons (' + a.doublons.length + ')', 'titre');
  if (a.doublons.length === 0) {
    ajouterLigne(zone, 'Aucun doublon.', 'info');
  }
  for (const d of a.doublons) {
    ajouterLigne(zone, 'N° ' + d.numero + ' : ' +
      d.lignes.map(nomAffichage).join('  |  '), 'alerte');
  }

  ajouterLigne(zone, 'Numéros invalides (' + a.invalides.length + ')', 'titre');
  if (a.invalides.length === 0) {
    ajouterLigne(zone, 'Aucun numéro invalide.', 'info');
  }
  for (const ligne of a.invalides) {
    ajouterLigne(zone, nomAffichage(ligne) + ' : valeur « ' +
      ligne.Num_epingle + ' »', 'alerte');
  }
}

function afficherListe() {
  const a = analyse;

  // Numéro proposé
  const prochain = calculerProchain();
  document.getElementById('prochain').textContent =
    'Prochain numéro à attribuer : ' + prochain.numero +
    (prochain.nouveau ? ' (nouveau, max + 1)' : ' (premier trou)');

  // Filtrage + tri (les variétés déjà attribuées en attente sont exclues)
  const filtre = normaliser(texteRecherche.trim());
  const correspondances = a.sansNumero
    .filter(function (ligne) {
      return !attributions.has(ligne.id) &&
        normaliser(ligne.NomVariete).includes(filtre);
    })
    .sort(function (x, y) {
      return nomAffichage(x).localeCompare(nomAffichage(y), 'fr');
    });

  // Compteur
  const affichees = Math.min(correspondances.length, LIMITE_LISTE);
  let texteCompteur = correspondances.length + ' variété(s) sans numéro';
  if (filtre) texteCompteur += ' correspondant à la recherche';
  if (correspondances.length > LIMITE_LISTE) {
    texteCompteur += ' (' + affichees + ' affichées, affine la recherche)';
  }
  document.getElementById('compteur').textContent = texteCompteur;

  // Liste
  const liste = document.getElementById('liste');
  liste.textContent = '';

  if (correspondances.length === 0) {
    const li = document.createElement('li');
    li.className = 'vide';
    li.textContent = filtre ? 'Aucun résultat.' : 'Toutes les variétés ont un numéro.';
    liste.appendChild(li);
    return;
  }

  for (const ligne of correspondances.slice(0, LIMITE_LISTE)) {
    const li = document.createElement('li');
    li.textContent = nomAffichage(ligne);
    li.dataset.id = ligne.id;
    liste.appendChild(li);
  }
}

function afficherAttentes() {
  const ul = document.getElementById('attentes');
  ul.textContent = '';

  const entrees = Array.from(attributions).sort(function (x, y) { return x[1] - y[1]; });
  document.getElementById('annuler-tout').hidden = entrees.length === 0;
  document.getElementById('sauvegarder').hidden = entrees.length === 0;
  if (entrees.length === 0) {
    const li = document.createElement('li');
    li.className = 'vide';
    li.textContent = 'Aucune attribution en attente.';
    ul.appendChild(li);
    return;
  }

  for (const [id, numero] of entrees) {
    const ligne = recordsParId.get(id);
    const li = document.createElement('li');

    const texte = document.createElement('span');
    texte.textContent = 'N° ' + numero + ' : ' + nomAffichage(ligne);
    li.appendChild(texte);

    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.textContent = 'Annuler';
    bouton.dataset.id = id;
    li.appendChild(bouton);

    ul.appendChild(li);
  }
}

function afficherMessage(texte, classe) {
  const el = document.getElementById('message');
  el.textContent = texte;
  el.className = 'info' + (classe ? ' ' + classe : '');
}

// ===== GRIST =====
// ===== ÉVÉNEMENTS =====
document.getElementById('recherche').addEventListener('input', function (e) {
  texteRecherche = e.target.value;
  afficherListe();
});

document.getElementById('liste').addEventListener('pointerup', function (e) {
  const li = e.target.closest('li[data-id]');
  if (!li) return;
  const id = Number(li.dataset.id);
  if (!recordsParId.has(id) || attributions.has(id)) return;

  attributions.set(id, calculerProchain().numero);
  nonSauvegarde = true;
  majStatut();
  afficherAttentes();
  afficherListe();
});

document.getElementById('attentes').addEventListener('pointerup', function (e) {
  const bouton = e.target.closest('button[data-id]');
  if (!bouton) return;
  attributions.delete(Number(bouton.dataset.id));
  nonSauvegarde = attributions.size > 0;
  majStatut();
  afficherAttentes();
  afficherListe();
});

document.getElementById('annuler-tout').addEventListener('pointerup', function () {
  attributions.clear();
  nonSauvegarde = false;
  majStatut();
  afficherAttentes();
  afficherListe();
});

document.getElementById('sauvegarder').addEventListener('pointerup', sauvegarder);

async function sauvegarder() {
  if (enCours || attributions.size === 0) return;

  // Contrôle 1 : les attributions sont-elles toujours cohérentes avec Grist ?
  const avant = attributions.size;
  nettoyerAttributions();
  if (attributions.size !== avant) {
    majStatut();
    afficherAttentes();
    afficherListe();
    afficherMessage('Des données ont changé dans Grist : ' +
      (avant - attributions.size) + ' attribution(s) retirée(s). ' +
      'Vérifie la liste puis sauvegarde à nouveau.', 'erreur');
    return;
  }

  // Contrôle 2 : pas deux fois le même numéro, et que des entiers >= 1
  const numeros = Array.from(attributions.values());
  if (new Set(numeros).size !== numeros.length || !numeros.every(estNumeroValide)) {
    afficherMessage('Sauvegarde annulée : numéros en double ou invalides.', 'erreur');
    return;
  }

  enCours = true;
  document.getElementById('sauvegarder').disabled = true;
  afficherMessage('Sauvegarde en cours…');

  try {
        if (!colonnes) throw new Error('colonnes non associées');
    const tableId = await grist.selectedTable.getTableId();
    const entrees = Array.from(attributions);
    const modifications = entrees; // sert au message final (modifications.length)
    const champs = {};
    champs[colonnes.Num_epingle] = entrees.map(function (e) { return e[1]; });
    champs[colonnes.Lettre] = entrees.map(function () { return ''; });
    await grist.docApi.applyUserActions([
      ['BulkUpdateRecord', tableId, entrees.map(function (e) { return e[0]; }), champs]
    ]);

    attributions.clear();
    nonSauvegarde = false;
    majStatut();
    afficherAttentes();
    afficherListe();
    afficherMessage(modifications.length + ' variété(s) numérotée(s) et sauvegardée(s).', 'ok');
  } catch (erreur) {
    afficherMessage('Erreur de sauvegarde : ' + (erreur && erreur.message ? erreur.message : erreur) +
      '. Les attributions sont conservées, tu peux réessayer.', 'erreur');
  } finally {
    enCours = false;
    document.getElementById('sauvegarder').disabled = false;
  }
}

grist.ready({
  requiredAccess: 'full',
  columns: [
    { name: 'NomVariete', title: 'Nom variété', type: 'Text' },
    { name: 'Num_epingle', title: 'N° épingle', type: 'Numeric' },
    { name: 'Lettre', title: 'Lettre', type: 'Text' }
  ]
});

grist.onRecords(function (records, mappings) {
  const lignes = grist.mapColumnNames(records);
  if (!lignes) {
    document.getElementById('resume').textContent =
      'Colonnes non associées : configure-les dans le panneau du widget.';
    return;
  }
  colonnes = mappings;
  recordsParId = new Map(lignes.map(function (l) { return [l.id, l]; }));
  analyse = analyserNumeros();
  afficherAnalyse();
  nettoyerAttributions();
  afficherAttentes();
  afficherListe();
  majStatut();
});