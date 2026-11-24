// État lu par le HTML : Vue redessine quand il change
const etat = Vue.reactive({
  modeSemis: 'godets',        // 'godets' ou 'pleine_terre'
  rechercheVariete: '',       // texte du champ Variété
  varieteId: null,            // variété choisie (id de Varietes)
  resultatsVariete: [],       // [{ id, libelle }]
  autresVarietes: 0,          // nombre de résultats non affichés
  listeVarieteOuverte: false,
  encart: null,               // null = pas d'encart ; sinon { type, dureeGerm, annee, nbSemis, mere, anneesPlantation, lignes, autres, dejaDansListe }
  millesimes: [],             // [{ id, original, annee, origine, saisons }]
  millesimeId: null,          // millésime choisi
  listeMillesimeOuverte: false,
  types: [],                  // choix de Semis.Type, tels qu'écrits dans Grist (« Fleurs 🌼 »)
  type: '',                   // valeur écrite dans Grist, ex. « Fleurs 🌼 »
  listeTypeOuverte: false,
   ouChoisis: [],              // lieux choisis (pleine terre)
  rechercheOu: '',
  listeOuOuverte: false,
  sachetVide: false,
  aProduire: false,
  etapesIntermediaires: [],   // étapes en attente d'enregistrement (copiées dans sessionStorage)
  erreur: '',
  erreurFiche: '',            // erreur de saisie sous le formulaire
  succes: '',
  enregistrement: false,
  date: dateDuJour(),         // 'AAAA-MM-JJ'
  nbGodets: '',
  nbGraines: '',
  message: '',
  charge: false               // devient vrai à la fin du chargement                      
});

// ===== Textes des messages (erreurs, succès) =====
// Tous les messages construits par le JS sont ici, pour les relire et les comparer d'un outil à l'autre.
// Une entrée « (x) => … » est une petite fonction : on lui donne des noms ou un nombre, elle renvoie la phrase.
const TEXTES = {
  // Contrôles avant « Ajouter à la liste »
  varieteManquante: "Choisis une variété dans la liste.",
  millesimeManquant: "Choisis un millésime.",
  typeManquant: "Aucun type disponible (lecture des choix impossible) : recharge le widget.",
  dateManquante: "Renseigne la date du semis.",
  godetsManquants: "Nombre de godets : saisis un nombre entier (1 ou plus).",
  grainesManquantes: "Nombre de graines : saisis un nombre entier (1 ou plus).",
  lieuManquant: "Choisis au moins un emplacement (Où) pour un semis en pleine terre.",

  // Chargement
  erreurChargement: (detail) => "Erreur de chargement : " + detail,
  choixIntrouvables: (noms) => "Choix introuvables dans Grist : " + noms,
  choixNonCharges: (detail) => "Choix (Type, Où) non chargés : " + detail,

  // Enregistrement
  succes: (n) => `✓ ${n} ${pluriel(n, 'semis enregistré', 'semis enregistrés')} dans Semis.`,
  echecEnregistrement: (detail) => "Échec de l'enregistrement : " + detail + " — tes lignes sont conservées."
};

// ===== État global =====
let prochainIdEtapeIntermediaire= 1;
let varietePendante = null;   // variété reçue avant la fin du chargement

let TYPES = [];   // lus depuis Grist (choix de la colonne Type de Semis)
const TYPE_PAR_DEFAUT = '🌿 Arom.Méd';

let LIEUX = [];   // lus depuis Grist (choix de la colonne Ou de Semis)

const recordsParId = {
  varietes: new Map(),
  millesimes: new Map(),
  semis: new Map()
};

// ===== Statut =====
function nombreEtapes() {
  return etat.etapesIntermediaires.length;
}

// ===== Chargement des données =====
async function chargerDonnees() {
  const [tabVarietes, tabMillesimes] = await Promise.all([
    grist.docApi.fetchTable('Varietes'),
    grist.docApi.fetchTable('Millesimes')
  ]);

  recordsParId.varietes.clear();
  recordsParId.millesimes.clear();

    for (const v of tableEnLignes(tabVarietes)) {
    recordsParId.varietes.set(v.id, {
      id: v.id,
      nom: v.Nom || '',
      variete: v.Variete || '',
      type: v.Type || '',
      dureeGerm: v.Duree_germ || null,
      recherche: normaliser((v.Nom || '') + ' ' + (v.Variete || ''))
    });
  }

  for (const m of tableEnLignes(tabMillesimes)) {
    recordsParId.millesimes.set(m.id, {
      id: m.id,
      varieteId: m.NomVariete || 0,
      annee: anneeDepuisDate(m.Millesime),
      origine: listeChoix(m.Origine),
      saisonsManuel: m.Nb_saisons_manuel || '',
      estOriginal: m.Nb_saisons_manuel === 'or.',
      planteMere: !!m.Plante_mere,
      anneePlantation: m.Annee_plantation || null,
      epuise: !!m.Epuise          // formule Grist : sachet sans graines ni sachets
    });
  }
}
// ===== Sélecteur de variété =====
const MAX_RESULTATS = 40;

function afficherResultats() {
  const saisie = normaliser(etat.rechercheVariete);
  if (!saisie) { etat.listeVarieteOuverte = false; return; }

  const trouves = [...recordsParId.varietes.values()]
    .filter(v => correspondRecherche(v.recherche, saisie))
    .sort((a, b) => libelle(a).localeCompare(libelle(b), 'fr'));

  etat.resultatsVariete = trouves.slice(0, MAX_RESULTATS)
    .map(v => ({ id: v.id, libelle: libelle(v) }));
  etat.autresVarietes = Math.max(0, trouves.length - MAX_RESULTATS);
  etat.listeVarieteOuverte = true;
}

function surRechercheVariete(e) {
  etat.rechercheVariete = e.target.value;
  etat.varieteId = null;
  remplirMillesimes(null);
  afficherDerniersSemis();
  afficherResultats();
}

function surFocusVariete(e) {
  e.target.select();
  // Rouvre la liste seulement si une recherche est en cours (pas après un choix)
  if (etat.rechercheVariete && etat.varieteId === null) afficherResultats();
}

function choisirVariete(id) {
  const v = recordsParId.varietes.get(id);
  if (!v) return;
  etat.varieteId = id;
  etat.rechercheVariete = libelle(v);
  etat.listeVarieteOuverte = false;
  remplirMillesimes(id);
  appliquerTypeVariete(id);
  afficherDerniersSemis();
}

function reinitialiserVariete() {
  etat.varieteId = null;
  etat.rechercheVariete = '';
  etat.listeVarieteOuverte = false;
  afficherDerniersSemis();
}

// ===== Sélecteur de millésime =====
function millesimesDeVariete(varieteId) {
  // Retenus : « or. » ou datés, ni épuisés, ni plantes mères. Ordre : datés (récent d'abord), puis « or. » en dernier.
  const retenus = [...recordsParId.millesimes.values()]
    .filter(m => m.varieteId === varieteId && (m.estOriginal || m.annee !== null)
      && !m.epuise && !m.planteMere);
  return retenus.sort((a, b) => {
    if (a.estOriginal !== b.estOriginal) return a.estOriginal ? 1 : -1;
    return (b.annee || 0) - (a.annee || 0);
  });
}


function remplirMillesimes(varieteId) {
  etat.millesimeId = null;
  etat.listeMillesimeOuverte = false;

  const liste = varieteId ? millesimesDeVariete(varieteId) : [];
  etat.millesimes = liste.map(m => ({
    id: m.id,
    original: m.estOriginal,
    annee: m.annee,
    origine: m.origine,
    saisons: m.estOriginal ? null : (Number(m.saisonsManuel) || null)
  }));
  if (liste.length) etat.millesimeId = liste[0].id;   // le plus récent (ou « or. » s'il est seul)
}

function choisirMillesime(id) {
  etat.millesimeId = id;
  etat.listeMillesimeOuverte = false;
}

function rafraichirFiche() {
  // Après un rechargement des données : remet à jour les millésimes et l'encart de la variété en cours,
  // en gardant le millésime choisi s'il est toujours proposé
  if (!etat.varieteId) return;
  const choisi = etat.millesimeId;
  remplirMillesimes(etat.varieteId);
  if (etat.millesimes.some(m => m.id === choisi)) etat.millesimeId = choisi;
  afficherDerniersSemis();
}

function millesimeChoisi() {
  return etat.millesimes.find(m => m.id === etat.millesimeId) || null;
}

// ===== Reste de la fiche =====
function typeParDefaut() {
  return TYPES.includes(TYPE_PAR_DEFAUT) ? TYPE_PAR_DEFAUT : (TYPES[0] || '');
}

function remplirTypes() {
  etat.types = [...TYPES];
  etat.type = typeParDefaut();
}

function appliquerTypeVariete(varieteId) {
  const v = recordsParId.varietes.get(varieteId);
  etat.type = v && TYPES.includes(v.type) ? v.type : typeParDefaut();
}

async function chargerChoix() {
  try {
    const choix = await lireChoixColonnes('Semis', ['Type', 'Ou']);
    if (choix.Type) TYPES = choix.Type;
    if (choix.Ou) LIEUX = choix.Ou;
    const manquants = [!choix.Type && 'Type', !choix.Ou && 'Où'].filter(Boolean);
    if (manquants.length) etat.message = TEXTES.choixIntrouvables(manquants.join(', '));
  } catch (err) {
    console.error('Lecture des choix impossible :', err);
    etat.message = TEXTES.choixNonCharges(err.message);
  }
}

function choisirType(valeur) {
  etat.type = valeur;
  etat.listeTypeOuverte = false;
}

function basculerListe(nom) {
  const ouvrir = nom === 'millesime'
    ? !etat.listeMillesimeOuverte && etat.millesimes.length > 0
    : !etat.listeTypeOuverte;
  etat.listeMillesimeOuverte = nom === 'millesime' && ouvrir;
  etat.listeTypeOuverte = nom === 'type' && ouvrir;
}

// Un toucher en dehors d'un menu ferme les deux listes
document.addEventListener('click', e => {
  if (!e.target.closest('#menuMillesime')) etat.listeMillesimeOuverte = false;
  if (!e.target.closest('#menuType')) etat.listeTypeOuverte = false;
});

// --- Où (multi-sélection) ---
function lieuxProposes() {
  return lieuxFiltres(LIEUX, etat.ouChoisis, etat.rechercheOu);
}

function surRechercheOu(e) {
  etat.rechercheOu = e.target.value;
  etat.listeOuOuverte = true;
}

function ajouterLieu(lieu) {
  etat.ouChoisis.push(lieu);
  etat.rechercheOu = '';
  etat.listeOuOuverte = false;   // se ferme après le choix, se rouvre au toucher du champ
}

function retirerLieu(lieu) {
  etat.ouChoisis = etat.ouChoisis.filter(l => l !== lieu);
}

// --- Mode godets / pleine terre ---
function appliquerMode(mode) {
  etat.modeSemis = mode;
  etat.ouChoisis = [];
  etat.rechercheOu = '';
  etat.listeOuOuverte = false;
  etat.erreurFiche = '';
}

function choisirMode(mode) {
  if (mode !== etat.modeSemis) appliquerMode(mode);
}

function lireFiche() {
  const pleineTerre = etat.modeSemis === 'pleine_terre';
  const m = millesimeChoisi();
  return {
    mode: etat.modeSemis,
    varieteId: etat.varieteId,
    millesimeId: etat.millesimeId,
    millesime: m ? { ...m } : null,   // copie, pour l'affichage de la carte
    date: etat.date,
    godets: pleineTerre ? 1 : entierOuNull(etat.nbGodets),
    graines: entierOuNull(etat.nbGraines),
    type: etat.type,
    ou: pleineTerre ? [...etat.ouChoisis] : [],
    sachetVide: etat.sachetVide,
    aProduire: etat.aProduire
  };
}

function validerFiche(f) {
  if (!f.varieteId) return TEXTES.varieteManquante;
  if (!f.millesimeId) return TEXTES.millesimeManquant;
  if (!f.type) return TEXTES.typeManquant;
  if (!f.date) return TEXTES.dateManquante;
  if (!(f.godets > 0)) return TEXTES.godetsManquants;
  if (!(f.graines > 0)) return TEXTES.grainesManquantes;
  if (f.mode === 'pleine_terre' && f.ou.length === 0) return TEXTES.lieuManquant;
  return '';
}

// ===== Etapes intermédiaires =====
function ajouterEtapeIntermediaire() {
  const f = lireFiche();
  etat.erreurFiche = validerFiche(f);
  if (etat.erreurFiche) return;

  f.id = prochainIdEtapeIntermediaire++;
  etat.etapesIntermediaires.push(f);

  // Réinitialisation partielle : on garde date, godets, graines, type, mode
  reinitialiserVariete();
  remplirMillesimes(null);
  etat.ouChoisis = [];
  etat.rechercheOu = '';
  etat.sachetVide = false;
  etat.aProduire = false;
  Vue.nextTick(() => document.getElementById('rechercheVariete').focus());
}
function retirerEtapeIntermediaire(id) {
  etat.etapesIntermediaires = etat.etapesIntermediaires.filter(b => b.id !== id);
}

function nomEtapeIntermediaire(b) {
  const v = recordsParId.varietes.get(b.varieteId);
  return v ? libelle(v) : '(variété inconnue)';
}
// ===== Étapes conservées au rechargement =====
const CLE_SAISIES = 'semis_realises_saisies';

function sauvegarderSaisies() {
  try {
    if (!etat.etapesIntermediaires.length) sessionStorage.removeItem(CLE_SAISIES);
    else sessionStorage.setItem(CLE_SAISIES, JSON.stringify(etat.etapesIntermediaires));
  } catch (err) { console.warn(err); }
}

function restaurerSaisies() {
  // À appeler après le chargement des données : écarte les étapes dont la variété ou le millésime n'existe plus
  try {
    const liste = JSON.parse(sessionStorage.getItem(CLE_SAISIES) || '[]');
    etat.etapesIntermediaires = liste.filter(b =>
      recordsParId.varietes.has(b.varieteId) && recordsParId.millesimes.has(b.millesimeId));
    prochainIdEtapeIntermediaire = Math.max(0, ...etat.etapesIntermediaires.map(b => b.id)) + 1;
  } catch (err) { console.warn(err); }
}
// ===== Enregistrement dans Semis =====

const afficherSucces = creerMessageTemporaire(texte => { etat.succes = texte; });

// Un clic efface les messages d'erreur. L'écouteur est en phase de capture : un clic sur « Ajouter »
// ou « Enregistrer » efface l'ancienne erreur AVANT que le bouton revalide, donc elle réapparaît s'il reste un problème.
effacerAuClic(() => { etat.erreur = ''; });

async function enregistrerTout() {
  if (etat.etapesIntermediaires.length === 0 || etat.enregistrement) return;
  etat.enregistrement = true;
  afficherSucces('');
  etat.erreur = '';

  const liste = etat.etapesIntermediaires;
  const n = liste.length;
  const colonnes = {
    NomVariete: liste.map(b => b.varieteId),
    Millesime: liste.map(b => b.millesimeId),
    Date_s: liste.map(b => dateEnSecondes(b.date)),
    Nb_godets: liste.map(b => b.godets),
    Nb_graines: liste.map(b => b.graines),
    Ou: liste.map(b => b.ou.length ? enListeChoix(b.ou) : null),
    Germes: liste.map(() => null),
    A_produire: liste.map(b => !!b.aProduire)
  };

  try {
    const actions = [['BulkAddRecord', 'Semis', new Array(n).fill(null), colonnes]];
    const millesimesVides = [...new Set(liste.filter(b => b.sachetVide).map(b => b.millesimeId))];
    for (const id of millesimesVides) {
      actions.push(['UpdateRecord', 'Millesimes', id, { Qtte_graines: null, Nb_sachets: null }]);
    }
    await grist.docApi.applyUserActions(actions);
    etat.etapesIntermediaires = [];
    afficherSucces(TEXTES.succes(n));
    try {
      await chargerDonnees();
      await chargerSemis();
      rafraichirFiche();
    } catch (e) { console.error('Rechargement des données impossible :', e); }
  } catch (err) {
    console.error(err);
    etat.erreur = TEXTES.echecEnregistrement(err.message);
  } finally {
    etat.enregistrement = false;
  }
}
// ===== Derniers semis =====
async function chargerSemis() {
  const tab = await grist.docApi.fetchTable('Semis');
  recordsParId.semis.clear();
  for (const s of tableEnLignes(tab)) {
    recordsParId.semis.set(s.id, {
      id: s.id,
      varieteId: s.NomVariete || 0,
      millesimeId: s.Millesime || 0,
      date: typeof s.Date_s === 'number' ? s.Date_s : null,
      annee: anneeDepuisDate(s.Date_s),
      godets: s.Nb_godets || 0,
      graines: s.Nb_graines || 0,
      ou: listeChoix(s.Ou)
    });
  }
}

function afficherDerniersSemis() {
  if (!etat.varieteId) { etat.encart = null; return; }
  const v = recordsParId.varietes.get(etat.varieteId);
  if (!v) { etat.encart = null; return; }

  const dateFiche = etat.date;
  const annee = dateFiche ? Number(dateFiche.slice(0, 4)) : new Date().getFullYear();

  const semis = [...recordsParId.semis.values()]
    .filter(s => s.varieteId === etat.varieteId && s.annee === annee && s.date !== null)
    .sort((a, b) => b.date - a.date);

  const meres = [...recordsParId.millesimes.values()]
    .filter(m => m.varieteId === etat.varieteId && m.planteMere);

  etat.encart = {
    type: v.type,                       // valeur Grist, ex. « Arom.Méd 🌿 »
    dureeGerm: v.dureeGerm,             // nombre de jours ou null
    annee,                              // année de la date saisie
    nbSemis: semis.length,
    mere: meres.length > 0,
    anneesPlantation: meres.map(m => m.anneePlantation).filter(a => a).sort(),
    lignes: semis.slice(0, 5).map(s => {
      const m = recordsParId.millesimes.get(s.millesimeId);
      return {
        id: s.id,
        date: s.date,
        original: m ? m.estOriginal : false,
        anneeMil: m ? m.annee : null,
        godets: s.godets,
        graines: s.graines,
        ou: s.ou
      };
    }),
    autres: Math.max(0, semis.length - 5),
    dejaDansListe: etat.etapesIntermediaires.some(b => b.varieteId === etat.varieteId)
  };
}

// ===== Variété envoyée par « À semer » =====
function varieteDemandee(id) {
  if (!id || !etat.charge) return;
  if (recordsParId.varietes.has(id)) choisirVariete(id);
}
Vue.createApp({ setup() { return { etat, nombreEtapes }; } }).mount('#appEntete');
Vue.createApp({ setup() { return {
  etat, nomEtapeIntermediaire, retirerEtapeIntermediaire, enregistrerTout,
  pluriel, dateAffichee, dateEnSecondes
}; } }).mount('#appEtapes');
Vue.createApp({ setup() { return {
  etat, choisirMode, pluriel, dateAffichee,
  surRechercheVariete, surFocusVariete, choisirVariete,
  basculerListe, choisirMillesime, millesimeChoisi,
  choisirType,
  lieuxProposes, surRechercheOu, ajouterLieu, retirerLieu,
  ajouterEtapeIntermediaire
}; } }).mount('#appFiche');
// Quand la date change, l'encart « déjà semé » se recalcule
Vue.watch(() => etat.date, afficherDerniersSemis);
// Chaque changement de la liste des étapes est copié dans sessionStorage
Vue.watch(() => etat.etapesIntermediaires, sauvegarderSaisies, { deep: true });
// ===== Initialisation =====
grist.ready({
  requiredAccess: 'full'
});

const canal = new BroadcastChannel('granotheque-semer');
canal.onmessage = e => {
  const id = e.data && e.data.varieteId;
  if (etat.charge) varieteDemandee(id); else varietePendante = id;
};
chargerDonnees()
  .then(chargerSemis)
  .then(chargerChoix)
  .then(() => {
    remplirTypes();
    restaurerSaisies();
    etat.charge = true;
    if (varietePendante) varieteDemandee(varietePendante);
  })
  .catch(err => {
    console.error(err);
    etat.message = TEXTES.erreurChargement(err.message);
  });