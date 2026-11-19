// ===== Achat / repro : outil en Vue =====
// Étape 3a : panneaux Espèce, Variété et Millésime (sans les étiquettes en attente, ajoutées en 3b)

// ===== Constantes =====
const TABLE_ESPECES = 'Especes';     // identifiant de la table des espèces dans Grist
const TABLE_VARIETES = 'Varietes';
const TABLE_MILLESIMES = 'Millesimes';
const TABLE_SEMIS = 'Semis';
const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Juil', 'Aou', 'Sep', 'Oct', 'Nov', 'Déc'];
const SEUIL_PASTILLES = 15;   // liste de choix de 15 ou moins : pastilles ; plus longue : champ de recherche
const NB_FAVORIS = 6;         // les 6 premiers choix de Origine sont des pastilles, les autres un menu
const NB_SAISONS = ['or.', '1', '2', '3', '4', '5', '6', '7', '8'];
const ORIGINE_PRODUCTION = 'Monjardin';   // choix de la colonne Origine affiché « AR » sur l'étiquette
const COLONNES_CHOIX_MODELE = [
  'Type', 'Exposition', 'Arrosage', 'Semis_profondeur',
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
    anneePlantation: '', nbPlants: '', lieux: [],  // plante mère
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
  bandeaux: { millesime: '', variete: '' },   // bandeaux d'enchaînement

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
  lieux: [],                 // choix de la colonne Ou de Semis (emplacements des plantes mères)
  millesime: millesimeVide(),
  doublonsMillesime: [],     // millésimes existants de même variété + année + origine + nature
  doublonMillesimeMasque: false,

  // Étiquettes en attente (Semis.Etiq_en_attente)
  issuEtiquettes: false,     // case « Issu de mes étiquettes »
  semisEnAttente: [],        // lignes Semis avec Etiq_en_attente > 0
  ligneAttenteId: '',        // ligne choisie dans la liste
  parcoursLigne: false       // true pendant le trajet ligne sans variété → espèce → variété → millésime
});

// ===== Messages =====
const afficherMessage = creerMessageTemporaire(texte => { etat.message = texte; }, 4000);

function dire(texte, erreur = false, panneau = etat.onglet) {
  etat.panneauMessage = panneau;
  etat.erreur = erreur;
  afficherMessage(texte);
}

// ===== Utilitaires =====
function nombreOuNull(valeur) {
  const n = parseFloat(valeur);
  return isNaN(n) ? null : n;
}

function colonnesCommunes(f) {
  // Colonnes identiques pour une espèce et une variété, au format attendu par Grist
  return {
    Type: f.type || null,
    Conservation: nombreOuNull(f.conservation),
    Semis_profondeur: f.profondeur || null,
    Duree_germ: nombreOuNull(f.dureeGerm),
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
    profondeur: m.Semis_profondeur || '',
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
  if (!nom) { dire('Le nom est obligatoire.', true); return; }
  if (!forcer && doublonsModele.value.length) { etat.doublonModeleMasque = false; return; }

  etat.enregistrement = true;
  let nouvelId = null;
  try {
    const resultat = await grist.docApi.applyUserActions([
      ['AddRecord', TABLE_ESPECES, null, { Nom: nom, ...colonnesCommunes(etat.modele) }]
    ]);
    nouvelId = resultat && resultat.retValues ? resultat.retValues[0] : null;
  } catch (e) {
    dire('❌ Erreur : ' + e.message, true);
    etat.enregistrement = false;
    return;
  }

  try {
    await chargerModeles();
  } catch (e) {
    console.error('Rechargement des espèces impossible :', e);
  }
  reinitialiserModele();
  dire('✅ Espèce créée : ' + nom);

  // Enchaînement vers la variété : espèce présélectionnée (ses champs sont copiés), nom repris
  if ((etat.chaine || etat.parcoursLigne) && nouvelId) {
    etat.varieteBase = nouvelId;
    etat.variete.nom = nom;
    etat.bandeaux.variete = '🔗 Espèce "' + nom + '" créée — complétez maintenant sa première variété.';
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
  etat.bandeaux.variete = '';
}

async function creerVariete(forcer = false) {
  if (etat.enregistrement) return;
  const f = etat.variete;
  const nom = f.nom.trim();
  const variete = f.variete.trim();
  if (!nom) { dire('Le nom est obligatoire.', true); return; }
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
    dire('❌ Erreur : ' + e.message, true);
    etat.enregistrement = false;
    return;
  }

  try {
    await chargerVarietes();
  } catch (e) {
    console.error('Rechargement des variétés impossible :', e);
  }
  reinitialiserVariete();
  dire('✅ Variété créée : ' + libelleCree);

  // Enchaînement vers le millésime : variété présélectionnée (forcé pendant un parcours « graines à identifier »)
  if ((etat.chaine || etat.parcoursLigne) && nouvelId) {
    etat.millesime.varieteId = nouvelId;
    if (etat.parcoursLigne && ligneAttente.value) {
      etat.parcoursLigne = false;
      preremplirLigneSansVariete(ligneAttente.value);
      etat.bandeaux.millesime = '🔗 Variété "' + libelleCree + '" créée — choisis l\'origine et la quantité de tes graines.';
    } else {
      etat.bandeaux.millesime = '🔗 Variété "' + libelleCree + '" créée — complétez maintenant son millésime.';
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

const texteDoublonMillesime = Vue.computed(() => {
  const liste = etat.doublonsMillesime;
  if (!liste.length) return '';
  const d = liste[0];
  return '⚠️ ' + (liste.length > 1 ? liste.length + ' millésimes existent déjà' : 'Un millésime existe déjà') +
    ' (année ' + d.annee + ', origine : ' + (d.origine || '—') +
    ', quantité : ' + (d.qtte != null ? d.qtte : '—') + '). Créer quand même ?';
});

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
  else Object.assign(etat.millesime, { anneePlantation: '', nbPlants: '', lieux: [] });
});

function reinitialiserMillesime() {
  Object.assign(etat.millesime, millesimeVide());
  etat.doublonsMillesime = [];
  etat.doublonMillesimeMasque = false;
  etat.bandeaux.millesime = '';
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
  if (!l.varId) {
    return 'Graines à identifier' + (l.note ? ' (' + l.note + ')' : '') + ' · ' + l.nb + ' étiquette(s)';
  }
  const v = etat.varietes.find(x => x.id === l.varId);
  const type = (l.mil && l.mil.planteMere) ? 'plante mère' : (l.seme ? 'semis' : 'récupération hors sachet');
  return (v ? libelle(v) : '(variété inconnue)') + ' · ' + type + ' · ' + l.nb + ' étiquette(s)';
}

const optionsAttente = Vue.computed(() =>
  etat.semisEnAttente
    .map(l => ({ id: l.id, texte: libelleAttente(l) }))
    .sort((a, b) => a.texte.localeCompare(b.texte, 'fr')));

const infoDon = Vue.computed(() => {
  const n = parseInt(etat.millesime.sachetsReels);
  return n >= 1 ? 'Don : ' + (n - 1) + ' sachet(s)' : '';
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

  // Ligne sans variété : le menu Variété reste libre, les boutons de création apparaissent
  if (!l.varId) {
    m.varieteId = '';
    preremplirLigneSansVariete(l);
    dire('Choisis la variété dans le menu, ou crée-la avec les boutons.', false, 'millesime');
    return;
  }

  // Ligne avec variété : variété verrouillée, tout est prérempli
  if (!etat.varietes.some(v => v.id === l.varId)) {
    dire('Variété introuvable dans la liste (recharge le widget).', true, 'millesime');
    return;
  }
  m.varieteId = l.varId;
  m.annee = new Date().getFullYear();
  m.nbSaisons = saisonsPourLigne(l);
  const produit = (l.mil && l.mil.planteMere) || l.seme;
  const origine = produit ? ORIGINE_PRODUCTION : (l.originesOr[0] || '');
  m.origine = etat.choixOrigine.includes(origine) ? origine : '';
  m.sachet = true;
  m.planteMere = false;
  m.sachetsReels = l.nb;
  if (!m.origine) dire('Origine non reconnue : choisis-la à la main.', true, 'millesime');
  donnerLeFocus('m-qtte');
}

// Ligne sans variété → panneau Variété (la note préremplit le nom, modifiable)
function allerCreerVariete() {
  const l = ligneAttente.value;
  if (!l || l.varId) return;
  etat.parcoursLigne = true;
  if (!etat.variete.nom.trim() && l.note) etat.variete.nom = l.note;
  etat.bandeaux.variete = '🔗 Graines à identifier (' + l.nb +
    ' étiquette(s)) : crée la variété, tu reviendras au millésime ensuite.';
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
  if (!actif) { annulerLigneAttente(); return; }
  try {
    await chargerSemisEnAttente();
    if (!etat.semisEnAttente.length) dire('Aucune étiquette en attente dans Semis.', true, 'millesime');
  } catch (e) {
    dire('❌ Lecture des étiquettes en attente impossible : ' + e.message, true, 'millesime');
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
  const qtte = nombreOuNull(m.qtte);
  const anneePlantation = parseInt(m.anneePlantation) || null;
  const nbPlants = Number(m.nbPlants);

  // 1) Contrôles de saisie
  if (!varId) { dire('Choisir une variété.', true); return; }
  if (!annee) { dire('Indiquer une année.', true); return; }
  if (!m.origine) { dire("L'origine est obligatoire.", true); return; }
  if (!sachet && !planteMere) { dire('Cocher Sachet ou Plante mère.', true); return; }
  if (sachet && !qtte) { dire('Indiquer la quantité de graines.', true); return; }
  if (planteMere && !anneePlantation) { dire("Indiquer l'année de plantation.", true); return; }
  if (planteMere && !(Number.isInteger(nbPlants) && nbPlants >= 1)) {
    dire('Indiquer le nombre de plants (entier, au moins 1).', true);
    return;
  }
  if (planteMere && m.lieux.length === 0) { dire('Choisir au moins un emplacement pour la plante mère.', true); return; }

  // Mode « Issu de mes étiquettes »
  const ligne = ligneAttente.value;
  if (etat.issuEtiquettes && !ligne) {
    dire('Choisir une ligne d\'étiquettes, ou décocher "Issu de mes étiquettes".', true);
    return;
  }
  let sachetsReels = null;
  if (ligne && sachet) {
    sachetsReels = parseInt(m.sachetsReels);
    if (!(sachetsReels >= 1)) { dire('Indiquer le nombre de sachets réels (au moins 1).', true); return; }
  }

  // 2) Détection de doublon (sauf si l'utilisateur a déjà confirmé)
  if (!forcer) {
    let doublons = [];
    try {
      doublons = await trouverDoublonsMillesime(varId, annee, m.origine, planteMere);
    } catch (e) {
      dire('⚠️ Détection impossible : ' + e.message, true);
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
Nb_sachets: sachet ? 1 : null,
Nb_plants: planteMere ? nombreDePlants : null,
Melange: false,
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
      dire('❌ Erreur : ' + e.message, true);
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
      dire('⚠️ Millésime créé, mais le décochage de "A produire" a échoué : ' + e.message, true);
      return;
    }

    // 3c) Ligne d'étiquettes en attente : vidée, ou supprimée si c'est une ligne de transit
    if (ligne) {
      try {
        await nettoyerLigneAttente(ligne);
      } catch (e) {
        dire('⚠️ Millésime créé, mais le nettoyage de la ligne d\'étiquettes a échoué : ' + e.message, true);
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
        dire('⚠️ Millésime créé, mais la ligne Semis a échoué : ' + e.message, true);
        return;
      }
    }

    dire('✅ Millésime ' + annee + ' créé pour ' + (v ? v.nom : '') +
      (planteMere ? ' (ajouté aussi dans Semis)' : '') +
      (nbDecoches ? ' · "À produire" décoché sur ' + nbDecoches + ' semis' : '') +
      (sachetsReels > 1 ? ' · Don : ' + (sachetsReels - 1) + ' sachet(s)' : ''));
    reinitialiserMillesime();
  } finally {
    etat.enregistrement = false;
  }
}

// ===== Application Vue (un seul point de montage) =====
const app = Vue.createApp({
  setup() {
    return {
      etat, MOIS, NB_SAISONS, libelle,
      doublonsModele, doublonsVariete, texteDoublonMillesime,
      origineFavorites, origineAutres, origineAutre, choisirOrigine, typeVariete,
      creerModele, reinitialiserModele,
      creerVariete, reinitialiserVariete,
      creerMillesime, reinitialiserMillesime,
      ligneAttente, ligneSansVariete, varieteVerrouillee, optionsAttente, infoDon,
      allerCreerVariete, allerCreerEspece
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
  }
});

// Composant « choix multiple » : pastilles si la liste est courte, champ de recherche si elle est longue
app.component('choix-multiple', {
  template: '#tpl-choix-multiple',
  props: {
    modelValue: { type: Array, default: () => [] },
    choix: { type: Array, default: () => [] },
    seuil: { type: Number, default: SEUIL_PASTILLES }
  },
  emits: ['update:modelValue'],
  data() {
    return { recherche: '', ouvert: false };
  },
  computed: {
    proposes() {
      return lieuxFiltres(this.choix, this.modelValue, this.recherche);
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

app.mount('#app');

// ===== Initialisation =====
grist.ready({ requiredAccess: 'full' });

async function demarrer() {
  try {
    const [choixModele, choixVariete, choixMillesime] = await Promise.all([
      lireChoixColonnes(TABLE_ESPECES, COLONNES_CHOIX_MODELE),
      lireChoixColonnes(TABLE_VARIETES, COLONNES_CHOIX_VARIETE),
      lireChoixColonnes(TABLE_MILLESIMES, ['Origine']),
      chargerModeles(),
      chargerVarietes()
    ]);
    for (const c of COLONNES_CHOIX_MODELE) etat.choix[c] = choixModele[c] || [];
    for (const c of COLONNES_CHOIX_VARIETE) etat.choixVariete[c] = choixVariete[c] || [];
    etat.choixOrigine = choixMillesime.Origine || [];
  } catch (err) {
    console.error(err);
    etat.erreurChargement = 'Erreur de chargement : ' + err.message;
  }

  // Emplacements des plantes mères : une erreur ici ne bloque que la création d'une plante mère
  try {
    const choixSemis = await lireChoixColonnes(TABLE_SEMIS, ['Ou']);
    etat.lieux = choixSemis.Ou || [];
    if (!etat.lieux.length) throw new Error('aucun choix trouvé pour ' + TABLE_SEMIS + '.Ou');
  } catch (err) {
    console.error(err);
    etat.erreurChargement += (etat.erreurChargement ? ' ' : '') +
      'Emplacements non chargés : ' + err.message + ' (impossible de créer une plante mère).';
  }
  etat.charge = true;
}

demarrer();