// ===== Fonctions communes aux outils =====
// Règle : uniquement des fonctions qui n'utilisent que leurs paramètres
// (aucune variable propre à un outil : etat, modifie, recordsParId...).

function tableEnLignes(tableau) {
  // fetchTable renvoie {colonne: [valeurs...]} → [{id, colonne...}, ...]
  const colonnes = Object.keys(tableau);
  const lignes = [];
  for (let i = 0; i < tableau.id.length; i++) {
    const ligne = {};
    for (const c of colonnes) ligne[c] = tableau[c][i];
    lignes.push(ligne);
  }
  return lignes;
}

function listeChoix(valeur) {
  // ChoiceList Grist : ['L', 'a', 'b'] → ['a', 'b']
  return Array.isArray(valeur) && valeur[0] === 'L' ? valeur.slice(1) : [];
}

function normaliser(texte) {
  // minuscules, sans accents, espaces simplifiés
  return String(texte || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

function dateAffichee(secondes) {
  if (typeof secondes !== 'number') return '?';
  return new Date(secondes * 1000).toLocaleDateString('fr-FR', { timeZone: 'UTC' });
}

function dateDuJour() {
// 'AAAA-MM-JJ' (format d'un champ <input type="date">)
const d = new Date();
const p = n => String(n).padStart(2, '0');
return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function dateEnSecondes(iso) {
// 'AAAA-MM-JJ' → secondes depuis 1970, à minuit UTC (format Grist pour une colonne Date)
const [a, m, j] = iso.split('-').map(Number);
return Date.UTC(a, m - 1, j) / 1000;
}

/*function typeInverse(type) {
  // « Arom.Méd 🌿 » → « 🌿 Arom.Méd » (emoji d'abord, puis le texte)
  const m = String(type || '').match(/^(.*?)\s*(\p{Extended_Pictographic}.*)$/u);
  return m ? `${m[2]} ${m[1]}`.trim() : String(type || '');
}*/

function libelle(v) {
  return v.variete ? `${v.nom} - ${v.variete}` : v.nom;
}

function lieuxFiltres(lieux, choisis, saisie) {
// Lieux pas encore choisis dont le nom contient la saisie (saisie vide = tous)
const s = normaliser(saisie);
return lieux.filter(l => !choisis.includes(l) && (!s || normaliser(l).includes(s)));
}

function correspondRecherche(texte, saisie) {
// texte et saisie sont déjà normalisés (voir normaliser) ; chaque mot de la saisie doit se trouver dans le texte
if (!saisie) return true;
return saisie.split(' ').every(mot => texte.includes(mot));
}

function choixColonne(tabTables, tabColonnes, tableId, colId) {
  // Choix d'une colonne Choice / ChoiceList, lus dans les métadonnées Grist. Renvoie null s'il n'y en a pas.
  const col = colonneGrist(tabTables, tabColonnes, tableId, colId);
  if (!col || !col.widgetOptions) return null;
  try {
    const options = JSON.parse(col.widgetOptions);
    return Array.isArray(options.choices) && options.choices.length ? options.choices : null;
  } catch (e) { return null; }
}

async function lireChoixColonnes(tableId, colIds) {
// Choix de plusieurs colonnes Choice / ChoiceList : { colId: [choix] ou null }.
// Seule fonction du commun qui appelle grist : le plugin doit être chargé avant l'appel.
const [tabTables, tabColonnes] = await Promise.all([
grist.docApi.fetchTable('_grist_Tables'),
grist.docApi.fetchTable('_grist_Tables_column')
  ]);
const resultat = {};
for (const c of colIds) resultat[c] = choixColonne(tabTables, tabColonnes, tableId, c);
return resultat;
}

function creerMessageTemporaire(definir, duree = 4000) {
// Renvoie une fonction (texte) qui affiche le texte via definir(texte), puis l'efface après duree ms
let minuterie = null;
return texte => {
clearTimeout(minuterie);

definir(texte);
if (texte) minuterie = setTimeout(() => definir(''), duree);
  };
}

function enListeChoix(valeurs) { return ['L', ...valeurs]; }

function pluriel(n, singulier, formePluriel = singulier + 's') {
  // 0 et 1 → singulier ; 2 et plus → pluriel
  return n >= 2 ? formePluriel : singulier;
}
function evolution(avant, apres, singulier, formePluriel) {
  // « 12 → 15 germés » : l'accord se fait sur la valeur d'arrivée
  return `${avant} → ${apres} ${pluriel(apres, singulier, formePluriel)}`;
}

function entierOuNull(valeur) {
  // '12' → 12 ; vide ou autre chose qu'un entier → null
  const t = String(valeur).trim();
  return /^\d+$/.test(t) ? parseInt(t, 10) : null;
}

// ===== Aperçu à l'écran : feuilles réduites à la largeur du widget =====
function facteurZoom(largeur) {
  // Réduction d'une feuille A4 paysage pour qu'elle tienne dans une zone de « largeur » pixels.
  // Jamais agrandie au-delà de la taille réelle ; arrondi vers le bas pour éviter une barre de défilement d'un pixel.
  const largeurFeuille = 297 * 96 / 25.4;   // 297 mm en pixels d'écran (≈ 1123)
  return Math.min(1, Math.floor(largeur / largeurFeuille * 1000) / 1000);
}
// Colonnes de la liste absentes des lignes reçues (aucune ligne : rien à vérifier)
function colonnesAbsentes(colonnes, liste) {
  // colonnes : un objet dont les clés sont les noms de colonnes
  //   - le résultat de fetchTable (complet même si la table est vide)
  //   - ou la première ligne reçue (lignes[0]) ; aucune ligne → undefined → rien à vérifier
  // liste : noms des colonnes nécessaires. Renvoie ceux qui manquent.
  if (!colonnes) return [];
  return liste.filter(c => !(c in colonnes));
}

// Mois de l'année. court : affichage ; long : dans une phrase ; initiale : colonnes étroites du cahier ;
// valeurs : ce qu'on peut trouver dans Grist (la première est celle des listes de choix).
const LISTE_MOIS = [
  { num: 1,  court: 'Jan',  long: 'janvier',   initiale: 'J',  valeurs: ['Jan', 'Janvier'] },
  { num: 2,  court: 'Fév',  long: 'février',   initiale: 'F',  valeurs: ['Fév', 'Février'] },
  { num: 3,  court: 'Mar',  long: 'mars',      initiale: 'M',  valeurs: ['Mar', 'Mars'] },
  { num: 4,  court: 'Avr',  long: 'avril',     initiale: 'A',  valeurs: ['Avr', 'Avril'] },
  { num: 5,  court: 'Mai',  long: 'mai',       initiale: 'Ma', valeurs: ['Mai'] },
  { num: 6,  court: 'Juin', long: 'juin',      initiale: 'Ju', valeurs: ['Jui', 'Juin'] },
  { num: 7,  court: 'Juil', long: 'juillet',   initiale: 'Jl', valeurs: ['Juil', 'Juillet'] },
  { num: 8,  court: 'Août', long: 'août',      initiale: 'Ao', valeurs: ['Aou', 'Août'] },
  { num: 9,  court: 'Sep',  long: 'septembre', initiale: 'S',  valeurs: ['Sep', 'Septembre'] },
  { num: 10, court: 'Oct',  long: 'octobre',   initiale: 'O',  valeurs: ['Oct', 'Octobre'] },
  { num: 11, court: 'Nov',  long: 'novembre',  initiale: 'N',  valeurs: ['Nov', 'Novembre'] },
  { num: 12, court: 'Déc',  long: 'décembre',  initiale: 'D',  valeurs: ['Déc', 'Décembre'] }
];

function numeroMois(valeur) {
  // 'Mar' ou 'Mars' → 3 ; valeur inconnue → null
  const m = LISTE_MOIS.find(m => m.valeurs.includes(valeur));
  return m ? m.num : null;
}

function anneeDepuisDate(valeur) {
  // Année d'une date Grist : secondes (fetchTable) ou objet Date (onRecords) ; autre chose → null
  if (valeur instanceof Date) return valeur.getUTCFullYear();
  return typeof valeur === 'number' ? new Date(valeur * 1000).getUTCFullYear() : null;
}

function aller(id) {
  // Fait défiler jusqu'à l'élément, juste sous l'en-tête collé (.entete), quelle que soit sa hauteur du moment
  const el = document.getElementById(id);
  if (!el) return;
  const entete = document.querySelector('.entete');
  const marge = (entete ? entete.offsetHeight : 0) + 8;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - marge, behavior: 'smooth' });
}

function estLigneMere(s) {
  // Ligne Semis d'une plante mère : s : ligne Semis préparée par l'outil, avec planteMere, millesimeId, godets, graines
  return s.planteMere && s.millesimeId > 0 && s.godets === 0 && s.graines === 0;
}

function effacerAuClic(effacer) {
  // Une erreur reste affichée jusqu'au prochain clic. Phase de capture : l'ancienne erreur est effacée
  // AVANT que le bouton cliqué agisse ; s'il reste un problème, il la réaffiche.
  document.addEventListener('click', effacer, true);
}
function colonneGrist(tabTables, tabColonnes, tableId, colId) {
  // Ligne de _grist_Tables_column pour tableId.colId, ou null si la colonne n'existe pas
  const table = tableEnLignes(tabTables).find(t => t.tableId === tableId);
  if (!table) throw new Error(`table ${tableId} introuvable dans les métadonnées`);
  return tableEnLignes(tabColonnes).find(c => c.parentId === table.id && c.colId === colId) || null;
}