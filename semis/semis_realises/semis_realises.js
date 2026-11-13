// État lu par le HTML : Vue redessine quand il change
const etat = Vue.reactive({
  modeSemis: 'godets',        // 'godets' ou 'pleine_terre'
  rechercheVariete: '',       // texte du champ Variété
  resultatsVariete: [],       // [{ id, libelle }]
  autresVarietes: 0,          // nombre de résultats non affichés
  listeVarieteOuverte: false,
  encart: null,               // null = pas d'encart ; sinon { infos, titre, mere, lignes, autres, alerte }
  millesimes: [],             // [{ id, libelle }]
  millesimeId: null,          // millésime choisi
  millesimeMessage: '— choisir une variété d\'abord —',   // texte du bouton quand rien n'est choisi
  millesimeDesactive: true,
  listeMillesimeOuverte: false,
  types: [],                  // [{ valeur, libelle }]
  type: '',                   // valeur écrite dans Grist, ex. « Fleurs 🌼 »
  listeTypeOuverte: false,
   ouChoisis: [],              // lieux choisis (pleine terre)
  rechercheOu: '',
  listeOuOuverte: false,
  sachetVide: false,
  aProduire: false,
  etapesIntermediaires: [],             // étapes en attente d'enregistrement (écran seulement)
  erreur: '',
  succes: '',
  enregistrement: false,
  date: dateDuJour(),         // 'AAAA-MM-JJ'
  nbGodets: '',
  nbGraines: '',
  message: ''                      
});

// ===== État global =====
let modifie = false;
let minuterieSucces = null;
let varieteChoisieId = null;
let millesimeChoisiId = null;
let prochainIdEtapeIntermediaire= 1;
let donneesChargees = false;
let varietePendante = null;   // variété reçue avant la fin du chargement

let TYPES = [
  'Arom.Méd 🌿', 'Fleurs 🌼', 'Lég-feu. 🥬', 'Lég-fru. 🍅', 'Lég-gra. 🌾',
  'Lég-rac. 🥕', 'Tub.bul. 🧅', 'Petits Fruits 🫐'
];
const TYPE_PAR_DEFAUT = 'Arom.Méd 🌿';

let LIEUX = [
  'Cour 1', 'Cour 2', 'C. Fosse', 'C. Terrasse', 'Regard eau', 'Bac C angle', 'Bac R milieu',
  'Bac terrasse', 'Bac C milieu', 'Bac R angle', 'Grand bac', 'SerreN', 'Serre Tipi', 'SerreS',
  'Serre', 'SerreE', 'SerreW', 'Pot.Table', 'Pot.HC', 'Pot.HE', 'Pot.Prunier', 'Pot.HN',
  'Pot.Bulle', 'Pot.B', 'Pot.BC', 'Ext. Serre W', 'Ext. Serre Bulle', 'Ext. Serre S',
  'Ext. Serre E', 'Ext. Serre Clô.', 'Ext. Serre Tipi', 'Pot.1-4', 'Pot.1-3', 'Pot.2-3',
  'Pot.2-4', 'Pot.3-1', 'Pot.3-2', 'Pot.3-3', 'Pot.3-4', 'Pot.4-1', 'Pot.4-3', 'Pot.4-4',
  'Séchoir B', 'Séchoir HB', 'Séchoir H', 'Kiwi', 'Figuier', 'Prairie murier', 'Saule',
  'Pot.2-1', 'Pot', 'Pot.1-2', 'Pot.2-2', 'Pot.4-2', 'Pot. 1-1', 'Tipi carré', 'En pot',
  'Murette', 'Fontaine', 'Cour triangle', 'C. Triangle'
];

const recordsParId = {
  varietes: new Map(),
  millesimes: new Map(),
  semis: new Map()
};

// ===== Utilitaires =====

function dateDuJour() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function dateEnSecondes(iso) {
  // 'YYYY-MM-DD' → secondes depuis 1970, à minuit UTC (format Grist pour une colonne Date)
  const [a, m, j] = iso.split('-').map(Number);
  return Date.UTC(a, m - 1, j) / 1000;
}

// ===== Statut =====
function majStatut() {
  const el = document.getElementById('statut');
  const n = etat.etapesIntermediaires.length;
  modifie = n > 0;
  el.textContent = modifie ? `● Non sauvegardé (${n})` : '✓ À jour';
  el.classList.toggle('non-sauvegarde', modifie);
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
      anneePlantation: m.Annee_plantation || null
    });
  }
}
// ===== Sélecteur de variété =====
const MAX_RESULTATS = 40;

function afficherResultats() {
  const saisie = normaliser(etat.rechercheVariete);
  if (!saisie) { etat.listeVarieteOuverte = false; return; }

  const mots = saisie.split(' ');
  const trouves = [...recordsParId.varietes.values()]
    .filter(v => mots.every(mot => v.recherche.includes(mot)))
    .sort((a, b) => libelle(a).localeCompare(libelle(b), 'fr'));

  etat.resultatsVariete = trouves.slice(0, MAX_RESULTATS)
    .map(v => ({ id: v.id, libelle: libelle(v) }));
  etat.autresVarietes = Math.max(0, trouves.length - MAX_RESULTATS);
  etat.listeVarieteOuverte = true;
}

function surRechercheVariete(e) {
  etat.rechercheVariete = e.target.value;
  varieteChoisieId = null;
  remplirMillesimes(null);
  afficherDerniersSemis();
  afficherResultats();
}

function surFocusVariete(e) {
  e.target.select();
  // Rouvre la liste seulement si une recherche est en cours (pas après un choix)
  if (etat.rechercheVariete && varieteChoisieId === null) afficherResultats();
}

function choisirVariete(id) {
  const v = recordsParId.varietes.get(id);
  if (!v) return;
  varieteChoisieId = id;
  etat.rechercheVariete = libelle(v);
  etat.listeVarieteOuverte = false;
  remplirMillesimes(id);
  appliquerTypeVariete(id);
  afficherDerniersSemis();
}

function reinitialiserVariete() {
  varieteChoisieId = null;
  etat.rechercheVariete = '';
  etat.listeVarieteOuverte = false;
  afficherDerniersSemis();
}

// ===== Sélecteur de millésime =====
function millesimesDeVariete(varieteId) {
  // Retenus : « or. » ou datés. Ordre : datés (récent d'abord), puis « or. » en dernier.
  const retenus = [...recordsParId.millesimes.values()]
    .filter(m => m.varieteId === varieteId && (m.estOriginal || m.annee !== null));
  return retenus.sort((a, b) => {
    if (a.estOriginal !== b.estOriginal) return a.estOriginal ? 1 : -1;
    return (b.annee || 0) - (a.annee || 0);
  });
}

function libelleMillesime(m) {
  const debut = m.estOriginal ? 'or. (originale)' : String(m.annee);
  const origine = m.origine.length ? ' · ' + m.origine.join(', ') : '';
  const saisons = !m.estOriginal && m.saisonsManuel ? ' · ' + m.saisonsManuel + ' saison(s)' : '';
  return debut + origine + saisons;
}

function remplirMillesimes(varieteId) {
  millesimeChoisiId = null;
  etat.millesimeId = null;
  etat.listeMillesimeOuverte = false;

  const liste = varieteId ? millesimesDeVariete(varieteId) : [];
  etat.millesimes = liste.map(m => ({ id: m.id, libelle: libelleMillesime(m) }));
  if (liste.length === 0) {
    etat.millesimeMessage = varieteId
      ? 'Aucun millésime disponible pour cette variété'
      : '— choisir une variété d\'abord —';
    etat.millesimeDesactive = true;
    return;
  }
  etat.millesimeDesactive = false;
  millesimeChoisiId = liste[0].id;   // le plus récent (ou « or. » s'il est seul)
  etat.millesimeId = liste[0].id;
}

function choisirMillesime(id) {
  millesimeChoisiId = id;
  etat.millesimeId = id;
  etat.listeMillesimeOuverte = false;
}

function texteBoutonMillesime() {
  const m = etat.millesimes.find(x => x.id === etat.millesimeId);
  return m ? m.libelle : etat.millesimeMessage;
}

// ===== Reste de la fiche =====
function remplirTypes() {
  etat.types = TYPES.map(t => ({ valeur: t, libelle: typeInverse(t) }));
  etat.type = TYPES.includes(TYPE_PAR_DEFAUT) ? TYPE_PAR_DEFAUT : TYPES[0];
}

function appliquerTypeVariete(varieteId) {
  const v = recordsParId.varietes.get(varieteId);
  const parDefaut = TYPES.includes(TYPE_PAR_DEFAUT) ? TYPE_PAR_DEFAUT : TYPES[0];
  etat.type = v && TYPES.includes(v.type) ? v.type : parDefaut;
}

function choisirType(valeur) {
  etat.type = valeur;
  etat.listeTypeOuverte = false;
}

function texteBoutonType() {
  const t = etat.types.find(x => x.valeur === etat.type);
  return t ? t.libelle : '';
}

function basculerListe(nom) {
  const ouvrir = nom === 'millesime'
    ? !etat.listeMillesimeOuverte && !etat.millesimeDesactive
    : !etat.listeTypeOuverte;
  etat.listeMillesimeOuverte = nom === 'millesime' && ouvrir;
  etat.listeTypeOuverte = nom === 'type' && ouvrir;
}

// Un toucher en dehors d'un menu ferme les deux listes
document.addEventListener('click', e => {
  if (!e.target.closest('#appMillesime .champ-liste')) etat.listeMillesimeOuverte = false;
  if (!e.target.closest('#appType .champ-liste')) etat.listeTypeOuverte = false;
});

// --- Où (multi-sélection) ---
function lieuxProposes() {
  const saisie = normaliser(etat.rechercheOu);
  return LIEUX.filter(l => !etat.ouChoisis.includes(l) && (!saisie || normaliser(l).includes(saisie)));
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
  afficherErreur('');
}

function choisirMode(mode) {
  if (mode !== etat.modeSemis) appliquerMode(mode);
}

function afficherErreur(texte) {
  const el = document.getElementById('erreurFiche');
  el.textContent = texte;
  el.hidden = !texte;
}

function lireFiche() {
  const pleineTerre = etat.modeSemis === 'pleine_terre';
  return {
    mode: etat.modeSemis,
    varieteId: varieteChoisieId,
    millesimeId: millesimeChoisiId,
       date: etat.date,
    godets: pleineTerre ? 1 : Number(etat.nbGodets),
    graines: Number(etat.nbGraines),
       type: etat.type,
      ou: pleineTerre ? [...etat.ouChoisis] : [],
    sachetVide: etat.sachetVide,
    aProduire: etat.aProduire
  };
}

function validerFiche(f) {
  if (!f.varieteId) return 'Choisis une variété dans la liste.';
  if (!f.millesimeId) return 'Choisis un millésime.';
  if (!f.date) return 'Renseigne la date du semis.';
  if (!(f.godets > 0)) return 'Renseigne le nombre de godets.';
  if (!(f.graines > 0)) return 'Renseigne le nombre de graines.';
  if (f.mode === 'pleine_terre' && f.ou.length === 0) return 'Choisis au moins un emplacement (Où) pour un semis en pleine terre.';
  return '';
}

// ===== Etapes intermédiaires =====
function ajouterEtapeIntermediaire() {
  const f = lireFiche();
  const erreur = validerFiche(f);
  afficherErreur(erreur);
  if (erreur) return;

  f.id = prochainIdEtapeIntermediaire++;
  etat.etapesIntermediaires.push(f);

  // Réinitialisation partielle : on garde date, godets, graines, type, mode
  reinitialiserVariete();
  remplirMillesimes(null);
  etat.ouChoisis = [];
  etat.rechercheOu = '';
  etat.sachetVide = false;
  etat.aProduire = false;
  majStatut();
  document.getElementById('rechercheVariete').focus();
}

function retirerEtapeIntermediaire(id) {
  etat.etapesIntermediaires = etat.etapesIntermediaires.filter(b => b.id !== id);
  majStatut();
}

function initialiserEtapesIntermediaires() {
  document.getElementById('btnAjouter').addEventListener('click', ajouterEtapeIntermediaire);
}

function nomEtapeIntermediaire(b) {
  const v = recordsParId.varietes.get(b.varieteId);
  return v ? libelle(v) : '(variété inconnue)';
}

function detailEtapeIntermediaire(b) {
  const m = recordsParId.millesimes.get(b.millesimeId);
  const quantite = b.mode === 'pleine_terre'
    ? `${b.graines} graines`
    : `${b.godets} godets × ${b.graines} graines`;
  return `${m ? libelleMillesime(m) : '?'} · ${b.date} · ${quantite} · ${typeInverse(b.type)}` +
    (b.ou.length ? ' · ' + b.ou.join(', ') : '') +
    (b.sachetVide ? ' · sachet vidé' : '') +
    (b.aProduire ? ' · à reproduire' : '');
}

// ===== Enregistrement dans Semis =====
function afficherSucces(texte) {
  clearTimeout(minuterieSucces);
  etat.succes = texte;
  if (texte) minuterieSucces = setTimeout(() => afficherSucces(''), 5000);
}

async function enregistrerTout() {
  if (etat.etapesIntermediaires.length === 0 || etat.enregistrement) return;
  etat.enregistrement = true;
  document.getElementById('btnAjouter').disabled = true;
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
    Type: liste.map(b => b.type),
    Ou: liste.map(b => b.ou.length ? ['L', ...b.ou] : null),
    Germes: liste.map(() => null),
    A_produire: liste.map(b => !!b.aProduire)
  };

  try {
    const actions = [['BulkAddRecord', 'Semis', new Array(n).fill(null), colonnes]];
    const millesimesVides = [...new Set(liste.filter(b => b.sachetVide).map(b => b.millesimeId))];
    for (const id of millesimesVides) {
      actions.push(['UpdateRecord', 'Millesimes', id, { Qtte_graines: null, Sachets: '' }]);
    }
    await grist.docApi.applyUserActions(actions);
    etat.etapesIntermediaires = [];
    majStatut();
    afficherSucces(`✓ ${n} semis enregistré${n > 1 ? 's' : ''} dans Semis.`);
    try { await chargerSemis(); } catch (e) { console.error('Rechargement de Semis impossible :', e); }
  } catch (err) {
    console.error(err);
    etat.erreur = 'Échec de l\'enregistrement : ' + err.message + ' — tes lignes sont conservées.';
  } finally {
    etat.enregistrement = false;
    document.getElementById('btnAjouter').disabled = false;
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
  if (!varieteChoisieId) { etat.encart = null; return; }
  const v = recordsParId.varietes.get(varieteChoisieId);
  if (!v) { etat.encart = null; return; }

  const dateFiche = etat.date;
  const annee = dateFiche ? Number(dateFiche.slice(0, 4)) : new Date().getFullYear();

  const semis = [...recordsParId.semis.values()]
    .filter(s => s.varieteId === varieteChoisieId && s.annee === annee && s.date !== null)
    .sort((a, b) => b.date - a.date);

  const meres = [...recordsParId.millesimes.values()]
    .filter(m => m.varieteId === varieteChoisieId && m.planteMere);
  const anneesPlantation = meres.map(m => m.anneePlantation).filter(a => a).sort();
  const dansListe = etat.etapesIntermediaires.filter(b => b.varieteId === varieteChoisieId).length;
  const germ = v.dureeGerm ? `${v.dureeGerm} jours` : 'non renseignée';

  etat.encart = {
    infos: `${v.type ? typeInverse(v.type) : '—'} · Germination : ${germ}`,
    titre: semis.length ? `Déjà semé en ${annee} (${semis.length}) :` : `Pas encore semé en ${annee}.`,
    mere: meres.length
      ? '🌱 Plante mère en place' + (anneesPlantation.length ? ` (plantée en ${anneesPlantation.join(', ')})` : '')
      : '',
    lignes: semis.slice(0, 5).map(s => {
      const m = recordsParId.millesimes.get(s.millesimeId);
      const mil = m ? (m.estOriginal ? 'or.' : m.annee) : '?';
      return {
        id: s.id,
        texte: `${dateAffichee(s.date)} · mil. ${mil} · ${s.godets} × ${s.graines}` +
          (s.ou.length ? ' · ' + s.ou.join(', ') : '')
      };
    }),
    autres: semis.length > 5 ? `… et ${semis.length - 5} autre(s)` : '',
    alerte: dansListe ? '⚠ Déjà dans ta liste à enregistrer' : ''
  };
}
window.addEventListener('beforeunload', e => {
  if (modifie) { e.preventDefault(); e.returnValue = ''; }
});
// ===== Choix Type / Ou lus depuis Grist =====
async function chargerChoix() {
  try {
    const [tabTables, tabColonnes] = await Promise.all([
      grist.docApi.fetchTable('_grist_Tables'),
      grist.docApi.fetchTable('_grist_Tables_column')
    ]);
    const table = tableEnLignes(tabTables).find(t => t.tableId === 'Semis');
    if (!table) throw new Error('table Semis introuvable dans les métadonnées');
    const colonnes = tableEnLignes(tabColonnes).filter(c => c.parentId === table.id);

    const choixDe = colId => {
      const c = colonnes.find(x => x.colId === colId);
      if (!c || !c.widgetOptions) return null;
      try {
        const options = JSON.parse(c.widgetOptions);
        return Array.isArray(options.choices) && options.choices.length ? options.choices : null;
      } catch (e) { return null; }
    };

    const types = choixDe('Type');
    const lieux = choixDe('Ou');
    if (types) TYPES = types;
    if (lieux) LIEUX = lieux;
  } catch (err) {
    console.error('Lecture des choix impossible, liste de secours utilisée :', err);
  }
}

// ===== Variété envoyée par « À semer » =====
function varieteDemandee(id) {
  if (!id || !donneesChargees) return;
  if (recordsParId.varietes.has(id)) choisirVariete(id);
}

Vue.createApp({ setup() { return { etat, choisirMode }; } }).mount('#appBascule');
Vue.createApp({ setup() { return { etat, surRechercheVariete, surFocusVariete, choisirVariete }; } }).mount('#appVariete');
Vue.createApp({ setup() { return { etat, basculerListe, choisirMillesime, texteBoutonMillesime }; } }).mount('#appMillesime');
Vue.createApp({ setup() { return { etat, basculerListe, choisirType, texteBoutonType }; } }).mount('#appType');
Vue.createApp({ setup() { return { etat, lieuxProposes, surRechercheOu, ajouterLieu, retirerLieu }; } }).mount('#appOu');
Vue.createApp({ setup() { return { etat }; } }).mount('#appCases');
Vue.createApp({ setup() { return { etat, nomEtapeIntermediaire, detailEtapeIntermediaire, retirerEtapeIntermediaire, enregistrerTout }; } }).mount('#appEtapes');
Vue.createApp({ setup() { return { etat }; } }).mount('#appSaisie');
// Quand la date change, l'encart « déjà semé » se recalcule
Vue.watch(() => etat.date, afficherDerniersSemis);
// ===== Initialisation =====
grist.ready({
  requiredAccess: 'full'
});

const canal = new BroadcastChannel('granotheque-semer');
canal.onmessage = e => {
  const id = e.data && e.data.varieteId;
  if (donneesChargees) varieteDemandee(id); else varietePendante = id;
};
chargerDonnees()
  .then(chargerSemis)
  .then(chargerChoix)
  .then(() => {
    remplirTypes();
    initialiserEtapesIntermediaires(); majStatut();
    donneesChargees = true;
    if (varietePendante) varieteDemandee(varietePendante);
  })
  .catch(err => {
    console.error(err);
    etat.message = 'Erreur de chargement : ' + err.message;
  });