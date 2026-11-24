// ===== Messages construits par le JS =====
const TEXTES = {
  echec: (msg) => `Erreur de chargement : ${msg} (voir la console)`,
  horsGrist: 'Page ouverte hors Grist : utilise cette URL comme widget Custom.',
  retirees: (n) => `Des données ont changé dans Grist : ${n} ${pluriel(n, 'ligne retirée', 'lignes retirées')} de « À enregistrer ». Vérifie la liste puis enregistre à nouveau.`,
  reoccupe: (n) => `Numéro de nouveau occupé : ${n} ${pluriel(n, 'attribution retirée', 'attributions retirées')} de « À enregistrer ».`,
  incoherent: 'Enregistrement annulé : numéros en double ou invalides.',
  echecEnregistrement: (msg) => `Erreur d'enregistrement : ${msg}. Les lignes en attente sont conservées, tu peux réessayer.`,
  succes: (n, m) => 'Enregistré : ' + [
    n ? `${n} ${pluriel(n, 'variété numérotée', 'variétés numérotées')}` : '',
    m ? `${m} ${pluriel(m, 'numéro libéré', 'numéros libérés')}` : ''
  ].filter(Boolean).join(' et ') + '.'
};

// ===== Configuration =====
const TABLE = 'Varietes';
// Colonnes lues ou écrites : si l'une manque (renommée, supprimée), rien n'est proposé
const COLONNES_NECESSAIRES = ['NomVariete', 'Num_epingle', 'Lettre', 'Type'];
// Millesimes : lue seulement, pour savoir quelles variétés ont un sachet ou une plante mère
const TABLE_MILLESIMES = 'Millesimes';
const COLONNES_MILLESIMES = ['NomVariete', 'Nb_sachets', 'Plante_mere'];
const LIMITE_LISTE = 40;   // nombre max de variétés affichées dans une liste déroulante

// ===== État lu par le HTML : Vue redessine quand il change =====
const etat = Vue.reactive({
  charge: false,                          // true quand les tables sont lues
  colonnesManquantes: [],                 // ex. 'Varietes.Lettre'
  erreur: '',                             // reste affichée jusqu'au prochain clic
  succes: '',                             // disparaît après 4 s
  rappel: false,                          // true après un enregistrement qui change des numéros existants
  doublons: [],                           // [{ numero, lignes: [{ id, nom }] }]
  invalides: [],                          // [{ id, nom, valeur }]
  prochain: { numero: 1, nouveau: true }, // prochain numéro libre
  // Lignes en attente d'enregistrement (une variété n'est que dans attributions OU dans liberations)
  attributions: {},                       // { id: numéro } à donner
  anciens: {},                            // { id: valeur fautive } pour les variétés renumérotées (doublon ou invalide)
  liberations: {},                        // { id: valeur actuelle } numéros à libérer (Num_epingle vidé)
  attentes: [],                           // cartes « À enregistrer », triées par numéro
  enCours: false,                         // true pendant l'écriture dans Grist
  menuOuvert: '',                         // liste déroulante ouverte : '' | 'attribuer' | 'liberer'
  // Attribuer
  recherche: '',                          // texte tapé dans le champ
  seulementDisponibles: true,             // case « Seulement les variétés disponibles »
  correspondances: [],                    // [{ id, nom }] (40 au plus)
  nbAutres: 0,                            // variétés trouvées au-delà des 40
  // Libérer
  rechercheLiberer: '',
  seulementIndisponibles: true,           // case « Seulement les variétés indisponibles »
  correspondancesLiberer: [],             // [{ id, numero, nom }] (40 au plus)
  nbAutresLiberer: 0
});

// Données hors de etat (Vue ne suit pas les Map ni les Set)
let recordsParId = new Map();       // id -> ligne de Varietes
let numerosPris = new Set();        // numéros valides déjà dans Grist
let numerosEnDoublon = new Set();   // numéros portés par plusieurs variétés dans Grist
let porteursParNumero = new Map();  // numéro -> [ids des variétés qui le portent]
let sansNumero = [];                // [{ id, nom, cle }] variétés sans numéro (cle = nom normalisé)
let numerotees = [];                // [{ id, numero, nom, cle }] variétés avec un numéro valide
let disponibles = new Set();        // ids de Varietes avec au moins un sachet ou une plante mère
let avecSachet = new Set();         // ids de Varietes avec au moins un millésime à Nb_sachets >= 1
let plantesMeres = new Set();       // ids de Varietes avec au moins un millésime Plante_mere
let numeroLecture = 0;              // sert à ignorer une lecture dépassée par une plus récente
const afficherSucces = creerMessageTemporaire(texte => { etat.succes = texte; });

// ===== Outils =====
function estNumeroValide(valeur) {
  return typeof valeur === 'number' && Number.isInteger(valeur) && valeur >= 1;
}

function estVide(valeur) {
  return valeur === null || valeur === undefined || valeur === '';
}

function nomAffichage(ligne) {
  // « Nom\nVariété » → « Nom - Variété »
  return String(ligne.NomVariete || '').replace(/\n/g, ' - ');
}

function nombreAttentes() {
  return Object.keys(etat.attributions).length + Object.keys(etat.liberations).length;
}

function enAttente(id) {
  return id in etat.attributions;
}

function enLiberation(id) {
  return id in etat.liberations;
}

// Variétés disponibles : au moins un millésime avec un sachet (Nb_sachets >= 1) ou une plante mère.
// Remplit aussi avecSachet et plantesMeres (détail affiché dans les anomalies).
function varietesDisponibles(millesimes) {
  avecSachet = new Set();
  plantesMeres = new Set();
  for (const m of millesimes) {
    if (typeof m.Nb_sachets === 'number' && m.Nb_sachets >= 1) avecSachet.add(m.NomVariete);
    if (m.Plante_mere === true) plantesMeres.add(m.NomVariete);
  }
  return new Set([...avecSachet, ...plantesMeres]);
}

// Disponibilité d'une variété : 'les-deux' | 'sachet' | 'mere' | 'aucun'
function dispoDe(id) {
  const sachet = avecSachet.has(id);
  const mere = plantesMeres.has(id);
  if (sachet && mere) return 'les-deux';
  if (sachet) return 'sachet';
  if (mere) return 'mere';
  return 'aucun';
}

// ===== Calculs =====
function analyserNumeros() {
  const parNumero = new Map();   // numéro -> lignes qui le portent
  const sansNumero = [];
  const invalides = [];
  for (const ligne of recordsParId.values()) {
    const valeur = ligne.Num_epingle;
    if (estVide(valeur)) {
      sansNumero.push(ligne);
    } else if (estNumeroValide(valeur)) {
      if (!parNumero.has(valeur)) parNumero.set(valeur, []);
      parNumero.get(valeur).push(ligne);
    } else {
      invalides.push(ligne);
    }
  }
  const doublons = [];
  for (const [numero, lignes] of parNumero) {
    if (lignes.length > 1) doublons.push({ numero, lignes });
  }
  doublons.sort((a, b) => a.numero - b.numero);
  return { parNumero, sansNumero, invalides, doublons };
}

// Numéros de Grist que toutes leurs variétés quittent (libérées ou renumérotées) : libres dès maintenant
function numerosLiberes() {
  const liberes = new Set();
  for (const [numero, ids] of porteursParNumero) {
    if (ids.every(id => id in etat.liberations || id in etat.anciens)) liberes.add(numero);
  }
  return liberes;
}

// Numéros de Grist encore occupés, en tenant compte des libérations en attente
function numerosOccupes() {
  const occupes = new Set(numerosPris);
  for (const numero of numerosLiberes()) occupes.delete(numero);
  return occupes;
}

// Prochain numéro libre : premier trou entre 1 et le max, sinon max + 1 (lignes en attente comprises)
function calculerProchain() {
  const pris = numerosOccupes();
  for (const numero of Object.values(etat.attributions)) pris.add(numero);
  let max = 0;
  for (const numero of pris) if (numero > max) max = numero;
  for (let n = 1; n <= max; n++) {
    if (!pris.has(n)) return { numero: n, nouveau: false };
  }
  return { numero: max + 1, nouveau: true };
}

// Copie dans etat ce que le HTML affiche
function recalculer() {
  const a = analyserNumeros();
  numerosPris = new Set(a.parNumero.keys());
  numerosEnDoublon = new Set(a.doublons.map(d => d.numero));
  porteursParNumero = new Map([...a.parNumero].map(([numero, lignes]) => [numero, lignes.map(l => l.id)]));
  sansNumero = a.sansNumero.map(l => ({ id: l.id, nom: nomAffichage(l), cle: normaliser(l.NomVariete) }));
  numerotees = [];
  for (const [numero, lignes] of a.parNumero) {
    for (const l of lignes) {
      numerotees.push({ id: l.id, numero, nom: nomAffichage(l), cle: normaliser(numero + ' ' + l.NomVariete) });
    }
  }
  etat.doublons = a.doublons.map(d => ({
    numero: d.numero,
    lignes: d.lignes.map(l => ({ id: l.id, nom: nomAffichage(l), type: l.Type || '', dispo: dispoDe(l.id) }))
  }));
  etat.invalides = a.invalides.map(l => ({
    id: l.id, nom: nomAffichage(l), valeur: String(l.Num_epingle), type: l.Type || '', dispo: dispoDe(l.id)
  }));
  if (!etat.colonnesManquantes.length) nettoyerAttentes();   // colonne manquante : on garde les attentes
  recalculerSaisies();
}

// Retire les lignes en attente devenues incohérentes après un changement dans Grist.
// Libération : la variété doit porter toujours la même valeur.
// Attribution : variété existante, numéro pas occupé, et variété toujours sans numéro
// (ou, pour une renumérotation, toujours la même valeur fautive).
// Renvoie le nombre de lignes retirées.
function nettoyerAttentes() {
  let total = 0;
  for (const [cle, valeur] of Object.entries(etat.liberations)) {
    const ligne = recordsParId.get(Number(cle));
    if (!ligne || ligne.Num_epingle !== valeur) {
      delete etat.liberations[cle];
      total++;
    }
  }
  // Retirer une attribution peut rendre un numéro de nouveau occupé : on recommence jusqu'à ce que tout tienne
  let retirees;
  do {
    retirees = 0;
    const occupes = numerosOccupes();
    for (const [cle, numero] of Object.entries(etat.attributions)) {
      const ligne = recordsParId.get(Number(cle));
      const valable = ligne && !occupes.has(numero)
        && (cle in etat.anciens ? toujoursFautif(ligne, etat.anciens[cle]) : estVide(ligne.Num_epingle));
      if (!valable) {
        delete etat.attributions[cle];
        delete etat.anciens[cle];
        retirees++;
      }
    }
    total += retirees;
  } while (retirees > 0);
  return total;
}

// Une variété renumérotée porte-t-elle toujours la même valeur fautive (invalide, ou numéro en doublon) ?
function toujoursFautif(ligne, ancien) {
  const valeur = ligne.Num_epingle;
  if (valeur !== ancien) return false;
  return !estNumeroValide(valeur) || numerosEnDoublon.has(valeur);
}

// Attribuer : variétés sans numéro, pas en attente, (disponibles si la case est cochée),
// qui contiennent chaque mot tapé ; triées par nom
function recalculerListe() {
  const saisie = normaliser(etat.recherche);
  if (!saisie) {
    etat.correspondances = [];
    etat.nbAutres = 0;
    return;
  }
  const trouvees = sansNumero
    .filter(v => !enAttente(v.id)
      && (!etat.seulementDisponibles || disponibles.has(v.id))
      && correspondRecherche(v.cle, saisie))
    .sort((x, y) => x.nom.localeCompare(y.nom, 'fr'));
  etat.correspondances = trouvees.slice(0, LIMITE_LISTE).map(v => ({ id: v.id, nom: v.nom }));
  etat.nbAutres = Math.max(0, trouvees.length - LIMITE_LISTE);
}

// Libérer : variétés numérotées, pas en attente, (indisponibles si la case est cochée),
// dont le numéro ou le nom contient chaque mot tapé ; triées par nom
function recalculerListeLiberer() {
  const saisie = normaliser(etat.rechercheLiberer);
  if (!saisie) {
    etat.correspondancesLiberer = [];
    etat.nbAutresLiberer = 0;
    return;
  }
  const trouvees = numerotees
    .filter(v => !enAttente(v.id) && !enLiberation(v.id)
      && (!etat.seulementIndisponibles || !disponibles.has(v.id))
      && correspondRecherche(v.cle, saisie))
    .sort((x, y) => x.nom.localeCompare(y.nom, 'fr'));
  etat.correspondancesLiberer = trouvees.slice(0, LIMITE_LISTE).map(v => ({ id: v.id, numero: v.numero, nom: v.nom }));
  etat.nbAutresLiberer = Math.max(0, trouvees.length - LIMITE_LISTE);
}

// Ce qui dépend des lignes en attente : prochain numéro, listes déroulantes, cartes « À enregistrer »
function recalculerSaisies() {
  etat.prochain = calculerProchain();
  recalculerListe();
  recalculerListeLiberer();
  const attentes = [];
  for (const [cle, numero] of Object.entries(etat.attributions)) {
    const ligne = recordsParId.get(Number(cle)) || {};
    const renumerotee = cle in etat.anciens;
    const ancien = renumerotee ? etat.anciens[cle] : null;
    attentes.push({
      id: Number(cle),
      action: 'attribuer',
      numero,
      tri: numero,
      valide: true,
      nom: nomAffichage(ligne),
      type: ligne.Type || '',
      ancien: renumerotee ? String(ancien) : '',
      cas: !renumerotee ? '' : (estNumeroValide(ancien) ? 'doublon' : 'invalide')
    });
  }
  for (const [cle, valeur] of Object.entries(etat.liberations)) {
    const ligne = recordsParId.get(Number(cle)) || {};
    const valide = estNumeroValide(valeur);
    attentes.push({
      id: Number(cle),
      action: 'liberer',
      numero: String(valeur),
      tri: valide ? valeur : 0,
      valide,
      nom: nomAffichage(ligne),
      type: ligne.Type || '',
      ancien: '',
      cas: valide && numerosEnDoublon.has(valeur) ? 'doublon-libere' : ''
    });
  }
  etat.attentes = attentes.sort((x, y) => x.tri - y.tri);
}

// ===== Actions =====
// Après une annulation : un numéro peut être de nouveau occupé, l'attribution qui l'avait pris est retirée
function apresAnnulation() {
  const retirees = nettoyerAttentes();
  if (retirees > 0) etat.erreur = TEXTES.reoccupe(retirees);
  recalculerSaisies();
}

// Clic sur une variété sans numéro : elle reçoit le prochain numéro, en attente d'enregistrement
function attribuer(id) {
  if (!recordsParId.has(id) || enAttente(id) || enLiberation(id)) return;
  etat.attributions[id] = calculerProchain().numero;
  etat.recherche = '';   // champ vidé, prêt pour la variété suivante
  recalculerSaisies();
  Vue.nextTick(() => document.getElementById('recherche').focus());
}

// Clic sur une variété numérotée : son numéro sera libéré (Num_epingle vidé, Lettre inchangée)
function liberer(id) {
  const ligne = recordsParId.get(id);
  if (!ligne || enAttente(id) || enLiberation(id)) return;
  etat.liberations[id] = ligne.Num_epingle;
  etat.rechercheLiberer = '';
  recalculerSaisies();
  Vue.nextTick(() => document.getElementById('rechercheLiberer').focus());
}

// ✕ : la ligne en attente est annulée
function retirer(id) {
  delete etat.attributions[id];
  delete etat.anciens[id];
  delete etat.liberations[id];
  apresAnnulation();
}

// Anomalies : 1er clic, la variété reçoit le prochain numéro libre (en attente) ; 2e clic, annule
function basculerRenumerotation(id) {
  if (enAttente(id)) {
    retirer(id);
    return;
  }
  const ligne = recordsParId.get(id);
  if (!ligne) return;
  delete etat.liberations[id];   // Renuméroter et Libérer s'excluent
  etat.attributions[id] = calculerProchain().numero;
  etat.anciens[id] = ligne.Num_epingle;
  apresAnnulation();
}

// Anomalies : 1er clic, la variété perdra sa valeur (en attente) ; 2e clic, annule
function basculerLiberation(id) {
  if (enLiberation(id)) {
    retirer(id);
    return;
  }
  const ligne = recordsParId.get(id);
  if (!ligne) return;
  delete etat.attributions[id];   // Renuméroter et Libérer s'excluent
  delete etat.anciens[id];
  etat.liberations[id] = ligne.Num_epingle;
  apresAnnulation();
}

// ----- Listes déroulantes (quel = 'attribuer' ou 'liberer') -----
// Relit Millesimes (sachets, plantes mères) à chaque clic dans un champ de recherche,
// car Grist ne prévient le widget que des changements de Varietes
async function relireMillesimes() {
  try {
    const millesimes = await grist.docApi.fetchTable(TABLE_MILLESIMES);
if (colonnesAbsentes(millesimes, COLONNES_MILLESIMES).length) return;
    disponibles = varietesDisponibles(tableEnLignes(millesimes));
    if (!etat.colonnesManquantes.length) recalculer();
  } catch (err) { console.warn(err); }
}

function menuVisible(quel) {
  const texte = quel === 'liberer' ? etat.rechercheLiberer : etat.recherche;
  return etat.menuOuvert === quel && texte.trim() !== '';
}
function surFocus(quel, e) {
  e.target.select();     // le texte déjà tapé est sélectionné : une frappe le remplace
  etat.menuOuvert = quel;
  relireMillesimes();
}
function ouvrirMenu(quel) {
  etat.menuOuvert = quel;
}
function fermerMenu() {
  etat.menuOuvert = '';
}

// ===== Enregistrement =====
async function enregistrer() {
  if (etat.enCours || nombreAttentes() === 0) return;
  etat.enCours = true;
  try {
    // Contrôle 1 : relire Varietes juste avant d'écrire
    const table = await grist.docApi.fetchTable(TABLE);
const manquantes = colonnesAbsentes(table, COLONNES_NECESSAIRES).map(c => TABLE + '.' + c);
    if (manquantes.length) {
      etat.colonnesManquantes = manquantes;   // le message de l'en-tête explique
      return;
    }

    // Contrôle 2 : les lignes en attente sont-elles toujours cohérentes avec Grist ?
    const avant = nombreAttentes();
    numeroLecture++;   // une lecture lancée avant celle-ci est dépassée : elle sera ignorée
    recordsParId = new Map(tableEnLignes(table).map(l => [l.id, l]));
    recalculer();   // met à jour les numéros pris et retire les lignes devenues fausses
    const retirees = avant - nombreAttentes();
    if (retirees > 0) {
      etat.erreur = TEXTES.retirees(retirees);
      return;
    }

    // Contrôle 3 : pas deux fois le même numéro, et que des entiers >= 1
    const entrees = Object.entries(etat.attributions).map(([cle, numero]) => [Number(cle), numero]);
    const numeros = entrees.map(e => e[1]);
    if (new Set(numeros).size !== numeros.length || !numeros.every(estNumeroValide)) {
      etat.erreur = TEXTES.incoherent;
      return;
    }

    // Écriture : un seul envoi.
    // Libérées : Num_epingle vidé, Lettre inchangée. Numérotées : numéro écrit, Lettre vidée.
    const liberees = Object.keys(etat.liberations).map(Number);
    const actions = [];
    if (liberees.length) {
      actions.push(['BulkUpdateRecord', TABLE, liberees, { Num_epingle: liberees.map(() => null) }]);
    }
    if (entrees.length) {
      actions.push(['BulkUpdateRecord', TABLE, entrees.map(e => e[0]),
        { Num_epingle: numeros, Lettre: entrees.map(() => '') }]);
    }
    await grist.docApi.applyUserActions(actions);
    // Numéros existants changés (libérés ou renumérotés) : les épingles physiques sont à refaire
    const modifies = liberees.length + entrees.filter(([id]) => id in etat.anciens).length;
    // Seules les lignes enregistrées sont retirées (une ligne ajoutée pendant l'envoi reste)
    for (const [id] of entrees) {
      delete etat.attributions[id];
      delete etat.anciens[id];
    }
    for (const id of liberees) delete etat.liberations[id];
    await charger();   // relit Grist : l'affichage repart des valeurs écrites
    afficherSucces(TEXTES.succes(entrees.length, liberees.length));
    etat.rappel = modifies > 0;
  } catch (err) {
    console.error("❌ Erreur lors de l'enregistrement :", err);
    etat.erreur = TEXTES.echecEnregistrement(err.message);
  } finally {
    etat.enCours = false;
  }
}

// ===== Recalculs automatiques =====
// Chaque liste suit son texte tapé et sa case à cocher
Vue.watch(() => [etat.recherche, etat.seulementDisponibles], recalculerListe);
Vue.watch(() => [etat.rechercheLiberer, etat.seulementIndisponibles], recalculerListeLiberer);

// ===== Lignes en attente conservées au rechargement (perdues à la fermeture de l'onglet : voulu) =====
const CLE_SAISIES = 'numerotation_saisies';

function sauvegarderSaisies() {
  try {
    if (nombreAttentes() === 0) sessionStorage.removeItem(CLE_SAISIES);
    else sessionStorage.setItem(CLE_SAISIES, JSON.stringify({
      attributions: etat.attributions, anciens: etat.anciens, liberations: etat.liberations
    }));
  } catch (err) { console.warn(err); }
}

// Au démarrage : seuls les numéros valides (entiers >= 1) sont repris pour les attributions ;
// les lignes devenues fausses sont retirées au premier chargement (nettoyerAttentes)
function restaurerSaisies() {
  try {
    const d = JSON.parse(sessionStorage.getItem(CLE_SAISIES) || '{}');
    const anciens = d.anciens || {};
    for (const [cle, numero] of Object.entries(d.attributions || {})) {
      if (!estNumeroValide(numero)) continue;
      etat.attributions[cle] = numero;
      if (cle in anciens) etat.anciens[cle] = anciens[cle];
    }
    for (const [cle, valeur] of Object.entries(d.liberations || {})) {
      if (!(cle in etat.attributions)) etat.liberations[cle] = valeur;
    }
  } catch (err) { console.warn(err); }
}

Vue.watch(() => [etat.attributions, etat.anciens, etat.liberations], sauvegarderSaisies, { deep: true });

// ===== Zones Vue =====
// Une erreur reste affichée jusqu'au prochain clic (phase de capture : effacée avant que le bouton agisse)
// Au prochain clic, les messages précédents s'effacent (phase de capture : avant que le bouton agisse)
effacerAuClic(() => { etat.erreur = ''; });

Vue.createApp({
  setup() {
    return { etat, pluriel, nombreAttentes };
  }
}).mount('#appEntete');

Vue.createApp({
  setup() {
    return { etat, pluriel, enAttente, enLiberation, basculerRenumerotation, basculerLiberation };
  }
}).mount('#appAnomalies');

Vue.createApp({
  setup() {
    return { etat, pluriel, attribuer, menuVisible, surFocus, ouvrirMenu, fermerMenu };
  }
}).mount('#appFiche');

Vue.createApp({
  setup() {
    return { etat, pluriel, liberer, menuVisible, surFocus, ouvrirMenu, fermerMenu };
  }
}).mount('#appLiberer');

Vue.createApp({
  setup() {
    return { etat, retirer, enregistrer, nombreAttentes };
  }
}).mount('#appAttentes');

// ===== Chargement (toutes les lignes, sans les filtres de la vue) =====
async function charger() {
  // Appelée par Grist au chargement, puis à chaque modification de Varietes
  const numero = ++numeroLecture;
  try {
    const [table, millesimes] = await Promise.all([
      grist.docApi.fetchTable(TABLE),
      grist.docApi.fetchTable(TABLE_MILLESIMES)
    ]);
    if (numero !== numeroLecture) return;   // une lecture plus récente a pris le relais

etat.colonnesManquantes = [
  ...colonnesAbsentes(table, COLONNES_NECESSAIRES).map(c => TABLE + '.' + c),
  ...colonnesAbsentes(millesimes, COLONNES_MILLESIMES).map(c => TABLE_MILLESIMES + '.' + c)
];
    if (etat.colonnesManquantes.length) {
      recordsParId = new Map();   // pas de proposition fausse : on ne garde rien
      disponibles = new Set();
    } else {
      recordsParId = new Map(tableEnLignes(table).map(l => [l.id, l]));
      disponibles = varietesDisponibles(tableEnLignes(millesimes));
    }
    recalculer();
    etat.charge = true;
  } catch (err) {
    console.error('❌ Erreur lors du chargement :', err);
    etat.erreur = TEXTES.echec(err.message);
  }
}

const dansGrist = window.self !== window.top;

if (dansGrist) {
  restaurerSaisies();   // avant la première lecture de Grist
  grist.ready({ requiredAccess: 'full' });
  // onRecords ne sert que de signal « Varietes a changé » ; includeColumns : réagit aussi aux colonnes masquées
  grist.onRecords(charger, { includeColumns: 'normal' });
} else {
  etat.erreur = TEXTES.horsGrist;
}