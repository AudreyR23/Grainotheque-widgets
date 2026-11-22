// ===== Messages (erreurs et succès) =====
const TEXTES = {
  sansNom: '(étiquette vierge)',
  refusNonImprime: "Rien n'est enregistré : les étiquettes ont changé depuis l'impression — réimprime-les, puis marque à nouveau.",
  refusModifiees: (noms) => `Rien n'est enregistré. Modifié ou supprimé dans Grist depuis l'affichage : ${noms} — vérifie les étiquettes affichées (réimprime si besoin), puis marque à nouveau.`,
  echec: (msg) => `Échec de l'enregistrement : ${msg} — vérifie dans Grist, puis réessaie si les étiquettes sont toujours affichées.`,
  succes: (n) => `✓ ${n} ${pluriel(n, 'ligne passée', 'lignes passées')} en attente.`
};
// ===== Mise en page (identique à l'ancien main_etiquettes.js) =====
const PAR_RANGEE = 5;
const RANGEES_PAR_FEUILLE = 4;
const ETIQUETTES_PAR_FEUILLE = PAR_RANGEE * RANGEES_PAR_FEUILLE; // 20
const ANNEE_EN_COURS = new Date().getFullYear();
// Colonnes que le widget doit recevoir : onRecords ne donne que les colonnes visibles dans la vue
const LARGEUR_FEUILLE_PX = 297 * 96 / 25.4;   // 297 mm en pixels d'écran (≈ 1123)
const COLONNES_NECESSAIRES = [
  'Nom', 'Variete', 'Date_s', 'Nb_etiquettes', 'Etiq_en_attente', 'Nb_saisons_mil',
  'Origine_or', 'Origine_millesime', 'Plante_mere', 'Annee_plantation_mil'
];

// ===== État global =====
// Lignes à imprimer telles qu'affichées : idSemis → { id, nom, variete, nbEtiquettes, enAttente }
const recordsParId = {
  aImprimer: new Map()
};
// Empreintes du contenu (texte) : affiché maintenant, et au moment de la dernière impression (null = rien d'imprimé)
const impression = {
  signatureAffichee: '',
  signatureImprimee: null
};

// État lu par le HTML : Vue redessine quand il change
const etat = Vue.reactive({
  feuilles: [],       // [feuille] ; feuille = [rangée] ; rangée = [étiquette] (5 au plus)
  nbEtiquettes: 0,    // total d'étiquettes affichées
  nbLignes: 0,        // lignes Semis qui ont au moins une étiquette
  placesLibres: 0,    // places vides sur la dernière feuille
  zoom: 1,            // réduction des feuilles à l'écran (1 = taille réelle ; sans effet à l'impression)
  imprimeA: '',             // heure de la dernière impression ('' = pas encore imprimé)
  impressionPerimee: false, // true si l'affichage a changé depuis cette impression
  colonnesManquantes: [],   // colonnes nécessaires masquées dans la vue du widget
  charge: false,      // true après la première réception des lignes
  confirmation: false,      // fenêtre « Marquer comme imprimées ? » ouverte
  enregistrement: false,    // écriture en cours dans Grist
  erreur: '',
  succes: ''
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
function colonnesManquantes(lignes) {
  // Une colonne masquée n'existe dans aucune ligne reçue (aucune ligne : rien à vérifier)
  if (!lignes.length) return [];
  return COLONNES_NECESSAIRES.filter(c => !(c in lignes[0]));
}

function afficherLignes(lignes) {
  // Une étiquette par unité de Nb_etiquettes, dans l'ordre de la vue Grist
  etat.colonnesManquantes = colonnesManquantes(lignes);
  recordsParId.aImprimer.clear();
  const etiquettes = [];
  const contenu = [];   // [id, nb, étiquette] par ligne : sert à l'empreinte
  for (const r of lignes) {
    const nb = parseInt(r.Nb_etiquettes) || 0;
    if (nb <= 0) continue;
    recordsParId.aImprimer.set(r.id, {
      id: r.id,
      nom: r.Nom || '',
      variete: r.Variete || '',
      nbEtiquettes: nb,
      enAttente: r.Etiq_en_attente || 0
    });
    const e = etiquetteDepuisLigne(r);
    contenu.push([r.id, nb, e]);
    for (let i = 0; i < nb; i++) etiquettes.push(e);
  }
  etat.nbEtiquettes = etiquettes.length;
  etat.nbLignes = recordsParId.aImprimer.size;
  etat.feuilles = enFeuilles(etiquettes);
  etat.placesLibres = etat.feuilles.length * ETIQUETTES_PAR_FEUILLE - etiquettes.length;
  impression.signatureAffichee = JSON.stringify(contenu);
  etat.impressionPerimee = impression.signatureImprimee !== null &&
    impression.signatureImprimee !== impression.signatureAffichee;
  etat.charge = true;
}

function noterImpression() {
  // Le navigateur ne dit pas si l'impression a été annulée : fermer la fenêtre d'impression compte comme imprimer
  if (etat.nbEtiquettes === 0) return;
  impression.signatureImprimee = impression.signatureAffichee;
  etat.imprimeA = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  etat.impressionPerimee = false;
}

function imprimer() {
  window.print();
  noterImpression();   // Chrome, Firefox : print() attend la fermeture de la fenêtre d'impression
}

// ===== Marquer comme imprimées =====
const afficherSucces = creerMessageTemporaire(texte => { etat.succes = texte; }, 4000);

function demanderMarquage() {
  etat.confirmation = true;
}

function annulerMarquage() {
  etat.confirmation = false;
}
async function relireSemis() {
  // Table Semis telle qu'elle est dans Grist maintenant (toutes les colonnes) : id → ligne
  const lignes = tableEnLignes(await grist.docApi.fetchTable('Semis'));
  return new Map(lignes.map(l => [l.id, l]));
}

function lignesModifiees(affichees, actuelles) {
  // Noms des lignes affichées qui ont changé ou disparu dans Grist depuis l'affichage
  return affichees
    .filter(a => {
      const b = actuelles.get(a.id);
      return !b ||
        (parseInt(b.Nb_etiquettes) || 0) !== a.nbEtiquettes ||
        (b.Etiq_en_attente || 0) !== a.enAttente;
    })
    .map(a => libelle(a) || TEXTES.sansNom);
}
async function marquerImprimees() {
  // Etiq_en_attente += Nb_etiquettes, puis Nb_etiquettes = 0, en un seul envoi. Aucune suppression.
  etat.confirmation = false;
  const lignes = [...recordsParId.aImprimer.values()];
  if (lignes.length === 0 || etat.enregistrement) return;
  afficherSucces('');
  etat.erreur = '';
  // 0. L'affichage doit être celui qui a été imprimé (il a pu changer pendant que la confirmation était ouverte)
  if (impression.signatureImprimee !== impression.signatureAffichee) {
    etat.erreur = TEXTES.refusNonImprime;
    return;
  }
  etat.enregistrement = true;
  try {
    // 1. Vérification : une de ces lignes a-t-elle changé dans Grist depuis l'affichage ?
    const actuelles = await relireSemis();
    const modifiees = lignesModifiees(lignes, actuelles);
    if (modifiees.length) {
      etat.erreur = TEXTES.refusModifiees(modifiees.join(', '));
      return;   // « finally » remet quand même enregistrement à false
    }

    // 2. Écriture, avec les valeurs qui viennent d'être relues
    await grist.docApi.applyUserActions([
      ['BulkUpdateRecord', 'Semis', lignes.map(l => l.id), {
        Etiq_en_attente: lignes.map(l => (actuelles.get(l.id).Etiq_en_attente || 0) + l.nbEtiquettes),
        Nb_etiquettes: lignes.map(() => 0)
      }]
    ]);
    // 3. Ce qui était imprimé est marqué : on repart de zéro
    impression.signatureImprimee = null;
    etat.imprimeA = '';
    etat.impressionPerimee = false;
    afficherSucces(TEXTES.succes(lignes.length));
  } catch (err) {
    console.error(err);
    etat.erreur = TEXTES.echec(err.message);
  } finally {
    etat.enregistrement = false;
  }
}

// Une erreur reste affichée jusqu'au prochain clic (phase de capture : effacée avant que le bouton agisse)
document.addEventListener('click', () => { etat.erreur = ''; }, true);
// Autres navigateurs (Safari) : print() n'attend pas, l'événement « afterprint » prévient à la fermeture
window.addEventListener('afterprint', noterImpression);
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
    return { etat, estInversee, pluriel, anneeEnCours: ANNEE_EN_COURS };
  }
}).mount('#appFeuilles');

// ===== Aperçu à l'écran : feuilles réduites à la largeur du widget =====
function ajusterZoom(largeur) {
  // Jamais agrandi au-delà de la taille réelle ; arrondi vers le bas pour éviter une barre de défilement d'un pixel
  etat.zoom = Math.min(1, Math.floor(largeur / LARGEUR_FEUILLE_PX * 1000) / 1000);
}

new ResizeObserver(entrees => ajusterZoom(entrees[0].contentRect.width))
  .observe(document.getElementById('appFeuilles'));

// ===== Initialisation =====
grist.ready({ requiredAccess: 'full' });
// includeColumns : reçoit aussi les colonnes masquées dans la vue (l'alerte reste comme filet de sécurité)
grist.onRecords(afficherLignes, { includeColumns: 'normal' });