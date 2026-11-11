// ===== ÉTAT GLOBAL =====
let recordsParId = new Map();     // id Grist -> ligne
let nonSauvegarde = false;        // vrai dès qu'une attribution est en attente
let attributions = new Map();     // id -> numéro attribué 
let analyse = null;               // résultat de analyserNumeros()
let texteRecherche = '';          // contenu du champ de recherche
const LIMITE_LISTE = 40;         // nombre max de lignes affichées
let enCours = false;              // vrai pendant l'écriture dans Grist
let colonnes = null;              // noms réels des colonnes associées (mappings)

// ===== STATUT =====
function majStatut() {
  const el = document.getElementById('statut');
  if (nonSauvegarde) {
    el.textContent = 'Non sauvegardé';
    el.classList.add('non-sauvegarde');
  } else {
    el.textContent = '✓ À jour';
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
  const doublons = [];
  for (const [numero, lignes] of parNumero) {
    if (lignes.length > 1) doublons.push({ numero: numero, lignes: lignes });
  }
  doublons.sort(function (a, b) { return a.numero - b.numero; });

  return {
    parNumero: parNumero,
    sansNumero: sansNumero,
    invalides: invalides,
    doublons: doublons
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
function ajouterDiv(parent, texte, classe) {
  const div = document.createElement('div');
  div.textContent = texte;
  div.className = classe;
  parent.appendChild(div);
}

function afficherAnalyse() {
  const a = analyse;
  const nbAnomalies = a.doublons.length + a.invalides.length;
  document.getElementById('anomalies').hidden = nbAnomalies === 0;

  const zone = document.getElementById('anomalies-contenu');
  zone.textContent = '';

  if (a.doublons.length > 0) {
    ajouterDiv(zone, '⚠ Doublons (' + a.doublons.length + ')', 'cadre-info-a-jour-titre');
    for (const d of a.doublons) {
      ajouterDiv(zone, 'N° ' + d.numero + ' : ' +
        d.lignes.map(nomAffichage).join('  |  '), 'erreur');
    }
  }
  if (a.invalides.length > 0) {
    ajouterDiv(zone, '⚠ Numéros invalides (' + a.invalides.length + ')', 'cadre-info-a-jour-titre');
    for (const ligne of a.invalides) {
      ajouterDiv(zone, nomAffichage(ligne) + ' : valeur « ' +
        ligne.Num_epingle + ' »', 'erreur');
    }
  }
}

function afficherListe() {
  const a = analyse;

  // Numéro proposé
  const prochain = calculerProchain();
  document.getElementById('prochain').textContent =
    'N° ' + prochain.numero + (prochain.nouveau ? ' (nouveau)' : '');

  // Variétés disponibles (hors attributions en attente)
  const disponibles = a.sansNumero.filter(function (ligne) {
    return !attributions.has(ligne.id);
  });

   // Liste déroulante : vide tant que rien n'est tapé
  const liste = document.getElementById('liste');
  liste.textContent = '';
  const filtre = normaliser(texteRecherche.trim());
  if (!filtre) { liste.hidden = true; return; }

  const correspondances = disponibles
    .filter(function (ligne) {
      return normaliser(ligne.NomVariete).includes(filtre);
    })
    .sort(function (x, y) {
      return nomAffichage(x).localeCompare(nomAffichage(y), 'fr');
    });

  for (const ligne of correspondances.slice(0, LIMITE_LISTE)) {
    const li = document.createElement('li');
    li.textContent = nomAffichage(ligne);
    li.dataset.id = ligne.id;
    liste.appendChild(li);
  }
  if (correspondances.length === 0) {
    const li = document.createElement('li');
    li.className = 'vide';
    li.textContent = 'Aucune variété trouvée';
    liste.appendChild(li);
  } else if (correspondances.length > LIMITE_LISTE) {
    const li = document.createElement('li');
    li.className = 'vide';
    li.textContent = '… ' + (correspondances.length - LIMITE_LISTE) + ' autres, précise ta recherche';
    liste.appendChild(li);
  }

  // N'ouvre la liste que si le champ est actif (évite qu'elle rouvre après une mise à jour Grist)
  liste.hidden = document.activeElement !== document.getElementById('recherche');
}

function afficherAttentes() {
  const ul = document.getElementById('attentes');
  ul.textContent = '';

  const entrees = Array.from(attributions).sort(function (x, y) { return x[1] - y[1]; });
  document.getElementById('en-attente').hidden = entrees.length === 0;
  document.getElementById('titre-attentes').textContent =
    'À enregistrer (' + entrees.length + ')';

  for (const [id, numero] of entrees) {
    const ligne = recordsParId.get(id);
    const li = document.createElement('li');
    li.className = 'brouillon';

    const texte = document.createElement('strong');
    texte.textContent = 'N° ' + numero + ' : ' + nomAffichage(ligne);
    li.appendChild(texte);

    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'btn-suppr';
    bouton.textContent = '✕';
    bouton.title = 'Retirer de la liste';
    bouton.dataset.id = id;
    li.appendChild(bouton);

    ul.appendChild(li);
  }
}

function afficherMessage(texte, classe) {
  const el = document.getElementById('message');
  el.textContent = texte;
  el.className = classe || 'info';
  el.hidden = !texte;
}

// ===== ÉVÉNEMENTS =====
const champRecherche = document.getElementById('recherche');
const listeVarietes = document.getElementById('liste');

champRecherche.addEventListener('input', function (e) {
  texteRecherche = e.target.value;
  afficherListe();
});
champRecherche.addEventListener('focus', function () {
  champRecherche.select();
  afficherListe();
});
champRecherche.addEventListener('blur', function () {
  listeVarietes.hidden = true;
});

// mousedown bloqué : le champ garde le focus, la liste reste ouverte jusqu'au click
listeVarietes.addEventListener('mousedown', function (e) { e.preventDefault(); });

listeVarietes.addEventListener('click', function (e) {
  const li = e.target.closest('li[data-id]');
  if (!li) return;
  const id = Number(li.dataset.id);
  if (!recordsParId.has(id) || attributions.has(id)) return;

  attributions.set(id, calculerProchain().numero);
  nonSauvegarde = true;

  // Champ vidé et prêt pour la variété suivante
  texteRecherche = '';
  champRecherche.value = '';

  majStatut();
  afficherAttentes();
  afficherListe();
  champRecherche.focus();
});

document.getElementById('attentes').addEventListener('click', function (e) {
  const bouton = e.target.closest('button[data-id]');
  if (!bouton) return;
  attributions.delete(Number(bouton.dataset.id));
  nonSauvegarde = attributions.size > 0;
  majStatut();
  afficherAttentes();
  afficherListe();
});

document.getElementById('sauvegarder').addEventListener('click', sauvegarder);

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
    afficherMessage(entrees.length + ' variété(s) numérotée(s) et sauvegardée(s).', 'succes');
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
    afficherMessage('Colonnes non associées : configure-les dans le panneau du widget.', 'erreur');    
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