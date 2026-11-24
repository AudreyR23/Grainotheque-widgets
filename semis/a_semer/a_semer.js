// ===== État global =====
const etat = Vue.reactive({
  lignes: [],
  mois: new Date().getMonth() + 1,   // 1 à 12
  afficherDejaSemees: false,
  tri: 'nom',
  nbTotal: 0,                        // variétés à semer (non estompées), sans les filtres Sous abri / Pleine terre
  nbRetenues: 0,                     // idem, après ces filtres
  filtreActif: false,                // une case Sous abri / Pleine terre est cochée
  filtreSousAbri: false,
  filtrePleineTerre: false,
  chargement: false,
  message: ''                        // erreur de chargement (reste affichée jusqu'au prochain chargement réussi)
});


// ===== Textes des messages =====
// Tous les messages construits par le JS sont ici, pour les relire et les comparer d'un outil à l'autre.
const TEXTES = {
  erreurChargement: (detail) => "Erreur de chargement : " + detail
};

const recordsParId = {
  varietes: new Map(),
  millesimes: new Map(),
  semisParVariete: new Map(),   // id variété → liste des Date_s (en secondes)
  varietesAvecPlant: new Map()  // id variété → Type_plant de sa plante mère ('' si non renseigné)
};

// ===== Utilitaires =====

function moisDansListe(liste, mois) {
  return liste.some(v => numeroMois(v) === mois);
}

function fenetreDeSemis(liste, mois, annee) {
  // Fenêtre continue de mois (Sous abris + Pleine terre) qui contient « mois »
  const ensemble = new Set();
  for (const choix of liste) {
    const n = numeroMois(choix);
    if (n) ensemble.add(n);
  }
  const prec = m => (m === 1 ? 12 : m - 1);
  const suiv = m => (m === 12 ? 1 : m + 1);
  let d = mois, e = mois;
  if (ensemble.size < 12) {
    while (ensemble.has(prec(d))) d = prec(d);
    while (ensemble.has(suiv(e))) e = suiv(e);
  } else { d = 1; e = 12; }

  const anneeDebut = d > mois ? annee - 1 : annee;
  const anneeFin = e >= d ? anneeDebut : anneeDebut + 1;
  return {
    debutMois: d,
    finMois: e,
    debut: Date.UTC(anneeDebut, d - 1, 1) / 1000,   // 1er jour du mois de début
    fin: Date.UTC(anneeFin, e, 1) / 1000            // 1er jour du mois suivant la fin (exclu)
  };
}

// ===== Chargement des données =====
async function chargerDonnees() {
      const [tabVarietes, tabMillesimes, tabSemis] = await Promise.all([
    grist.docApi.fetchTable('Varietes'),
    grist.docApi.fetchTable('Millesimes'),
    grist.docApi.fetchTable('Semis')
  ]);

  recordsParId.varietes.clear();
  recordsParId.millesimes.clear();
  recordsParId.semisParVariete.clear();
  recordsParId.varietesAvecPlant.clear();

  for (const v of tableEnLignes(tabVarietes)) {
    recordsParId.varietes.set(v.id, {
      id: v.id,
      nom: v.Nom || '',
      variete: v.Variete || '',
      type: v.Type || '',
      sousAbris: listeChoix(v.Semis_sous_abris),
      pleineTerre: listeChoix(v.Semis_pleine_terre),
      anneesSansTest: v.Annees_sans_test
    });
  }

  for (const m of tableEnLignes(tabMillesimes)) {
    const estPlant = !!m.Plante_mere;   // plante mère vivante (À gérer décoche Plante_mere à sa mort)
    recordsParId.millesimes.set(m.id, {
      id: m.id,
      varieteId: m.NomVariete || 0,
      annee: anneeDepuisDate(m.Millesime),
      epuise: m.Epuise === true,
      germination: typeof m.Germination_affichee === 'number' ? m.Germination_affichee : null,
      estPlant,
      avecGraines: m.Qtte_graines > 0 || m.Nb_sachets > 0,
      estMelange: !!m.Melange
    });
    if (estPlant && m.NomVariete) recordsParId.varietesAvecPlant.set(m.NomVariete, m.Type_plant || '');
  }
    for (const s of tableEnLignes(tabSemis)) {
    if (!s.NomVariete || typeof s.Date_s !== 'number') continue;
    if (!recordsParId.semisParVariete.has(s.NomVariete)) recordsParId.semisParVariete.set(s.NomVariete, []);
    recordsParId.semisParVariete.get(s.NomVariete).push(s.Date_s);
  }
}

// ===== Logique « à semer » =====
function millesimeAUtiliser(varieteId) {
  // Millésimes non épuisés de la variété
  const candidats = [...recordsParId.millesimes.values()]
    .filter(m => m.varieteId === varieteId && !m.epuise && (!m.estPlant || m.avecGraines));  
    if (candidats.length === 0) return null;

  // 1) le plus récent (parmi ceux qui ont une date)
  const dates = candidats.filter(m => m.annee !== null).sort((a, b) => b.annee - a.annee);
  if (dates.length) return dates[0];

  // 2) sinon celui qui a un taux de germination affiché (le plus élevé)
  const avecTaux = candidats.filter(m => m.germination !== null).sort((a, b) => b.germination - a.germination);
  return avecTaux.length ? avecTaux[0] : null;
}

function comparerSelonTri(a, b) {
  const parNom = (a.v.nom + a.v.variete).localeCompare(b.v.nom + b.v.variete, 'fr');
  if (etat.tri === 'germination') {
    const ga = a.mil?.germination ?? -1;
    const gb = b.mil?.germination ?? -1;
    return (gb - ga) || parNom;
  }
  if (etat.tri === 'test') {
    const ta = typeof a.v.anneesSansTest === 'number' ? a.v.anneesSansTest : 999;   // « Jamais testé » en tête
    const tb = typeof b.v.anneesSansTest === 'number' ? b.v.anneesSansTest : 999;
    return (tb - ta) || parNom;
  }
  return parNom;
}

function varietesASemer() {
  const annee = new Date().getFullYear();
  const resultat = [];
  for (const v of recordsParId.varietes.values()) {
    const sousAbris = moisDansListe(v.sousAbris, etat.mois);
    const pleineTerre = moisDansListe(v.pleineTerre, etat.mois);
    if (!sousAbris && !pleineTerre) continue;     // pas dans la fenêtre de semis

    const fenetre = fenetreDeSemis([...v.sousAbris, ...v.pleineTerre], etat.mois, annee);
    const dates = recordsParId.semisParVariete.get(v.id) || [];
    const semisFait = dates.some(d => d >= fenetre.debut && d < fenetre.fin);
    const plant = recordsParId.varietesAvecPlant.has(v.id);          // plante mère au jardin
    const typePlant = recordsParId.varietesAvecPlant.get(v.id) || '';  // pieds, rhizome, caïeux, bulbe ou ''
    const dejaSemee = semisFait || plant;
    if (dejaSemee && !etat.afficherDejaSemees) continue;

    const mil = millesimeAUtiliser(v.id);
    if (!mil && !plant) continue;                 // ni graines, ni plant

    // Valeurs pour l'affichage (le HTML écrit les phrases)
    const g = mil ? mil.germination : null;
    const germination = g === null ? null : Math.round(g <= 1 ? g * 100 : g);   // en %
    const anneesSansTest = typeof v.anneesSansTest === 'number' ? v.anneesSansTest : null;   // null = jamais testé

    resultat.push({ v, mil, sousAbris, pleineTerre, dejaSemee, semisFait, plant, typePlant, fenetre, germination, anneesSansTest });
  }
  return resultat.sort(comparerSelonTri);
}

// ===== Affichage =====
function afficher() {
  const toutes = varietesASemer();
  const lignes = toutes.filter(l =>
    (!etat.filtreSousAbri || l.sousAbris) && (!etat.filtrePleineTerre || l.pleineTerre));
  etat.nbTotal = toutes.filter(l => !l.dejaSemee).length;
  etat.nbRetenues = lignes.filter(l => !l.dejaSemee).length;
  etat.filtreActif = etat.filtreSousAbri || etat.filtrePleineTerre;
  etat.lignes = lignes;
}

// ===== Codes et actions utilisés par le HTML =====
function categorie(l) {
  // Code du liseré : 'sousabri', 'pleineterre' ou 'sousabri-pleineterre' (le HTML en fait la classe carte--…)
  return l.sousAbris && l.pleineTerre ? 'sousabri-pleineterre' : l.sousAbris ? 'sousabri' : 'pleineterre';
}
function semer(id) {
  canal.postMessage({ varieteId: id });
}

async function actualiser() {
  etat.chargement = true;
  etat.message = '';
  try {
    await chargerDonnees();
    afficher();
  } catch (err) {
    console.error(err);
    etat.message = TEXTES.erreurChargement(err.message);
  } finally {
    etat.chargement = false;
  }
}


// ===== Initialisation =====
// 'full' est nécessaire pour lire plusieurs tables avec docApi.fetchTable, même si on n'écrit rien.
grist.ready({ requiredAccess: 'full' });
const canal = new BroadcastChannel('granotheque-semer');
// Quand un filtre change, la liste se recalcule
Vue.watch(() => [etat.mois, etat.afficherDejaSemees, etat.tri, etat.filtreSousAbri, etat.filtrePleineTerre], afficher);
Vue.createApp({ setup() { return { etat, LISTE_MOIS, actualiser }; } }).mount('#appEntete');
Vue.createApp({ setup() { return { etat, LISTE_MOIS }; } }).mount('#appFiltres');
Vue.createApp({ setup() { return {
  etat, LISTE_MOIS, libelle, categorie, pluriel, semer
}; } }).mount('#appListe');
actualiser();