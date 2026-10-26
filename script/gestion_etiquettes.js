// ===== État global =====
let modifie = false;
let brouillons = [];   // { idSemis, nb } : étiquettes à ajouter
let enregistrementEnCours = false;
let recherche = '';
const recordsParId = {
  semis: new Map()
};

// ===== Utilitaires (copiés de ton outil) =====
function tableEnLignes(tableau) {
  const colonnes = Object.keys(tableau);
  const lignes = [];
  for (let i = 0; i < tableau.id.length; i++) {
    const ligne = {};
    for (const c of colonnes) ligne[c] = tableau[c][i];
    lignes.push(ligne);
  }
  return lignes;
}


function dateAffichee(secondes) {
  return new Date(secondes * 1000).toLocaleDateString('fr-FR', { timeZone: 'UTC' });
}

function normaliser(texte) {
  return String(texte || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

/*ajouter choix du ou*/
function listeChoix(valeur) {
  // ChoiceList Grist : ['L', 'a', 'b'] → ['a', 'b']
  return Array.isArray(valeur) && valeur[0] === 'L' ? valeur.slice(1) : [];
}

// ===== Chargement =====
async function chargerSemis() {
  const tab = await grist.docApi.fetchTable('Semis');
  recordsParId.semis.clear();
  for (const s of tableEnLignes(tab)) {
    recordsParId.semis.set(s.id, {
      id: s.id,
      nom: s.Nom || '',
      variete: s.Variete || '',
      anneeGraine: s.Annee_graine || null,
      plantes: s.Plantes || 0,
      datePlantation: typeof s.Date_p === 'number' ? s.Date_p : null,
      ou: listeChoix(s.Ou),
      positions: s.Positions || '',
      nbEtiquettes: s.Nb_etiquettes || 0,
      enAttente: s.Etiq_en_attente || 0,
      planteMere: !!s.Plante_mere,
      anneePlantation: s.Annee_plantation_mil || null
    });
  }
}

// ===== Sélection =====
function entreesEtiquetables() {
  return [...recordsParId.semis.values()].filter(s =>
    s.planteMere ? !!s.anneePlantation : s.plantes > 0);
}

// ===== Affichage =====
function libelle(s) {
  return s.variete ? `${s.nom} — ${s.variete}` : s.nom;
}

function detailEntree(s) {
  const parties = [];
  if (s.planteMere) {
    parties.push('plante mère' + (s.anneePlantation ? ` plantée en ${s.anneePlantation}` : ''));
  }
  if (s.plantes > 0) {
    parties.push(`${s.plantes} planté${s.plantes > 1 ? 's' : ''}` +
      (s.datePlantation ? ` le ${dateAffichee(s.datePlantation)}` : ''));
  }
  if (s.anneeGraine) parties.push(`graines ${s.anneeGraine}`);
  if (s.ou.length) parties.push(`Où : ${s.ou.join(', ')}`);
  return parties.join(' · ');
}

function filtrerParRecherche(semis) {
  if (!recherche) return semis;
  const mots = recherche.split(' ');
  return semis.filter(s => {
    const texte = normaliser(s.nom + ' ' + s.variete);
    return mots.every(mot => texte.includes(mot));
  });
}

function afficherSelection() {
  const liste = document.getElementById('listeSelection');
  const tous = entreesEtiquetables().sort((a, b) =>
    libelle(a).localeCompare(libelle(b), 'fr') || a.id - b.id);
  const semis = filtrerParRecherche(tous);
  liste.innerHTML = '';
  document.getElementById('titreSelection').textContent = recherche
    ? `À étiqueter (${semis.length} sur ${tous.length})`
    : `À étiqueter (${tous.length})`;

  for (const s of semis) {
    const li = document.createElement('li');
    li.className = 'semis';
    li.dataset.id = s.id;

    const ligne1 = document.createElement('strong');
    ligne1.textContent = libelle(s);

    const ligne2 = document.createElement('div');
    ligne2.className = 'semis-detail';
    ligne2.textContent = detailEntree(s);

    const brouillon = brouillons.find(b => b.idSemis === s.id);
    li.classList.toggle('brouillon', !!brouillon);

    const saisie = document.createElement('div');
    saisie.className = 'saisie';
    const champ = document.createElement('input');
    champ.type = 'number';
    champ.min = '1';
    champ.step = '1';
    champ.inputMode = 'numeric';
    champ.placeholder = 'Étiquettes';
    champ.className = 'champ-etiquettes';
    if (brouillon) champ.value = brouillon.nb;
    saisie.appendChild(champ);

    li.append(ligne1, ligne2, saisie);

    if (s.nbEtiquettes > 0 || s.enAttente > 0) {
      const info = document.createElement('div');
      info.className = 'semis-detail';
      const alerte = document.createElement('span');
      alerte.className = 'semis-retard';
      const morceaux = [];
      if (s.nbEtiquettes > 0) morceaux.push(`${s.nbEtiquettes} à imprimer`);
      if (s.enAttente > 0) morceaux.push(`${s.enAttente} imprimée${s.enAttente > 1 ? 's' : ''} en attente`);
      alerte.textContent = '⚠ ' + morceaux.join(' · ');
      info.appendChild(alerte);
      li.appendChild(info);
    }
    liste.appendChild(li);
  }
  majCompteurs();
}

function majCompteurs() {
  document.getElementById('compteurs').textContent =
    `${entreesEtiquetables().length} à étiqueter`;
}

function initialiserRecherche() {
  document.getElementById('recherche').addEventListener('input', e => {
    recherche = normaliser(e.target.value);
    afficherSelection();
  });
}

// ===== Statut =====
function majStatut() {
  const el = document.getElementById('statut');
  const n = brouillons.length;
  modifie = n > 0;
  el.textContent = modifie ? `● Non sauvegardé (${n})` : '✓ À jour';
  el.classList.toggle('non-sauvegarde', modifie);
  document.getElementById('btnEnregistrer').hidden = !modifie;
}

// ===== Saisie et brouillons =====
function poserBrouillon(idSemis, nb) {
  brouillons = brouillons.filter(b => b.idSemis !== idSemis);
  if (nb !== null) brouillons.push({ idSemis, nb });
  const li = document.querySelector(`#listeSelection li[data-id="${idSemis}"]`);
  if (li) li.classList.toggle('brouillon', nb !== null);
  majStatut();
}

function initialiserSaisie() {
  document.getElementById('listeSelection').addEventListener('input', e => {
    const champ = e.target.closest('.champ-etiquettes');
    if (!champ) return;
    const id = Number(champ.closest('li').dataset.id);
    const texte = champ.value.trim();
    const valeur = Number(texte);
    const valide = texte !== '' && Number.isInteger(valeur) && valeur > 0;
    poserBrouillon(id, valide ? valeur : null);
  });
    document.getElementById('btnEnregistrer').addEventListener('click', enregistrerTout);
}

// ===== Enregistrement =====
let minuterieSucces = null;

function afficherSucces(texte) {
  const el = document.getElementById('messageSucces');
  clearTimeout(minuterieSucces);
  el.textContent = texte;
  el.hidden = !texte;
  if (texte) {
    minuterieSucces = setTimeout(() => afficherSucces(''), 5000);
  }
}

function afficherErreurEnregistrement(texte) {
  const el = document.getElementById('erreurEnregistrement');
  el.textContent = texte;
  el.hidden = !texte;
}

async function enregistrerTout() {
  if (brouillons.length === 0 || enregistrementEnCours) return;
  enregistrementEnCours = true;
  const bouton = document.getElementById('btnEnregistrer');
  bouton.disabled = true;
  bouton.textContent = 'Enregistrement…';
  afficherSucces('');
  afficherErreurEnregistrement('');

  const n = brouillons.length;
  try {
    // 1. Relire les valeurs actuelles dans Grist (l'impression a pu les remettre à 0)
    await chargerSemis();
    const ids = [];
    const valeurs = [];
    for (const b of brouillons) {
      const s = recordsParId.semis.get(b.idSemis);
      if (!s) continue;
      ids.push(b.idSemis);
      valeurs.push(s.nbEtiquettes + b.nb);
    }
    // 2. Écrire uniquement Nb_etiquettes
    await grist.docApi.applyUserActions([
      ['BulkUpdateRecord', 'Semis', ids, { Nb_etiquettes: valeurs }]
    ]);
    brouillons = [];
    majStatut();
    afficherSucces(`✓ ${n} ligne${n > 1 ? 's' : ''} mise${n > 1 ? 's' : ''} à jour.`);
    await chargerSemis();
    afficherSelection();
  } catch (err) {
    console.error(err);
    afficherErreurEnregistrement('Échec de l\'enregistrement : ' + err.message + ' — tes saisies sont conservées.');
  } finally {
    enregistrementEnCours = false;
    bouton.disabled = false;
    bouton.textContent = 'Enregistrer tout';
  }
}

window.addEventListener('beforeunload', e => {
  if (modifie) { e.preventDefault(); e.returnValue = ''; }
});

// ===== Initialisation =====
grist.ready({ requiredAccess: 'full' });

chargerSemis()
  .then(() => {
    afficherSucces('');
    afficherSelection();
    initialiserRecherche();
    initialiserSaisie();
    majStatut();
    const plants = entreesEtiquetables().filter(s => !s.planteMere).length;
    const meres  = entreesEtiquetables().filter(s => s.planteMere).length;
    document.getElementById('message').textContent =
      `Semis chargés : ${recordsParId.semis.size}\nPlants plantés : ${plants}\nPlantes mères : ${meres}`;
  })
  .catch(err => {
    console.error(err);
    document.getElementById('message').textContent = 'Erreur de chargement : ' + err.message;
  });