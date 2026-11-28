// État lu par le HTML : Vue redessine quand il change
const etat = Vue.reactive({
  modeSemis: 'godets',        // 'godets' ou 'pleine_terre'
  rechercheVariete: '',       // texte du champ Variété
  varieteId: null,            // variété choisie (id de Varietes)
  resultatsVariete: [],       // [{ id, libelle }]
  autresVarietes: 0,          // nombre de résultats non affichés
  listeVarieteOuverte: false,
  encart: null,               // null = pas d'encart ; sinon { type, dureeGerm, annee, nbSemis, mere, anneesPlantation, lignes, autres, dejaDansListe }
  millesimes: [],             // [{ id, original, annee, origine, saisons }]
  millesimeId: null,          // millésime choisi
  listeMillesimeOuverte: false,
  ouChoisis: [],              // lieux choisis (pleine terre)
  rechercheOu: '',
  listeOuOuverte: false,
  sachetVide: false,
  aReproduire: false,         // case « À reproduire » : recopie Varietes.A_reproduire au choix de la variété
  aEnregistrer: [],           // semis ajoutés à la liste, pas encore écrits dans Grist (perdus au rechargement : voulu)
  erreur: '',
  erreurFiche: '',            // erreur de saisie sous le formulaire
  succes: '',
  enregistrement: false,
  date: dateDuJour(),         // 'AAAA-MM-JJ'
  nbGodets: '',
  nbGraines: '',
  message: '',
  charge: false,              // devient vrai à la fin du chargement

  // Section « À semer » (ancien widget À semer)
  aSemer: {
    lignes: [],
    mois: new Date().getMonth() + 1,   // 1 à 12
    afficherDejaSemees: false,
    tri: 'nom',
    nbTotal: 0,                        // variétés à semer (non estompées), sans les filtres Sous abri / Pleine terre
    nbRetenues: 0,                     // idem, après ces filtres
    filtreActif: false,                // une case Sous abri / Pleine terre est cochée
    filtreSousAbri: false,
    filtrePleineTerre: false,
    ouvert: true,                      // section dépliée
    listeTriOuverte: false,             // menu Tri ouvert                       // section dépliée
    listeMoisOuverte: false            // menu Mois ouvert
  }
});
 
// ===== Textes des messages (erreurs, succès) =====
// Tous les messages construits par le JS sont ici, pour les relire et les comparer d'un outil à l'autre.
// Une entrée « (x) => … » est une petite fonction : on lui donne des noms ou un nombre, elle renvoie la phrase.
const TEXTES = {
  // Contrôles avant « Ajouter à la liste »
  varieteManquante: "Choisis une variété dans la liste.",
  millesimeManquant: "Choisis un millésime.",
  dateManquante: "Renseigne la date du semis.",
  godetsManquants: "Nombre de godets : saisis un nombre entier (1 ou plus).",
  grainesManquantes: "Nombre de graines : saisis un nombre entier (1 ou plus).",
  lieuManquant: "Choisis au moins un emplacement (Où) pour un semis en pleine terre.",
 
  // Chargement
  erreurChargement: (detail) => "Erreur de chargement : " + detail,
  choixIntrouvables: (noms) => "Choix introuvables dans Grist : " + noms,
  choixNonCharges: (detail) => "Choix (Où) non chargés : " + detail,
  colonnesManquantes: (noms) => "Colonnes introuvables dans Varietes : " + noms,
 
  // Enregistrement
  succes: (n) => `✓ ${n} ${pluriel(n, 'semis enregistré', 'semis enregistrés')} dans Semis.`,
  echecEnregistrement: (detail) => "Échec de l'enregistrement : " + detail + " — tes lignes sont conservées."
};
 
// ===== État global =====
let prochainIdCarte = 1;
 
let LIEUX = [];   // lus depuis Grist (choix de la colonne Ou de Semis)
 
// Colonnes de Varietes lues par l'outil (une colonne renommée ne donne pas d'erreur, juste une valeur vide)
const COLONNES_VARIETES = ['Nom', 'Variete', 'Type', 'Duree_germ', 'A_reproduire',
  'Semis_sous_abris', 'Semis_pleine_terre', 'Annees_sans_test'];

const recordsParId = {
  varietes: new Map(),
  millesimes: new Map(),
  semis: new Map()
};
 
// ===== Statut =====
function nombreAEnregistrer() {
  return etat.aEnregistrer.length;
}
 
// ===== Chargement des données =====
async function chargerDonnees() {
  const [tabVarietes, tabMillesimes] = await Promise.all([
    grist.docApi.fetchTable('Varietes'),
    grist.docApi.fetchTable('Millesimes')
  ]);
 
  recordsParId.varietes.clear();
  recordsParId.millesimes.clear();
 
  const manquantes = colonnesAbsentes(tabVarietes, COLONNES_VARIETES);
  if (manquantes.length) etat.message = TEXTES.colonnesManquantes(manquantes.join(', '));
 
  for (const v of tableEnLignes(tabVarietes)) {
    recordsParId.varietes.set(v.id, {
      id: v.id,
      nom: v.Nom || '',
      variete: v.Variete || '',
      type: v.Type || '',
      dureeGerm: v.Duree_germ || null,
      aReproduire: !!v.A_reproduire,
      sousAbris: listeChoix(v.Semis_sous_abris),       // mois de semis (valeurs Grist : 'Jan', 'Fév'…)
      pleineTerre: listeChoix(v.Semis_pleine_terre),
      anneesSansTest: typeof v.Annees_sans_test === 'number' ? v.Annees_sans_test : null,   // null = jamais testé
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
      anneePlantation: m.Annee_plantation || null,
      epuise: !!m.Epuise,         // formule Grist : sachet sans graines ni sachets
      germination: typeof m.Germination_affichee === 'number' ? m.Germination_affichee : null,
      avecGraines: m.Qtte_graines > 0 || m.Nb_sachets > 0
    });
  }
}
 
// ===== Sélecteur de variété =====
const MAX_RESULTATS = 40;
 
function afficherResultats() {
  const saisie = normaliser(etat.rechercheVariete);
  if (!saisie) { etat.listeVarieteOuverte = false; return; }
 
  const trouves = [...recordsParId.varietes.values()]
    .filter(v => correspondRecherche(v.recherche, saisie))
    .sort((a, b) => libelle(a).localeCompare(libelle(b), 'fr'));
 
  etat.resultatsVariete = trouves.slice(0, MAX_RESULTATS)
    .map(v => ({ id: v.id, libelle: libelle(v) }));
  etat.autresVarietes = Math.max(0, trouves.length - MAX_RESULTATS);
  etat.listeVarieteOuverte = true;
}
 
function surRechercheVariete(e) {
  etat.rechercheVariete = e.target.value;
  etat.varieteId = null;
  remplirMillesimes(null);
  afficherDerniersSemis();
  afficherResultats();
}
 
function surFocusVariete(e) {
  e.target.select();
  // Rouvre la liste seulement si une recherche est en cours (pas après un choix)
  if (etat.rechercheVariete && etat.varieteId === null) afficherResultats();
}
 
function choisirVariete(id) {
  const v = recordsParId.varietes.get(id);
  if (!v) return;
  etat.varieteId = id;
  etat.rechercheVariete = libelle(v);
  etat.listeVarieteOuverte = false;
  etat.aReproduire = v.aReproduire;   // la case montre l'état actuel de la variété
  remplirMillesimes(id);
  afficherDerniersSemis();
}
 
function reinitialiserVariete() {
  etat.varieteId = null;
  etat.rechercheVariete = '';
  etat.listeVarieteOuverte = false;
  afficherDerniersSemis();
}
 
// ===== Sélecteur de millésime =====
function millesimesDeVariete(varieteId) {
  // Retenus : « or. » ou datés, ni épuisés, ni plantes mères. Ordre : datés (récent d'abord), puis « or. » en dernier.
  const retenus = [...recordsParId.millesimes.values()]
    .filter(m => m.varieteId === varieteId && (m.estOriginal || m.annee !== null)
      && !m.epuise && !m.planteMere);
  return retenus.sort((a, b) => {
    if (a.estOriginal !== b.estOriginal) return a.estOriginal ? 1 : -1;
    return (b.annee || 0) - (a.annee || 0);
  });
}
 
function remplirMillesimes(varieteId) {
  etat.millesimeId = null;
  etat.listeMillesimeOuverte = false;
 
  const liste = varieteId ? millesimesDeVariete(varieteId) : [];
  etat.millesimes = liste.map(m => ({
    id: m.id,
    original: m.estOriginal,
    annee: m.annee,
    origine: m.origine,
    saisons: m.estOriginal ? null : (Number(m.saisonsManuel) || null)
  }));
  if (liste.length) etat.millesimeId = liste[0].id;   // le plus récent (ou « or. » s'il est seul)
}
 
function choisirMillesime(id) {
  etat.millesimeId = id;
  etat.listeMillesimeOuverte = false;
}
 
function basculerListeMillesime() {
  etat.listeMillesimeOuverte = !etat.listeMillesimeOuverte && etat.millesimes.length > 0;
}
 
// Un toucher en dehors d'un menu le ferme
document.addEventListener('click', e => {
  if (!e.target.closest('#menuMillesime')) etat.listeMillesimeOuverte = false;
  if (!e.target.closest('#menuTriASemer')) etat.aSemer.listeTriOuverte = false;
  if (!e.target.closest('#menuMoisASemer')) etat.aSemer.listeMoisOuverte = false;  
});
 
function rafraichirFiche() {
  // Après un rechargement des données : remet à jour les millésimes et l'encart de la variété en cours,
  // en gardant le millésime choisi s'il est toujours proposé
  if (!etat.varieteId) return;
  const choisi = etat.millesimeId;
  remplirMillesimes(etat.varieteId);
  if (etat.millesimes.some(m => m.id === choisi)) etat.millesimeId = choisi;
  afficherDerniersSemis();
}
 
function millesimeChoisi() {
  return etat.millesimes.find(m => m.id === etat.millesimeId) || null;
}
 
function libelleMillesime(m) {
  // « 2024 · Kokopelli · 2 saisons » : bouton, liste et carte (un seul endroit à modifier)
  const morceaux = [m.original ? 'or. (originale)' : m.annee];
  if (m.origine.length) morceaux.push(m.origine.join(', '));
  if (m.saisons) morceaux.push(`${m.saisons} ${pluriel(m.saisons, 'saison')}`);
  return morceaux.join(' · ');
}
// ===== Reste de la fiche =====
async function chargerChoix() {
  try {
    const choix = await lireChoixColonnes('Semis', ['Ou']);
    if (choix.Ou) LIEUX = choix.Ou;
    else etat.message = TEXTES.choixIntrouvables('Où');
  } catch (err) {
    console.error('Lecture des choix impossible :', err);
    etat.message = TEXTES.choixNonCharges(err.message);
  }
}
 
// --- Où (multi-sélection) ---
function lieuxProposes() {
  return lieuxFiltres(LIEUX, etat.ouChoisis, etat.rechercheOu);
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
  etat.erreurFiche = '';
}
 
function choisirMode(mode) {
  if (mode !== etat.modeSemis) appliquerMode(mode);
}
 
function lireFiche() {
  const pleineTerre = etat.modeSemis === 'pleine_terre';
  const m = millesimeChoisi();
  const v = recordsParId.varietes.get(etat.varieteId);
  return {
    mode: etat.modeSemis,
    varieteId: etat.varieteId,
    millesimeId: etat.millesimeId,
    millesime: m ? { ...m } : null,   // copie, pour l'affichage de la carte
    variete: v ? { nom: v.nom, variete: v.variete, type: v.type } : null,   // copie, pour l'affichage de la carte
    date: etat.date,
    godets: pleineTerre ? 1 : entierOuNull(etat.nbGodets),
    graines: entierOuNull(etat.nbGraines),
    ou: pleineTerre ? [...etat.ouChoisis] : [],
    sachetVide: etat.sachetVide,
    // Varietes.A_reproduire à écrire : true ou false si la case a changé, null si rien à écrire
    reproduire: v && etat.aReproduire !== v.aReproduire ? etat.aReproduire : null
  };
}
 
function validerFiche(f) {
  if (!f.varieteId) return TEXTES.varieteManquante;
  if (!f.millesimeId) return TEXTES.millesimeManquant;
  if (!f.date) return TEXTES.dateManquante;
  if (!(f.godets > 0)) return TEXTES.godetsManquants;
  if (!(f.graines > 0)) return TEXTES.grainesManquantes;
  if (f.mode === 'pleine_terre' && f.ou.length === 0) return TEXTES.lieuManquant;
  return '';
}
 
// ===== Liste « À enregistrer » =====
function ajouterALaListe() {
  const f = lireFiche();
  etat.erreurFiche = validerFiche(f);
  if (etat.erreurFiche) return;
 
  f.id = prochainIdCarte++;
  etat.aEnregistrer.push(f);
 
  // Réinitialisation partielle : on garde date, godets, graines, mode
  reinitialiserVariete();
  remplirMillesimes(null);
  etat.ouChoisis = [];
  etat.rechercheOu = '';
  etat.sachetVide = false;
  etat.aReproduire = false;
  Vue.nextTick(() => document.getElementById('rechercheVariete').focus());
}
 
function retirerDeLaListe(id) {
  etat.aEnregistrer = etat.aEnregistrer.filter(b => b.id !== id);
}
 
// ===== Enregistrement dans Semis =====
const afficherSucces = creerMessageTemporaire(texte => { etat.succes = texte; });
 
// Un clic efface les messages d'erreur. L'écouteur est en phase de capture : un clic sur « Ajouter »
// ou « Enregistrer » efface l'ancienne erreur AVANT que le bouton revalide, donc elle réapparaît s'il reste un problème.
effacerAuClic(() => { etat.erreur = ''; etat.erreurFiche = ''; });
 
async function enregistrerTout() {
  if (etat.aEnregistrer.length === 0 || etat.enregistrement) return;
  etat.enregistrement = true;
  afficherSucces('');
  etat.erreur = '';
 
  const liste = etat.aEnregistrer;
  const n = liste.length;
  const colonnes = {
    NomVariete: liste.map(b => b.varieteId),
    Millesime: liste.map(b => b.millesimeId),
    Date_s: liste.map(b => dateEnSecondes(b.date)),
    Date_p: liste.map(b => b.mode === 'pleine_terre' ? dateEnSecondes(b.date) : null), // pleine terre : planté le jour du semis
    Nb_godets: liste.map(b => b.godets),
    Nb_graines: liste.map(b => b.graines),
    Ou: liste.map(b => b.ou.length ? enListeChoix(b.ou) : null),
    Germes: liste.map(() => null)
  };
 
  try {
    const actions = [['BulkAddRecord', 'Semis', new Array(n).fill(null), colonnes]];
    const millesimesVides = [...new Set(liste.filter(b => b.sachetVide).map(b => b.millesimeId))];
    for (const id of millesimesVides) {
      actions.push(['UpdateRecord', 'Millesimes', id, { Qtte_graines: null, Nb_sachets: null }]);
    }
    // « À reproduire » changé : une écriture par variété (si deux cartes diffèrent, la dernière gagne)
    const reproductions = new Map();
    for (const b of liste) if (b.reproduire !== null) reproductions.set(b.varieteId, b.reproduire);
    for (const [id, valeur] of reproductions) {
      actions.push(['UpdateRecord', 'Varietes', id, { A_reproduire: valeur }]);
    }
    await grist.docApi.applyUserActions(actions);
    etat.aEnregistrer = [];
    afficherSucces(TEXTES.succes(n));
    try {
      await chargerDonnees();
      await chargerSemis();
      rafraichirFiche();
      afficherASemer();
    } catch (e) { console.error('Rechargement des données impossible :', e); }
  } catch (err) {
    console.error(err);
    etat.erreur = TEXTES.echecEnregistrement(err.message);
  } finally {
    etat.enregistrement = false;
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
function meresDe(varieteId) {
  // Millésimes « plante mère » de la variété (plants au jardin)
  return [...recordsParId.millesimes.values()].filter(m => m.varieteId === varieteId && m.planteMere);
} 
function afficherDerniersSemis() {
  if (!etat.varieteId) { etat.encart = null; return; }
  const v = recordsParId.varietes.get(etat.varieteId);
  if (!v) { etat.encart = null; return; }
 
  const dateFiche = etat.date;
  const annee = dateFiche ? Number(dateFiche.slice(0, 4)) : new Date().getFullYear();
 
  const semis = [...recordsParId.semis.values()]
    .filter(s => s.varieteId === etat.varieteId && s.annee === annee && s.date !== null)
    .sort((a, b) => b.date - a.date);
 
  const meres = meresDe(etat.varieteId);
 
  etat.encart = {
    type: v.type,                       // valeur Grist, ex. « 🌿 Arom.Méd »
    dureeGerm: v.dureeGerm,             // nombre de jours ou null
    annee,                              // année de la date saisie
    nbSemis: semis.length,
    mere: meres.length > 0,
    anneesPlantation: meres.map(m => m.anneePlantation).filter(a => a).sort(),
    lignes: semis.slice(0, 5).map(s => {
      const m = recordsParId.millesimes.get(s.millesimeId);
      return {
        id: s.id,
        date: s.date,
        original: m ? m.estOriginal : false,
        anneeMil: m ? m.annee : null,
        godets: s.godets,
        graines: s.graines,
        ou: s.ou
      };
    }),
    autres: Math.max(0, semis.length - 5),
    dejaDansListe: etat.aEnregistrer.some(b => b.varieteId === etat.varieteId)
  };
}
function basculerTriASemer() {
  etat.aSemer.listeTriOuverte = !etat.aSemer.listeTriOuverte;
}

function choisirTriASemer(tri) {
  etat.aSemer.tri = tri;               // le watch sur les filtres recalcule la liste
  etat.aSemer.listeTriOuverte = false;
}

function basculerMoisASemer() {
  etat.aSemer.listeMoisOuverte = !etat.aSemer.listeMoisOuverte;
}

function choisirMoisASemer(num) {
  etat.aSemer.mois = num;              // le watch sur les filtres recalcule la liste
  etat.aSemer.listeMoisOuverte = false;
}
// ===== Section « À semer » =====
// Variétés à semer au mois choisi, pas encore semées dans leur période de semis.
// « Semer » remplit la fiche avec la variété.

function moisDansListe(liste, mois) {
  return liste.some(v => numeroMois(v) === mois);
}

function fenetreDeSemis(liste, mois, annee) {
  // Fenêtre continue de mois (sous abri + pleine terre) qui contient « mois », éventuellement à cheval sur deux années
  const ensemble = new Set();
  for (const choix of liste) {
    const n = numeroMois(choix);
    if (n) ensemble.add(n);
  }
  const prec = m => (m === 1 ? 12 : m - 1);
  const suiv = m => (m === 12 ? 1 : m + 1);
  let d = mois, e = mois;
  if (ensemble.size < 12) {
    while (ensemble.has(prec(d))) d = prec(d);
    while (ensemble.has(suiv(e))) e = suiv(e);
  } else { d = 1; e = 12; }

  const anneeDebut = d > mois ? annee - 1 : annee;
  const anneeFin = e >= d ? anneeDebut : anneeDebut + 1;
  const anneeApres = e === 12 ? anneeFin + 1 : anneeFin;   // année du mois qui suit la fin
  const deuxChiffres = n => String(n).padStart(2, '0');
  return {
    debutMois: d,
    finMois: e,
    debut: dateEnSecondes(`${anneeDebut}-${deuxChiffres(d)}-01`),              // 1er jour du mois de début
    fin: dateEnSecondes(`${anneeApres}-${deuxChiffres(suiv(e))}-01`)           // 1er jour du mois suivant la fin (exclu)
  };
}

function millesimeAUtiliser(varieteId) {
  // Millésimes non épuisés de la variété (une plante mère seulement si elle a des graines)
  const candidats = [...recordsParId.millesimes.values()]
    .filter(m => m.varieteId === varieteId && !m.epuise && (!m.planteMere || m.avecGraines));
  if (candidats.length === 0) return null;

  // 1) le plus récent (parmi ceux qui ont une date)
  const dates = candidats.filter(m => m.annee !== null).sort((a, b) => b.annee - a.annee);
  if (dates.length) return dates[0];

  // 2) sinon celui qui a un taux de germination affiché (le plus élevé)
  const avecTaux = candidats.filter(m => m.germination !== null).sort((a, b) => b.germination - a.germination);
  return avecTaux.length ? avecTaux[0] : null;
}

function comparerSelonTri(a, b) {
  const parNom = libelle(a.v).localeCompare(libelle(b.v), 'fr');
  if (etat.aSemer.tri === 'germination') {
    const ga = a.germination ?? -1;
    const gb = b.germination ?? -1;
    return (gb - ga) || parNom;
  }
  if (etat.aSemer.tri === 'test') {
    const ta = a.v.anneesSansTest ?? 999;   // « Jamais testé » en tête
    const tb = b.v.anneesSansTest ?? 999;
    return (tb - ta) || parNom;
  }
  return parNom;
}

function varietesASemer() {
  const mois = etat.aSemer.mois;
  const annee = new Date().getFullYear();

  // Dates de semis par variété
  const datesParVariete = new Map();
  for (const s of recordsParId.semis.values()) {
    if (s.date === null) continue;
    if (!datesParVariete.has(s.varieteId)) datesParVariete.set(s.varieteId, []);
    datesParVariete.get(s.varieteId).push(s.date);
  }

  const resultat = [];
  for (const v of recordsParId.varietes.values()) {
    const sousAbris = moisDansListe(v.sousAbris, mois);
    const pleineTerre = moisDansListe(v.pleineTerre, mois);
    if (!sousAbris && !pleineTerre) continue;     // pas dans la fenêtre de semis

    const fenetre = fenetreDeSemis([...v.sousAbris, ...v.pleineTerre], mois, annee);
    const dates = datesParVariete.get(v.id) || [];
    const semisFait = dates.some(d => d >= fenetre.debut && d < fenetre.fin);
        const plant = meresDe(v.id).length > 0;       // plante mère au jardin
    const dejaSemee = semisFait || plant;
    if (dejaSemee && !etat.aSemer.afficherDejaSemees) continue;

    const mil = millesimeAUtiliser(v.id);
    if (!mil && !plant) continue;                 // ni graines, ni plant

    // Valeurs pour l'affichage (le HTML écrit les phrases)
    const g = mil ? mil.germination : null;
    const germination = g === null ? null : Math.round(g <= 1 ? g * 100 : g);   // en %

    resultat.push({
      v, mil, sousAbris, pleineTerre, dejaSemee, semisFait, plant,
      fenetre, germination
    });
  }
  return resultat.sort(comparerSelonTri);
}

function afficherASemer() {
  const a = etat.aSemer;
  const toutes = varietesASemer();
  const lignes = toutes.filter(l =>
    (!a.filtreSousAbri || l.sousAbris) && (!a.filtrePleineTerre || l.pleineTerre));
  a.nbTotal = toutes.filter(l => !l.dejaSemee).length;
  a.nbRetenues = lignes.filter(l => !l.dejaSemee).length;
  a.filtreActif = a.filtreSousAbri || a.filtrePleineTerre;
  a.lignes = lignes;
}

function categorie(l) {
  // Code du liseré : 'sousabri', 'pleineterre' ou 'sousabri-pleineterre' (le HTML en fait la classe carte--…)
  return l.sousAbris && l.pleineTerre ? 'sousabri-pleineterre' : l.sousAbris ? 'sousabri' : 'pleineterre';
}

function dansLaListe(varieteId) {
  return etat.aEnregistrer.some(b => b.varieteId === varieteId);
}

function semer(l) {
  // Remplit la fiche avec la variété ; le mode suit la carte s'il n'y en a qu'un possible
  if (l.sousAbris && !l.pleineTerre) choisirMode('godets');
  if (l.pleineTerre && !l.sousAbris) choisirMode('pleine_terre');
  choisirVariete(l.v.id);
  aller('appFiche');
} 
 
Vue.createApp({ setup() { return { etat, nombreAEnregistrer, aller }; } }).mount('#appEntete');
Vue.createApp({ setup() { return {
  etat, libelle, retirerDeLaListe, enregistrerTout,
  pluriel, dateAffichee, dateEnSecondes, libelleMillesime
}; } }).mount('#appEnCours');
Vue.createApp({ setup() { return {
  etat, choisirMode, pluriel, dateAffichee,
  surRechercheVariete, surFocusVariete, choisirVariete,
  basculerListeMillesime, choisirMillesime, millesimeChoisi,
  lieuxProposes, surRechercheOu, ajouterLieu, retirerLieu,
  ajouterALaListe, libelleMillesime,
}; } }).mount('#appFiche');
Vue.createApp({ setup() { return {
  etat, LISTE_MOIS, libelle, pluriel, categorie, dansLaListe, semer, basculerTriASemer, choisirTriASemer, basculerMoisASemer, choisirMoisASemer
}; } }).mount('#appASemer');

// Quand la date change, l'encart « déjà semé » se recalcule
Vue.watch(() => etat.date, afficherDerniersSemis);
// Quand un filtre de « À semer » change, la liste se recalcule
Vue.watch(() => [etat.aSemer.mois, etat.aSemer.afficherDejaSemees, etat.aSemer.tri,
  etat.aSemer.filtreSousAbri, etat.aSemer.filtrePleineTerre], afficherASemer);

// ===== Initialisation =====
grist.ready({
  requiredAccess: 'full'
});
 
chargerDonnees()
  .then(chargerSemis)
  .then(chargerChoix)
  .then(() => {
    etat.charge = true;
    afficherASemer();
  })
  .catch(err => {
    console.error(err);
    etat.message = TEXTES.erreurChargement(err.message);
  });
 