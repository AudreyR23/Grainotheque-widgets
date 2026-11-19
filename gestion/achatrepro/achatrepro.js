// ===== Achat / repro : outil en Vue =====
// Les textes affichés après une action sont dans achatrepro_textes.js (TEXTES) ;
// les libellés fixes, bandeaux et avertissements sont dans achatrepro.html.

// ===== Constantes =====
const TABLE_ESPECES = 'Especes';     // identifiant de la table des espèces dans Grist
const TABLE_VARIETES = 'Varietes';
const TABLE_MILLESIMES = 'Millesimes';
const TABLE_SEMIS = 'Semis';
const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Juil', 'Aou', 'Sep', 'Oct', 'Nov', 'Déc'];
const NB_FAVORIS = 6;         // les 6 premiers choix de Origine sont des pastilles, les autres un menu
const NB_SAISONS = ['or.', '1', '2', '3', '4', '5', '6', '7', '8'];
const NB_SACHETS = 1;         // valeur de Nb_sachets (Numérique) pour un sachet ; une plante mère va dans Nb_plants
const ORIGINE_PRODUCTION = 'Monjardin';   // choix de la colonne Origine affiché « AR » sur l'étiquette
const ANNEE_MIN = 2000;
const COLONNES_CHOIX_MODELE = [
  'Type', 'Exposition', 'Arrosage',
  'Famille', 'Nature_du_sol', 'Qualite_du_sol', 'Ou_cultiver', 'Infos'
];
const COLONNES_CHOIX_VARIETE = [...COLONNES_CHOIX_MODELE, 'Semis_GPT'];

// Champs communs à une espèce et à une variété : mêmes noms dans le formulaire
function champsVides() {
  return {
    type: '', famille: [], conservation: '', profondeur: '', dureeGerm: '', tempGerm: '',
    abri: [], terre: [], recolte: [],
    exposition: '', arrosage: '', natureSol: [], qualiteSol: [], ouCultiver: [], infos: []
  };
}

function millesimeVide() {
  return {
    varieteId: '', nbSaisons: 'or.', annee: new Date().getFullYear(),
    origine: '',                       // une seule origine
    sachet: true, planteMere: false,
    qtte: '',                          // quantité de graines (sachet)
    anneePlantation: '', nbPlants: '', typePlant: '', lieux: [],  // plante mère
    sachetsReels: ''                   // « Issu de mes étiquettes » : sachets réels (le tien + dons)
  };
}

// ===== État =====
const etat = Vue.reactive({
  charge: false,
  erreurChargement: '',
  onglet: 'millesime',
  chaine: true,              // « Enchaîner automatiquement »
  enregistrement: false,
  message: '',
  erreur: false,
  panneauMessage: '',        // panneau où le message s'affiche : 'modele' | 'variete' | 'millesime'
  // Bandeaux d'enchaînement : le texte est dans le HTML, ici seulement la situation et ses données
  //   variete  : { type: 'espece', nom } | { type: 'graines', nb }
  //   millesime: { type: 'variete', nom } | { type: 'graines', nom }
  bandeaux: { millesime: null, variete: null },

  // Espèces
  choix: Object.fromEntries(COLONNES_CHOIX_MODELE.map(c => [c, []])),   // choix[colonne] = [...]
  modeles: [],               // espèces existantes
  modeleBase: '',            // id de l'espèce choisie comme point de départ (panneau Espèce)
  modele: { nom: '', ...champsVides() },
  doublonModeleMasque: false,

  // Variétés
  choixVariete: Object.fromEntries(COLONNES_CHOIX_VARIETE.map(c => [c, []])),
  varietes: [],              // variétés existantes
  varieteBase: '',           // id de l'espèce choisie comme modèle de base (panneau Variété)
  variete: { nom: '', variete: '', description: '', semisGpt: [], ...champsVides() },
  doublonVarieteMasque: false,

  // Millésimes
  choixOrigine: [],          // choix de la colonne Origine
  choixTypePlant: [],        // choix de la colonne Type_plant (plante mère)
  lieux: [],                 // choix de la colonne Ou de Semis (emplacements des plantes mères)
  millesime: millesimeVide(),
  doublonsMillesime: [],     // millésimes existants de même variété + année + origine + nature
  doublonMillesimeMasque: false,

  // Étiquettes en attente (Semis.Etiq_en_attente)
  issuEtiquettes: false,     // case « Issu de mes étiquettes »
  etiquettesChargees: false, // la liste a été lue (pour afficher « aucune étiquette »)
  erreurEtiquettes: '',      // erreur de lecture de la liste
  semisEnAttente: [],        // lignes Semis avec Etiq_en_attente > 0
  ligneAttenteId: '',        // ligne choisie dans la liste
  parcoursLigne: false       // true pendant le trajet ligne sans variété → espèce → variété → millésime
});

// ===== Messages =====
const afficherMessage = creerMessageTemporaire(texte => { etat.message = texte; }, 4000);

function dire(texte, erreur = false, panneau = etat.onglet) {
  etat.panneauMessage = panneau;
  etat.erreur = erreur;
  if (erreur) {
    afficherMessage('');     // arrête le minuteur en cours
    etat.message = texte;    // une erreur reste affichée jusqu'au prochain message
  } else {
    afficherMessage(texte);  // un succès disparaît au bout de 4 s
  }
}

// ===== Utilitaires =====
function entierOuNull(valeur) {
  // '12' → 12 ; vide ou autre chose qu'un entier → null
  const t = String(valeur).trim();
  return /^\d+$/.test(t) ? parseInt(t, 10) : null;
}

function anneeValide(valeur) {
  // 4 chiffres, entre ANNEE_MIN et l'année en cours
  const t = String(valeur).trim();
  const n = parseInt(t, 10);
  return /^\d{4}$/.test(t) && n >= ANNEE_MIN && n <= new Date().getFullYear();
}

const MOTIF_PROFONDEUR = /^\d+([.,]\d+)?(\s*-\s*\d+([.,]\d+)?)?$/;   // 1, 0,5, 1-2

function nettoyerProfondeur(valeur) {
  // « 1 cm » → « 1 » ; tirets longs → « - » ; le point devient une virgule
  return String(valeur || '')
    .replace(/\s*cm\s*$/i, '')
    .replace(/[–—]/g, '-')
    .replace(/\./g, ',')
    .trim();
}

function erreurChampsCommuns(f) {
  // Message d'erreur pour les champs numériques d'une espèce ou d'une variété ('' si tout va bien)
  if (String(f.conservation).trim() && entierOuNull(f.conservation) === null) return TEXTES.conservationEntier;
  if (String(f.dureeGerm).trim() && entierOuNull(f.dureeGerm) === null) return TEXTES.dureeEntier;
  const profondeur = nettoyerProfondeur(f.profondeur);
  if (profondeur && !MOTIF_PROFONDEUR.test(profondeur)) return TEXTES.profondeurFormat;
  return '';
}

function colonnesCommunes(f) {
  // Colonnes identiques pour une espèce et une variété, au format attendu par Grist
  return {
    Type: f.type || null,
    Conservation: entierOuNull(f.conservation),
    Semis_profondeur: nettoyerProfondeur(f.profondeur) || null,
    Duree_germ: entierOuNull(f.dureeGerm),
    Temp_germ: f.tempGerm || null,
    Semis_sous_abris: enListeChoix(f.abri),
    Semis_pleine_terre: enListeChoix(f.terre),
    Recolte_floraison: enListeChoix(f.recolte),
    Exposition: f.exposition || null,
    Arrosage: f.arrosage || null,
    Nature_du_sol: enListeChoix(f.natureSol),
    Qualite_du_sol: enListeChoix(f.qualiteSol),
    Famille: enListeChoix(f.famille),
    Ou_cultiver: enListeChoix(f.ouCultiver),
    Infos: enListeChoix(f.infos)
  };
}

function appliquerModele(m, formulaire) {
  // Copie les champs communs d'une espèce dans un formulaire (le nom n'est pas copié)
  for (const cle of Object.keys(champsVides())) {
    const v = m[cle];
    formulaire[cle] = Array.isArray(v) ? [...v] : v;
  }
}

function donnerLeFocus(id) {
  Vue.nextTick(() => {
    const el = document.getElementById(id);
    if (el) el.focus();
  });
}

// ===== Espèces =====
function modeleDepuisLigne(m) {
  return {
    id: m.id,
    nom: m.Nom || '',
    type: m.Type || '',
    famille: listeChoix(m.Famille),
    conservation: m.Conservation || '',
    profondeur: nettoyerProfondeur(m.Semis_profondeur),
    dureeGerm: m.Duree_germ || '',
    tempGerm: m.Temp_germ || '',
    abri: listeChoix(m.Semis_sous_abris),
    terre: listeChoix(m.Semis_pleine_terre),
    recolte: listeChoix(m.Recolte_floraison),
    exposition: m.Exposition || '',
    arrosage: m.Arrosage || '',
    natureSol: listeChoix(m.Nature_du_sol),
    qualiteSol: listeChoix(m.Qualite_du_sol),
    ouCultiver: listeChoix(m.Ou_cultiver),
    infos: listeChoix(m.Infos)
  };
}

async function chargerModeles() {
  const tab = await grist.docApi.fetchTable(TABLE_ESPECES);
  etat.modeles = tableEnLignes(tab)
    .map(modeleDepuisLigne)
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

const doublonsModele = Vue.computed(() => {
  const cle = normaliser(etat.modele.nom);
  return cle ? etat.modeles.filter(m => normaliser(m.nom) === cle) : [];
});

function reinitialiserModele() {
  etat.modeleBase = '';
  Object.assign(etat.modele, { nom: '', ...champsVides() });
  etat.doublonModeleMasque = false;
}

async function creerModele(forcer = false) {
  if (etat.enregistrement) return;
  const nom = etat.modele.nom.trim();
  if (!nom) { dire(TEXTES.nomObligatoire, true); return; }
  const erreurNombres = erreurChampsCommuns(etat.modele);
  if (erreurNombres) { dire(erreurNombres, true); return; }
  if (!forcer && doublonsModele.value.length) { etat.doublonModeleMasque = false; return; }

  etat.enregistrement = true;
  let nouvelId = null;
  try {
    const resultat = await grist.docApi.applyUserActions([
      ['AddRecord', TABLE_ESPECES, null, { Nom: nom, ...colonnesCommunes(etat.modele) }]
    ]);
    nouvelId = resultat && resultat.retValues ? resultat.retValues[0] : null;
  } catch (e) {
    dire(TEXTES.erreur(e.message), true);
    etat.enregistrement = false;
    return;
  }

  try {
    await chargerModeles();
  } catch (e) {
    console.error('Rechargement des espèces impossible :', e);
  }
  reinitialiserModele();
  dire(TEXTES.especeCreee(nom));

  // Enchaînement vers la variété : espèce présélectionnée (ses champs sont copiés), nom repris
  if ((etat.chaine || etat.parcoursLigne) && nouvelId) {
    etat.varieteBase = nouvelId;
    etat.variete.nom = nom;
    etat.bandeaux.variete = { type: 'espece', nom };
    etat.onglet = 'variete';
    donnerLeFocus('v-variete');
  }
  etat.enregistrement = false;
}

// Choisir une espèce comme point de départ : copie ses champs dans le formulaire
Vue.watch(() => etat.modeleBase, id => {
  const m = etat.modeles.find(x => x.id === id);
  if (m) appliquerModele(m, etat.modele);
});

// Le bandeau « doublon » se rouvre dès que le nom change
Vue.watch(() => etat.modele.nom, () => { etat.doublonModeleMasque = false; });

// ===== Variétés =====
async function chargerVarietes() {
  const tab = await grist.docApi.fetchTable(TABLE_VARIETES);
  etat.varietes = tableEnLignes(tab)
    .map(v => ({ id: v.id, nom: v.Nom || '', variete: v.Variete || '', type: v.Type || '' }))
    .sort((a, b) => (a.nom + a.variete).localeCompare(b.nom + b.variete, 'fr'));
}

const doublonsVariete = Vue.computed(() => {
  if (!etat.variete.nom.trim()) return [];
  const cle = normaliser(etat.variete.nom) + '|' + normaliser(etat.variete.variete);
  return etat.varietes.filter(v => normaliser(v.nom) + '|' + normaliser(v.variete) === cle);
});

function reinitialiserVariete() {
  etat.varieteBase = '';
  Object.assign(etat.variete, { nom: '', variete: '', description: '', semisGpt: [], ...champsVides() });
  etat.doublonVarieteMasque = false;
  etat.bandeaux.variete = null;
}

async function creerVariete(forcer = false) {
  if (etat.enregistrement) return;
  const f = etat.variete;
  const nom = f.nom.trim();
  const variete = f.variete.trim();
  if (!nom) { dire(TEXTES.nomObligatoire, true); return; }
  const erreurNombres = erreurChampsCommuns(f);
  if (erreurNombres) { dire(erreurNombres, true); return; }
  if (!forcer && doublonsVariete.value.length) { etat.doublonVarieteMasque = false; return; }

  /* NomVariete = "Nom\nVariété", ou "Nom" s'il n'y a pas de variété */
  const nomVariete = variete ? nom + '\n' + variete : nom;
  const libelleCree = variete ? nom + ' — ' + variete : nom;

  etat.enregistrement = true;
  let nouvelId = null;
  try {
    const resultat = await grist.docApi.applyUserActions([
      ['AddRecord', TABLE_VARIETES, null, {
        NomVariete: nomVariete,
        Num_epingle: null,   // vide, pas 0
        ...colonnesCommunes(f),
        Description: f.description.trim() || null,
        Semis_GPT: enListeChoix(f.semisGpt)
      }]
    ]);
    nouvelId = resultat && resultat.retValues ? resultat.retValues[0] : null;
  } catch (e) {
    dire(TEXTES.erreur(e.message), true);
    etat.enregistrement = false;
    return;
  }

  try {
    await chargerVarietes();
  } catch (e) {
    console.error('Rechargement des variétés impossible :', e);
  }
  reinitialiserVariete();
  dire(TEXTES.varieteCreee(libelleCree));

  // Enchaînement vers le millésime : variété présélectionnée (forcé pendant un parcours « graines à identifier »)
  if ((etat.chaine || etat.parcoursLigne) && nouvelId) {
    etat.millesime.varieteId = nouvelId;
    if (etat.parcoursLigne && ligneAttente.value) {
      etat.parcoursLigne = false;
      preremplirLigneSansVariete(ligneAttente.value);
      etat.bandeaux.millesime = { type: 'graines', nom: libelleCree };
    } else {
      etat.bandeaux.millesime = { type: 'variete', nom: libelleCree };
    }
    etat.onglet = 'millesime';
    donnerLeFocus('m-origine-autre');
  }
  etat.enregistrement = false;
}

// Choisir une espèce comme modèle de base : copie ses champs dans le formulaire (le nom n'est pas copié)
Vue.watch(() => etat.varieteBase, id => {
  const m = etat.modeles.find(x => x.id === id);
  if (m) appliquerModele(m, etat.variete);
});

// Le bandeau « doublon » se rouvre dès que le nom ou la variété change
Vue.watch(() => [etat.variete.nom, etat.variete.variete], () => { etat.doublonVarieteMasque = false; });

// ===== Millésimes =====
const origineFavorites = Vue.computed(() => etat.choixOrigine.slice(0, NB_FAVORIS));
const origineAutres = Vue.computed(() => etat.choixOrigine.slice(NB_FAVORIS));
// Valeur affichée par le menu « Autres origines » : l'origine choisie si elle y figure, sinon vide
const origineAutre = Vue.computed(() => origineAutres.value.includes(etat.millesime.origine) ? etat.millesime.origine : '');

function choisirOrigine(origine) {
  etat.millesime.origine = origine;   // une seule origine au total (pastille ou menu)
}

const typeVariete = Vue.computed(() => {
  const v = etat.varietes.find(x => x.id === Number(etat.millesime.varieteId));
  return v ? v.type : '';
});

function cleOrigine(liste) {
  // ['Achat', 'Don'] ou ['L', 'Achat', 'Don'] → 'Achat|Don' (trié, sans le L) pour comparer
  return (Array.isArray(liste) ? liste : []).filter(v => v && v !== 'L').sort().join('|');
}

async function trouverDoublonsMillesime(varId, annee, origine, planteMere) {
  // Millésimes existants de même variété + année + origine + nature (sachet ou plante mère)
  const data = await grist.docApi.fetchTable(TABLE_MILLESIMES);
  const doublons = [];
  data.id.forEach((id, i) => {
    if (data.NomVariete[i] !== varId) return;
    if (!!data.Plante_mere[i] !== !!planteMere) return;
    if (anneeDepuisDate(data.Millesime[i]) !== annee) return;
    if (cleOrigine(data.Origine[i]) !== origine) return;
    doublons.push({ id, annee, origine, qtte: data.Qtte_graines[i] });
  });
  return doublons;
}

// Alerte en direct : se déclenche dès que variété, année et origine sont renseignées
let numeroVerification = 0;

async function verifierDoublonMillesime() {
  const m = etat.millesime;
  const varId = Number(m.varieteId);
  const annee = parseInt(m.annee);
  if (!varId || !annee || !m.origine) { etat.doublonsMillesime = []; return; }

  const numero = ++numeroVerification;   // évite qu'une ancienne réponse écrase une plus récente
  try {
    const doublons = await trouverDoublonsMillesime(varId, annee, m.origine, m.planteMere);
    if (numero === numeroVerification) etat.doublonsMillesime = doublons;
  } catch (e) {
    console.error('Vérification en direct impossible :', e);
  }
}

Vue.watch(
  () => [etat.millesime.varieteId, etat.millesime.annee, etat.millesime.origine, etat.millesime.planteMere],
  () => {
    etat.doublonMillesimeMasque = false;
    verifierDoublonMillesime();
  }
);

// Sachet et plante mère s'excluent ; décocher l'un vide ses champs
Vue.watch(() => etat.millesime.sachet, coche => {
  if (coche) etat.millesime.planteMere = false;
  else etat.millesime.qtte = '';
});
Vue.watch(() => etat.millesime.planteMere, coche => {
  if (coche) etat.millesime.sachet = false;
  else Object.assign(etat.millesime, { anneePlantation: '', nbPlants: '', typePlant: '', lieux: [] });
});

function reinitialiserMillesime() {
  Object.assign(etat.millesime, millesimeVide());
  etat.doublonsMillesime = [];
  etat.doublonMillesimeMasque = false;
  etat.bandeaux.millesime = null;
  etat.ligneAttenteId = '';
  etat.parcoursLigne = false;
  rafraichirEtiquettes();   // la case « Issu de mes étiquettes » reste cochée : la liste est remise à jour
}

// ===== Étiquettes en attente (Semis.Etiq_en_attente) =====
// Contrat avec l'outil d'étiquettes : « Marquer comme imprimées » copie Nb_etiquettes dans Etiq_en_attente
// (sans rien supprimer) ; cet outil vide Etiq_en_attente à la création du millésime, et supprime la ligne
// si c'est une ligne de transit (sans date de semis ni données de culture).
async function chargerSemisEnAttente() {
  const [semis, mils] = await Promise.all([
    grist.docApi.fetchTable(TABLE_SEMIS),
    grist.docApi.fetchTable(TABLE_MILLESIMES)
  ]);

  const milParId = new Map();
  const originesOr = new Map();   // variété → origines de son millésime « or. »
  mils.id.forEach((id, i) => {
    milParId.set(id, {
      saisons: mils.Nb_saisons_manuel[i] || '',
      planteMere: !!mils.Plante_mere[i],
      anneePlantation: mils.Annee_plantation[i] || null
    });
    if (mils.Nb_saisons_manuel[i] === 'or.' && !originesOr.has(mils.NomVariete[i])) {
      originesOr.set(mils.NomVariete[i], cleOrigine(mils.Origine[i]).split('|').filter(Boolean));
    }
  });

  const liste = [];
  semis.id.forEach((id, i) => {
    const nb = semis.Etiq_en_attente[i];
    if (!(nb > 0)) return;
    liste.push({
      id,
      varId: semis.NomVariete[i] || 0,
      nb,
      note: ((semis.Note_attente || [])[i] || '').trim(),
      seme: !!semis.Date_s[i],
      mil: milParId.get(semis.Millesime[i]) || null,
      originesOr: originesOr.get(semis.NomVariete[i]) || []
    });
  });
  etat.semisEnAttente = liste;
  etat.etiquettesChargees = true;
}

async function rafraichirEtiquettes() {
  if (!etat.issuEtiquettes) return;
  try {
    await chargerSemisEnAttente();
  } catch (e) {
    console.error('Rafraîchissement des étiquettes en attente impossible :', e);
  }
}

const ligneAttente = Vue.computed(() =>
  etat.semisEnAttente.find(l => l.id === Number(etat.ligneAttenteId)) || null);
const ligneSansVariete = Vue.computed(() => !!ligneAttente.value && !ligneAttente.value.varId);
const varieteVerrouillee = Vue.computed(() => !!ligneAttente.value && !!ligneAttente.value.varId);

function libelleAttente(l) {
  if (!l.varId) return TEXTES.graineAIdentifier(l.note, l.nb);
  const v = etat.varietes.find(x => x.id === l.varId);
  const type = (l.mil && l.mil.planteMere) ? TEXTES.typeMere : (l.seme ? TEXTES.typeSemis : TEXTES.typeHorsSachet);
  return TEXTES.ligneAttente(v ? libelle(v) : TEXTES.varieteInconnue, type, l.nb);
}

const optionsAttente = Vue.computed(() =>
  etat.semisEnAttente
    .map(l => ({ id: l.id, texte: libelleAttente(l) }))
    .sort((a, b) => a.texte.localeCompare(b.texte, 'fr')));

// Don = sachets réels - 1 (null tant que les sachets réels ne sont pas saisis)
const donSachets = Vue.computed(() => {
  const n = parseInt(etat.millesime.sachetsReels);
  return n >= 1 ? n - 1 : null;
});

function saisonsPourLigne(l) {
  // Nb de saisons du nouveau millésime : même règle que l'étiquette
  let n;
  if (l.mil && l.mil.planteMere && l.mil.anneePlantation) {
    n = new Date().getFullYear() - l.mil.anneePlantation + 1;
  } else if (!l.seme) {
    return 'or.';
  } else {
    n = parseInt(l.mil ? l.mil.saisons : '');
    n = isNaN(n) ? 1 : n + 1;
  }
  return String(Math.min(Math.max(n, 1), 8));
}

function preremplirLigneSansVariete(l) {
  // Ligne sans variété : l'origine n'est pas devinable, tu la choisis
  const m = etat.millesime;
  m.annee = new Date().getFullYear();
  m.nbSaisons = 'or.';
  m.origine = '';
  m.sachet = true;
  m.planteMere = false;
  m.sachetsReels = l.nb;
}

function annulerLigneAttente() {
  etat.ligneAttenteId = '';
  etat.parcoursLigne = false;
}

function chargerLigneAttente() {
  const l = ligneAttente.value;
  etat.parcoursLigne = false;
  if (!l) { annulerLigneAttente(); return; }
  const m = etat.millesime;

  // Ligne sans variété : le menu Variété reste libre (les boutons de création sont dans le HTML)
  if (!l.varId) {
    m.varieteId = '';
    preremplirLigneSansVariete(l);
    return;
  }

  // Ligne avec variété : variété verrouillée, tout est prérempli
  if (!etat.varietes.some(v => v.id === l.varId)) {
    dire(TEXTES.varieteIntrouvable, true, 'millesime');
    return;
  }
  m.varieteId = l.varId;
  m.annee = new Date().getFullYear();
  m.nbSaisons = saisonsPourLigne(l);
  const produit = (l.mil && l.mil.planteMere) || l.seme;
  const origine = produit ? ORIGINE_PRODUCTION : (l.originesOr[0] || '');
  m.origine = etat.choixOrigine.includes(origine) ? origine : '';   // vide : le HTML invite à la choisir
  m.sachet = true;
  m.planteMere = false;
  m.sachetsReels = l.nb;
  donnerLeFocus('m-qtte');
}

// Ligne sans variété → panneau Variété (la note préremplit le nom, modifiable)
function allerCreerVariete() {
  const l = ligneAttente.value;
  if (!l || l.varId) return;
  etat.parcoursLigne = true;
  if (!etat.variete.nom.trim() && l.note) etat.variete.nom = l.note;
  etat.bandeaux.variete = { type: 'graines', nb: l.nb };
  etat.onglet = 'variete';
  donnerLeFocus('v-nom');
}

// Ligne sans variété → panneau Espèce, puis la chaîne continue vers Variété et Millésime
function allerCreerEspece() {
  const l = ligneAttente.value;
  if (!l || l.varId) return;
  etat.parcoursLigne = true;
  if (!etat.modele.nom.trim() && l.note) etat.modele.nom = l.note;
  etat.onglet = 'modele';
  donnerLeFocus('e-nom');
}

async function nettoyerLigneAttente(ligne) {
  // Vide Etiq_en_attente ; supprime la ligne si c'est une ligne de transit
  const data = await grist.docApi.fetchTable(TABLE_SEMIS);
  const i = data.id.indexOf(ligne.id);
  if (i === -1) return;
  const transit = !data.Date_s[i] && !data.Nb_graines[i] && !data.Nb_godets[i]
    && !data.Germes[i] && !data.Plantes[i] && !(data.Nb_etiquettes[i] > 0);
  if (transit) {
    await grist.docApi.applyUserActions([['RemoveRecord', TABLE_SEMIS, ligne.id]]);
  } else {
    await grist.docApi.applyUserActions([['UpdateRecord', TABLE_SEMIS, ligne.id, { Etiq_en_attente: null }]]);
  }
}

// Case « Issu de mes étiquettes » : charge la liste, ou libère le formulaire
Vue.watch(() => etat.issuEtiquettes, async actif => {
  etat.erreurEtiquettes = '';
  etat.etiquettesChargees = false;
  if (!actif) { annulerLigneAttente(); return; }
  try {
    await chargerSemisEnAttente();
  } catch (e) {
    etat.erreurEtiquettes = e.message;   // le texte est dans le HTML
  }
});

// Choix d'une ligne dans la liste
Vue.watch(() => etat.ligneAttenteId, () => chargerLigneAttente());

async function trouverSemisAProduire(varId) {
  // Ids des lignes Semis de cette variété dont « A produire » est coché
  const data = await grist.docApi.fetchTable(TABLE_SEMIS);
  const ids = [];
  data.id.forEach((id, i) => {
    if (data.NomVariete[i] === varId && data.A_produire[i]) ids.push(id);
  });
  return ids;
}

async function creerMillesime(forcer = false) {
  if (etat.enregistrement) return;
  const m = etat.millesime;
  const varId = Number(m.varieteId);
  const annee = parseInt(m.annee);
  const sachet = m.sachet;
  const planteMere = m.planteMere;
  const qtte = entierOuNull(m.qtte);
  const anneePlantation = parseInt(m.anneePlantation) || null;
  const nbPlants = Number(m.nbPlants);
  const anneeMax = new Date().getFullYear();

  // 1) Contrôles de saisie
  if (!varId) { dire(TEXTES.varieteObligatoire, true); return; }
  if (!anneeValide(m.annee)) { dire(TEXTES.anneeMillesime(ANNEE_MIN, anneeMax), true); return; }
  if (!m.origine) { dire(TEXTES.origineObligatoire, true); return; }
  if (!sachet && !planteMere) { dire(TEXTES.natureObligatoire, true); return; }
  if (sachet && !qtte) { dire(TEXTES.quantiteObligatoire, true); return; }
  if (planteMere && !anneeValide(m.anneePlantation)) { dire(TEXTES.anneePlantation(ANNEE_MIN, anneeMax), true); return; }
  if (planteMere && !(Number.isInteger(nbPlants) && nbPlants >= 1)) { dire(TEXTES.nbPlantsObligatoire, true); return; }
  if (planteMere && etat.choixTypePlant.length && !m.typePlant) { dire(TEXTES.typePlantObligatoire, true); return; }
  if (planteMere && m.lieux.length === 0) { dire(TEXTES.lieuxObligatoires, true); return; }

  // Mode « Issu de mes étiquettes »
  const ligne = ligneAttente.value;
  if (etat.issuEtiquettes && !ligne) { dire(TEXTES.ligneObligatoire, true); return; }
  let sachetsReels = null;
  if (ligne && sachet) {
    sachetsReels = entierOuNull(m.sachetsReels);
    if (!(sachetsReels >= 1)) { dire(TEXTES.sachetsReelsObligatoire, true); return; }
  }

  // 2) Détection de doublon (sauf si l'utilisateur a déjà confirmé)
  if (!forcer) {
    let doublons = [];
    try {
      doublons = await trouverDoublonsMillesime(varId, annee, m.origine, planteMere);
    } catch (e) {
      dire(TEXTES.detectionImpossible(e.message), true);
      return;
    }
    if (doublons.length) {
      etat.doublonsMillesime = doublons;
      etat.doublonMillesimeMasque = false;
      return;
    }
  }

  etat.enregistrement = true;
  try {
    const v = etat.varietes.find(x => x.id === varId);
    const typeDeLaVariete = typeVariete.value || null;
    const dateMillesime = Date.UTC(annee, 0, 1) / 1000;   // 1er janvier, en secondes (format Grist)

    // 3) Création du millésime
    let nouveauMillesimeId = null;
    try {
      const resultat = await grist.docApi.applyUserActions([
        ['AddRecord', TABLE_MILLESIMES, null, {
          NomVariete: varId,
          Type: typeDeLaVariete,
          Millesime: dateMillesime,
          Nb_saisons_manuel: m.nbSaisons || null,
          Origine: enListeChoix([m.origine]),
          Nb_sachets: sachet ? NB_SACHETS : null,
          Nb_plants: planteMere ? nbPlants : null,
          Type_plant: planteMere ? (m.typePlant || null) : null,
          Qtte_graines: sachet ? qtte : null,
          Germination_historique: null,   // forcé à vide pour éviter une valeur par défaut
          Plante_mere: planteMere,
          Annee_plantation: anneePlantation,
          // Don = sachets réels - 1 (rien n'est écrit s'il n'y a rien à donner)
          ...(sachetsReels > 1 ? { Don: sachetsReels - 1 } : {})
        }]
      ]);
      nouveauMillesimeId = resultat && resultat.retValues ? resultat.retValues[0] : null;
    } catch (e) {
      dire(TEXTES.erreur(e.message), true);
      return;
    }

    // 3b) « A produire » décoché sur les semis de cette variété
    let nbDecoches = 0;
    try {
      const ids = await trouverSemisAProduire(varId);
      if (ids.length) {
        await grist.docApi.applyUserActions([
          ['BulkUpdateRecord', TABLE_SEMIS, ids, { A_produire: ids.map(() => false) }]
        ]);
        nbDecoches = ids.length;
      }
    } catch (e) {
      dire(TEXTES.decochageEchoue(e.message), true);
      return;
    }

    // 3c) Ligne d'étiquettes en attente : vidée, ou supprimée si c'est une ligne de transit
    if (ligne) {
      try {
        await nettoyerLigneAttente(ligne);
      } catch (e) {
        dire(TEXTES.nettoyageEchoue(e.message), true);
        return;
      }
    }

    // 4) Plante mère : une ligne Semis (sans godets ni graines) porte le nombre de plants et les emplacements
    if (planteMere && nouveauMillesimeId) {
      try {
        await grist.docApi.applyUserActions([
          ['AddRecord', TABLE_SEMIS, null, {
            NomVariete: varId,
            Millesime: nouveauMillesimeId,
            Date_s: Date.UTC(anneePlantation, 0, 1) / 1000,
            Type: typeDeLaVariete,
            Plantes: nbPlants,
            Ou: enListeChoix(m.lieux),
            Nb_etiquettes: 0
          }]
        ]);
      } catch (e) {
        dire(TEXTES.ligneSemisEchouee(e.message), true);
        return;
      }
    }

    dire(TEXTES.millesimeCree(annee, v ? v.nom : '', planteMere, nbDecoches, sachetsReels > 1 ? sachetsReels - 1 : 0));
    reinitialiserMillesime();
  } finally {
    etat.enregistrement = false;
  }
}

// ===== Ajouter un nouveau choix à une colonne (Origine, Infos) =====
function existeDeja(liste, valeur) {
  return liste.some(c => normaliser(c) === normaliser(valeur));   // sans casse ni accents
}

async function ajouterChoixColonne(tableId, colId, valeur) {
  // Ajoute un choix à la liste d'une colonne Choice / ChoiceList. Les autres réglages
  // de la colonne (couleurs des choix existants comprises) sont relus puis conservés tels quels.
  const [tabTables, tabColonnes] = await Promise.all([
    grist.docApi.fetchTable('_grist_Tables'),
    grist.docApi.fetchTable('_grist_Tables_column')
  ]);
  const table = tableEnLignes(tabTables).find(t => t.tableId === tableId);
  if (!table) throw new Error('table ' + tableId + ' introuvable');
  const colonne = tableEnLignes(tabColonnes).find(c => c.parentId === table.id && c.colId === colId);
  if (!colonne) throw new Error('colonne ' + colId + ' introuvable dans ' + tableId);

  let options = {};
  try {
    options = colonne.widgetOptions ? JSON.parse(colonne.widgetOptions) : {};
  } catch (e) {
    throw new Error('réglages de la colonne ' + colId + ' illisibles');
  }
  const choix = Array.isArray(options.choices) ? options.choices : [];
  if (existeDeja(choix, valeur)) return;   // déjà présent : rien à écrire
  options.choices = [...choix, valeur];
  await grist.docApi.applyUserActions([
    ['ModifyColumn', tableId, colId, { widgetOptions: JSON.stringify(options) }]
  ]);
}

async function ajouterOrigine(texte) {
  // Renvoie true si le champ de saisie peut se refermer
  const existante = etat.choixOrigine.find(c => normaliser(c) === normaliser(texte));
  if (existante) {
    etat.millesime.origine = existante;
    dire(TEXTES.origineExiste(existante), false, 'millesime');
    return true;
  }
  try {
    await ajouterChoixColonne(TABLE_MILLESIMES, 'Origine', texte);
  } catch (e) {
    dire(TEXTES.originePasAjoutee(e.message), true, 'millesime');
    return false;
  }
  etat.choixOrigine = [...etat.choixOrigine, texte];
  etat.millesime.origine = texte;
  dire(TEXTES.origineAjoutee(texte), false, 'millesime');
  return true;
}

async function ajouterInfoGrist(texte) {
  // Ajoute l'info aux choix de l'espèce ET de la variété (pour qu'une variété la reçoive de son espèce).
  // Renvoie la valeur à sélectionner, ou null en cas d'erreur.
  const existante = [...etat.choix.Infos, ...etat.choixVariete.Infos]
    .find(c => normaliser(c) === normaliser(texte));
  const valeur = existante || texte;
  try {
    if (!existeDeja(etat.choix.Infos, valeur)) {
      await ajouterChoixColonne(TABLE_ESPECES, 'Infos', valeur);
      etat.choix.Infos = [...etat.choix.Infos, valeur];
    }
    if (!existeDeja(etat.choixVariete.Infos, valeur)) {
      await ajouterChoixColonne(TABLE_VARIETES, 'Infos', valeur);
      etat.choixVariete.Infos = [...etat.choixVariete.Infos, valeur];
    }
  } catch (e) {
    dire(TEXTES.infoPasAjoutee(e.message), true);
    return null;
  }
  dire(TEXTES.infoAjoutee(valeur));
  return valeur;
}

// ===== Application Vue (un seul point de montage) =====
// Listes préparées pour les menus : { valeur, libelle }
const optionsVarietes = Vue.computed(() =>
  etat.varietes.map(v => ({ valeur: v.id, libelle: libelle(v) })));
const optionsModeles = Vue.computed(() =>
  etat.modeles.map(m => ({ valeur: m.id, libelle: m.nom })));
const optionsAttenteMenu = Vue.computed(() =>
  optionsAttente.value.map(o => ({ valeur: o.id, libelle: o.texte })));
const optionsNbSaisons = NB_SAISONS.map(s => ({ valeur: s, libelle: s === 'or.' ? TEXTES.orOriginal : s }));

const app = Vue.createApp({
  setup() {
    return {
      etat, MOIS, NB_SAISONS, libelle,
      doublonsModele, doublonsVariete,
      origineFavorites, origineAutres, origineAutre, choisirOrigine, typeVariete,
      creerModele, reinitialiserModele,
      creerVariete, reinitialiserVariete,
      creerMillesime, reinitialiserMillesime,
      ligneAttente, ligneSansVariete, varieteVerrouillee, donSachets,
      allerCreerVariete, allerCreerEspece,
      optionsVarietes, optionsModeles, optionsAttenteMenu, optionsNbSaisons,
      ajouterOrigine
    };
  }
});

// Composant « champs communs » : les champs qu'ont en commun une espèce et une variété
app.component('champs-culture', {
  template: '#tpl-champs-culture',
  props: {
    formulaire: { type: Object, required: true },
    choix: { type: Object, required: true },
    prefixe: { type: String, default: 'x' }   // préfixe des id (pour relier libellés et champs)
  },
  data() {
    return { MOIS };
  },
  methods: {
    async ajouterInfo(texte) {
      const valeur = await ajouterInfoGrist(texte);
      if (valeur === null) return false;
      if (!this.formulaire.infos.includes(valeur)) {
        this.formulaire.infos = [...this.formulaire.infos, valeur];   // la nouvelle info est sélectionnée
      }
      return true;
    }
  }
});

// Composant « choix multiple » : pastilles, ou champ de recherche + liste avec l'attribut « menu »
app.component('choix-multiple', {
  template: '#tpl-choix-multiple',
  props: {
    modelValue: { type: Array, default: () => [] },
    choix: { type: Array, default: () => [] },
    menu: { type: Boolean, default: false }   // true : champ de recherche + liste ; false : pastilles
  },
  emits: ['update:modelValue'],
  data() {
    return { recherche: '', ouvert: false };
  },
  computed: {
    valides() {
      // les choix vides ou réduits à des espaces sont ignorés
      return this.choix.filter(c => String(c).trim() !== '');
    },
    proposes() {
      return lieuxFiltres(this.valides, this.modelValue, this.recherche);
    }
  },
  methods: {
    basculer(c) {
      const suivant = this.modelValue.includes(c)
        ? this.modelValue.filter(x => x !== c)
        : [...this.modelValue, c];
      this.$emit('update:modelValue', suivant);
    },
    ajouter(c) {
      this.$emit('update:modelValue', [...this.modelValue, c]);
      this.recherche = '';
      this.ouvert = false;   // se rouvre au toucher du champ
    },
    retirer(c) {
      this.$emit('update:modelValue', this.modelValue.filter(x => x !== c));
    },
    surSaisie(e) {
      this.recherche = e.target.value;
      this.ouvert = true;
    },
    fermer() {
      this.ouvert = false;
      this.recherche = '';
    }
  }
});

// Composant « choix unique » : un bouton qui ouvre une liste (comme « Trier par » dans à gérer)
app.component('choix-unique', {
  template: '#tpl-choix-unique',
  props: {
    modelValue: { type: [String, Number], default: '' },
    options: { type: Array, default: () => [] },   // chaînes, ou { valeur, libelle }
    vide: { type: String, default: '' },           // texte de l'entrée « rien de choisi » (si absent : pas d'entrée)
    champId: { type: String, default: '' },        // id du bouton (pour le libellé et le focus)
    disabled: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  data() {
    return { ouvert: false };
  },
  computed: {
    liste() {
      return this.options
        .map(o => (typeof o === 'object' ? o : { valeur: o, libelle: o }))
        .filter(o => String(o.libelle).trim() !== '');   // les choix vides sont ignorés
    },
    estVide() {
      return !this.liste.some(o => o.valeur === this.modelValue);
    },
    libelleChoisi() {
      const o = this.liste.find(x => x.valeur === this.modelValue);
      return o ? o.libelle : this.vide;
    }
  },
  methods: {
    basculer() {
      if (!this.disabled) this.ouvert = !this.ouvert;
    },
    choisir(valeur) {
      this.$emit('update:modelValue', valeur);
      this.ouvert = false;
    },
    fermerSiDehors(e) {
      if (!this.$el.contains(e.target)) this.ouvert = false;   // un toucher ailleurs ferme la liste
    }
  },
  mounted() {
    document.addEventListener('click', this.fermerSiDehors);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.fermerSiDehors);
  }
});

// Composant « choix avec recherche » : champ de saisie, la liste se réduit à chaque lettre
app.component('choix-recherche', {
  template: '#tpl-choix-recherche',
  props: {
    modelValue: { type: [String, Number], default: '' },
    options: { type: Array, default: () => [] },   // { valeur, libelle }
    placeholder: { type: String, default: '' },
    champId: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    max: { type: Number, default: 40 }             // nombre de résultats affichés
  },
  emits: ['update:modelValue'],
  data() {
    return { texte: '', ouvert: false };
  },
  computed: {
    libelleChoisi() {
      const o = this.options.find(x => x.valeur === this.modelValue);
      return o ? o.libelle : '';
    },
    trouves() {
      const saisie = normaliser(this.texte);
      return this.options.filter(o => correspondRecherche(normaliser(o.libelle), saisie));
    },
    affiches() {
      return this.trouves.slice(0, this.max);
    },
    nbAutres() {
      return Math.max(0, this.trouves.length - this.max);
    }
  },
  methods: {
    ouvrir() {
      if (!this.disabled) this.ouvert = true;
    },
    surSaisie(e) {
      this.texte = e.target.value;
      this.ouvrir();
    },
    choisir(valeur) {
      this.$emit('update:modelValue', valeur);
      this.texte = '';
      this.ouvert = false;
    },
    fermer() {
      this.ouvert = false;
      this.texte = '';
    }
  }
});

// Composant « ajout d'un choix » : un bouton qui ouvre un petit champ de saisie
app.component('ajout-choix', {
  template: '#tpl-ajout-choix',
  props: {
    libelle: { type: String, default: '' },
    surAjout: { type: Function, required: true }   // reçoit le texte, renvoie true si l'ajout a réussi
  },
  data() {
    return { ouvert: false, texte: '', enCours: false };
  },
  methods: {
    ouvrir() {
      this.ouvert = true;
      this.$nextTick(() => { if (this.$refs.champ) this.$refs.champ.focus(); });
    },
    annuler() {
      this.ouvert = false;
      this.texte = '';
    },
    async valider() {
      const texte = this.texte.trim();
      if (!texte || this.enCours) return;
      this.enCours = true;
      try {
        if (await this.surAjout(texte)) this.annuler();
      } finally {
        this.enCours = false;
      }
    }
  }
});

app.mount('#app');

// ===== Initialisation =====
grist.ready({ requiredAccess: 'full' });

async function demarrer() {
  try {
    const [choixModele, choixVariete, choixMillesime] = await Promise.all([
      lireChoixColonnes(TABLE_ESPECES, COLONNES_CHOIX_MODELE),
      lireChoixColonnes(TABLE_VARIETES, COLONNES_CHOIX_VARIETE),
      lireChoixColonnes(TABLE_MILLESIMES, ['Origine', 'Type_plant']),
      chargerModeles(),
      chargerVarietes()
    ]);
    for (const c of COLONNES_CHOIX_MODELE) etat.choix[c] = choixModele[c] || [];
    for (const c of COLONNES_CHOIX_VARIETE) etat.choixVariete[c] = choixVariete[c] || [];
    etat.choixOrigine = choixMillesime.Origine || [];
    etat.choixTypePlant = choixMillesime.Type_plant || [];
  } catch (err) {
    console.error(err);
    etat.erreurChargement = TEXTES.erreurChargement(err.message);
  }

  // Emplacements des plantes mères : une erreur ici ne bloque que la création d'une plante mère
  try {
    const choixSemis = await lireChoixColonnes(TABLE_SEMIS, ['Ou']);
    etat.lieux = choixSemis.Ou || [];
    if (!etat.lieux.length) throw new Error(TEXTES.aucunChoixLieux);
  } catch (err) {
    console.error(err);
    etat.erreurChargement += (etat.erreurChargement ? ' ' : '') + TEXTES.lieuxNonCharges(err.message);
  }
  etat.charge = true;
}

demarrer();