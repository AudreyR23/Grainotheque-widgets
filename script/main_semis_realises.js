// ===== État global =====
let modifie = false;
let varieteChoisieId = null;
let millesimeChoisiId = null;
let ouChoisis = [];   // valeurs de « Ou » sélectionnées
let brouillons = [];       // lignes en attente d'enregistrement
let prochainIdBrouillon = 1;
let enregistrementEnCours = false;
let modeSemis = 'godets';   // 'godets' ou 'pleine_terre'
let sourceChoix = 'liste de secours (lecture Grist non faite)';
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
function tableEnLignes(tableau) {
  // fetchTable renvoie {colonne: [valeurs...]} → on le transforme en [{id, colonne...}, ...]
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

function anneeDepuisDate(secondes) {
  return typeof secondes === 'number' ? new Date(secondes * 1000).getUTCFullYear() : null;
}
function normaliser(texte) {
  // minuscules, sans accents, espaces simplifiés
  return String(texte || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}
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
  modifie = brouillons.length > 0;
  el.textContent = modifie ? `● Non sauvegardé (${brouillons.length})` : '✓ À jour';
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
            estOriginal: m.Nb_saisons_manuel === 'or.',
      planteMere: !!m.Plante_mere,
      anneePlantation: m.Annee_plantation || null
    });
  }
}

function afficherControle() {
  const mils = [...recordsParId.millesimes.values()];
  const lignes = [
    `Variétés : ${recordsParId.varietes.size}`,
    `Millésimes : ${mils.length}`,
    `  dont « or. » : ${mils.filter(m => m.estOriginal).length}`,
    `  sans variété liée : ${mils.filter(m => !m.varieteId).length}`,
    `  ignorés (sans date, hors « or. ») : ${mils.filter(m => !m.estOriginal && m.annee === null).length}`,
    `  ignorés (sans date, hors « or. ») : ${mils.filter(m => !m.estOriginal && m.annee === null).length}`,
    `Choix Type / Où : ${sourceChoix}`
  ];
  document.getElementById('message').innerText = lignes.join('\n');
  console.log('Exemple variété :', [...recordsParId.varietes.values()][0]);
  console.log('Exemple millésime avec année :', mils.find(m => m.annee !== null));
}
// ===== Sélecteur de variété =====
const MAX_RESULTATS = 40;

function libelleVariete(v) {
  return v.variete ? `${v.nom} — ${v.variete}` : v.nom;
}

function afficherResultats() {
  const liste = document.getElementById('listeVarietes');
  const saisie = normaliser(document.getElementById('rechercheVariete').value);
  liste.innerHTML = '';
  if (!saisie) { liste.hidden = true; return; }

  const mots = saisie.split(' ');
  const trouves = [...recordsParId.varietes.values()]
    .filter(v => mots.every(mot => v.recherche.includes(mot)))
    .sort((a, b) => libelleVariete(a).localeCompare(libelleVariete(b), 'fr'));

  for (const v of trouves.slice(0, MAX_RESULTATS)) {
    const li = document.createElement('li');
    li.textContent = libelleVariete(v);
    li.dataset.id = v.id;
    liste.appendChild(li);
  }
  if (trouves.length === 0) {
    const li = document.createElement('li');
    li.className = 'vide';
    li.textContent = 'Aucune variété trouvée';
    liste.appendChild(li);
  } else if (trouves.length > MAX_RESULTATS) {
    const li = document.createElement('li');
    li.className = 'vide';
    li.textContent = `… ${trouves.length - MAX_RESULTATS} autres, précise ta recherche`;
    liste.appendChild(li);
  }
  liste.hidden = false;
}

function choisirVariete(id) {
  const v = recordsParId.varietes.get(id);
  if (!v) return;
  varieteChoisieId = id;
  document.getElementById('rechercheVariete').value = libelleVariete(v);
  document.getElementById('listeVarietes').hidden = true;

  const info = document.getElementById('infoVariete');
  const germ = v.dureeGerm ? `${v.dureeGerm} jours` : 'non renseignée';
  info.textContent = `Type : ${v.type || '—'} · Germination : ${germ}`;
  info.hidden = false;
  remplirMillesimes(id);
  appliquerTypeVariete(id);
  afficherDerniersSemis();
  console.log('Variété choisie :', v);
}

function initialiserSelecteurVariete() {
  const champ = document.getElementById('rechercheVariete');
  const liste = document.getElementById('listeVarietes');

  champ.addEventListener('input', () => {
    varieteChoisieId = null;
    remplirMillesimes(null);
    afficherDerniersSemis();
    document.getElementById('infoVariete').hidden = true;
    afficherResultats();
  });
  champ.addEventListener('focus', () => champ.select());

  // mousedown bloqué : le champ garde le focus, la liste reste ouverte jusqu'au click.
  // click (et non pointerdown) : un défilement tactile ne déclenche pas de sélection.
  liste.addEventListener('mousedown', e => e.preventDefault());
  liste.addEventListener('click', e => {
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    choisirVariete(Number(li.dataset.id));
  });
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
  const select = document.getElementById('selectMillesime');
  select.innerHTML = '';
  millesimeChoisiId = null;

  const liste = varieteId ? millesimesDeVariete(varieteId) : [];
  if (liste.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = varieteId ? 'Aucun millésime disponible pour cette variété' : '— choisir une variété d\'abord —';
    select.appendChild(opt);
    select.disabled = true;
    return;
  }

  for (const m of liste) {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = libelleMillesime(m);
    select.appendChild(opt);
  }
  select.disabled = false;
  select.value = String(liste[0].id);   // le plus récent (ou « or. » s'il est seul)
  millesimeChoisiId = liste[0].id;
}

function initialiserSelecteurMillesime() {
  const select = document.getElementById('selectMillesime');
  select.addEventListener('change', () => {
    millesimeChoisiId = select.value ? Number(select.value) : null;
    console.log('Millésime choisi :', recordsParId.millesimes.get(millesimeChoisiId));
  });
  remplirMillesimes(null);
}
// ===== Reste de la fiche =====
function remplirTypes() {
  const select = document.getElementById('selectType');
  select.innerHTML = '';
  for (const t of TYPES) {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    select.appendChild(opt);
  }
    select.value = TYPES.includes(TYPE_PAR_DEFAUT) ? TYPE_PAR_DEFAUT : TYPES[0];
}

function appliquerTypeVariete(varieteId) {
  const v = recordsParId.varietes.get(varieteId);
  const parDefaut = TYPES.includes(TYPE_PAR_DEFAUT) ? TYPE_PAR_DEFAUT : TYPES[0];
  const type = v && TYPES.includes(v.type) ? v.type : parDefaut;
  document.getElementById('selectType').value = type;
}

// --- Ou (multi-sélection) ---
function afficherPastilles() {
  const zone = document.getElementById('pastillesOu');
  zone.innerHTML = '';
  for (const lieu of ouChoisis) {
    const span = document.createElement('span');
    span.className = 'pastille';
    span.textContent = lieu + ' ✕';
    span.dataset.lieu = lieu;
    zone.appendChild(span);
  }
}

function afficherResultatsOu() {
  const liste = document.getElementById('listeOu');
  const saisie = normaliser(document.getElementById('rechercheOu').value);
  liste.innerHTML = '';
  const trouves = LIEUX.filter(l => !ouChoisis.includes(l) && (!saisie || normaliser(l).includes(saisie)));
  for (const lieu of trouves) {
    const li = document.createElement('li');
    li.textContent = lieu;
    li.dataset.lieu = lieu;
    liste.appendChild(li);
  }
  if (trouves.length === 0) {
    const li = document.createElement('li');
    li.className = 'vide';
    li.textContent = 'Aucun emplacement';
    liste.appendChild(li);
  }
  liste.hidden = false;
}

function initialiserOu() {
  const champ = document.getElementById('rechercheOu');
  const liste = document.getElementById('listeOu');
  const zone = document.getElementById('pastillesOu');

  champ.addEventListener('input', afficherResultatsOu);
  champ.addEventListener('focus', afficherResultatsOu);
  champ.addEventListener('blur', () => { liste.hidden = true; });

    liste.addEventListener('mousedown', e => e.preventDefault());
  liste.addEventListener('click', e => {
    const li = e.target.closest('li[data-lieu]');
    if (!li) return;
    ouChoisis.push(li.dataset.lieu);
    champ.value = '';
    afficherPastilles();
    afficherResultatsOu();
  });

  zone.addEventListener('click', e => {
    const p = e.target.closest('.pastille');
    if (!p) return;
    ouChoisis = ouChoisis.filter(l => l !== p.dataset.lieu);
    afficherPastilles();
  });
}

// --- Mode godets / pleine terre ---
function appliquerMode(mode) {
  modeSemis = mode;
  const pleineTerre = mode === 'pleine_terre';
  document.querySelectorAll('#basculeMode button').forEach(b =>
    b.classList.toggle('actif', b.dataset.mode === mode));
  document.getElementById('blocGodets').hidden = pleineTerre;
  document.getElementById('blocOu').hidden = !pleineTerre;
  document.getElementById('labelGraines').textContent = pleineTerre ? 'Nb de graines' : 'Graines par godet';
  document.querySelector('#fiche .deux-colonnes').classList.toggle('une-colonne', pleineTerre);

  ouChoisis = [];
  afficherPastilles();
  document.getElementById('rechercheOu').value = '';
  document.getElementById('listeOu').hidden = true;
  afficherErreur('');
}

function initialiserBascule() {
  document.getElementById('basculeMode').addEventListener('click', e => {
    const b = e.target.closest('button[data-mode]');
    if (!b || b.dataset.mode === modeSemis) return;
    appliquerMode(b.dataset.mode);
  });
  appliquerMode('godets');
}

function initialiserFiche() {
  document.getElementById('dateSemis').value = dateDuJour();
  remplirTypes();
  initialiserOu();
    document.getElementById('dateSemis').addEventListener('change', afficherDerniersSemis);
    initialiserBascule();
}
// ===== Brouillons =====
function afficherErreur(texte) {
  const el = document.getElementById('erreurFiche');
  el.textContent = texte;
  el.hidden = !texte;
}

function lireFiche() {
  const pleineTerre = modeSemis === 'pleine_terre';
  return {
    mode: modeSemis,
    varieteId: varieteChoisieId,
    millesimeId: millesimeChoisiId,
    date: document.getElementById('dateSemis').value,
    godets: pleineTerre ? 1 : Number(document.getElementById('nbGodets').value),
    graines: Number(document.getElementById('nbGraines').value),
    type: document.getElementById('selectType').value,
    ou: pleineTerre ? [...ouChoisis] : [],
    sachetVide: document.getElementById('caseSachetVide').checked,
    aProduire: document.getElementById('caseAProduire').checked
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

function ajouterBrouillon() {
  const f = lireFiche();
  const erreur = validerFiche(f);
  afficherErreur(erreur);
  if (erreur) return;

  f.idBrouillon = prochainIdBrouillon++;
  brouillons.push(f);

  // Réinitialisation partielle : on garde date, godets, graines, type
  varieteChoisieId = null;
  afficherDerniersSemis();
  document.getElementById('rechercheVariete').value = '';
  document.getElementById('listeVarietes').hidden = true;
  document.getElementById('infoVariete').hidden = true;
  remplirMillesimes(null);
  ouChoisis = [];
  afficherPastilles();
  document.getElementById('rechercheOu').value = '';
  document.getElementById('caseSachetVide').checked = false;
  document.getElementById('caseAProduire').checked = false;

  afficherBrouillons();
  majStatut();
  document.getElementById('rechercheVariete').focus();
}

function afficherBrouillons() {
  const zone = document.getElementById('listeBrouillons');
  const titre = document.getElementById('titreBrouillons');
  zone.innerHTML = '';
  titre.hidden = brouillons.length === 0;
  titre.textContent = `À enregistrer (${brouillons.length})`;
  document.getElementById('btnEnregistrer').hidden = brouillons.length === 0;

  for (const b of brouillons) {
    const v = recordsParId.varietes.get(b.varieteId);
    const m = recordsParId.millesimes.get(b.millesimeId);
    const li = document.createElement('li');
    li.className = 'brouillon';

    const texte = document.createElement('div');
    texte.className = 'brouillon-texte';
    const ligne1 = document.createElement('strong');
    ligne1.textContent = v ? libelleVariete(v) : '(variété inconnue)';
    const ligne2 = document.createElement('div');
    ligne2.className = 'brouillon-detail';
        const quantite = b.mode === 'pleine_terre'
      ? `pleine terre · ${b.graines} graines`
      : `${b.godets} godets × ${b.graines} graines`;
       ligne2.textContent =
      `${m ? libelleMillesime(m) : '?'} · ${b.date} · ${quantite} · ${b.type}` +
      (b.ou.length ? ' · ' + b.ou.join(', ') : '') +
      (b.sachetVide ? ' · sachet vidé' : '') +
      (b.aProduire ? ' · à reproduire' : '');
    texte.append(ligne1, ligne2);

    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'btn-suppr';
    bouton.textContent = '✕';
    bouton.title = 'Retirer de la liste';
    bouton.dataset.id = b.idBrouillon;

    li.append(texte, bouton);
    zone.appendChild(li);
  }
}

function initialiserBrouillons() {
  document.getElementById('btnAjouter').addEventListener('click', ajouterBrouillon);
    document.getElementById('btnEnregistrer').addEventListener('click', enregistrerTout);
  document.getElementById('listeBrouillons').addEventListener('click', e => {
    const btn = e.target.closest('.btn-suppr');
    if (!btn) return;
    brouillons = brouillons.filter(b => b.idBrouillon !== Number(btn.dataset.id));
    afficherBrouillons();
    majStatut();
  });
}

// ===== Enregistrement dans Semis =====
function afficherSucces(texte) {
  const el = document.getElementById('messageSucces');
  el.textContent = texte;
  el.hidden = !texte;
}

function afficherErreurEnregistrement(texte) {
  const el = document.getElementById('erreurEnregistrement');
  el.textContent = texte;
  el.hidden = !texte;
}

async function enregistrerTout() {
  if (brouillons.length === 0 || enregistrementEnCours) return;
  enregistrementEnCours = true;

  const bouton = document.getElementById('btnEnregistrer');
  bouton.disabled = true;
  document.getElementById('btnAjouter').disabled = true;
  bouton.textContent = 'Enregistrement…';
  afficherSucces('');
  afficherErreurEnregistrement('');

  const n = brouillons.length;
  const colonnes = {
    NomVariete: brouillons.map(b => b.varieteId),
    Millesime: brouillons.map(b => b.millesimeId),
    Date_s: brouillons.map(b => dateEnSecondes(b.date)),
    Nb_godets: brouillons.map(b => b.godets),
    Nb_graines: brouillons.map(b => b.graines),
    Type: brouillons.map(b => b.type),
    Ou: brouillons.map(b => b.ou.length ? ['L', ...b.ou] : null),
    Germes: brouillons.map(() => null),
    A_produire: brouillons.map(b => !!b.aProduire)
  };

   try {
        const actions = [['BulkAddRecord', 'Semis', new Array(n).fill(null), colonnes]];
    const millesimesVides = [...new Set(brouillons.filter(b => b.sachetVide).map(b => b.millesimeId))];
    for (const id of millesimesVides) {
      actions.push(['UpdateRecord', 'Millesimes', id, { Qtte_graines: null, Sachets: '' }]);
    }
    await grist.docApi.applyUserActions(actions);
    brouillons = [];
    afficherBrouillons();
    majStatut();
    afficherSucces(`✓ ${n} semis enregistré${n > 1 ? 's' : ''} dans Semis.`);
    try { await chargerSemis(); } catch (e) { console.error('Rechargement de Semis impossible :', e); }
  } catch (err) {
    console.error(err);
    afficherErreurEnregistrement('Échec de l\'enregistrement : ' + err.message + ' — tes lignes sont conservées.');
  } finally {
    enregistrementEnCours = false;
    bouton.disabled = false;
    document.getElementById('btnAjouter').disabled = false;
    bouton.textContent = 'Enregistrer tout';
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

function dateAffichee(secondes) {
  return new Date(secondes * 1000).toLocaleDateString('fr-FR', { timeZone: 'UTC' });
}

function afficherDerniersSemis() {
  const zone = document.getElementById('derniersSemis');
  zone.innerHTML = '';
  if (!varieteChoisieId) { zone.hidden = true; return; }

  const dateFiche = document.getElementById('dateSemis').value;
  const annee = dateFiche ? Number(dateFiche.slice(0, 4)) : new Date().getFullYear();

  const semis = [...recordsParId.semis.values()]
    .filter(s => s.varieteId === varieteChoisieId && s.annee === annee && s.date !== null)
    .sort((a, b) => b.date - a.date);

  const titre = document.createElement('div');
  titre.className = 'derniers-titre';
  titre.textContent = semis.length
    ? `Déjà semé en ${annee} (${semis.length}) :`
    : `Pas encore semé en ${annee}.`;
  zone.appendChild(titre);
    const meres = [...recordsParId.millesimes.values()]
    .filter(m => m.varieteId === varieteChoisieId && m.planteMere);
  if (meres.length) {
    const annees = meres.map(m => m.anneePlantation).filter(a => a).sort();
    const div = document.createElement('div');
    div.className = 'derniers-mere';
    div.textContent = '🌱 Plante mère en place' + (annees.length ? ` (plantée en ${annees.join(', ')})` : '');
    zone.appendChild(div);
  }

  for (const s of semis.slice(0, 5)) {
    const m = recordsParId.millesimes.get(s.millesimeId);
    const mil = m ? (m.estOriginal ? 'or.' : m.annee) : '?';
    const div = document.createElement('div');
    div.className = 'derniers-ligne';
    div.textContent =
      `${dateAffichee(s.date)} · mil. ${mil} · ${s.godets} × ${s.graines}` +
      (s.ou.length ? ' · ' + s.ou.join(', ') : '');
    zone.appendChild(div);
  }
  if (semis.length > 5) {
    const div = document.createElement('div');
    div.className = 'derniers-ligne';
    div.textContent = `… et ${semis.length - 5} autre(s)`;
    zone.appendChild(div);
  }

  const dansListe = brouillons.filter(b => b.varieteId === varieteChoisieId).length;
  if (dansListe) {
    const div = document.createElement('div');
    div.className = 'derniers-alerte';
    div.textContent = `⚠ Déjà dans ta liste à enregistrer (${dansListe}).`;
    zone.appendChild(div);
  }
  zone.hidden = false;
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
    sourceChoix = `Grist (Type : ${types ? types.length : 'secours'}, Ou : ${lieux ? lieux.length : 'secours'})`;
  } catch (err) {
    console.error('Lecture des choix impossible, liste de secours utilisée :', err);
    sourceChoix = 'liste de secours (erreur : ' + err.message + ')';
  }
}

// ===== Variété envoyée par « À semer » =====
function varieteDemandee(id) {
  if (!id || !donneesChargees) return;
  if (recordsParId.varietes.has(id)) choisirVariete(id);
}

// ===== Initialisation =====
grist.ready({
  requiredAccess: 'full'
});

const canal = new BroadcastChannel('granotheque-semer');
canal.onmessage = e => varieteDemandee(e.data && e.data.varieteId);

chargerDonnees()
  .then(chargerSemis)
  .then(chargerChoix)
  .then(() => {
    afficherControle(); initialiserSelecteurVariete(); initialiserSelecteurMillesime();
    initialiserFiche(); initialiserBrouillons(); majStatut();
    donneesChargees = true;
    if (varietePendante) varieteDemandee(varietePendante);
    }).catch(err => {
    console.error(err);
    document.getElementById('message').textContent = 'Erreur de chargement : ' + err.message;
  });