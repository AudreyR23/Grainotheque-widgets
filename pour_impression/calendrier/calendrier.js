// ===== Messages (erreurs) =====
const TEXTES = {
  echec: (msg) => `Erreur de chargement : ${msg} (voir la console)`,
  horsGrist: 'Page ouverte hors Grist : utilise cette URL comme widget Custom.'
};

/* =============================================
   CONFIGURATION
   ============================================= */
// Colonnes lues : si l'une manque (renommée, supprimée), le calendrier ne s'affiche pas
const COLONNES_MILLESIMES = ['NomVariete', 'Nb_sachets'];
const COLONNES_VARIETES = ['Nom', 'Variete', 'Type', 'NomVariete', 'Semis_sous_abris', 'Semis_pleine_terre'];
const MOIS_COURANT = new Date().getMonth() + 1;   // colonne surlignée à l'écran (pas à l'impression)
const LIGNES_PAR_COLONNE = 30;   // plantes par colonne (2 colonnes par feuille) : à ajuster après le test d'impression
// Données lues dans Grist : id de ligne → ligne
const recordsParId = {
  varietes: new Map(),       // table Varietes : id → ligne
  varietesParNom: new Map(), // mêmes lignes, trouvées par le texte NomVariete (ce que donne onRecords)
  millesimes: new Map()      // table Millesimes, telle que reçue de onRecords
};
let numeroLecture = 0;       // sert à ignorer une lecture dépassée par une plus récente

// État lu par le HTML : Vue redessine quand il change
const etat = Vue.reactive({
  charge: false,             // true quand les données sont chargées
  plantes: [],               // [plante] triées ; plante = { nom, type, varietes, mois: [12 cases] }
  aRevoir: aRevoirVide(),    // données à corriger dans Grist (en-tête seulement, jamais imprimé)
  pages: [],                 // [page] ; page = { type, suite, colonnes: [[plante]] } (1 ou 2 colonnes)
  details: null,             // fenêtre de détails : null (fermée) ou { plante, mois, varietes: [{ id, nom, abri, terre }] }
  zoom: 1,                   // réduction des feuilles à l'écran (1 = taille réelle ; sans effet à l'impression)
  colonnesManquantes: [],    // colonnes nécessaires absentes (ex. 'Varietes.Type')
  erreur: ''
});

function imprimer() {
  window.print();
}

// Une erreur reste affichée jusqu'au prochain clic (phase de capture : effacée avant que le bouton agisse)
effacerAuClic(() => { etat.erreur = ''; });

Vue.createApp({
  setup() {
    return { etat, pluriel, imprimer };
  }
}).mount('#appEntete');

Vue.createApp({
  setup() {
    return { etat, LISTE_MOIS, MOIS_COURANT, estPartielle, ouvrirDetails };
  }
}).mount('#appPages');

Vue.createApp({
  setup() {
    return { etat, fermerDetails };
  }
}).mount('#appDetails');

// Un clic ailleurs ferme la fenêtre (les clics sur une case et dans la fenêtre ne remontent pas jusqu'ici)
document.addEventListener('click', fermerDetails);
// ===== Aperçu à l'écran : feuilles réduites à la largeur du widget =====
new ResizeObserver(entrees => {etat.zoom = facteurZoom(entrees[0].contentRect.width); })
  .observe(document.getElementById('appPages'));
/* =============================================
   UTILITAIRES
   ============================================= */
// Points à corriger dans Grist (listes de noms ; le HTML écrit les phrases)
function aRevoirVide() {
  return { total: 0, nomsProches: [], plantesSansMois: [], varietesSansMois: [], typesDifferents: [], moisInconnus: [] };
}

// ChoiceList de mois ['L', 'Mar', 'Avr'] → [3, 4] ; une valeur non reconnue est ajoutée à inconnus (un Set)
function moisDe(valeur, inconnus) {
  const nums = [];
  for (const v of listeChoix(valeur)) {
const n = numeroMois(v);
    if (n) nums.push(n);
    else inconnus.add(v);
  }
  return nums;
}

// La référence NomVariete arrive en texte « Nom↵Variété » (ou en id selon la vue) : les deux sont gérés
function varieteDuMillesime(r) {
  return typeof r.NomVariete === 'number'
    ? recordsParId.varietes.get(r.NomVariete)
    : recordsParId.varietesParNom.get(r.NomVariete);
}

// Code d'une case : 'toutes' les variétés sèment ce mois-là, 'certaines', ou 'aucune'
function casDuMois(varietes, cle, num) {
  const n = varietes.filter(v => v[cle].includes(num)).length;
  if (n === 0) return 'aucune';
  return n === varietes.length ? 'toutes' : 'certaines';
}

/* =============================================
   CALCUL DES PLANTES
   ============================================= */
function recalculerPlantes() {
  const aRevoir = aRevoirVide();
  const moisInconnus = new Set();     // Set : chaque valeur n'y est gardée qu'une fois
  const typesDifferents = new Set();

  // Regroupe par plante (Varietes.Nom) les variétés qui ont au moins un sachet
  const parNom = new Map();   // nom → { nom, type, varietes: Map id → variété }
  for (const r of recordsParId.millesimes.values()) {
    if (!r.Nb_sachets) continue;                // sachet épuisé : absent du calendrier
    const v = varieteDuMillesime(r);
    if (!v || !v.Nom) continue;                 // pas de variété liée

    if (!parNom.has(v.Nom)) parNom.set(v.Nom, { nom: v.Nom, type: v.Type || '', varietes: new Map() });
    const plante = parNom.get(v.Nom);
    if (plante.varietes.has(v.id)) continue;    // variété déjà comptée (plusieurs millésimes)
    if ((v.Type || '') !== plante.type) typesDifferents.add(v.Nom);   // type de la première variété gardé
    plante.varietes.set(v.id, {
      id: v.id,
      nom: v.Variete || v.Nom,
      abri: moisDe(v.Semis_sous_abris, moisInconnus),
      terre: moisDe(v.Semis_pleine_terre, moisInconnus)
    });
  }

  const plantes = [];
  for (const p of parNom.values()) {
    // Une variété sans aucun mois renseigné est ignorée : c'est une info manquante, pas « ne sème jamais »
    const varietes = [];
    const sansMois = [];
    for (const v of p.varietes.values()) {
      if (v.abri.length || v.terre.length) varietes.push(v);
      else sansMois.push(v.nom === p.nom ? p.nom : `${p.nom} (${v.nom})`);
    }
    const mois = LISTE_MOIS.map(m => ({
      abri: casDuMois(varietes, 'abri', m.num),
      terre: casDuMois(varietes, 'terre', m.num)
    }));
    if (mois.every(c => c.abri === 'aucune' && c.terre === 'aucune')) {
      aRevoir.plantesSansMois.push(p.nom);      // aucun mois de semis : plante absente du calendrier
      continue;
    }
    aRevoir.varietesSansMois.push(...sansMois); // plante affichée, mais certaines variétés ignorées
    plantes.push({ cle: 'plante-' + p.nom, nom: p.nom, type: p.type, varietes, mois });
  }

  // Noms qui ne diffèrent que par les accents, les majuscules ou les espaces (ex. Epinard / Épinard)
  const parNomNormalise = new Map();
  for (const nom of parNom.keys()) {
    const cle = normaliser(nom);
    if (!parNomNormalise.has(cle)) parNomNormalise.set(cle, []);
    parNomNormalise.get(cle).push(nom);
  }
  aRevoir.nomsProches = [...parNomNormalise.values()].filter(noms => noms.length > 1);

  const trier = liste => liste.sort((a, b) => a.localeCompare(b, 'fr'));
  trier(aRevoir.plantesSansMois);
  trier(aRevoir.varietesSansMois);
  aRevoir.typesDifferents = trier([...typesDifferents]);
  aRevoir.moisInconnus = trier([...moisInconnus]);
  aRevoir.total = aRevoir.nomsProches.length + aRevoir.plantesSansMois.length + aRevoir.varietesSansMois.length
    + aRevoir.typesDifferents.length + aRevoir.moisInconnus.length;
  etat.aRevoir = aRevoir;

  // Tri par type, puis par nom
  plantes.sort((a, b) =>
    a.type.localeCompare(b.type, 'fr') || a.nom.localeCompare(b.nom, 'fr'));

  etat.plantes = plantes;
}

/* =============================================
   PAGES : une page (ou plus) par type, deux colonnes par page
   ============================================= */
// Coupe une liste en morceaux de n éléments
function morceaux(liste, n) {
  const resultat = [];
  for (let i = 0; i < liste.length; i += n) resultat.push(liste.slice(i, i + n));
  return resultat;
}

// Ligne vide à remplir à la main : mêmes champs qu'une plante, sans nom ni semis
function ligneVide(type, n) {
  return {
    cle: `vide-${type}-${n}`,
    nom: '',
    mois: LISTE_MOIS.map(() => ({ abri: 'aucune', terre: 'aucune' }))
  };
}

function recalculerPages() {
  // Plantes (déjà triées par type puis nom) regroupées par type, ordre conservé
  const parType = new Map();
  for (const plante of etat.plantes) {
    if (!parType.has(plante.type)) parType.set(plante.type, []);
    parType.get(plante.type).push(plante);
  }

  const pages = [];
  for (const [type, plantes] of parType) {
    const morceauxDuType = morceaux(plantes, 2 * LIGNES_PAR_COLONNE);
    morceauxDuType.forEach((morceau, k) => {
      let lignes = morceau;

      // Dernière page du type : lignes vides à la fin de l'alphabet (donc en bas de la colonne de droite).
      // Nombre choisi pour que le total soit pair : les deux colonnes finissent à la même hauteur.
      if (k === morceauxDuType.length - 1) {
        const place = 2 * LIGNES_PAR_COLONNE - morceau.length;
        let nbVides = morceau.length % 2 ? 3 : 2;   // impair : 3 ; pair : 2
        if (nbVides > place) nbVides -= 2;           // pas assez de place : 1 (impair) ou 0 (pair)
        const vides = Array.from({ length: nbVides }, (_, i) => ligneVide(type, i + 1));
        lignes = [...morceau, ...vides];
      }

      // Deux colonnes : la gauche prend la moitié arrondie au-dessus, la lecture continue à droite
      const milieu = Math.ceil(lignes.length / 2);
      const colonnes = [lignes.slice(0, milieu), lignes.slice(milieu)].filter(c => c.length);
      pages.push({ type, suite: k > 0, colonnes });
    });
  }
  etat.pages = pages;
}
/* =============================================
   FENÊTRE DE DÉTAILS (écran seulement)
   ============================================= */
// Case hachurée : seulement certaines variétés sèment ce mois-là (sous abri ou en pleine terre)
function estPartielle(cas) {
  return cas.abri === 'certaines' || cas.terre === 'certaines';
}

// Clic sur une case : ouvre la fenêtre si la case est hachurée, sinon ferme celle qui est ouverte
function ouvrirDetails(plante, i) {
  if (!estPartielle(plante.mois[i])) {
    fermerDetails();
    return;
  }
  const num = LISTE_MOIS[i].num;
  etat.details = {
    plante: plante.nom,
    mois: LISTE_MOIS[i].long,
    varietes: plante.varietes
      .map(v => ({ id: v.id, nom: v.nom, abri: v.abri.includes(num), terre: v.terre.includes(num) }))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  };
}

function fermerDetails() {
  etat.details = null;
}
/* =============================================
   LECTURE DES DONNÉES (API widget de Grist)
   ============================================= */
async function afficherMillesimes(lignes) {
  // Appelée par Grist au chargement, puis à chaque modification de Millesimes
  const numero = ++numeroLecture;
  try {
    const varietes = tableEnLignes(await grist.docApi.fetchTable('Varietes'));
    if (numero !== numeroLecture) return;   // une lecture plus récente a pris le relais

etat.colonnesManquantes = [
  ...colonnesAbsentes(lignes[0], COLONNES_MILLESIMES).map(c => 'Millesimes.' + c),
  ...colonnesAbsentes(varietes[0], COLONNES_VARIETES).map(c => 'Varietes.' + c)
];
    if (etat.colonnesManquantes.length) {
      etat.plantes = [];          // pas de calendrier faux : on n'affiche rien
      etat.pages = [];
      etat.aRevoir = aRevoirVide();
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

    recalculerPlantes();
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