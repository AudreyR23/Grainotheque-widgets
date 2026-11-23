// ===== Messages (erreurs) =====
const TEXTES = {
  echec: (msg) => `Erreur de chargement : ${msg} (voir la console)`,
  horsGrist: 'Page ouverte hors Grist : utilise cette URL comme widget Custom.'
};

/* =============================================
   CONFIGURATION
   ============================================= */
const LIGNES_PAR_COLONNE = 20;
const COLONNES_PAR_PAGE = 3;
const PAR_PAGE = LIGNES_PAR_COLONNE * COLONNES_PAR_PAGE;
const NB_EMPLACEMENTS_VIDES = 10;   // emplacements à remplir à la main, après le dernier numéro
const LARGEUR_FEUILLE_PX = 297 * 96 / 25.4;   // 297 mm en pixels d'écran (≈ 1123)
// Colonnes lues : si l'une manque (renommée, supprimée), rien ne s'affiche
const COLONNES_NECESSAIRES = ['Type', 'Nom', 'Variete', 'Num_epingle'];

// État lu par le HTML : Vue redessine quand il change
// État lu par le HTML : Vue redessine quand il change
const etat = Vue.reactive({
  charge: false,            // true quand les données sont chargées
  nbNumeros: 0,             // nombre d'épingles imprimées
  pages: [],                // [page] ; page = [colonne] (3) ; colonne = [épingle] (20 au plus)
  zoom: 1,                  // réduction des feuilles à l'écran (1 = taille réelle ; sans effet à l'impression)
  colonnesManquantes: [],   // colonnes nécessaires absentes (ex. 'Varietes.Num_epingle')
  erreur: ''
});
let numeroLecture = 0;    // sert à ignorer une lecture dépassée par une plus récente

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
    return { etat };
  }
}).mount('#appPages');

// ===== Aperçu à l'écran : feuilles réduites à la largeur du widget =====
function ajusterZoom(largeur) {
  // Jamais agrandi au-delà de la taille réelle ; arrondi vers le bas pour éviter une barre de défilement d'un pixel
  etat.zoom = Math.min(1, Math.floor(largeur / LARGEUR_FEUILLE_PX * 1000) / 1000);
}

new ResizeObserver(entrees => ajusterZoom(entrees[0].contentRect.width))
  .observe(document.getElementById('appPages'));

/* =============================================
   CALCUL DES PAGES
   ============================================= */
// Épingles à imprimer : numéro > 0, un seul par numéro (la première variété rencontrée), triées par numéro
function epinglesTriees(lignes) {
  const vus = new Set();
  const epingles = [];
  for (const v of lignes) {
    const num = v.Num_epingle;
    if (!num || num <= 0 || vus.has(num)) continue;   // doublon ignoré sans message (un autre outil s'en charge)
    vus.add(num);
    epingles.push({ id: v.id, type: v.Type || '', nom: v.Nom || '', variete: v.Variete || '', num });
  }
  return epingles.sort((a, b) => a.num - b.num);
}
// Emplacement à remplir à la main : seul le numéro est écrit
function emplacementVide(num) {
  return { id: `vide-${num}`, type: '', nom: '', variete: '', num };
}
// Pages de 3 colonnes de 20, remplies colonne par colonne (1-20, 21-40, 41-60)
function enPages(epingles) {
  const pages = [];
  for (let debut = 0; debut < epingles.length; debut += PAR_PAGE) {
    const morceau = epingles.slice(debut, debut + PAR_PAGE);
    const page = [];
    for (let c = 0; c < COLONNES_PAR_PAGE; c++) {
      page.push(morceau.slice(c * LIGNES_PAR_COLONNE, (c + 1) * LIGNES_PAR_COLONNE));
    }
    pages.push(page);
  }
  return pages;
}

/* =============================================
   INITIALISATION (données via l'API widget de Grist)
   ============================================= */
async function charger() {
  // Appelée par Grist au chargement, puis à chaque modification de Varietes
  const numero = ++numeroLecture;
  try {
    const table = await grist.docApi.fetchTable('Varietes');   // toute la table, sans les filtres de la vue
    if (numero !== numeroLecture) return;   // une lecture plus récente a pris le relais

    etat.colonnesManquantes = COLONNES_NECESSAIRES
      .filter(c => !(c in table))
      .map(c => 'Varietes.' + c);
    if (etat.colonnesManquantes.length) {
      etat.pages = [];          // pas de liste fausse : on n'affiche rien
      etat.nbNumeros = 0;
      etat.charge = true;
      return;
    }
    const epingles = epinglesTriees(tableEnLignes(table));
    const dernier = epingles.length ? epingles[epingles.length - 1].num : 0;   // liste triée : le plus grand numéro est le dernier
    const vides = Array.from({ length: NB_EMPLACEMENTS_VIDES }, (_, k) => emplacementVide(dernier + k + 1));
    etat.pages = enPages([...epingles, ...vides]);   // les vides comptent dans les pages, pas dans « N graines »
    etat.nbNumeros = epingles.length;
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
  // onRecords ne sert que de signal « Varietes a changé » ; includeColumns : réagit aussi aux colonnes masquées dans la vue
  grist.onRecords(charger, { includeColumns: 'normal' });
} else {
  etat.erreur = TEXTES.horsGrist;
}