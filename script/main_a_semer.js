// ===== État global =====
let moisChoisi = new Date().getMonth() + 1;   // 1 à 12 (mois en cours pour l'instant)
let afficherDejaSemees = false;
let tri = 'nom';

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Juil', 'Aou', 'Sep', 'Oct', 'Nov', 'Déc'];

const recordsParId = {
  varietes: new Map(),
  millesimes: new Map()
};

// ===== Utilitaires =====
function tableEnLignes(tableau) {
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
  return Array.isArray(valeur) && valeur[0] === 'L' ? valeur.slice(1) : [];
}

function anneeDepuisDate(secondes) {
  return typeof secondes === 'number' ? new Date(secondes * 1000).getUTCFullYear() : null;
}

function normaliser(texte) {
  return String(texte || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

function moisDansListe(liste, mois) {
  // liste = ['Jan', 'Fév', ...] ; mois = 1 à 12
  const cible = normaliser(MOIS[mois - 1]);
  return liste.some(m => normaliser(m) === cible);
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
      sousAbris: listeChoix(v.Semis_sous_abris),
      pleineTerre: listeChoix(v.Semis_pleine_terre),
      dejaSemeCetteAnnee: v.Deja_seme_cette_annee === true,
      anneesSansTest: v.Annees_sans_test
    });
  }

  for (const m of tableEnLignes(tabMillesimes)) {
    recordsParId.millesimes.set(m.id, {
      id: m.id,
      varieteId: m.NomVariete || 0,
      annee: anneeDepuisDate(m.Millesime),
      epuise: m.Epuise === true,
      germination: typeof m.Germination_affichee === 'number' ? m.Germination_affichee : null
    });
  }
}

// ===== Logique « à semer » =====
function millesimeAUtiliser(varieteId) {
  // Millésimes non épuisés de la variété
  const candidats = [...recordsParId.millesimes.values()]
    .filter(m => m.varieteId === varieteId && !m.epuise);
  if (candidats.length === 0) return null;

  // 1) le plus récent (parmi ceux qui ont une date)
  const dates = candidats.filter(m => m.annee !== null).sort((a, b) => b.annee - a.annee);
  if (dates.length) return dates[0];

  // 2) sinon celui qui a un taux de germination affiché (le plus élevé)
  const avecTaux = candidats.filter(m => m.germination !== null).sort((a, b) => b.germination - a.germination);
  return avecTaux.length ? avecTaux[0] : null;
}

function comparerSelonTri(a, b) {
  const parNom = (a.v.nom + a.v.variete).localeCompare(b.v.nom + b.v.variete, 'fr');
  if (tri === 'germination') {
    const ga = a.mil.germination ?? -1;
    const gb = b.mil.germination ?? -1;
    return (gb - ga) || parNom;
  }
  if (tri === 'test') {
    const ta = typeof a.v.anneesSansTest === 'number' ? a.v.anneesSansTest : 999;   // « Jamais testé » en tête
    const tb = typeof b.v.anneesSansTest === 'number' ? b.v.anneesSansTest : 999;
    return (tb - ta) || parNom;
  }
  return parNom;
}

function varietesASemer() {
  const resultat = [];
  for (const v of recordsParId.varietes.values()) {
    const sousAbris = moisDansListe(v.sousAbris, moisChoisi);
    const pleineTerre = moisDansListe(v.pleineTerre, moisChoisi);
    if (!sousAbris && !pleineTerre) continue;     // pas dans la fenêtre de semis
    if (v.dejaSemeCetteAnnee && !afficherDejaSemees) continue;   // déjà semée cette année
    const mil = millesimeAUtiliser(v.id);
    if (!mil) continue;                           // plus de graines utilisables
    resultat.push({ v, mil, sousAbris, pleineTerre, dejaSemee: v.dejaSemeCetteAnnee });
  }
  return resultat.sort(comparerSelonTri);
}

// ===== Affichage =====
function texteGermination(g) {
  if (g === null) return 'germination inconnue';
  return 'germination ' + Math.round(g <= 1 ? g * 100 : g) + ' %';
}

function texteTest(a) {
  if (typeof a === 'number') return a === 0 ? 'testé cette année' : `testé il y a ${a} an${a > 1 ? 's' : ''}`;
  return 'jamais testé';
}

function afficher() {
  const liste = document.getElementById('liste');
  liste.innerHTML = '';
  const lignes = varietesASemer();

  const nbASemer = lignes.filter(l => !l.dejaSemee).length;
  document.getElementById('message').textContent =
    `${nbASemer} variété(s) à semer en ${MOIS[moisChoisi - 1]}, pas encore semée(s) cette année.`;

  for (const { v, mil, sousAbris, pleineTerre, dejaSemee } of lignes) {
    const li = document.createElement('li');
    li.className = 'carte' + (!sousAbris && pleineTerre ? ' pleine-terre' : '') + (dejaSemee ? ' deja-semee' : '');

    const nom = document.createElement('div');
    nom.className = 'carte-nom';
    nom.textContent = v.variete ? `${v.nom} — ${v.variete}` : v.nom;

    const badges = document.createElement('div');
    if (sousAbris) {
      const b = document.createElement('span');
      b.className = 'badge';
      b.textContent = 'Sous abri';
      badges.appendChild(b);
    }
    if (pleineTerre) {
      const b = document.createElement('span');
      b.className = 'badge pleine-terre';
      b.textContent = 'Pleine terre';
      badges.appendChild(b);
    }

    const detail = document.createElement('div');
    detail.className = 'carte-detail';
    const anneeMil = mil.annee !== null ? `millésime ${mil.annee}` : 'millésime sans date';
    detail.textContent = `${anneeMil} · ${texteGermination(mil.germination)} · ${texteTest(v.anneesSansTest)}`;

        if (dejaSemee) {
      const b = document.createElement('span');
      b.className = 'badge deja-semee';
      b.textContent = 'Déjà semée';
      badges.appendChild(b);
    }

    li.append(nom, badges, detail);
    liste.appendChild(li);
  }
}

async function actualiser() {
  const bouton = document.getElementById('btnActualiser');
  bouton.disabled = true;
  try {
    await chargerDonnees();
    afficher();
  } catch (err) {
    console.error(err);
    document.getElementById('message').textContent = 'Erreur de chargement : ' + err.message;
  } finally {
    bouton.disabled = false;
  }
}

// ===== Filtres =====
function initialiserFiltres() {
  const selectMois = document.getElementById('selectMois');
  MOIS.forEach((nom, i) => {
    const opt = document.createElement('option');
    opt.value = i + 1;
    opt.textContent = nom;
    selectMois.appendChild(opt);
  });
  selectMois.value = String(moisChoisi);
  selectMois.addEventListener('change', () => {
    moisChoisi = Number(selectMois.value);
    afficher();
  });
    document.getElementById('caseDejaSemees').addEventListener('change', e => {
    afficherDejaSemees = e.target.checked;
    afficher();
  });
    document.getElementById('selectTri').addEventListener('change', e => {
    tri = e.target.value;
    afficher();
  });
}

// ===== Initialisation =====
// 'full' est nécessaire pour lire plusieurs tables avec docApi.fetchTable, même si on n'écrit rien.
grist.ready({ requiredAccess: 'full' });

document.getElementById('btnActualiser').addEventListener('click', actualiser);
initialiserFiltres();
actualiser();