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
  ligneInconnue: '(ligne inconnue)',
  erreurChargement: (msg) => `Erreur de chargement : ${msg}`,
  refusModifiees: (noms) => `Rien n'est enregistré. Modifié ou supprimé dans Grist depuis l'affichage : ${noms} — vérifie les valeurs affichées, puis enregistre à nouveau.`,
  echec: (msg) => `Échec de l'enregistrement : ${msg} — tes saisies sont conservées.`,
  rechargementEchoue: (msg) => `Enregistré, mais le rechargement a échoué : ${msg} — recharge le widget.`,
  succes: (n) => `✓ ${n} ${pluriel(n, 'ligne mise', 'lignes mises')} à jour.`
};

// --- Sauvegarde des saisies dans l'onglet (survit à un rechargement du widget) ---
const CLE_SAISIES = 'gestion_etiquettes_saisies';

function sauvegarderSaisies() {
  try {
    if (Object.keys(etat.saisies).length === 0) sessionStorage.removeItem(CLE_SAISIES);
    else sessionStorage.setItem(CLE_SAISIES, JSON.stringify(etat.saisies));
  } catch (err) {
    console.warn('Sauvegarde des saisies impossible :', err);
  }
}

function restaurerSaisies() {
  try {
    const brut = sessionStorage.getItem(CLE_SAISIES);
    if (!brut) return;
    for (const [id, nb] of Object.entries(JSON.parse(brut))) {
      if (Number.isInteger(nb) && nb > 0) etat.saisies[id] = nb;
    }
  } catch (err) {
    console.warn('Lecture des saisies sauvegardées impossible :', err);
  }
}

function purgerSaisiesOrphelines() {
  // Supprime les saisies dont la ligne Semis n'existe plus
  for (const id of Object.keys(etat.saisies)) {
    if (!recordsParId.semis.has(Number(id))) delete etat.saisies[id];
  }
}

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
  const texte = e.target.value.trim();
const valeur = entierOuNull(e.target.value); if (valeur > 0) etat.saisies[idSemis] = valeur; else delete etat.saisies[idSemis];
  const valide = texte !== '' && Number.isInteger(valeur) && valeur > 0;
  if (valide) etat.saisies[idSemis] = valeur;
  else delete etat.saisies[idSemis];
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

async function lignesModifiees(ids) {
  // Recharge Semis et renvoie [{ id, nom }] pour les lignes (parmi ids) modifiées ou supprimées depuis l'affichage
  const avant = new Map(ids.map(id => [id, recordsParId.semis.get(id)]));
  await chargerSemis();
  const modifiees = [];
  for (const id of ids) {
    const a = avant.get(id);
    const b = recordsParId.semis.get(id);
    const change = !a || !b ||
      a.nbEtiquettes !== b.nbEtiquettes ||
      a.enAttente !== b.enAttente;
    if (change) {
      modifiees.push({ id, nom: (a || b) ? libelle(a || b) : TEXTES.ligneInconnue });
    }
  }
  return modifiees;
}

async function enregistrerTout() {
  const saisies = Object.entries(etat.saisies)
    .map(([id, nb]) => ({ idSemis: Number(id), nb }));
  if (saisies.length === 0 || etat.enregistrement) return;
  etat.enregistrement = true;
  afficherSucces('');
  etat.erreur = '';

  const n = saisies.length;
  try {
    // 1. Vérification : une de ces lignes a-t-elle changé dans Grist depuis l'affichage ?
    const modifiees = await lignesModifiees(saisies.map(b => b.idSemis));
    if (modifiees.length) {
      // Une ligne supprimée n'a plus de carte : on retire sa saisie
      for (const m of modifiees) {
        if (!recordsParId.semis.has(m.id)) retirerSaisie(m.id);
      }
      afficherSelection();   // l'écran reprend les valeurs actuelles
      etat.erreur = TEXTES.refusModifiees(modifiees.map(m => m.nom).join(', '));
      etat.enregistrement = false;
      return;
    }

    // 2. Écrire uniquement Nb_etiquettes (les valeurs viennent de la relecture qui vient d'être faite)
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

window.addEventListener('beforeunload', e => {
  if (nombreSaisies() > 0) { e.preventDefault(); e.returnValue = ''; }
});

// Une erreur reste affichée jusqu'au prochain clic
effacerAuClic(() => { etat.erreur = ''; });

// ===== Surveillances =====
// Quand la recherche ou un filtre change, la liste se recalcule
Vue.watch(
  () => [etat.recherche, etat.filtreMeres, etat.filtreEtiquettes],
  afficherSelection
);

// Les saisies sont copiées dans l'onglet à chaque changement
Vue.watch(() => etat.saisies, sauvegarderSaisies, { deep: true });

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
      etat, libelle, dateAffichee, valeurNb, surNb, pluriel,
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
    restaurerSaisies();
    purgerSaisiesOrphelines();
    afficherSelection();
    etat.charge = true;
  })
  .catch(err => {
    console.error(err);
    etat.message = TEXTES.erreurChargement(err.message);
  });