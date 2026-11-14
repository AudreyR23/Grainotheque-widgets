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

function anneeDepuisDate(secondes) {
  return typeof secondes === 'number' ? new Date(secondes * 1000).getUTCFullYear() : null;
}

function dateAffichee(secondes) {
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

function typeInverse(type) {
  // « Arom.Méd 🌿 » → « 🌿 Arom.Méd » (emoji d'abord, puis le texte)
  const m = String(type || '').match(/^(.*?)\s*(\p{Extended_Pictographic}.*)$/u);
  return m ? `${m[2]} ${m[1]}`.trim() : String(type || '');
}

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
const table = tableEnLignes(tabTables).find(t => t.tableId === tableId);
if (!table) throw new Error(`table ${tableId} introuvable dans les métadonnées`);
const col = tableEnLignes(tabColonnes).find(c => c.parentId === table.id && c.colId === colId);
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

function creerMessageTemporaire(definir, duree = 5000) {
// Renvoie une fonction (texte) qui affiche le texte via definir(texte), puis l'efface après duree ms
let minuterie = null;
return texte => {
clearTimeout(minuterie);
definir(texte);
if (texte) minuterie = setTimeout(() => definir(''), duree);
  };
}