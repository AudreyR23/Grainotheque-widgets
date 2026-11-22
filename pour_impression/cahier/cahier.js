// ===== Messages (erreurs) =====
const TEXTES = {
  echec: (msg) => `Erreur de chargement : ${msg} (voir la console)`,
  horsGrist: 'Page ouverte hors Grist : utilise cette URL comme widget Custom.'
};

/* =============================================
   CONFIGURATION
   ============================================= */
const LIGNES_PAR_PAGE = 25;
const NB_LIGNES_VIDES_PAR_TYPE = 3;   // lignes vides à remplir à la main, à la fin de chaque type
const LARGEUR_FEUILLE_PX = 297 * 96 / 25.4;   // 297 mm en pixels d'écran (≈ 1123)
// Colonnes lues : si l'une manque (renommée, supprimée), le cahier ne s'affiche pas
const COLONNES_MILLESIMES = [
  'NomVariete', 'Type', 'Origine', 'Nb_sachets', 'Millesime', 'Nb_saisons',
  'Nb_saisons_manuel', 'Qtte_graines', 'Germination_cahier', 'Epuise'
];
const COLONNES_VARIETES = [
  'Type', 'Nom', 'Variete', 'NomVariete', 'Num_epingle', 'Nb_epingle', 'Semis_profondeur',
  'Duree_germ', 'Temp_germ', 'Semis_sous_abris', 'Semis_pleine_terre',
  'Arrosage', 'Exposition', 'Ou_cultiver', 'Conservation'
];

// Données lues dans Grist : id de ligne → ligne
const recordsParId = {
  varietes: new Map(),      // table Varietes : id → ligne
  varietesParNom: new Map(), // même lignes, trouvées par le texte NomVariete (ce que donne onRecords)
  millesimes: new Map()     // table Millesimes (les sachets), telle que reçue de onRecords
};
let numeroLecture = 0;    // sert à ignorer une lecture dépassée par une plus récente

// État lu par le HTML : Vue redessine quand il change
const etat = Vue.reactive({
  charge: false,     // true quand les données sont chargées
  nbVarietes: 0,     // nombre de variétés affichées
  pages: [],         // [page] ; page = [variété] ; variété = { …, sachets: [sachet] }
  zoom: 1,           // réduction des feuilles à l'écran (1 = taille réelle ; sans effet à l'impression)
  colonnesManquantes: [],   // colonnes nécessaires absentes (ex. 'Millesimes.Epuise')
  erreur: ''
});

function imprimer() {
  window.print();
}

// Une erreur reste affichée jusqu'au prochain clic (phase de capture : effacée avant que le bouton agisse)
document.addEventListener('click', () => { etat.erreur = ''; }, true);

Vue.createApp({
  setup() {
    return { etat, pluriel, imprimer };
  }
}).mount('#appEntete');

Vue.createApp({
  setup() {
    return { etat, pluriel };
  }
}).mount('#appPages');


// ===== Aperçu à l'écran : feuilles réduites à la largeur du widget =====
function ajusterZoom(largeur) {
  // Jamais agrandi au-delà de la taille réelle ; arrondi vers le bas pour éviter une barre de défilement d'un pixel
  etat.zoom = Math.min(1, Math.floor(largeur / LARGEUR_FEUILLE_PX * 1000) / 1000);
}

new ResizeObserver(entrees => ajusterZoom(entrees[0].contentRect.width))
  .observe(document.getElementById('appPages'));

/* Abréviations mois */
const MOIS = {
  "Jan": "J", "Fév": "F", "Mar": "M", "Avr": "A", "Mai": "Ma",
  "Jui": "Ju", "Juil": "Jl", "Aou": "Ao", "Sep": "S", "Oct": "O", "Nov": "N", "Déc": "D",
  "Janvier": "J", "Février": "F", "Mars": "M", "Avril": "A", "Juin": "Ju",
  "Juillet": "Jl", "Août": "Ao", "Septembre": "S", "Octobre": "O",
  "Novembre": "N", "Décembre": "D"
};

/* =============================================
   UTILITAIRES
   ============================================= */
function fmtAnnee(v) {
  if (!v) return '';
  if (typeof v === 'number') return new Date(v * 1000).getFullYear().toString();
  if (v instanceof Date) return v.getFullYear().toString();
  if (typeof v === 'string' && v.includes('-')) return v.substring(0, 4);
  return String(v).substring(0, 4);
}

// Mois d'une liste de choix → abréviations (['Jan', 'Fév'] → ['J', 'F'])
function moisAbreges(liste) {
  return liste.map(m => MOIS[m] || m);
}
// Colonnes de la liste absentes des lignes reçues (aucune ligne : rien à vérifier)
function colonnesAbsentes(lignes, liste) {
  if (!lignes.length) return [];
  return liste.filter(c => !(c in lignes[0]));
}

// Variété « vide » : mêmes champs qu'une vraie variété, tous vides (ligne à remplir à la main)
function ligneVide(type, k) {
  return {
    id: `vide-${type}-${k}`,
    type, nom: '', variete: '', num_epingle: '', nb_epingle: '',
    profondeur: '', germ_duree: '', germ_temp: '',
    abri: [], semis_ext: [], arrosage: '', exposition: '', ou: [], conservation: '',
    sachets: [{ origine: '', sachet: '', annee: '', saisons: '', qtte: '', germination: '' }]
  };
}

// Colonne « Sais. » : 'or.' reste 'or.', un nombre devient un entier, le reste est affiché tel quel
function valeurSaisons(v) {
  if (!v) return '';
  const val = String(v).trim().toLowerCase();
  if (val === 'or.' || val === 'or') return 'or.';
  if (!isNaN(val)) return parseInt(val);
  return v;
}

/* =============================================
   EN-TÊTE DU TABLEAU
   ============================================= */


/* =============================================
   CONSTRUCTION D'UNE LIGNE
   ============================================= */


/* =============================================
   RENDU DES PAGES
   ============================================= */


/* =============================================
   CONSTRUCTION DE LA MAP DES GRAINES
   ============================================= */
function buildGrainesMap(lignes) {
  // Regroupe les sachets par variété (clé = id de la ligne Varietes)
  const map = new Map();

  for (const r of lignes) {
    if (r.Epuise) continue;                                  // sachet épuisé : absent du cahier
    const v = recordsParId.varietesParNom.get(r.NomVariete); // onRecords donne le texte de la référence
    if (!v || (!v.Nom && !v.Variete)) continue;              // pas de variété liée

    if (!map.has(v.id)) {
      map.set(v.id, {
        id: v.id,
        type: v.Type || r.Type || '',
        nom: v.Nom || '',
        variete: v.Variete || '',
        num_epingle: v.Num_epingle || '',
        nb_epingle: v.Nb_epingle || '',
        profondeur: v.Semis_profondeur || '',
        germ_duree: v.Duree_germ || '',
        germ_temp: v.Temp_germ || '',
        abri: moisAbreges(listeChoix(v.Semis_sous_abris)),
        semis_ext: moisAbreges(listeChoix(v.Semis_pleine_terre)),
        arrosage: v.Arrosage || '',
        exposition: v.Exposition || '',
        ou: listeChoix(v.Ou_cultiver),
        conservation: v.Conservation || '',
        sachets: []
      });
    }

    const origine = Array.isArray(r.Origine)
      ? r.Origine.filter(item => item !== 'L').join(', ')
      : r.Origine || '';

    map.get(v.id).sachets.push({
      origine: origine,
      sachet: r.Nb_sachets ? String(r.Nb_sachets) : '',
      annee: fmtAnnee(r.Millesime),
      saisons: valeurSaisons(r.Nb_saisons || r.Nb_saisons_manuel || ''),
      qtte: r.Qtte_graines || '',
      germination: typeof r.Germination_cahier === 'string' ? r.Germination_cahier : ''
    });
  }

  return map;
}

/* =============================================
   INITIALISATION (données via l'API widget de Grist)
   ============================================= */
function recalculerPages() {
  const graines = [...buildGrainesMap([...recordsParId.millesimes.values()]).values()];

  // Tri par type, puis nom, puis variété
  graines.sort((a, b) => {
    const t = (a.type || '').localeCompare(b.type || '', 'fr');
    if (t) return t;
    const n = (a.nom || '').localeCompare(b.nom || '', 'fr');
    if (n) return n;
    return (a.variete || '').localeCompare(b.variete || '', 'fr');
  });

  // Lignes vides à la fin de chaque type
  const lignes = [];
  graines.forEach((g, i) => {
    lignes.push(g);
    const suivant = graines[i + 1];
    if (!suivant || suivant.type !== g.type) {
      for (let k = 1; k <= NB_LIGNES_VIDES_PAR_TYPE; k++) lignes.push(ligneVide(g.type, k));
    }
  });

  // Pagination : un type ne partage jamais une page avec un autre ;
  // une variété à 1 sachet compte pour 2 lignes, sinon 1 ligne par sachet
  const pages = [];
  let typeCourant = null;
  let page = [];
  let lignesPage = 0;
  for (const g of lignes) {
    const nbLignes = g.sachets.length === 1 ? 2 : g.sachets.length;
    const changeType = g.type !== typeCourant;
    if (page.length > 0 && (changeType || lignesPage + nbLignes > LIGNES_PAR_PAGE)) {
      pages.push(page);
      page = [];
      lignesPage = 0;
    }
    typeCourant = g.type;
    page.push(g);
    lignesPage += nbLignes;
  }
  if (page.length > 0) pages.push(page);

  etat.pages = pages;
  etat.nbVarietes = graines.length;
}

async function afficherMillesimes(lignes) {
  // Appelée par Grist au chargement, puis à chaque modification de Millesimes
  const numero = ++numeroLecture;
  try {
    const varietes = tableEnLignes(await grist.docApi.fetchTable('Varietes'));
    if (numero !== numeroLecture) return;   // une lecture plus récente a pris le relais

    etat.colonnesManquantes = [
      ...colonnesAbsentes(lignes, COLONNES_MILLESIMES).map(c => 'Millesimes.' + c),
      ...colonnesAbsentes(varietes, COLONNES_VARIETES).map(c => 'Varietes.' + c)
    ];
    if (etat.colonnesManquantes.length) {
      etat.pages = [];          // pas de cahier faux : on n'affiche rien
      etat.nbVarietes = 0;
      etat.charge = true;
      return;
    }

    recordsParId.varietes.clear();
    recordsParId.varietesParNom.clear();
    for (const v of varietes) {
      recordsParId.varietes.set(v.id, v);
      if (recordsParId.varietesParNom.has(v.NomVariete)) {
        console.warn('Deux variétés portent le même nom, la première est gardée :', v.NomVariete);
      } else {
        recordsParId.varietesParNom.set(v.NomVariete, v);
      }
    }
    recordsParId.millesimes.clear();
    for (const r of lignes) recordsParId.millesimes.set(r.id, r);

    recalculerPages();
    etat.erreur = '';
    etat.charge = true;
  } catch (err) {
    console.error('❌ Erreur lors du chargement des données Grist :', err);
    etat.erreur = TEXTES.echec(err.message);
  }
}

const dansGrist = window.self !== window.top;

if (dansGrist) {
  grist.ready({ requiredAccess: 'full' });
  // includeColumns : reçoit aussi les colonnes masquées dans la vue
  grist.onRecords(afficherMillesimes, { includeColumns: 'normal' });
} else {
  etat.erreur = TEXTES.horsGrist;
}