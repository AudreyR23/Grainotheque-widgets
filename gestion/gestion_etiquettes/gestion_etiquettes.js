// ===== État global =====
const recordsParId = {
  semis: new Map()
};


// État lu par le HTML : Vue redessine quand il change
const etat = Vue.reactive({
  recherche: '',          // texte tapé dans le champ de recherche
  filtreMeres: false,
  filtreEtiquettes: false,
  entrees: [],            // cartes affichées (après recherche et filtres)
  totalEntrees: 0,        // nombre de cartes sans recherche ni filtres
  saisies: {},            // idSemis → nombre d'étiquettes à ajouter (pas encore enregistré)
  brut: {},               // idSemis → texte tapé dans le champ « Nb »
  charge: false,          // true quand les données sont chargées
  erreur: '',
  succes: '',
  message: '',
  enregistrement: false
});
// ===== Messages (erreurs et succès) =====
const TEXTES = {
  erreurChargement: (msg) => `Erreur de chargement : ${msg}`,
  echec: (msg) => `Échec de l'enregistrement : ${msg} — tes saisies sont conservées.`,
  rechargementEchoue: (msg) => `Enregistré, mais le rechargement a échoué : ${msg} — recharge le widget.`,
  succes: (n) => `✓ ${n} ${pluriel(n, 'ligne mise', 'lignes mises')} à jour.`
};

// ===== Chargement =====
async function chargerSemis() {
  const tab = await grist.docApi.fetchTable('Semis');
  recordsParId.semis.clear();
  for (const s of tableEnLignes(tab)) {
    recordsParId.semis.set(s.id, {
      id: s.id,
      nom: s.Nom || '',
      variete: s.Variete || '',
      anneeGraine: s.Annee_graine || null,
      plantes: s.Plantes || 0,
      datePlantation: typeof s.Date_p === 'number' ? s.Date_p : null,
      ou: listeChoix(s.Ou),
      nbEtiquettes: s.Nb_etiquettes || 0,
      enAttente: s.Etiq_en_attente || 0,
      planteMere: !!s.Plante_mere,
      anneePlantation: s.Annee_plantation_mil || null,
      type: s.Type || '',
      godets: s.Nb_godets || 0,
      graines: s.Nb_graines || 0,
      millesimeId: s.Millesime || 0
    });
  }
}

// ===== Sélection =====
function entreesEtiquetables() {
  // Plantes mères : seulement leur ligne « mère » (année de plantation facultative).
  // Autres : lignes avec des plants plantés.
  return [...recordsParId.semis.values()].filter(s =>
    s.planteMere ? estLigneMere(s) : s.plantes > 0);
}

function filtrerParRecherche(semis) {
  const saisie = normaliser(etat.recherche);
  if (!saisie) return semis;
  return semis.filter(s => correspondRecherche(normaliser(s.nom + ' ' + s.variete), saisie));
}

function afficherSelection() {
  const tous = entreesEtiquetables().sort((a, b) =>
    libelle(a).localeCompare(libelle(b), 'fr') || a.id - b.id);
  let semis = filtrerParRecherche(tous);
  if (etat.filtreMeres) semis = semis.filter(s => s.planteMere);
  if (etat.filtreEtiquettes) semis = semis.filter(s => s.nbEtiquettes > 0 || s.enAttente > 0);
  etat.totalEntrees = tous.length;
  etat.entrees = semis;
}

// ===== Saisies (écran uniquement : rien n'est écrit dans Grist avant « Enregistrer ») =====
function nombreSaisies() {
  return Object.keys(etat.saisies).length;
}

function recapAjouts() {
  // [{ id, nb, s }] : une entrée par saisie, triées par nom (lignes inconnues à la fin)
  return Object.entries(etat.saisies)
    .map(([id, nb]) => ({ id: Number(id), nb, s: recordsParId.semis.get(Number(id)) }))
    .sort((a, b) => {
      if (!a.s || !b.s) return (a.s ? 0 : 1) - (b.s ? 0 : 1);
      return libelle(a.s).localeCompare(libelle(b.s), 'fr') || a.id - b.id;
    });
}

function valeurNb(idSemis) {
  // Ce qui est affiché dans le champ : le texte tapé, sinon la saisie validée
  const brut = etat.brut[idSemis];
  if (brut !== undefined) return brut;
  return etat.saisies[idSemis] ?? '';
}

function surNb(idSemis, e) {
  etat.brut[idSemis] = e.target.value;
  const valeur = entierOuNull(e.target.value);
  if (valeur > 0) etat.saisies[idSemis] = valeur;
  else delete etat.saisies[idSemis];
}

function saisieInvalide(idSemis) {
  // Texte tapé qui n'est pas un entier supérieur à 0 (champ vide : pas d'erreur)
  const brut = etat.brut[idSemis];
  if (brut === undefined || brut.trim() === '') return false;
  return !(entierOuNull(brut) > 0);
}

function retirerSaisie(idSemis) {
  delete etat.saisies[idSemis];
  delete etat.brut[idSemis];
}

// ===== Défilement =====
async function allerCarte(idSemis) {
  const id = 'carte-' + idSemis;
  if (!document.getElementById(id)) {
    // carte masquée par la recherche ou un filtre : on les enlève
    etat.recherche = '';
    etat.filtreMeres = false;
    etat.filtreEtiquettes = false;
    afficherSelection();   // recalcule tout de suite, sans attendre le watch
    await Vue.nextTick();
  }
  aller(id);
}

// ===== Enregistrement =====
const afficherSucces = creerMessageTemporaire(texte => { etat.succes = texte; });

async function enregistrerTout() {
  const saisies = Object.entries(etat.saisies)
    .map(([id, nb]) => ({ idSemis: Number(id), nb }));
  if (saisies.length === 0 || etat.enregistrement) return;
  etat.enregistrement = true;
  afficherSucces('');
  etat.erreur = '';

  const n = saisies.length;
  try {
    // Nb_etiquettes + saisie, calculé sur les valeurs chargées ; seule Nb_etiquettes est écrite
    const ids = saisies.map(b => b.idSemis);
    const valeurs = saisies.map(b => recordsParId.semis.get(b.idSemis).nbEtiquettes + b.nb);
    await grist.docApi.applyUserActions([
      ['BulkUpdateRecord', 'Semis', ids, { Nb_etiquettes: valeurs }]
    ]);
    etat.saisies = {};
    etat.brut = {};
    afficherSucces(TEXTES.succes(n));
  } catch (err) {
    console.error(err);
    etat.erreur = TEXTES.echec(err.message);
    etat.enregistrement = false;
    return;
  }

  // Rechargement séparé : s'il échoue, l'enregistrement, lui, a bien eu lieu
  try {
    await chargerSemis();
    afficherSelection();
  } catch (err) {
    console.error(err);
    etat.erreur = TEXTES.rechargementEchoue(err.message);
  } finally {
    etat.enregistrement = false;
  }
}

// Une erreur reste affichée jusqu'au prochain clic
effacerAuClic(() => { etat.erreur = ''; });

// ===== Surveillances =====
// Quand la recherche ou un filtre change, la liste se recalcule
Vue.watch(
  () => [etat.recherche, etat.filtreMeres, etat.filtreEtiquettes],
  afficherSelection
);

// ===== Zones Vue =====
Vue.createApp({
  setup() {
    return { etat };
  }
}).mount('#appRecherche');

Vue.createApp({
  setup() {
    return {
      etat, libelle, recapAjouts, retirerSaisie, enregistrerTout, allerCarte, pluriel,
    };
  }
}).mount('#appAjouts');

Vue.createApp({
  setup() {
    return {
      etat, libelle, dateAffichee, valeurNb, surNb, saisieInvalide, pluriel,
    };
  }
}).mount('#appSelection');

Vue.createApp({
  setup() {
    return { etat, nombreSaisies, aller };
  }
}).mount('#appEntete');

// ===== Initialisation =====
grist.ready({ requiredAccess: 'full' });

chargerSemis()
  .then(() => {
    afficherSelection();
    etat.charge = true;
  })
  .catch(err => {
    console.error(err);
    etat.message = TEXTES.erreurChargement(err.message);
  });