// ===== Mise en page (identique à l'ancien main_etiquettes.js) =====
const PAR_RANGEE = 5;
const RANGEES_PAR_FEUILLE = 4;
const ETIQUETTES_PAR_FEUILLE = PAR_RANGEE * RANGEES_PAR_FEUILLE; // 20
const ANNEE_EN_COURS = new Date().getFullYear();

// ===== État global =====
// État lu par le HTML : Vue redessine quand il change
const etat = Vue.reactive({
  feuilles: [],       // [feuille] ; feuille = [rangée] ; rangée = [étiquette] (5 au plus)
  nbEtiquettes: 0,    // total d'étiquettes affichées
  nbLignes: 0,        // lignes Semis qui ont au moins une étiquette
  charge: false       // true après la première réception des lignes
});

// ===== Contenu d'une étiquette =====
function origineAvecAR(e, origine) {
  // Semé ou plante mère : « origine → AR », ou « AR » seul si l'origine est vide ou déjà AR
  if (origine && origine !== 'AR') {
    e.origine = origine;
    e.versAR = true;
  } else {
    e.origine = 'AR';
  }
}
function dateEnSecondesGrist(valeur) {
  // onRecords donne une date Grist sous forme d'objet Date : on la remet en secondes pour anneeDepuisDate
  return valeur instanceof Date ? valeur.getTime() / 1000 : valeur;
}
function etiquetteDepuisLigne(r) {
  // Renvoie des valeurs ; le HTML écrit les textes.
  // { nom, variete, origine, versAR, libelleDate: 'semis' | 'plantation', annee, saisons (nombre, ou null = « …… ») }
  const vierge = !r.Nom && !r.Variete;
  const seme = !!r.Date_s;
  // Millésime semé « or. » (0 saison) : origine de ce millésime ; sinon : origine du millésime « or. » de la variété
  const origineAchat = r.Nb_saisons_mil === undefined || r.Nb_saisons_mil == 0;
  const origine = ((origineAchat ? r.Origine_millesime : r.Origine_or) || '').replace('Monjardin', 'AR');

  const e = {
    nom: r.Nom || '',
    variete: r.Variete || '',
    origine: '',
    versAR: false,
    libelleDate: 'semis',
    annee: seme ? anneeDepuisDate(dateEnSecondesGrist(r.Date_s)) : null,
    saisons: null
  };
  if (vierge) return e;   // champs vides, « …… saison(s) »

  if (r.Plante_mere) {
    origineAvecAR(e, origine);
    e.libelleDate = 'plantation';
    const annee = r.Annee_plantation_mil || null;
    e.annee = annee;
    e.saisons = annee ? ANNEE_EN_COURS - annee + 1 : null;
  } else if (seme) {
    origineAvecAR(e, origine);
    const n = parseInt(r.Nb_saisons_mil);
    e.saisons = isNaN(n) ? 1 : n + 1;
  } else {
    e.origine = origine;  // non semé : origine seule, « …… saison(s) »
  }
  return e;
}

// ===== Mise en feuilles =====
function enFeuilles(etiquettes) {
  // Découpe la liste : 20 étiquettes par feuille, 5 par rangée
  const feuilles = [];
  for (let p = 0; p < etiquettes.length; p += ETIQUETTES_PAR_FEUILLE) {
    const page = etiquettes.slice(p, p + ETIQUETTES_PAR_FEUILLE);
    const rangees = [];
    for (let l = 0; l < page.length; l += PAR_RANGEE) rangees.push(page.slice(l, l + PAR_RANGEE));
    feuilles.push(rangees);
  }
  return feuilles;
}

function estInversee(i) {
  // 2e et 4e étiquettes d'une rangée : retournées pour imbriquer les trapèzes
  return i === 1 || i === 3;
}

function afficherLignes(lignes) {
  // Une étiquette par unité de Nb_etiquettes, dans l'ordre de la vue Grist
  const etiquettes = [];
  let nbLignes = 0;
  for (const r of lignes) {
    const nb = parseInt(r.Nb_etiquettes) || 0;
    if (nb <= 0) continue;
    nbLignes++;
    const e = etiquetteDepuisLigne(r);
    for (let i = 0; i < nb; i++) etiquettes.push(e);
  }
  etat.nbEtiquettes = etiquettes.length;
  etat.nbLignes = nbLignes;
  etat.feuilles = enFeuilles(etiquettes);
  etat.charge = true;
}

function imprimer() {
  window.print();
}

// ===== Zones Vue =====
Vue.createApp({
  setup() {
    return { etat, pluriel, imprimer };
  }
}).mount('#appEntete');

Vue.createApp({
  setup() {
    return { etat, estInversee, pluriel, anneeEnCours: ANNEE_EN_COURS };
  }
}).mount('#appFeuilles');

// ===== Initialisation =====
grist.ready({ requiredAccess: 'full' });
grist.onRecords(afficherLignes);