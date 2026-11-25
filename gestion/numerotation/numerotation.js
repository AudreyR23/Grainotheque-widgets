// ===== Messages construits par le JS =====
const TEXTES = {
  erreurChargement: (detail) => `Erreur de chargement : ${detail} (voir la console)`,
  echecEnregistrement: (detail) => `Erreur d'enregistrement : ${detail}. Rien n'a été écrit, tu peux réessayer.`,
  succes: (n, m) => 'Enregistré : ' + [
    n ? `${n} ${pluriel(n, 'variété numérotée', 'variétés numérotées')}` : '',
    m ? `${m} ${pluriel(m, 'numéro libéré', 'numéros libérés')}` : ''
  ].filter(Boolean).join(' et ') + '.'
};

// ===== Configuration =====
const TABLE = 'Varietes';
// Colonnes lues ou écrites. Disponible : formule Grist (un millésime non épuisé au moins)
const COLONNES_NECESSAIRES = ['Nom', 'Variete', 'Type', 'Num_epingle', 'Lettre', 'Disponible'];
const LIMITE_LISTE = 40;   // nombre max de variétés affichées dans la liste déroulante

// ===== État lu par le HTML : Vue redessine quand il change =====
const etat = Vue.reactive({
  charge: false,                          // true quand Varietes est lue
  message: '',                            // erreur de chargement (jusqu'au prochain chargement réussi)
  colonnesManquantes: [],                 // ex. 'Varietes.Disponible'
  erreur: '',                             // erreur d'enregistrement (jusqu'au prochain clic)
  succes: '',                             // disparaît après 4 s
  doublons: [],                           // [{ numero, noms }]
  invalides: [],                          // [{ id, nom, valeur }]
  reutilisables: [],                      // [{ id, numero, nom, type }] numérotées et indisponibles
  reutilisablesOuvert: false,             // section « Numéros réutilisables » dépliée
  prochain: { numero: 1, nouveau: true }, // prochain numéro libre
  attributions: {},                       // { id: numéro } à donner à l'enregistrement (Lettre vidée)
  liberations: {},                        // { id: numéro } à libérer à l'enregistrement (Lettre inchangée)
  attentes: [],                           // [{ id, numero, action, nom, type }] cartes « À enregistrer »
  enCours: false,                         // true pendant l'écriture dans Grist
  recherche: '',                          // texte tapé dans le champ
  menuOuvert: false,                      // true quand le champ a le focus
  seulementDisponibles: true,             // case « Seulement les variétés disponibles »
  correspondances: [],                    // [{ id, nom }] (40 au plus)
  nbAutres: 0                             // variétés trouvées au-delà des 40
});

// Données hors de etat (Vue ne suit pas les Map ni les Set)
let recordsParId = new Map();   // id -> ligne de Varietes
let numerosPris = new Set();    // numéros valides déjà dans Grist
let sansNumero = [];            // [{ id, nom, cle, disponible }] variétés sans numéro
const afficherSucces = creerMessageTemporaire(texte => { etat.succes = texte; });

// ===== Outils =====
function estNumeroValide(valeur) {
  return typeof valeur === 'number' && Number.isInteger(valeur) && valeur >= 1;
}

function estVide(valeur) {
  return valeur === null || valeur === undefined || valeur === '';
}

function nomDe(ligne) {
  return libelle({ nom: ligne.Nom || '', variete: ligne.Variete || '' });
}

function nombreAttentes() {
  return Object.keys(etat.attributions).length + Object.keys(etat.liberations).length;
}

function enLiberation(id) {
  return id in etat.liberations;
}

// ===== Calculs =====
// Prochain numéro libre : premier trou entre 1 et le max, sinon max + 1 (numéros en attente compris).
// Un numéro en cours de libération reste pris jusqu'à l'enregistrement.
function calculerProchain() {
  const pris = new Set(numerosPris);
  for (const numero of Object.values(etat.attributions)) pris.add(numero);
  let max = 0;
  for (const numero of pris) if (numero > max) max = numero;
  for (let n = 1; n <= max; n++) {
    if (!pris.has(n)) return { numero: n, nouveau: false };
  }
  return { numero: max + 1, nouveau: true };
}

// Range les variétés (sans numéro, numérotées, invalides) et copie dans etat ce que le HTML affiche
function recalculer() {
  const parNumero = new Map();   // numéro -> lignes qui le portent
  const invalides = [];
  sansNumero = [];
  for (const l of recordsParId.values()) {
    const valeur = l.Num_epingle;
    if (estVide(valeur)) {
      sansNumero.push({ id: l.id, nom: nomDe(l), cle: normaliser(nomDe(l)), disponible: l.Disponible === true });
    } else if (estNumeroValide(valeur)) {
      if (!parNumero.has(valeur)) parNumero.set(valeur, []);
      parNumero.get(valeur).push(l);
    } else {
      invalides.push({ id: l.id, nom: nomDe(l), valeur: String(valeur) });
    }
  }
  numerosPris = new Set(parNumero.keys());

  etat.doublons = [...parNumero]
    .filter(([, lignes]) => lignes.length > 1)
    .map(([numero, lignes]) => ({ numero, noms: lignes.map(nomDe) }))
    .sort((a, b) => a.numero - b.numero);
  etat.invalides = invalides;
  etat.reutilisables = [...parNumero]
    .flatMap(([numero, lignes]) => lignes
      .filter(l => l.Disponible !== true)
      .map(l => ({ id: l.id, numero, nom: nomDe(l), type: l.Type || '' })))
    .sort((a, b) => a.numero - b.numero);

  // Carte en attente devenue fausse après un changement dans Grist : retirée
  for (const [cle, numero] of Object.entries(etat.attributions)) {
    const l = recordsParId.get(Number(cle));
    if (!l || !estVide(l.Num_epingle) || numerosPris.has(numero)) delete etat.attributions[cle];
  }
  for (const [cle, numero] of Object.entries(etat.liberations)) {
    const l = recordsParId.get(Number(cle));
    if (!l || l.Num_epingle !== numero) delete etat.liberations[cle];
  }
  recalculerSaisies();
}

// Ce qui dépend des lignes en attente : prochain numéro, liste déroulante, cartes « À enregistrer »
function recalculerSaisies() {
  etat.prochain = calculerProchain();
  recalculerListe();
  const carte = (cle, numero, action) => {
    const l = recordsParId.get(Number(cle)) || {};
    return { id: Number(cle), numero, action, nom: nomDe(l), type: l.Type || '' };
  };
  etat.attentes = [
    ...Object.entries(etat.attributions).map(([cle, numero]) => carte(cle, numero, 'attribuer')),
    ...Object.entries(etat.liberations).map(([cle, numero]) => carte(cle, numero, 'liberer'))
  ].sort((x, y) => x.numero - y.numero);
}

// Variétés sans numéro, pas en attente, (disponibles si la case est cochée),
// qui contiennent chaque mot tapé ; triées par nom
function recalculerListe() {
  const saisie = normaliser(etat.recherche);
  if (!saisie) {
    etat.correspondances = [];
    etat.nbAutres = 0;
    return;
  }
  const trouvees = sansNumero
    .filter(v => !(v.id in etat.attributions)
      && (!etat.seulementDisponibles || v.disponible)
      && correspondRecherche(v.cle, saisie))
    .sort((x, y) => x.nom.localeCompare(y.nom, 'fr'));
  etat.correspondances = trouvees.slice(0, LIMITE_LISTE).map(v => ({ id: v.id, nom: v.nom }));
  etat.nbAutres = Math.max(0, trouvees.length - LIMITE_LISTE);
}

// ===== Attribuer (en attente) =====
function attribuer(id) {
  if (!recordsParId.has(id) || id in etat.attributions) return;
  etat.attributions[id] = calculerProchain().numero;
  etat.recherche = '';   // champ vidé, prêt pour la variété suivante
  recalculerSaisies();
  Vue.nextTick(() => document.getElementById('recherche').focus());
}

// ===== Libérer (en attente) : 1er clic, carte ajoutée ; 2e clic, annulé =====
function basculerLiberation(r) {
  if (enLiberation(r.id)) delete etat.liberations[r.id];
  else etat.liberations[r.id] = r.numero;
  recalculerSaisies();
}

// ✕ : la ligne en attente est annulée
function retirer(id) {
  delete etat.attributions[id];
  delete etat.liberations[id];
  recalculerSaisies();
}

// ----- Liste déroulante -----
function menuVisible() {
  return etat.menuOuvert && etat.recherche.trim() !== '';
}
function surFocus(e) {
  e.target.select();     // le texte déjà tapé est sélectionné : une frappe le remplace
  etat.menuOuvert = true;
}
function ouvrirMenu() {
  etat.menuOuvert = true;
}
function fermerMenu() {
  etat.menuOuvert = false;
}

// ===== Enregistrer les lignes en attente (un seul envoi) =====
// Libérées : Num_epingle vidé, Lettre inchangée. Numérotées : numéro écrit, Lettre vidée.
async function enregistrer() {
  if (etat.enCours || nombreAttentes() === 0) return;
  etat.enCours = true;
  try {
    const entrees = Object.entries(etat.attributions).map(([cle, numero]) => [Number(cle), numero]);
    const liberees = Object.keys(etat.liberations).map(Number);
    const actions = [];
    if (liberees.length) {
      actions.push(['BulkUpdateRecord', TABLE, liberees, { Num_epingle: liberees.map(() => null) }]);
    }
    if (entrees.length) {
      actions.push(['BulkUpdateRecord', TABLE, entrees.map(e => e[0]),
        { Num_epingle: entrees.map(e => e[1]), Lettre: entrees.map(() => '') }]);
    }
    await grist.docApi.applyUserActions(actions);
    // Copie locale mise à jour tout de suite : un clic avant le retour de Grist ne redonne pas ces numéros
    for (const [id, numero] of entrees) {
      const l = recordsParId.get(id);
      if (l) { l.Num_epingle = numero; l.Lettre = ''; }
      delete etat.attributions[id];
    }
    for (const id of liberees) {
      const l = recordsParId.get(id);
      if (l) l.Num_epingle = null;
      delete etat.liberations[id];
    }
    recalculer();
    afficherSucces(TEXTES.succes(entrees.length, liberees.length));
  } catch (err) {
    console.error("❌ Erreur lors de l'enregistrement :", err);
    etat.erreur = TEXTES.echecEnregistrement(err.message);
  } finally {
    etat.enCours = false;
  }
}

// ===== Recalcul automatique : la liste suit le texte tapé et la case =====
Vue.watch(() => [etat.recherche, etat.seulementDisponibles], recalculerListe);

// ===== Zones Vue =====
effacerAuClic(() => { etat.erreur = ''; });

Vue.createApp({ setup() { return { etat, pluriel, nombreAttentes }; } }).mount('#appEntete');
Vue.createApp({ setup() { return { etat, pluriel }; } }).mount('#appAnomalies');
Vue.createApp({ setup() { return { etat, enLiberation, basculerLiberation }; } }).mount('#appReutilisables');
Vue.createApp({ setup() { return { etat, pluriel, attribuer, menuVisible, surFocus, ouvrirMenu, fermerMenu }; } }).mount('#appFiche');
Vue.createApp({ setup() { return { etat, retirer, enregistrer, nombreAttentes }; } }).mount('#appAttentes');

// ===== Chargement (toute la table, sans les filtres de la vue) =====
async function charger() {
  // Appelée par Grist au chargement, puis à chaque modification de Varietes (Disponible compris)
  try {
    const table = await grist.docApi.fetchTable(TABLE);
    etat.colonnesManquantes = colonnesAbsentes(table, COLONNES_NECESSAIRES).map(c => TABLE + '.' + c);
    recordsParId = etat.colonnesManquantes.length
      ? new Map()                                           // pas de proposition fausse : on ne garde rien
      : new Map(tableEnLignes(table).map(l => [l.id, l]));
    recalculer();
    etat.message = '';
    etat.charge = true;
  } catch (err) {
    console.error('❌ Erreur lors du chargement de Varietes :', err);
    etat.message = TEXTES.erreurChargement(err.message);
  }
}

grist.ready({ requiredAccess: 'full' });
// onRecords ne sert que de signal « Varietes a changé » ; includeColumns : réagit aussi aux colonnes masquées
grist.onRecords(charger, { includeColumns: 'normal' });