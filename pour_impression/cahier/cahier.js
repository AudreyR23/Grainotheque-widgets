// ===== Messages (erreurs) =====
const TEXTES = {
  echec: (msg) => `Erreur de chargement : ${msg} (voir la console)`
};

/* =============================================
   CONFIGURATION
   ============================================= */
const LIGNES_PAR_PAGE = 26;
const NB_LIGNES_VIDES_PAR_TYPE = 3;   // lignes vides à remplir à la main, à la fin de chaque type
// Colonnes lues : si l'une manque (renommée, supprimée), le cahier ne s'affiche pas
const COLONNES_MILLESIMES = [
  'NomVariete', 'Type', 'Origine', 'Nb_sachets', 'Millesime', 'Nb_saisons',
  'Nb_saisons_manuel', 'Qtte_graines', 'Germination_cahier', 'Epuise',
  'Plante_mere', 'Lieu_cahier', 'Annee_plantation'
];
const COLONNES_VARIETES = [
  'Type', 'Nom', 'Variete', 'NomVariete', 'Num_epingle', 'Nb_epingle', 'Semis_profondeur',
  'Duree_germ', 'Temp_germ', 'Semis_sous_abris', 'Semis_pleine_terre',
  'Arrosage', 'Exposition', 'Ou_cultiver', 'Conservation'
];

// Données lues dans Grist : id de ligne → ligne
const recordsParId = {
  millesimes: new Map()     // table Millesimes (les sachets), telle que reçue de onRecords
};
let indexVarietes = indexerVarietes([]);   // table Varietes indexée par id et par nom (voir le commun)

// État lu par le HTML : Vue redessine quand il change
const etat = Vue.reactive({
  charge: false,     // true quand les données sont chargées
  nbVarietes: 0,     // nombre de variétés affichées
  pages: [],         // [page] ; page = [variété] ; variété = { …, sachets: [sachet] }
  zoom: 1,           // réduction des feuilles à l'écran (1 = taille réelle ; sans effet à l'impression)
  colonnesManquantes: [],   // colonnes nécessaires absentes (ex. 'Millesimes.Epuise')
  message: ''
});

function imprimer() {
  window.print();
}

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
new ResizeObserver(entrees => { etat.zoom = facteurZoom(entrees[0].contentRect.width); })
  .observe(document.getElementById('appPages'));

/* =============================================
   UTILITAIRES
   ============================================= */
// Mois d'une liste de choix → abréviations (['Jan', 'Fév'] → ['J', 'F'])
function moisAbreges(liste) {
  return liste.map(v => { const n = numeroMois(v); return n ? LISTE_MOIS[n - 1].initiale : v; });
}

// Variété « vide » : mêmes champs qu'une vraie variété, tous vides (ligne à remplir à la main).
// nom et variete contiennent une espace insécable : sans texte, leurs <span> n'auraient aucune hauteur,
// et la ligne ferait la moitié d'une variété à un sachet (2 lignes, comme le compte recalculerPages).
function ligneVide(type, k) {
  return {
    id: `vide-${type}-${k}`,
    avecMere: false,
    type, nom: '\u00A0', variete: '\u00A0', num_epingle: '', nb_epingle: '',
    profondeur: '', germ_duree: '', germ_temp: '',
    abri: [], semis_ext: [], arrosage: '', exposition: '', ou: [], conservation: '',
    sachets: [{ origine: '', sachet: '', annee: '', saisons: '', qtte: '', germination: '', mere: false, lieu: '' }]
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
// Ordre des sachets d'une variété : les sachets d'abord (millésime du plus ancien au plus récent), puis les plantes mères
// (année de plantation du plus ancien au plus récent). Sans année : en dernier de son groupe. À égalité : ordre de la vue Grist.
function trierSachets(sachets) {
  const cle = s => s.anneeTri ?? 9999;
  return sachets.sort((a, b) => (a.mere - b.mere) || (cle(a) - cle(b)));
}

/* =============================================
   CONSTRUCTION DE LA MAP DES GRAINES
   ============================================= */
function buildGrainesMap(lignes) {
  // Regroupe les sachets par variété (clé = id de la ligne Varietes)
  const map = new Map();

  for (const r of lignes) {
    if (r.Epuise) continue;                                  // sachet épuisé : absent du cahier
    const v = varieteReferencee(indexVarietes, r.NomVariete);
    if (!v || (!v.Nom && !v.Variete)) continue;              // pas de variété liée

    if (!map.has(v.id)) {
      map.set(v.id, {
        id: v.id,
        avecMere: false,   // au moins une plante mère : la case Qté + Germ. est fusionnée pour sa ligne        
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

const origine = (r.Origine || []).filter(x => x !== 'L').join(', ');
        map.get(v.id).sachets.push({
      origine: origine,
      sachet: r.Nb_sachets ? String(r.Nb_sachets) : '',
      annee: r.Plante_mere ? (r.Annee_plantation || '') : (anneeDepuisDate(r.Millesime) ?? ''),
      saisons: valeurSaisons(r.Nb_saisons || r.Nb_saisons_manuel || ''),
      qtte: r.Qtte_graines || '',
      germination: typeof r.Germination_cahier === 'string' ? r.Germination_cahier : '',
      mere: Boolean(r.Plante_mere),                       // plante mère : la case Qté montre le lieu
      lieu: typeof r.Lieu_cahier === 'string' ? r.Lieu_cahier : '',
      anneeTri: r.Plante_mere ? (r.Annee_plantation || null) : anneeDepuisDate(r.Millesime)   // clé de tri : voir trierSachets
    });
    if (r.Plante_mere) map.get(v.id).avecMere = true;
  }

  return map;
}

/* =============================================
   CALCUL DES PAGES
   ============================================= */
function recalculerPages() {
  const graines = [...buildGrainesMap([...recordsParId.millesimes.values()]).values()];
  for (const g of graines) trierSachets(g.sachets);
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

/* =============================================
   LECTURE DES DONNÉES (API widget de Grist)
   ============================================= */
async function afficherMillesimes(lignes) {
  // Appelée par Grist au chargement, puis à chaque modification de Millesimes
  try {
    const varietes = tableEnLignes(await grist.docApi.fetchTable('Varietes'));

    etat.colonnesManquantes = [
      ...colonnesAbsentes(lignes[0], COLONNES_MILLESIMES).map(c => 'Millesimes.' + c),
      ...colonnesAbsentes(varietes[0], COLONNES_VARIETES).map(c => 'Varietes.' + c)
    ];
    if (etat.colonnesManquantes.length) {
      etat.pages = [];          // pas de cahier faux : on n'affiche rien
      etat.nbVarietes = 0;
      etat.charge = true;
      return;
    }

    indexVarietes = indexerVarietes(varietes);
    recordsParId.millesimes.clear();
    for (const r of lignes) recordsParId.millesimes.set(r.id, r);

    recalculerPages();
    etat.message = '';
    etat.charge = true;
  } catch (err) {
    console.error('❌ Erreur lors du chargement des données Grist :', err);
    etat.message = TEXTES.echec(err.message);
  }
}

grist.ready({ requiredAccess: 'full' });
// includeColumns : reçoit aussi les colonnes masquées dans la vue
grist.onRecords(afficherMillesimes, { includeColumns: 'normal' });