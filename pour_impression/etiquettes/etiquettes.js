// ===== Messages (erreurs et succès) =====
const TEXTES = {
  echec: (msg) => `Échec de l'enregistrement : ${msg} — vérifie dans Grist, puis réessaie si les étiquettes sont toujours affichées.`,
  succes: (n) => `✓ ${n} ${pluriel(n, 'ligne passée', 'lignes passées')} en attente.`
};
// ===== Mise en page (identique à l'ancien main_etiquettes.js) =====
const PAR_RANGEE = 5;
const RANGEES_PAR_FEUILLE = 4;
const ETIQUETTES_PAR_FEUILLE = PAR_RANGEE * RANGEES_PAR_FEUILLE; // 20
// Colonnes que le widget doit recevoir (filet de sécurité : includeColumns les envoie normalement toutes)
const COLONNES_NECESSAIRES = [
  'Nom', 'Variete', 'Date_s', 'Nb_etiquettes', 'Etiq_en_attente', 'Nb_saisons_mil',
  'Origine_or', 'Origine_millesime', 'Plante_mere', 'Annee_plantation_mil'
];

// ===== État global =====
// Lignes à imprimer telles qu'affichées : idSemis → { id, nbEtiquettes, enAttente }
const recordsParId = {
  aImprimer: new Map()
};
// Dernières lignes reçues de Grist : pour recalculer les étiquettes quand l'année de récolte change
let lignesRecues = [];
// État lu par le HTML : Vue redessine quand il change
const etat = Vue.reactive({
  feuilles: [],       // [feuille] ; feuille = [rangée] ; rangée = [étiquette] (5 au plus)
  nbEtiquettes: 0,    // total d'étiquettes affichées
  nbLignes: 0,        // lignes Semis qui ont au moins une étiquette
  placesLibres: 0,    // places vides sur la dernière feuille
  saisieRecolte: String(anneeRecolteParDefaut()),  // texte du champ « Année de récolte »
  anneeRecolte: anneeRecolteParDefaut(),           // année validée (null si la saisie n'est pas une année)
  zoom: 1,            // réduction des feuilles à l'écran (1 = taille réelle ; sans effet à l'impression)
  imprimeA: '',             // heure de la dernière impression ('' = pas encore imprimé)
  colonnesManquantes: [],   // colonnes nécessaires absentes des lignes reçues
  charge: false,      // true après la première réception des lignes
  confirmation: false,      // fenêtre « Marquer comme imprimées ? » ouverte
  enregistrement: false,    // écriture en cours dans Grist
  erreur: '',
  succes: ''
});

// ===== Contenu d'une étiquette =====
function anneeRecolteParDefaut() {
  // Janvier et février : étiquettes de la fin de saison précédente ; ensuite l'année en cours
  const d = new Date();
  return d.getMonth() <= 1 ? d.getFullYear() - 1 : d.getFullYear();
}

function lireAnneeRecolte(texte) {
  // Année à 4 chiffres, sinon null
  const n = entierOuNull(texte);
  return n !== null && n >= 1000 && n <= 9999 ? n : null;
}

function origineAvecAR(e, origine) {
  // Semé ou plante mère : « origine → AR », ou « AR » seul si l'origine est vide ou déjà AR
  if (origine && origine !== 'AR') {
    e.origine = origine;
    e.versAR = true;
  } else {
    e.origine = 'AR';
  }
}

function etiquetteDepuisLigne(r, anneeRecolte) {
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
    annee: seme ? anneeDepuisDate(r.Date_s) : null,
    saisons: null
  };
  if (vierge) return e;   // champs vides, « …… saison(s) »

  if (r.Plante_mere) {
    origineAvecAR(e, origine);
    e.libelleDate = 'plantation';
    const annee = r.Annee_plantation_mil || null;
    e.annee = annee;
    // Saisons comptées jusqu'à l'année de récolte (pas l'année en cours)
    e.saisons = annee && anneeRecolte ? anneeRecolte - annee + 1 : null;
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
function estDerniere(i, rangee) {
  // Dernière étiquette de sa rangée : si elle est retournée, aucune voisine ne dessine son côté droit
  return i === rangee.length - 1;
}

function afficherLignes(lignes) {
  // Une étiquette par unité de Nb_etiquettes, dans l'ordre de la vue Grist
  lignesRecues = lignes;
  etat.colonnesManquantes = colonnesAbsentes(lignes[0], COLONNES_NECESSAIRES);
  recordsParId.aImprimer.clear();
  const etiquettes = [];
  for (const r of lignes) {
    const nb = parseInt(r.Nb_etiquettes) || 0;
    if (nb <= 0) continue;
    recordsParId.aImprimer.set(r.id, {
      id: r.id,
      nbEtiquettes: nb,
      enAttente: r.Etiq_en_attente || 0
    });
    const e = etiquetteDepuisLigne(r, etat.anneeRecolte);
    for (let i = 0; i < nb; i++) etiquettes.push(e);
  }
  etat.nbEtiquettes = etiquettes.length;
  etat.nbLignes = recordsParId.aImprimer.size;
  etat.feuilles = enFeuilles(etiquettes);
  etat.placesLibres = etat.feuilles.length * ETIQUETTES_PAR_FEUILLE - etiquettes.length;
  etat.charge = true;
}

// ===== Impression =====
function noterImpression() {
  // Le navigateur ne dit pas si l'impression a été annulée : fermer la fenêtre d'impression compte comme imprimer
  if (etat.nbEtiquettes === 0) return;
  etat.imprimeA = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function imprimer() {
  window.print();
  noterImpression();   // Chrome, Firefox : print() attend la fermeture de la fenêtre d'impression
}

// ===== Marquer comme imprimées =====
const afficherSucces = creerMessageTemporaire(texte => { etat.succes = texte; });

function demanderMarquage() {
  etat.confirmation = true;
}

function annulerMarquage() {
  etat.confirmation = false;
}

async function marquerImprimees() {
  // Etiq_en_attente += Nb_etiquettes, puis Nb_etiquettes = 0, en un seul envoi, avec les valeurs affichées. Aucune suppression.
  etat.confirmation = false;
  const lignes = [...recordsParId.aImprimer.values()];
  if (lignes.length === 0 || etat.enregistrement) return;
  etat.enregistrement = true;
  afficherSucces('');
  etat.erreur = '';
  try {
    await grist.docApi.applyUserActions([
      ['BulkUpdateRecord', 'Semis', lignes.map(l => l.id), {
        Etiq_en_attente: lignes.map(l => l.enAttente + l.nbEtiquettes),
        Nb_etiquettes: lignes.map(() => 0)
      }]
    ]);
    etat.imprimeA = '';   // ce qui était imprimé est marqué : on repart de zéro
    afficherSucces(TEXTES.succes(lignes.length));
  } catch (err) {
    console.error(err);
    etat.erreur = TEXTES.echec(err.message);
  } finally {
    etat.enregistrement = false;
  }
}

// Une erreur reste affichée jusqu'au prochain clic (phase de capture : effacée avant que le bouton agisse)
effacerAuClic(() => { etat.erreur = ''; });
// Autres navigateurs (Safari) : print() n'attend pas, l'événement « afterprint » prévient à la fermeture
window.addEventListener('afterprint', noterImpression);
// Année de récolte modifiée : on la valide, puis les étiquettes se recalculent (si les lignes sont déjà arrivées)
Vue.watch(() => etat.saisieRecolte, texte => {
  etat.anneeRecolte = lireAnneeRecolte(texte);
  if (etat.charge) afficherLignes(lignesRecues);
});
// ===== Zones Vue =====
Vue.createApp({
  setup() {
    return { etat, pluriel, imprimer, demanderMarquage };
  }
}).mount('#appEntete');

Vue.createApp({
  setup() {
    return { etat, pluriel, marquerImprimees, annulerMarquage };
  }
}).mount('#appConfirmation');

Vue.createApp({
  setup() {
    return { etat, estInversee, estDerniere, pluriel };
  }
}).mount('#appPages');

// ===== Aperçu à l'écran : feuilles réduites à la largeur du widget =====
new ResizeObserver(entrees => { etat.zoom = facteurZoom(entrees[0].contentRect.width); })
  .observe(document.getElementById('appPages'));

// ===== Initialisation =====
grist.ready({ requiredAccess: 'full' });
// includeColumns : reçoit aussi les colonnes masquées dans la vue (l'alerte reste comme filet de sécurité)
grist.onRecords(afficherLignes, { includeColumns: 'normal' });