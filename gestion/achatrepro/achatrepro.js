// ===== Achat / repro : outil en Vue =====
// Les textes affichés après une action sont dans l'objet TEXTES (section 3) ;
// les libellés fixes, bandeaux et avertissements sont dans achatrepro.html.
// Plan du fichier :
//   1. Constantes            5. Valeurs calculées       9. Millésimes
//   2. État                  6. Observateurs (watch)   10. Ajouter un choix (Origine, Infos)
//   3. Messages              7. Lecture des données    11. Applications Vue (une zone par bloc)
//   4. Utilitaires (dont menus et choix)   8. Variétés   12. Initialisation

// ===== 1. Constantes =====
const TABLE_ESPECES = 'Especes';     // identifiant de la table des espèces dans Grist
const TABLE_VARIETES = 'Varietes';
const TABLE_MILLESIMES = 'Millesimes';
const TABLE_SEMIS = 'Semis';
const NB_FAVORIS = 6;                // les 6 premiers choix de Origine sont des pastilles, les autres un menu
const NB_SAISONS_MAX = 20;           // nombre de saisons maximum proposé (menu et préremplissage)
const NB_SAISONS = ['or.', ...Array.from({ length: NB_SAISONS_MAX }, (_, i) => String(i + 1))];
const NB_SACHETS = 1;                // valeur de Nb_sachets (Numérique) pour un sachet ; une plante mère va dans Nb_plants
const ORIGINE_PRODUCTION = 'Monjardin';   // choix de la colonne Origine affiché « AR » sur l'étiquette
const ANNEE_MIN = 2000;
const MOTIF_PROFONDEUR = /^\d+([.,]\d+)?(\s*-\s*\d+([.,]\d+)?)?$/;   // 1, 0,5, 1-2
// Colonnes de choix lues dans Varietes
const COLONNES_CHOIX = [
  'Type', 'Exposition', 'Arrosage', 'Famille', 'Nature_du_sol', 'Qualite_du_sol', 'Ou_cultiver', 'Infos', 'Ou_semer'
];
const MOIS_VALEURS = LISTE_MOIS.map(m => m.valeurs[0]);   // valeurs des listes de mois dans Grist
const LIMITE_RECHERCHE = 40;         // nombre de résultats affichés dans une liste avec recherche
// Champs communs à une espèce et à une variété : mêmes noms dans le formulaire
function champsVides() {
  return {
    type: '', famille: [], conservation: '', profondeur: '', dureeGerm: '', tempGerm: '',
    abri: [], terre: [], recolte: [],
    exposition: '', arrosage: '', natureSol: [], qualiteSol: [], ouCultiver: [], ouSemer: [], infos: []
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

// ===== 2. État =====
const etat = Vue.reactive({
  charge: false,
  erreurChargement: '',
  onglet: 'millesime',
  chaine: true,              // « Enchaîner automatiquement »
  enregistrement: false,
  message: '',
  erreur: false,
  panneauMessage: '',        // panneau où le message s'affiche : 'variete' | 'millesime'
  // Bandeaux d'enchaînement : le texte est dans le HTML, ici seulement la situation et ses données
  //   variete  : { nb }
  //   millesime: { type: 'variete', nom } | { type: 'graines', nom }
  bandeaux: { millesime: null, variete: null },

  // Espèces
  especes: [],               // espèces existantes

  // Variétés
  choixVariete: Object.fromEntries(COLONNES_CHOIX.map(c => [c, []])),
  varietes: [],              // variétés existantes
  varieteBase: '',           // id de l'espèce choisie comme modèle de base (panneau Variété)
  variete: { nom: '', variete: '', description: '', ...champsVides() },
  doublonVarieteMasque: false,

  // Millésimes
  choixOrigine: [],          // choix de la colonne Origine
  choixTypePlant: [],        // choix de la colonne Type_plant (plante mère)
  lieux: [],                 // choix de la colonne Ou de Semis (emplacements des plantes mères)
  millesime: millesimeVide(),
  doublonsMillesime: [],     // millésimes existants de même variété + année + origine + nature
  doublonMillesimeMasque: false,
  autresOrigines: false,     // panneau « Autre origine » ouvert
  menuOuvert: '',            // nom du menu déroulant ouvert ('' si aucun)
  recherches: { 'm-variete': '', 'v-base': '', 'v-infos': '', 'm-lieux': '' },   // texte tapé dans chaque champ de recherche (clé = nom du menu)
  ajout: { cible: '', texte: '', enCours: false },   // petit champ « ➕ Nouvelle origine / info » ouvert : 'origine' | 'info'

  // Étiquettes en attente (Semis.Etiq_en_attente)
  issuEtiquettes: false,     // case « Issu de mes étiquettes »
  etiquettesChargees: false, // la liste a été lue (pour afficher « aucune étiquette »)
  erreurEtiquettes: '',      // erreur de lecture de la liste
  semisEnAttente: [],        // lignes Semis avec Etiq_en_attente > 0
  ligneAttenteId: '',        // ligne choisie dans la liste
  parcoursLigne: false       // true pendant le trajet ligne sans variété → variété → millésime
});

// ===== 3. Messages =====

// ===== Textes de l'outil Achat / repro =====
// Tous les messages affichés après une action (erreurs de saisie, confirmations, erreurs d'écriture)
// et les libellés fabriqués par le code sont ici. Les libellés fixes (titres, champs, boutons,
// bandeaux, avertissements) sont dans achatrepro.html.
 
const TEXTES = {
  // --- Contrôles de saisie : variété ---
  nomObligatoire: 'Le nom est obligatoire.',
  conservationEntier: "La conservation doit être un nombre entier d'années.",
  dureeEntier: 'La durée de germination doit être un nombre entier de jours.',
  profondeurFormat: 'La profondeur de semis doit être un nombre ou une fourchette (ex. 1 ou 1-2).',
 
  // --- Contrôles de saisie : millésime ---
  varieteObligatoire: 'Choisir une variété.',
  anneeMillesime: (min, max) => `L'année du millésime doit avoir 4 chiffres (entre ${min} et ${max}).`,
  origineObligatoire: "L'origine est obligatoire.",
  natureObligatoire: 'Cocher Sachet ou Plante mère.',
  quantiteObligatoire: 'Indiquer la quantité de graines (nombre entier, au moins 1).',
  anneePlantation: (min, max) => `L'année de plantation doit avoir 4 chiffres (entre ${min} et ${max}).`,
  nbPlantsObligatoire: 'Indiquer le nombre de plants (entier, au moins 1).',
  typePlantObligatoire: 'Choisir le type de plant.',
  lieuxObligatoires: 'Choisir au moins un emplacement pour la plante mère.',
  ligneObligatoire: 'Choisir une ligne d\'étiquettes, ou décocher "Issu de mes étiquettes".',
  sachetsReelsObligatoire: 'Indiquer le nombre de sachets réels (au moins 1).',
 
  // --- Erreurs d'écriture et de lecture ---
  erreur: e => '❌ Erreur : ' + e,
  detectionImpossible: e => '⚠️ Détection impossible : ' + e,
  varieteIntrouvable: 'Variété introuvable dans la liste (recharge le widget).',
  originePasAjoutee: e => '❌ Origine non ajoutée : ' + e,
  infoPasAjoutee: e => '❌ Info non ajoutée : ' + e,
  erreurChargement: e => 'Erreur de chargement : ' + e,
  aucunChoixLieux: 'aucun choix trouvé pour Semis.Ou',
  lieuxNonCharges: e => 'Emplacements non chargés : ' + e + ' (impossible de créer une plante mère).',
  suiteEchouee: e => '⚠️ Millésime créé, mais la suite a échoué (' + e + ') : vérifie Millesimes, les semis de la variété et la ligne d\'étiquettes.',
  // --- Confirmations ---
  varieteCreee: nom => 'Variété créée : ' + nom,
  millesimeCree: (annee, nom, planteMere, decoche, don) => 'Millésime ' + annee + ' créé pour ' + nom +
    (planteMere ? ' (ajouté aussi dans Semis)' : '') +
    (decoche ? ' · « À reproduire » décoché' : '') +
    (don > 0 ? ' · Don : ' + don + ' ' + pluriel(don, 'sachet') : ''),
  origineExiste: nom => `Cette origine existe déjà : « ${nom} » est sélectionnée.`,
  origineAjoutee: nom => 'Origine ajoutée : ' + nom,
  infoAjoutee: nom => 'Info ajoutée : ' + nom,
 
  // --- Libellés fabriqués par le code (listes) ---
  orOriginal: 'or. (original)',
  varieteInconnue: '(variété inconnue)',
   graineAIdentifier: (note, nb) =>
    'Graines à identifier' + (note ? ' (' + note + ')' : '') + ' · ' + nb + ' ' + pluriel(nb, 'étiquette'),
  ligneAttente: (variete, type, nb) => variete + ' · ' + type + ' · ' + nb + ' ' + pluriel(nb, 'étiquette'),
  typeMere: 'plante mère',
  typeSemis: 'semis',
  typeHorsSachet: 'récupération hors sachet'
};
 
const afficherMessage = creerMessageTemporaire(texte => { etat.message = texte; });

function dire(texte, erreur = false, panneau = etat.onglet) {
  etat.panneauMessage = panneau;
  etat.erreur = erreur;
  if (erreur) {
    afficherMessage('');     // arrête le minuteur en cours
    etat.message = texte;    // une erreur reste affichée jusqu'au prochain clic
  } else {
    afficherMessage(texte);  // un succès disparaît au bout de 4 s
  }
}

// Un clic efface un message d'erreur. L'écouteur est en phase de capture : un clic sur « Créer »
// efface l'ancienne erreur AVANT que le bouton revalide, donc elle réapparaît s'il reste un problème.
effacerAuClic(() => { if (etat.erreur && etat.message) etat.message = ''; });

// ===== 4. Utilitaires =====
function anneeValide(valeur) {
  // 4 chiffres, entre ANNEE_MIN et l'année en cours
  const t = String(valeur).trim();
  const n = parseInt(t, 10);
  return /^\d{4}$/.test(t) && n >= ANNEE_MIN && n <= new Date().getFullYear();
}

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
    Ou_semer: enListeChoix(f.ouSemer),
    Infos: enListeChoix(f.infos)
  };
}

function appliquerEspece(m, formulaire) {
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

function existeDeja(liste, valeur) {
  return liste.some(c => normaliser(c) === normaliser(valeur));   // sans casse ni accents
}

function cleOrigine(liste) {
  // ['Achat', 'Don'] ou ['L', 'Achat', 'Don'] → 'Achat|Don' (trié, sans le L) pour comparer
  return (Array.isArray(liste) ? liste : []).filter(v => v && v !== 'L').sort().join('|');
}
// Menus déroulants à choix unique : un seul ouvert à la fois, fermé par un clic ailleurs
function basculerMenu(nom) {
  etat.menuOuvert = etat.menuOuvert === nom ? '' : nom;
}

function choisir(objet, cle, valeur) {
  objet[cle] = valeur;
  etat.menuOuvert = '';
}

function libelleDe(options, valeur) {
  // Libellé de l'option { valeur, libelle } choisie ('' si aucune)
  const o = options.find(x => x.valeur === valeur);
  return o ? o.libelle : '';
}

// Menus avec recherche : le texte tapé est dans etat.recherches[nom], la liste se réduit à chaque lettre
function chercher(options, saisie) {
  const s = normaliser(saisie);
  const trouves = options.filter(o => correspondRecherche(normaliser(o.libelle), s));
  return { affiches: trouves.slice(0, LIMITE_RECHERCHE), autres: Math.max(0, trouves.length - LIMITE_RECHERCHE) };
}

function ouvrirRecherche(nom) {
  etat.menuOuvert = nom;
}

function saisirRecherche(nom, e) {
  etat.recherches[nom] = e.target.value;
  etat.menuOuvert = nom;
}

function fermerRecherche(nom) {
  if (etat.menuOuvert === nom) etat.menuOuvert = '';
  etat.recherches[nom] = '';
}

function choisirRecherche(nom, objet, cle, valeur) {
  choisir(objet, cle, valeur);
  etat.recherches[nom] = '';
}

document.addEventListener('click', e => {
  if (!e.target.closest('.menu')) etat.menuOuvert = '';
});

function sansVides(liste) {
  return (liste || []).filter(c => String(c).trim() !== '');   // choix vides de Grist ignorés
}

// Choix multiples : pastilles ou liste avec recherche
function basculerDans(liste, valeur) {
  // Ajoute la valeur si elle n'y est pas, la retire sinon
  const i = liste.indexOf(valeur);
  if (i >= 0) liste.splice(i, 1);
  else liste.push(valeur);
}

function ajouterDans(nom, liste, valeur) {
  liste.push(valeur);
  etat.recherches[nom] = '';
  etat.menuOuvert = '';   // la liste se rouvre au toucher du champ
}
// ===== 5. Valeurs calculées =====
// Variétés : doublons
const doublonsVariete = Vue.computed(() => {
  if (!etat.variete.nom.trim()) return [];
  const cle = normaliser(etat.variete.nom) + '|' + normaliser(etat.variete.variete);
  return etat.varietes.filter(v => normaliser(v.nom) + '|' + normaliser(v.variete) === cle);
});

// Millésime : origine
const origineFavorites = Vue.computed(() => etat.choixOrigine.slice(0, NB_FAVORIS));
const origineAutres = Vue.computed(() => etat.choixOrigine.slice(NB_FAVORIS));
// Valeur affichée par le menu « Autres origines » : l'origine choisie si elle y figure, sinon vide
const origineAutre = Vue.computed(() => origineAutres.value.includes(etat.millesime.origine) ? etat.millesime.origine : '');

const typeVariete = Vue.computed(() => {
  const v = etat.varietes.find(x => x.id === Number(etat.millesime.varieteId));
  return v ? v.type : '';
});

// Millésime : étiquettes en attente
const ligneAttente = Vue.computed(() =>
  etat.semisEnAttente.find(l => l.id === Number(etat.ligneAttenteId)) || null);
const ligneSansVariete = Vue.computed(() => !!ligneAttente.value && !ligneAttente.value.varId);
const varieteVerrouillee = Vue.computed(() => !!ligneAttente.value && !!ligneAttente.value.varId);

const optionsAttente = Vue.computed(() =>
  etat.semisEnAttente
    .map(l => ({ valeur: l.id, libelle: libelleAttente(l) }))
    .sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr')));

// Don = sachets réels - 1 (null tant que les sachets réels ne sont pas saisis)
const donSachets = Vue.computed(() => {
  const n = entierOuNull(etat.millesime.sachetsReels);
  return n >= 1 ? n - 1 : null;
});

// Listes préparées pour les menus : { valeur, libelle }
const optionsVarietes = Vue.computed(() =>
  etat.varietes.map(v => ({ valeur: v.id, libelle: libelle(v) })));
const optionsEspeces = Vue.computed(() =>
  etat.especes.map(m => ({ valeur: m.id, libelle: m.nom })));
const optionsNbSaisons = NB_SAISONS.map(s => ({ valeur: s, libelle: s === 'or.' ? TEXTES.orOriginal : s }));
const resultatsVariete = Vue.computed(() => chercher(optionsVarietes.value, etat.recherches['m-variete']));
const resultatsEspece = Vue.computed(() => chercher(optionsEspeces.value, etat.recherches['v-base']));
const infosProposees = Vue.computed(() => lieuxFiltres(etat.choixVariete.Infos, etat.variete.infos, etat.recherches['v-infos']));
const lieuxProposes = Vue.computed(() => lieuxFiltres(etat.lieux, etat.millesime.lieux, etat.recherches['m-lieux']));

// ===== 6. Observateurs (watch) =====
// Choisir une espèce comme modèle de base (panneau Variété) :
// copie ses champs dans le formulaire, le nom n'est pas copié
Vue.watch(() => etat.varieteBase, id => {
  const m = etat.especes.find(x => x.id === id);
  if (m) appliquerEspece(m, etat.variete);
});

// Le bandeau « doublon » se rouvre dès que le nom (ou la variété) change
Vue.watch(() => [etat.variete.nom, etat.variete.variete], () => { etat.doublonVarieteMasque = false; });

// Une origine choisie (pastille, menu, ajout, ligne d'étiquettes) referme le panneau « Autre origine »
Vue.watch(() => etat.millesime.origine, () => {
  etat.autresOrigines = false;
  if (etat.ajout.cible === 'origine') annulerAjout();
});
// Le bandeau « doublon » disparaît dès qu'on change la variété, l'année, l'origine ou la nature
Vue.watch(
  () => [etat.millesime.varieteId, etat.millesime.annee, etat.millesime.origine, etat.millesime.planteMere],
  () => { etat.doublonsMillesime = []; etat.doublonMillesimeMasque = false; }
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

// Choix d'une ligne dans la liste des étiquettes en attente
Vue.watch(() => etat.ligneAttenteId, () => chargerLigneAttente());

// Corriger l'année du millésime recalcule Nb saisons (ligne d'étiquettes avec variété choisie)
Vue.watch(() => etat.millesime.annee, () => {
  const l = ligneAttente.value;
  if (l && l.varId && anneeValide(etat.millesime.annee)) {
    etat.millesime.nbSaisons = saisonsPourLigne(l, parseInt(etat.millesime.annee));
  }
});

// ===== 7. Lecture des données =====
function especeDepuisLigne(m) {
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
    ouSemer: listeChoix(m.Ou_semer),
    infos: listeChoix(m.Infos)
  };
}

async function chargerEspeces() {
  const tab = await grist.docApi.fetchTable(TABLE_ESPECES);
  etat.especes = tableEnLignes(tab)
    .map(especeDepuisLigne)
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

async function chargerVarietes() {
  const tab = await grist.docApi.fetchTable(TABLE_VARIETES);
  etat.varietes = tableEnLignes(tab)
    .map(v => ({ id: v.id, nom: v.Nom || '', variete: v.Variete || '', type: v.Type || '', aReproduire: !!v.A_reproduire }))
    .sort((a, b) => (a.nom + a.variete).localeCompare(b.nom + b.variete, 'fr'));
}

// Étiquettes en attente (Semis.Etiq_en_attente)
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
      transit: !semis.Date_s[i] && !semis.Nb_graines[i] && !semis.Nb_godets[i]
        && !semis.Germes[i] && !semis.Plantes[i] && !(semis.Nb_etiquettes[i] > 0),
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


// ===== 8. Variétés =====

function reinitialiserVariete() {
  etat.varieteBase = '';
  Object.assign(etat.variete, { nom: '', variete: '', description: '', ...champsVides() });
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
  const libelleCree = libelle({ nom, variete });

  etat.enregistrement = true;
  let nouvelId = null;
  try {
    const resultat = await grist.docApi.applyUserActions([
      ['AddRecord', TABLE_VARIETES, null, {
        NomVariete: nomVariete,
        Num_epingle: null,   // vide, pas 0
        ...colonnesCommunes(f),
        Description: f.description.trim() || null
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
  }
  etat.enregistrement = false;
}

// ===== 9. Millésimes =====

function reinitialiserMillesime() {
  Object.assign(etat.millesime, millesimeVide());
  etat.doublonsMillesime = [];
  etat.doublonMillesimeMasque = false;
  etat.bandeaux.millesime = null;
  etat.ligneAttenteId = '';
  etat.parcoursLigne = false;
  etat.autresOrigines = false;
  rafraichirEtiquettes();   // la case « Issu de mes étiquettes » reste cochée : la liste est remise à jour
}

// --- Étiquettes en attente : choix d'une ligne et préremplissage ---
function libelleAttente(l) {
  if (!l.varId) return TEXTES.graineAIdentifier(l.note, l.nb);
  const v = etat.varietes.find(x => x.id === l.varId);
  const type = (l.mil && l.mil.planteMere) ? TEXTES.typeMere : (l.seme ? TEXTES.typeSemis : TEXTES.typeHorsSachet);
  return TEXTES.ligneAttente(v ? libelle(v) : TEXTES.varieteInconnue, type, l.nb);
}

function saisonsPourLigne(l, anneeRef) {
  // Nb de saisons du nouveau millésime : même règle que l'étiquette.
  // Pour une plante mère, on compte jusqu'à l'année du millésime saisi (la récolte), pas jusqu'à aujourd'hui.
  let n;
  if (l.mil && l.mil.planteMere) {
    if (!l.mil.anneePlantation) return 'or.';
    n = anneeRef - l.mil.anneePlantation + 1;
  } else if (!l.seme) {
    return 'or.';
  } else {
    n = parseInt(l.mil ? l.mil.saisons : '');
    n = isNaN(n) ? 1 : n + 1;
  }
  return String(Math.min(Math.max(n, 1), NB_SAISONS_MAX));
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
  m.nbSaisons = saisonsPourLigne(l, parseInt(m.annee));
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
  etat.bandeaux.variete = { nb: l.nb };
  etat.onglet = 'variete';
  donnerLeFocus('v-nom');
}

function actionLigneEtiquettes(ligne) {
  // Ligne de transit : on la supprime ; sinon on vide seulement Etiq_en_attente
  return ligne.transit
    ? ['RemoveRecord', TABLE_SEMIS, ligne.id]
    : ['UpdateRecord', TABLE_SEMIS, ligne.id, { Etiq_en_attente: null }];
}

// --- Création d'un millésime ---
async function creerMillesime(forcer = false) {
  if (etat.enregistrement) return;
  const m = etat.millesime;
  const varId = Number(m.varieteId);
  const annee = parseInt(m.annee);
  const sachet = m.sachet;
  const planteMere = m.planteMere;
  const qtte = entierOuNull(m.qtte);
  const anneePlantation = parseInt(m.anneePlantation) || null;
  const nbPlants = entierOuNull(m.nbPlants);
  const anneeMax = new Date().getFullYear();

  // 1) Contrôles de saisie
  if (!varId) { dire(TEXTES.varieteObligatoire, true); return; }
  if (!anneeValide(m.annee)) { dire(TEXTES.anneeMillesime(ANNEE_MIN, anneeMax), true); return; }
  if (!m.origine) { dire(TEXTES.origineObligatoire, true); return; }
  if (!sachet && !planteMere) { dire(TEXTES.natureObligatoire, true); return; }
  if (sachet && !qtte) { dire(TEXTES.quantiteObligatoire, true); return; }
  if (planteMere && !anneeValide(m.anneePlantation)) { dire(TEXTES.anneePlantation(ANNEE_MIN, anneeMax), true); return; }
  if (planteMere && !(nbPlants >= 1)) { dire(TEXTES.nbPlantsObligatoire, true); return; }
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
    const etaitAReproduire = !!(v && v.aReproduire);   // pour le message seulement

    // Premier envoi : le millésime (son id est nécessaire pour la ligne Semis d'une plante mère)
    let nouveauMillesimeId = null;
    try {
      const resultat = await grist.docApi.applyUserActions([
        ['AddRecord', TABLE_MILLESIMES, null, {
          NomVariete: varId,
          Millesime: dateEnSecondes(annee + '-01-01'),   // 1er janvier
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

    // Second envoi : tout le reste d'un seul coup
    const actions = [['UpdateRecord', TABLE_VARIETES, varId, { A_reproduire: false }]];
    if (ligne) actions.push(actionLigneEtiquettes(ligne));
    if (planteMere && nouveauMillesimeId) {
      actions.push(['AddRecord', TABLE_SEMIS, null, {
        NomVariete: varId,
        Millesime: nouveauMillesimeId,
        Date_s: dateEnSecondes(anneePlantation + '-01-01'),
        Plantes: nbPlants,
        Ou: enListeChoix(m.lieux),
        Nb_etiquettes: 0
      }]);
    }
    try {
      await grist.docApi.applyUserActions(actions);
    } catch (e) {
      dire(TEXTES.suiteEchouee(e.message), true);   // pas d'annulation : le message dit quoi vérifier
      return;
    }

    if (v) v.aReproduire = false;
    dire(TEXTES.millesimeCree(annee, v ? v.nom : '', planteMere, etaitAReproduire, sachetsReels > 1 ? sachetsReels - 1 : 0));
    reinitialiserMillesime();
  } finally {
    etat.enregistrement = false;
  }
}

// ===== 10. Ajouter un choix à une colonne (Origine, Infos) =====
async function ajouterChoixColonne(tableId, colId, valeur) {
  // Ajoute un choix à une colonne Choice / ChoiceList. Les autres réglages de la colonne
  // sont relus puis renvoyés tels quels (ModifyColumn remplace tous les réglages).
  const [tabTables, tabColonnes] = await Promise.all([
    grist.docApi.fetchTable('_grist_Tables'),
    grist.docApi.fetchTable('_grist_Tables_column')
  ]);
  const colonne = colonneGrist(tabTables, tabColonnes, tableId, colId);
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
function ouvrirAjout(cible) {
  etat.ajout.cible = cible;
  etat.ajout.texte = '';
  donnerLeFocus('ajout-' + cible);
}

function annulerAjout() {
  etat.ajout.cible = '';
  etat.ajout.texte = '';
}

async function validerAjout() {
  const texte = etat.ajout.texte.trim();
  if (!texte || etat.ajout.enCours) return;
  etat.ajout.enCours = true;
  try {
    const reussi = etat.ajout.cible === 'origine' ? await ajouterOrigine(texte) : await ajouterInfo(texte);
    if (reussi) annulerAjout();
  } finally {
    etat.ajout.enCours = false;
  }
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

async function ajouterInfo(texte) {
  // Ajoute l'info aux choix de Varietes.Infos, puis la sélectionne dans la variété. Renvoie true si l'ajout a réussi.
  const existante = etat.choixVariete.Infos.find(c => normaliser(c) === normaliser(texte));
  const valeur = existante || texte;
  if (!existante) {
    try {
      await ajouterChoixColonne(TABLE_VARIETES, 'Infos', valeur);
      etat.choixVariete.Infos = [...etat.choixVariete.Infos, valeur];
    } catch (e) {
      dire(TEXTES.infoPasAjoutee(e.message), true);
      return false;
    }
  }
  if (!etat.variete.infos.includes(valeur)) etat.variete.infos = [...etat.variete.infos, valeur];
  dire(TEXTES.infoAjoutee(valeur));
  return true;
}
// ===== 11. Applications Vue (une zone par bloc, un seul état commun) =====
// En-tête : titre, onglets, enchaînement
Vue.createApp({
  setup() {
    return { etat };
  }
}).mount('#appEntete');

// Panneau « Nouveau millésime »
Vue.createApp({
  setup() {
    return {
      etat, pluriel,
      origineFavorites, origineAutres, origineAutre, typeVariete,
      creerMillesime, reinitialiserMillesime,
      ligneAttente, ligneSansVariete, varieteVerrouillee, donSachets,
      allerCreerVariete,
      optionsVarietes, optionsAttente, optionsNbSaisons, resultatsVariete,
      ouvrirRecherche, saisirRecherche, fermerRecherche, choisirRecherche,
      basculerMenu, choisir, libelleDe,
      ouvrirAjout, annulerAjout, validerAjout,
      basculerDans, ajouterDans, lieuxProposes
    };
  }
}).mount('#appMillesime');

// Panneau « Nouvelle variété »
Vue.createApp({
  setup() {
    return {
      etat, pluriel,
      doublonsVariete, creerVariete, reinitialiserVariete,
      optionsEspeces, resultatsEspece,
      ouvrirRecherche, saisirRecherche, fermerRecherche, choisirRecherche,
      basculerMenu, choisir, libelleDe,
      ouvrirAjout, annulerAjout, validerAjout,
      MOIS_VALEURS, basculerDans, ajouterDans, infosProposees
    };
  }
}).mount('#appVariete');

// ===== 12. Initialisation =====
grist.ready({ requiredAccess: 'full' });

async function demarrer() {
  try {
       const [choixVariete, choixMillesime] = await Promise.all([
      lireChoixColonnes(TABLE_VARIETES, COLONNES_CHOIX),
      lireChoixColonnes(TABLE_MILLESIMES, ['Origine', 'Type_plant']),
      chargerEspeces(),
      chargerVarietes()
    ]);
    for (const c of COLONNES_CHOIX) etat.choixVariete[c] = sansVides(choixVariete[c]);
    etat.choixOrigine = sansVides(choixMillesime.Origine);
    etat.choixTypePlant = sansVides(choixMillesime.Type_plant);
  } catch (err) {
    console.error(err);
    etat.erreurChargement = TEXTES.erreurChargement(err.message);
  }

  // Emplacements des plantes mères : une erreur ici ne bloque que la création d'une plante mère
  try {
    const choixSemis = await lireChoixColonnes(TABLE_SEMIS, ['Ou']);
    etat.lieux = sansVides(choixSemis.Ou);
    if (!etat.lieux.length) throw new Error(TEXTES.aucunChoixLieux);
  } catch (err) {
    console.error(err);
    etat.erreurChargement += (etat.erreurChargement ? ' ' : '') + TEXTES.lieuxNonCharges(err.message);
  }
  etat.charge = true;
}

demarrer();