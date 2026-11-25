// État lu par le HTML : Vue met la page à jour quand il change
const etat = Vue.reactive({
  recherche: "", // texte tapé dans le champ de recherche
  saisies: {}, // idSemis → { germes, attente, plantes, oups, don, ou } : ajouts pas encore enregistrés
  listeVerifier: [], // semis affichés dans « À vérifier » (après recherche)
  totalVerifier: 0, // nombre de semis à vérifier, sans la recherche
  inclureSansDuree: true, // afficher aussi les semis dont la variété n'a pas de durée de germination
  listePlanter: [], // semis affichés dans « À planter » (après recherche)
  totalPlanter: 0, // nombre de semis à planter, sans la recherche
  datePlantation: dateDuJour(), // 'AAAA-MM-JJ'
  charge: false, // true quand les données sont chargées
  enregistrement: false, // true pendant l'enregistrement
  succes: "", // message de succès
  erreurs: { verifier: "", planter: "", meres: "", general: "" },
  message: "", // erreur de chargement, ou emplacements non chargés
  brut: {}, // texte tapé dans les champs de nombre (germes, plantes, oups, don), clé « idSemis:cle »
  tri: "defaut", // 'defaut' ou 'nom'
  controleMeres: false, // afficher la section « plantes mères à contrôler »
  listeMeres: [], // plantes mères affichées (après recherche)
  totalMeres: 0, // plantes mères à contrôler, sans la recherche
  saisiesMeres: {}, // idMillesime → { statut, morts, ou, ajuste, plants } : contrôles pas encore enregistrés
  inclureControlees: false, // revoir aussi les plantes mères déjà contrôlées cette année
  ouOuvert: null, // 'semis-12' ou 'mere-12' : sélecteur « Où » ouvert
  rechercheOu: "",
  listeTriOuverte: false,
});

// ===== Textes des messages (erreurs, succès) =====
// Tous les messages construits par le JS sont ici, pour les relire et les comparer d'un outil à l'autre.
// Une entrée « (x) => … » est une petite fonction : on lui donne des noms ou un nombre, elle renvoie la phrase.
const TEXTES = {
  // Noms des sections, repris dans les messages
  sections: {
    verifier: "À vérifier",
    planter: "À planter",
    meres: "À contrôler",
  },

  // Refus avant enregistrement
  rienEnregistreVoir: (section) =>
    `Rien n'est enregistré : voir « ${section} ».`,
  dateManquante: "Renseigne la date de plantation.",
  nombreInvalide: (noms) => "Nombre entier attendu (sans virgule ni lettre) : " + noms,
  lieuManquant:
    "Choisis un emplacement (Où) pour les cartes marquées en rouge ci-dessus.",
  meresSansEmplacement: (noms) =>
    "Choisis l'emplacement des plantes mères : " + noms,
  meresLieuxMortsNonCoches: (noms) =>
    "Coche les lieux où la plante est morte : " + noms,
  meresPlantsInvalides: (noms) =>
    "Nombre de plants invalide (1 au minimum, sinon marque « Morte ») : " +
    noms,

  // Résultat de l'enregistrement
  succes: (n) => `✓ ${n} ${pluriel(n, "ligne mise", "lignes mises")} à jour.`,
  echecEnregistrement: (detail) =>
    "Échec de l'enregistrement : " + detail + " — tes saisies sont conservées.",
  echecRechargement: (detail) =>
    "Enregistré, mais le rechargement a échoué : " +
    detail +
    " — recharge le widget.",

  // Chargement
  erreurChargement: (detail) => "Erreur de chargement : " + detail,
  emplacementsNonCharges: (detail) =>
    "Emplacements (Où) non chargés : " + detail,
};

// ===== État global =====
let LIEUX = []; // lus depuis Grist (choix de la colonne Ou)
const recordsParId = {
  semis: new Map(),
  millesimes: new Map(),
};

// ===== Saisies en attente =====

function saisieVide() {
  return { germes: null, attente: false, plantes: 0, oups: 0, don: 0, ou: [] };
}

function saisieDe(idSemis) {
  // Saisie en attente de ce semis (ou une saisie vide, sans rien créer)
  return etat.saisies[idSemis] || saisieVide();
}

function majSaisie(idSemis, champs) {
  // Modifie quelques champs ; si la saisie devient vide, on la supprime
  const s = { ...saisieDe(idSemis), ...champs };
  if (s.germes === null) s.attente = false; // « en attente » n'a de sens qu'avec un nombre
  const vide =
    s.germes === null &&
    s.plantes === 0 &&
    s.oups === 0 &&
    s.don === 0 &&
    s.ou.length === 0;
  if (vide) delete etat.saisies[idSemis];
  else etat.saisies[idSemis] = s;
}

function aPlantation(saisie) {
  return saisie.plantes > 0 || saisie.oups > 0 || saisie.don > 0;
}

function saisiesGermes() {
  // [{ idSemis, germes, attente }] : germes à enregistrer (NG = 0 compris)
  return Object.entries(etat.saisies)
    .filter(([, s]) => s.germes !== null)
    .map(([id, s]) => ({
      idSemis: Number(id),
      germes: s.germes,
      attente: !!s.attente,
    }));
}

function saisiesPlantation() {
  // [{ idSemis, plantes, oups, don, ou }] : plantations à enregistrer
  // Un emplacement choisi sans quantité ne compte pas.
  return Object.entries(etat.saisies)
    .filter(([, s]) => aPlantation(s))
    .map(([id, s]) => ({
      idSemis: Number(id),
      plantes: s.plantes,
      oups: s.oups,
      don: s.don,
      ou: s.ou,
    }));
}

// ===== Récapitulatif « En cours » =====
function recapGermes() {
  return saisiesGermes()
    .map((g) => ({ g, s: recordsParId.semis.get(g.idSemis) }))
    .filter((x) => x.s)
    .map(({ g, s }) => ({
      id: g.idSemis,
      nom: libelle(s),
      type: s.type,
      germes: g.germes,
      attente: g.attente,
      finAttente: s.attente && !g.attente, // en attente dans Grist, décochée maintenant
      avant: s.germes || 0,
      total: totalGermes(s),
      trop: tropDeGermes(s),
      semees: s.semees,
    }));
}

function recapPlantation() {
  return saisiesPlantation()
    .map((p) => ({ p, s: recordsParId.semis.get(p.idSemis) }))
    .filter((x) => x.s)
    .map(({ p, s }) => ({
      id: p.idSemis,
      nom: libelle(s),
      type: s.type,
      plantes: p.plantes,
      plantesAvant: s.plantes,
      plantesApres: s.plantes + p.plantes,
      oups: p.oups,
      oupsAvant: s.oups,
      oupsApres: s.oups + p.oups,
      don: p.don,
      donAvant: s.don,
      donApres: s.don + p.don,
      ou: p.ou, // lieux choisis maintenant
      ouActuels: s.ou, // lieux déjà dans Grist
      casOu: casOu(s),
      total: totalSaisi(p.idSemis),
      reste: s.reste,
    }));
}

function recapMeres() {
  const lieux = lieuxParMillesime();
  return Object.entries(etat.saisiesMeres)
    .map(([id, s]) => ({
      id: Number(id),
      s,
      m: recordsParId.millesimes.get(Number(id)),
    }))
    .filter((x) => x.m)
    .map(({ id, s, m }) => {
      const actuels = lieux.get(id) || [];
      const e = effetMere(s, actuels);
      let cas = "vivante";
      if (s.statut === "Vivante" && actuels.length === 0)
        cas =
          s.ou && s.ou.length ? "vivante-nouveau-lieu" : "vivante-sans-lieu";
      else if (s.statut === "Vivante" && s.ou && s.ou.length)
        cas = "vivante-ajout-lieu";
      else if (
        s.statut === "Morte" &&
        actuels.length > 1 &&
        e.morts.length === 0
      )
        cas = "morte-sans-coche";
      else if (!e.planteMere) cas = "morte";
      else if (e.morts.length) cas = "morte-partielle";
      // Nombre de plants après : seulement si on ajuste et que le nombre est valide
      const ajusteValide = avecNombrePlants(s, actuels) && plantsValide(s);
      return {
        id,
        nom: libelle(m),
        type: m.type,
        cas,
        lieuxChoisis: s.ou || [],
        lieuxActuels: actuels,
        lieuxMorts: e.morts,
        lieuxRestants: actuels.filter((l) => !e.morts.includes(l)),
        plantsAvant: m.plants,
        plantsApres: ajusteValide ? Number(s.plants) : null,
      };
    });
}

function retirerSaisie(idSemis) {
  delete etat.saisies[idSemis];
  for (const cle of Object.keys(etat.brut || {})) {
    if (cle.startsWith(idSemis + ":")) delete etat.brut[cle];
  }
}

// ===== Défilement =====
async function allerCarte(section, idSemis) {
  const id = section + "-" + idSemis; // 'verifier-12' ou 'planter-12'
  if (!document.getElementById(id)) {
    // carte masquée par la recherche
    etat.recherche = "";
    await Vue.nextTick();
  }
  aller(id);
}

async function allerMere(idMillesime) {
  const carte = () => document.getElementById("mere-" + idMillesime);
  if (!carte()) {
    etat.controleMeres = true; // ouvre la section
    etat.recherche = ""; // enlève un filtre qui masquerait la carte
    etat.inclureControlees = true; // montre aussi les plantes déjà contrôlées
    recalculerMeres(); // recalcule tout de suite, sans attendre le watch
    await Vue.nextTick();
  }
  aller("mere-" + idMillesime);
}
// ===== Erreurs d'enregistrement =====
function effacerErreurs() {
  etat.erreurs = { verifier: "", planter: "", meres: "", general: "" };
}
// Une erreur reste affichée jusqu'au prochain clic
effacerAuClic(effacerErreurs);

async function refuser(section, texte) {
  etat.erreurs[section] = texte;
  etat.erreurs.general = TEXTES.rienEnregistreVoir(TEXTES.sections[section]);
  if (section === "meres") etat.controleMeres = true; // la section doit être ouverte pour voir le message
  await Vue.nextTick();
  aller("erreur-" + section);
}

// ===== Chargement =====
async function chargerSemis() {
  const tab = await grist.docApi.fetchTable("Semis");
  recordsParId.semis.clear();
  for (const s of tableEnLignes(tab)) {
    recordsParId.semis.set(s.id, {
      id: s.id,
      nom: s.Nom || "",
      variete: s.Variete || "",
      date: typeof s.Date_s === "number" ? s.Date_s : null,
      godets: s.Nb_godets || 0,
      graines: s.Nb_graines || 0,
      semees: s.Graines_semees || (s.Nb_godets || 0) * (s.Nb_graines || 0),
      plantes: s.Plantes || 0,
      oups: s.Oups || 0,
      don: s.Don_p || 0,
      reste: typeof s.Reste_a_planter === "number" ? s.Reste_a_planter : 0,
      planteMere: !!s.Plante_mere,
      ou: listeChoix(s.Ou),
      millesimeId: s.Millesime || 0,
      datePlantation: typeof s.Date_p === "number" ? s.Date_p : null,
      germes: s.Germes, // null = pas encore noté
      duree: s.Germination_duree || null,
      info: s.Info_germination, // 'En attente' | nombre (jours de retard) | 'OK' | 'NG' | ''
      type: s.Type || "",
      attente: !!s.Germes_attente,
    });
  }
}
// ===== Plantes mères (table Millesimes) =====
async function chargerMillesimes() {
  const tab = await grist.docApi.fetchTable("Millesimes");
  recordsParId.millesimes.clear();
  for (const m of tableEnLignes(tab)) {
    recordsParId.millesimes.set(m.id, {
      id: m.id,
      nom: m.Nom || "",
      variete: m.Variete || "",
      planteMere: !!m.Plante_mere,
      plants: m.Nb_plants || 0,
      type: m.Type || "",
      varieteId: m.NomVariete || 0,
      anneePlantation: m.Annee_plantation || null,
      statut: m.Statut_mere || "", // '' | 'Vivante' | 'Morte'
      anneeControle: anneeDepuisDate(m.Controle_mere),
    });
  }
}

function meresAControler() {
  // Par défaut : plantées avant cette année et pas encore contrôlées cette année.
  // Avec la case « inclure » : toutes les plantes mères en place.
  const annee = new Date().getFullYear();
  return [...recordsParId.millesimes.values()]
    .filter(
      (m) =>
        m.planteMere &&
        (etat.inclureControlees ||
          (m.anneeControle !== annee &&
            (!m.anneePlantation || m.anneePlantation < annee))),
    )
    .sort((a, b) => libelle(a).localeCompare(libelle(b), "fr") || a.id - b.id);
}

function lignesSemisMere(idMillesime) {
  // Ligne(s) Semis de cette plante mère (en principe une seule)
  return [...recordsParId.semis.values()].filter(
    (s) => s.millesimeId === idMillesime && estLigneMere(s),
  );
}
function sansQuantite(s) {
  // Rien n'a été semé (ni godets ni graines) : il n'y a pas de germination à vérifier
  return s.millesimeId > 0 && s.godets === 0 && s.graines === 0;
}

function lieuxParMillesime() {
  // idMillesime → lieux actuels : « Ou » de la ou des lignes Semis de la plante mère
  const resultat = new Map();
  for (const s of recordsParId.semis.values()) {
    if (!estLigneMere(s)) continue;
    const lieux = resultat.get(s.millesimeId) || [];
    for (const l of s.ou) if (!lieux.includes(l)) lieux.push(l);
    resultat.set(s.millesimeId, lieux);
  }
  return resultat;
}
function nouvelleSaisieMere(statut) {
  return { statut, morts: [], ou: [], ajuste: false, plants: "" };
}

function statutMere(idMillesime) {
  const s = etat.saisiesMeres[idMillesime];
  return s ? s.statut : "";
}

function choisirStatutMere(m, statut) {
  // Un second clic sur le même bouton annule le choix.
  const s = etat.saisiesMeres[m.id];
  if (s && s.statut === statut) delete etat.saisiesMeres[m.id];
  else etat.saisiesMeres[m.id] = nouvelleSaisieMere(statut);
}

function lieuMort(idMillesime, lieu) {
  const s = etat.saisiesMeres[idMillesime];
  return !!s && s.morts.includes(lieu);
}

function basculerLieuMort(idMillesime, lieu) {
  const s = etat.saisiesMeres[idMillesime];
  if (!s) return;
  s.morts = s.morts.includes(lieu)
    ? s.morts.filter((l) => l !== lieu)
    : [...s.morts, lieu];
  // Champ « Nombre de plants » prérempli avec le nombre actuel (utile en cas de mort partielle)
  if (s.plants === "") {
    const m = recordsParId.millesimes.get(idMillesime);
    s.plants = m && m.plants ? String(m.plants) : "";
  }
}

function effetMere(saisie, actuels) {
  // Ce que l'enregistrement fera : { planteMere, statut, morts }
  if (saisie.statut !== "Morte")
    return { planteMere: true, statut: "Vivante", morts: [] };
  const morts = saisie.morts.filter((l) => actuels.includes(l));
  if (actuels.length <= 1)
    return { planteMere: false, statut: "Morte", morts: [...actuels] };
  if (morts.length === 0)
    return { planteMere: true, statut: "Vivante", morts: [] };
  if (morts.length >= actuels.length)
    return { planteMere: false, statut: "Morte", morts };
  return { planteMere: true, statut: "Vivante", morts };
}

function avecNombrePlants(saisie, actuels) {
  // Le champ « Nombre de plants » compte : « Ajuster », ou mort à une partie des lieux seulement
  if (saisie.statut === "Vivante") return !!saisie.ajuste;
  const e = effetMere(saisie, actuels);
  return e.planteMere && e.morts.length > 0;
}

function champPlantsMere(m) {
  // Afficher le champ « Nombre de plants » sur la carte ?
  const s = etat.saisiesMeres[m.id];
  return !!s && avecNombrePlants(s, m.ou);
}

function retirerMere(idMillesime) {
  delete etat.saisiesMeres[idMillesime];
}
function ajusteMere(idMillesime) {
  const s = etat.saisiesMeres[idMillesime];
  return !!s && s.statut === "Vivante" && s.ajuste;
}

function plantsMere(idMillesime) {
  const s = etat.saisiesMeres[idMillesime];
  return s ? s.plants : "";
}

function ajusterMere(m) {
  // 1er clic : « Encore là » + champ prérempli ; 2e clic : on ferme le champ
  let s = etat.saisiesMeres[m.id];
  if (!s) s = etat.saisiesMeres[m.id] = nouvelleSaisieMere("Vivante");
  if (s.statut !== "Vivante") return;
  s.ajuste = !s.ajuste;
  if (!s.ajuste && m.ou.length > 0) s.ou = []; // on ferme : les lieux ajoutés sont abandonnés
  if (s.ajuste && s.plants === "") s.plants = m.plants ? String(m.plants) : "";
}

function surPlantsMere(m, e) {
  const s = etat.saisiesMeres[m.id];
  if (s) s.plants = e.target.value;
}

function plantsValide(saisie) {
  const n = entierOuNull(saisie.plants);
  return n !== null && n >= 1;
}
// ===== Affichage =====
function trierListe(semis) {
  if (etat.tri !== "nom") return semis;
  return [...semis].sort((a, b) => libelle(a).localeCompare(libelle(b), "fr"));
}
function basculerTri() {
  etat.listeTriOuverte = !etat.listeTriOuverte;
}
function choisirTri(valeur) {
  etat.tri = valeur;
  etat.listeTriOuverte = false;
}
// Un toucher en dehors du menu le ferme
document.addEventListener("click", (e) => {
  if (!e.target.closest("#appRecherche .menu")) etat.listeTriOuverte = false;
});

function recalculerListe(cle, tous) {
  etat["total" + cle] = tous.length;
  etat["liste" + cle] = trierListe(filtrerParRecherche(tous));
}
function recalculerVerifier() {
  recalculerListe("Verifier", semisAVerifier());
}
function recalculerPlanter() {
  recalculerListe("Planter", semisAPlanter());
}
function recalculerMeres() {
  const lieux = lieuxParMillesime();
  recalculerListe(
    "Meres",
    meresAControler().map((m) => ({ ...m, ou: lieux.get(m.id) || [] })),
  );
}

function recalculerTout() {
  recalculerVerifier();
  recalculerPlanter();
  recalculerMeres();
}

// ===== À vérifier =====
// --- Champs de nombre : ce qui est tapé reste dans etat.brut pour pouvoir signaler une erreur ---
function saisieInvalide(idSemis, cle) {
  // Le champ contient du texte qui n'est pas un nombre entier (vide = pas d'erreur)
  const t = etat.brut[`${idSemis}:${cle}`];
  return t !== undefined && t.trim() !== "" && entierOuNull(t) === null;
}

function quantiteInvalide(idSemis) {
  return ["plantes", "oups", "don"].some((cle) => saisieInvalide(idSemis, cle));
}

function semisSaisieInvalide(cles) {
  // Semis dont un des champs « cles » contient autre chose qu'un entier
  const ids = new Set();
  for (const cle of Object.keys(etat.brut)) {
    const [id, champ] = cle.split(":");
    if (cles.includes(champ) && saisieInvalide(id, champ)) ids.add(Number(id));
  }
  return [...ids].map((id) => recordsParId.semis.get(id)).filter(Boolean);
}

function estNG(idSemis) {
  return saisieDe(idSemis).germes === 0;
}

function plantsMereInvalide(idMillesime) {
  const s = etat.saisiesMeres[idMillesime];
  return !!s && !plantsValide(s);
}

function aGermes(idSemis) {
  return saisieDe(idSemis).germes !== null;
}

function valeurGermes(idSemis) {
  const brut = etat.brut[`${idSemis}:germes`];
  if (brut !== undefined) return brut;
  const g = saisieDe(idSemis).germes;
  return g === null ? "" : g;
}

function attenteDansGrist(idSemis) {
  // La carte est-elle « en attente » dans Grist ?
  const s = recordsParId.semis.get(Number(idSemis));
  return !!(s && s.attente);
}

function champsGermes(idSemis, germes) {
  // Premier nombre saisi sur la carte : « En attente » reprend l'état de Grist
  const champs = { germes };
  if (germes !== null && saisieDe(idSemis).germes === null)
    champs.attente = attenteDansGrist(idSemis);
  return champs;
}

function surGermes(idSemis, e) {
  etat.brut[`${idSemis}:germes`] = e.target.value;
  majSaisie(idSemis, champsGermes(idSemis, entierOuNull(e.target.value)));
}

function basculerNG(idSemis) {
  // 1er clic : 0 germe ; 2e clic : on annule
  delete etat.brut[`${idSemis}:germes`];
  majSaisie(idSemis, champsGermes(idSemis, saisieDe(idSemis).germes === 0 ? null : 0));
}

function valeurAttente(idSemis) {
  // Avec une saisie : ce que tu as choisi ; sans saisie : l'état de Grist
  const saisie = saisieDe(idSemis);
  if (saisie.germes === null) return attenteDansGrist(idSemis);
  return !!saisie.attente;
}

function basculerAttente(idSemis) {
  const s = saisieDe(idSemis);
  if (s.germes === null) return;
  majSaisie(idSemis, { attente: !s.attente });
}

function totalGermes(s) {
  // germés déjà enregistrés + germés saisis (0 si rien n'est saisi)
  return (s.germes || 0) + (saisieDe(s.id).germes ?? 0);
}

function tropDeGermes(s) {
  return (
    saisieDe(s.id).germes !== null && s.semees > 0 && totalGermes(s) > s.semees
  );
}

function resteAGermer(s) {
  // Graines pas encore germées, d'après Grist seulement (la saisie en cours se voit dans « En cours »)
  if (
    !s.attente ||
    s.germes === null ||
    s.germes === undefined ||
    !(s.semees > 0)
  )
    return null;
  return Math.max(s.semees - s.germes, 0);
}
function totalSaisi(idSemis) {
  const p = saisieDe(idSemis);
  return p.plantes + p.oups + p.don;
}

const UN_AN = 365 * 24 * 3600; // en secondes

function semisAVerifier() {
  const maintenant = Date.now() / 1000;
  const base = [...recordsParId.semis.values()].filter(
    (s) => s.date !== null && !sansQuantite(s),
  );
  const sansGermes = base.filter(
    (s) => s.germes === null || s.germes === undefined,
  );
  const enRetard = sansGermes
    .filter((s) => typeof s.info === "number")
    .sort((a, b) => b.info - a.info);
  const enAttente = base
    .filter((s) => s.attente && s.germes !== null && s.germes !== undefined)
    .sort((a, b) => a.date - b.date);
  const sansDuree = etat.inclureSansDuree
    ? sansGermes
        .filter((s) => !s.duree && maintenant - s.date < UN_AN)
        .sort((a, b) => a.date - b.date)
    : [];
  return [...enRetard, ...enAttente, ...sansDuree];
}

// ===== Recherche =====
function rechercheNormalisee() {
  return normaliser(etat.recherche);
}

function filtrerParRecherche(semis) {
  const saisie = rechercheNormalisee();
  if (!saisie) return semis;
  return semis.filter((s) =>
    correspondRecherche(normaliser(s.nom + " " + s.variete), saisie),
  );
}

// ===== Nombre de saisies en attente =====
function nombreSaisies() {
  return (
    saisiesGermes().length +
    saisiesPlantation().length +
    Object.keys(etat.saisiesMeres).length
  );
}

// ===== À planter =====
function semisAPlanter() {
  return [...recordsParId.semis.values()]
    .filter((s) => s.germes > 0 && s.reste > 0 && !s.planteMere)
    .sort((a, b) => (a.date || 0) - (b.date || 0));
}
function aPlantationDe(idSemis) {
  return aPlantation(saisieDe(idSemis));
}

function valeurQuantite(idSemis, cle) {
  const brut = etat.brut[`${idSemis}:${cle}`];
  if (brut !== undefined) return brut;
  const v = saisieDe(idSemis)[cle];
  return v > 0 ? v : "";
}

function surQuantite(idSemis, cle, e) {
  etat.brut[`${idSemis}:${cle}`] = e.target.value;
  const v = entierOuNull(e.target.value);
  majSaisie(idSemis, { [cle]: v > 0 ? v : 0 });
}

function toutPlanter(s) {
  etat.brut[`${s.id}:plantes`] = String(s.reste);
  etat.brut[`${s.id}:oups`] = "";
  etat.brut[`${s.id}:don`] = "";
  majSaisie(s.id, { plantes: s.reste, oups: 0, don: 0 });
}
function toutPlanteDe(s) {
  // La saisie correspond à « Tout » : tous les restants plantés, ni oups ni don
  const p = saisieDe(s.id);
  return s.reste > 0 && p.plantes === s.reste && p.oups === 0 && p.don === 0;
}
// --- Où : un seul jeu de fonctions pour « À planter » (type 'semis') et les plantes mères (type 'mere') ---
function cleOu(type, id) {
  return type + "-" + id;
}

function lieuxChoisis(type, id) {
  if (type === "mere")
    return (etat.saisiesMeres[id] && etat.saisiesMeres[id].ou) || [];
  return saisieDe(id).ou;
}

function changerLieux(type, id, liste) {
  if (type === "mere") {
    if (etat.saisiesMeres[id]) etat.saisiesMeres[id].ou = liste;
  } else majSaisie(id, { ou: liste });
}

function ouvertOu(type, id) {
  return etat.ouOuvert === cleOu(type, id);
}

function lieuxProposes(type, id) {
  if (!ouvertOu(type, id)) return []; // on ne calcule que pour la liste ouverte
  return lieuxFiltres(LIEUX, lieuxChoisis(type, id), etat.rechercheOu);
}

function ouvrirOu(type, id) {
  if (!ouvertOu(type, id)) {
    etat.ouOuvert = cleOu(type, id);
    etat.rechercheOu = "";
  }
}

function fermerOu(type, id) {
  if (ouvertOu(type, id)) etat.ouOuvert = null;
}

function surRechercheOu(type, id, e) {
  etat.ouOuvert = cleOu(type, id);
  etat.rechercheOu = e.target.value;
}

function ajouterLieu(type, id, lieu) {
  changerLieux(type, id, [...lieuxChoisis(type, id), lieu]);
  etat.rechercheOu = "";
  etat.ouOuvert = null; // se referme après le choix
}

function retirerLieu(type, id, lieu) {
  changerLieux(
    type,
    id,
    lieuxChoisis(type, id).filter((l) => l !== lieu),
  );
}

function casOu(s) {
  // Rien à dire si rien n'est planté, ou si un nouvel emplacement est déjà choisi
  const p = saisieDe(s.id);
  if (p.plantes <= 0 || p.ou.length > 0) return "aucun";
  return s.ou.length ? "reste" : "manquant";
}
// --- Emplacement d'une plante mère « Encore là » (sans lieu connu, ou ajusté) ---
function besoinLieuMere(m) {
  // Champ « Où » : plante « Encore là » sans lieu connu, ou en cours d'ajustement
  return (
    statutMere(m.id) === "Vivante" && (m.ou.length === 0 || ajusteMere(m.id))
  );
}

// ===== Enregistrement =====
const afficherSucces = creerMessageTemporaire((texte) => {
  etat.succes = texte;
});

async function enregistrerTout() {
  const lignesGermes = saisiesGermes();
  const lignesPlantation = saisiesPlantation();
  const lignesMeres = Object.entries(etat.saisiesMeres)
    .map(([id, saisie]) => ({ id: Number(id), saisie }))
    .filter((l) => recordsParId.millesimes.has(l.id));
  if (
    (lignesGermes.length === 0 &&
      lignesPlantation.length === 0 &&
      lignesMeres.length === 0) ||
    etat.enregistrement
  )
    return;
  effacerErreurs();
  // Champs de nombre qui contiennent autre chose qu'un entier
  const germesInvalides = semisSaisieInvalide(["germes"]);
  if (germesInvalides.length) {
    refuser("verifier", TEXTES.nombreInvalide(germesInvalides.map((s) => libelle(s)).join(", ")));
    return;
  }
  const quantitesInvalides = semisSaisieInvalide(["plantes", "oups", "don"]);
  if (quantitesInvalides.length) {
    refuser("planter", TEXTES.nombreInvalide(quantitesInvalides.map((s) => libelle(s)).join(", ")));
    return;
  }
  const dateP = etat.datePlantation;
  if (lignesPlantation.some((p) => p.plantes > 0) && !dateP) {
    refuser("planter", TEXTES.dateManquante);
    return;
  }
  const sansOu = lignesPlantation.filter(
    (p) =>
      p.plantes > 0 &&
      p.ou.length === 0 &&
      recordsParId.semis.get(p.idSemis).ou.length === 0,
  );
  if (sansOu.length) {
    refuser("planter", TEXTES.lieuManquant);
    return;
  }
  const lieuxConnus = lieuxParMillesime();
  const meresSansEmplacement = lignesMeres.filter(
    (l) =>
      l.saisie.statut === "Vivante" &&
      (lieuxConnus.get(l.id) || []).length === 0 &&
      (l.saisie.ou || []).length === 0,
  );
  if (meresSansEmplacement.length) {
    const noms = meresSansEmplacement
      .map((l) => libelle(recordsParId.millesimes.get(l.id)))
      .join(", ");
    refuser("meres", TEXTES.meresSansEmplacement(noms));
    return;
  }
  const meresSansLieu = lignesMeres.filter((l) => {
    const actuels = lieuxConnus.get(l.id) || [];
    return (
      l.saisie.statut === "Morte" &&
      actuels.length > 1 &&
      l.saisie.morts.filter((x) => actuels.includes(x)).length === 0
    );
  });
  if (meresSansLieu.length) {
    const noms = meresSansLieu
      .map((l) => libelle(recordsParId.millesimes.get(l.id)))
      .join(", ");
    refuser("meres", TEXTES.meresLieuxMortsNonCoches(noms));
    return;
  }
  const meresPlantsInvalides = lignesMeres.filter(
    (l) =>
      avecNombrePlants(l.saisie, lieuxConnus.get(l.id) || []) &&
      !plantsValide(l.saisie),
  );
  if (meresPlantsInvalides.length) {
    const noms = meresPlantsInvalides
      .map((l) => libelle(recordsParId.millesimes.get(l.id)))
      .join(", ");
    refuser("meres", TEXTES.meresPlantsInvalides(noms));
    return;
  }
  afficherSucces("");
  etat.enregistrement = true;

  const n = lignesGermes.length + lignesPlantation.length + lignesMeres.length;
  try {
    const actions = [];
    if (lignesGermes.length) {
      actions.push([
        "BulkUpdateRecord",
        "Semis",
        lignesGermes.map((b) => b.idSemis),
        {
          Germes: lignesGermes.map(
            (b) => (recordsParId.semis.get(b.idSemis).germes || 0) + b.germes,
          ),
          Germes_attente: lignesGermes.map((b) => !!b.attente),
        },
      ]);
    }
    for (const p of lignesPlantation) {
      const s = recordsParId.semis.get(p.idSemis);
      if (!s) continue;
      const champs = {};
      if (p.plantes > 0) {
        champs.Plantes = s.plantes + p.plantes;
        champs.Date_p = dateEnSecondes(dateP);
        champs.Ou = enListeChoix([...new Set([...s.ou, ...p.ou])]);
      }
      if (p.oups > 0) champs.Oups = s.oups + p.oups;
      if (p.don > 0) champs.Don_p = s.don + p.don;
      actions.push(["UpdateRecord", "Semis", p.idSemis, champs]);
    }
    if (lignesMeres.length) {
      const aujourdhui = dateEnSecondes(dateDuJour());
      const lieux = lieuxParMillesime();
      const effets = lignesMeres.map((l) => ({
        id: l.id,
        e: effetMere(l.saisie, lieux.get(l.id) || []),
      }));
      actions.push([
        "BulkUpdateRecord",
        "Millesimes",
        effets.map((x) => x.id),
        {
          Statut_mere: effets.map((x) => x.e.statut),
          Controle_mere: effets.map(() => aujourdhui),
          Plante_mere: effets.map((x) => x.e.planteMere),
        },
      ]);
      // Nombre de plants : ajusté, ou remis à 0 en cas de mort totale.
      // Semis.Plantes de la ligne plante mère suit Nb_plants (lu par le plan et les étiquettes).
      lignesMeres.forEach((l, i) => {
        if (!effets[i].e.planteMere) {
          actions.push(["UpdateRecord", "Millesimes", l.id, { Nb_plants: 0 }]);
        } else if (avecNombrePlants(l.saisie, lieux.get(l.id) || [])) {
          const n = Number(l.saisie.plants);
          actions.push(["UpdateRecord", "Millesimes", l.id, { Nb_plants: n }]);
          const lignes = lignesSemisMere(l.id); // en principe une seule : on modifie la première
          if (lignes.length)
            actions.push(["UpdateRecord", "Semis", lignes[0].id, { Plantes: n }]);
        }
      });
      // Lignes Semis des plantes mères : on retire les lieux morts ; mort totale : Plantes = 0
      for (const { id, e } of effets) {
        if (e.planteMere && e.morts.length === 0) continue; // rien de mort : on ne touche à rien
        for (const s of recordsParId.semis.values()) {
          if (s.millesimeId !== id || !estLigneMere(s)) continue;
          const restants = s.ou.filter((l) => !e.morts.includes(l));
          const champs = {
            Ou: restants.length ? enListeChoix(restants) : null,
          };
          if (!e.planteMere) champs.Plantes = 0;
          actions.push(["UpdateRecord", "Semis", s.id, champs]);
        }
      }
      // « Encore là » avec un lieu choisi (sans lieu connu, ou ajouté par « Ajuster ») : ligne Semis existante, sinon création
      for (const l of lignesMeres) {
        const nouveaux = l.saisie.ou || [];
        if (l.saisie.statut !== "Vivante" || nouveaux.length === 0) continue;
        const m = recordsParId.millesimes.get(l.id);
        const existantes = lignesSemisMere(l.id);
        if (existantes.length) {
          actions.push([
            "UpdateRecord",
            "Semis",
            existantes[0].id,
            {
              Ou: enListeChoix([
                ...new Set([...existantes[0].ou, ...nouveaux]),
              ]),
            },
          ]);
        } else {
          actions.push([
            "AddRecord",
            "Semis",
            null,
            {
              NomVariete: m.varieteId,
              Millesime: l.id,
              Date_s: m.anneePlantation
                ? dateEnSecondes(`${m.anneePlantation}-01-01`)
                : null,
              Plantes: l.saisie.ajuste
                ? Number(l.saisie.plants)
                : m.plants || 1,
              Ou: enListeChoix(nouveaux),
              Nb_etiquettes: 0,
            },
          ]);
        }
      }
    }
    await grist.docApi.applyUserActions(actions);
    etat.saisies = {};
    etat.saisiesMeres = {};
    if (etat.brut) etat.brut = {};
    afficherSucces(TEXTES.succes(n));
  } catch (err) {
    console.error(err);
    etat.erreurs.general = TEXTES.echecEnregistrement(err.message);
    etat.enregistrement = false;
    return;
  }

  // Rechargement séparé : s'il échoue, l'enregistrement, lui, a bien eu lieu
  try {
    await chargerSemis();
    await chargerMillesimes();
    recalculerTout();
  } catch (err) {
    console.error(err);
    etat.erreurs.general = TEXTES.echecRechargement(err.message);
  } finally {
    etat.enregistrement = false;
  }
}

// ===== Choix « Où » lus depuis Grist =====
async function chargerChoix() {
  try {
    const choix = await lireChoixColonnes("Semis", ["Ou"]);
    if (choix.Ou) LIEUX = choix.Ou;
  } catch (err) {
    console.error("Lecture des emplacements impossible :", err);
    etat.message = TEXTES.emplacementsNonCharges(err.message);
  }
}
// ===== Vue =====
Vue.createApp({
  setup() {
    return { etat, nombreSaisies, aller };
  },
}).mount("#appEntete");
Vue.createApp({
  setup() {
    return { etat, basculerTri, choisirTri };
  },
}).mount("#appRecherche");
Vue.createApp({
  setup() {
    return {
      etat,
      recapGermes,
      recapPlantation,
      recapMeres,
      allerCarte,
      allerMere,
      retirerSaisie,
      retirerMere,

      pluriel,
      evolution,
    };
  },
}).mount("#appEnCours");
Vue.createApp({
  setup() {
    return {
      etat,
      libelle,
      dateAffichee,
      pluriel,
      aGermes,
      valeurGermes,
      surGermes,
      basculerNG,
      saisieInvalide, 
      estNG,
      valeurAttente,
      basculerAttente,
      tropDeGermes,
      totalGermes,
      resteAGermer,
    };
  },
}).mount("#appVerifier");
Vue.createApp({
  setup() {
    return {
      etat,
      libelle,

      dateAffichee,
      pluriel,
      aPlantationDe,
      valeurQuantite,
      surQuantite,
      quantiteInvalide,
      toutPlanter,
      totalSaisi,
      casOu,
      lieuxChoisis,
      lieuxProposes,
      ouvertOu,
      ouvrirOu,
      fermerOu,
      surRechercheOu,
      ajouterLieu,
      retirerLieu,
      toutPlanteDe,
    };
  },
}).mount("#appPlanter");
Vue.createApp({
  setup() {
    return {
      etat,
      libelle,

      pluriel,
      statutMere,
      choisirStatutMere,
      lieuMort,
      basculerLieuMort,
      ajusteMere,
      ajusterMere,
      plantsMere,
      surPlantsMere,
      champPlantsMere,
      plantsMereInvalide,
      besoinLieuMere,
      lieuxChoisis,
      lieuxProposes,
      ouvertOu,
      ouvrirOu,
      fermerOu,
      surRechercheOu,
      ajouterLieu,
      retirerLieu,
    };
  },
}).mount("#appMeres");
Vue.createApp({
  setup() {
    return { etat, nombreSaisies, enregistrerTout };
  },
}).mount("#appEnregistrer");

// Quand la recherche, le tri ou une case d'option change, on recalcule les trois listes
Vue.watch(
  () => [
    etat.recherche,
    etat.tri,
    etat.inclureSansDuree,
    etat.inclureControlees,
  ],
  () => {
    recalculerTout();
  },
);

// ===== Initialisation =====
grist.ready({ requiredAccess: "full" });

chargerSemis()
  .then(chargerChoix)
  .then(chargerMillesimes)
  .then(() => {
    recalculerTout();
    etat.charge = true;
  })
  .catch((err) => {
    console.error(err);
    etat.message = TEXTES.erreurChargement(err.message);
  });
