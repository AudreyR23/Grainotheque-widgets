// ===== État global =====
let modifie = false;
let brouillons = [];   // { idSemis, nb } : étiquettes à ajouter
let recherche = '';
let minuterieSucces = null;
let reponseConfirmation = null;
const recordsParId = {
  semis: new Map()
};

// État lu par le HTML : Vue redessine quand il change
const etat = Vue.reactive({
  filtreMeres: false,
  filtreEtiquettes: false,
  titre: 'À étiqueter',
  entrees: [],
  etapeIntermediaire: [],
  etapeVisible: false,
  erreur: '',
  succes: '',
  message: '',
  enregistrement: false,
  confirmation: { visible: false, texte: '' }
});

// ===== Utilitaires (passé en commun)=====

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
      type: s.Type || ''
    });
  }
}

// ===== Sélection =====
function entreesEtiquetables() {
  return [...recordsParId.semis.values()].filter(s =>
    s.planteMere ? !!s.anneePlantation : s.plantes > 0);
}

function filtrerParRecherche(semis) {
  if (!recherche) return semis;
  const mots = recherche.split(' ');
  return semis.filter(s => {
    const texte = normaliser(s.nom + ' ' + s.variete);
    return mots.every(mot => texte.includes(mot));
  });
}

function afficherSelection() {
  const tous = entreesEtiquetables().sort((a, b) =>
    libelle(a).localeCompare(libelle(b), 'fr') || a.id - b.id);
  let semis = filtrerParRecherche(tous);
  if (etat.filtreMeres) semis = semis.filter(s => s.planteMere);
  if (etat.filtreEtiquettes) semis = semis.filter(s => s.nbEtiquettes > 0 || s.enAttente > 0);
  const filtre = recherche || etat.filtreMeres || etat.filtreEtiquettes;
  etat.titre = filtre
    ? `À étiqueter (${semis.length} sur ${tous.length})`
    : `À étiqueter (${tous.length})`;
  etat.entrees = semis;
}

function surRecherche(e) {
  recherche = normaliser(e.target.value);
  afficherSelection();
}

// ===== Textes affichés par le HTML =====
function libelle(s) {
  return s.variete ? `${s.nom} - ${s.variete}` : s.nom;
}

function detailEntree(s) {
  const parties = [];
  if (s.plantes > 0) {
    parties.push(`${s.plantes} planté${s.plantes > 1 ? 's' : ''}` +
      (s.datePlantation ? ` le ${dateAffichee(s.datePlantation)}` : ''));
  }
  if (s.anneeGraine) parties.push(`graines ${s.anneeGraine}`);
  return parties.join(' · ');
}

function textePlanteMere(s) {
  return '🌱 Plante mère' + (s.anneePlantation ? ` (plantée en ${s.anneePlantation})` : '');
}

function texteInfo(s) {
  const morceaux = [];
  if (s.nbEtiquettes > 0) morceaux.push(`${s.nbEtiquettes} à imprimer`);
  if (s.enAttente > 0) morceaux.push(`${s.enAttente} imprimée${s.enAttente > 1 ? 's' : ''} en attente`);
  return morceaux.join(' · ');
}

function texteAlerte(s) {
  const morceaux = [];
  if (s.nbEtiquettes > 0) morceaux.push(`${s.nbEtiquettes} déjà à imprimer`);
  if (s.enAttente > 0) morceaux.push(`${s.enAttente} en attente`);
  return morceaux.join(' · ');
}

function nomEtapeIntermediaire(b) {
  return b.s ? (b.s.planteMere ? '🌱 ' : '') + libelle(b.s) : '(ligne inconnue)';
}

function texteNb(b) {
  return `+ ${b.nb} étiquette${b.nb > 1 ? 's' : ''}`;
}

function valeurEtapeIntermediaire(idSemis) {
  const b = brouillons.find(x => x.idSemis === idSemis);
  return b ? b.nb : '';
}

// ===== Statut =====
function majStatut() {
  const el = document.getElementById('statut');
  const n = brouillons.length;
  modifie = n > 0;
  el.textContent = modifie ? `● Non sauvegardé (${n})` : '✓ À jour';
  el.classList.toggle('non-sauvegarde', modifie);
  majEtapeIntermediaire();
}

// ===== Saisie et brouillons =====
function poserBrouillon(idSemis, nb) {
  // écran uniquement : rien n'est écrit dans Grist avant « Enregistrer »
  brouillons = brouillons.filter(b => b.idSemis !== idSemis);
  if (nb !== null) brouillons.push({ idSemis, nb });
  majStatut();
}

function majEtapeIntermediaire() {
  etat.etapeIntermediaire = brouillons.map(b => ({
    id: b.idSemis,
    nb: b.nb,
    s: recordsParId.semis.get(b.idSemis)
  }));
}

function initialiserSaisie() {
  document.getElementById('listeSelection').addEventListener('input', e => {
    const champ = e.target.closest('.champ-etiquettes');
    if (!champ) return;
    const id = Number(champ.closest('li').dataset.id);
    const texte = champ.value.trim();
    const valeur = Number(texte);
    const valide = texte !== '' && Number.isInteger(valeur) && valeur > 0;
    poserBrouillon(id, valide ? valeur : null);
  });
}

// ===== Section « À ajouter » : visibilité et défilement =====
function initialiserEtapeIntermediaire() {
  new IntersectionObserver(entrees => {
    etat.etapeVisible = entrees[0].isIntersecting;
  }).observe(document.getElementById('etapeIntermediaire'));
}

function voirEtapeIntermediaire() {
  document.getElementById('etapeIntermediaire')
    .scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== Confirmation (prête, pas encore utilisée) =====
function confirmer(texte) {
  return new Promise(resolve => {
    etat.confirmation.texte = texte;
    etat.confirmation.visible = true;
    reponseConfirmation = resolve;
  });
}

function repondreConfirmation(ok) {
  etat.confirmation.visible = false;
  if (reponseConfirmation) reponseConfirmation(ok);
  reponseConfirmation = null;
}

// ===== Enregistrement =====
function afficherSucces(texte) {
  clearTimeout(minuterieSucces);
  etat.succes = texte;
  if (texte) {
    minuterieSucces = setTimeout(() => afficherSucces(''), 5000);
  }
}

async function enregistrerTout() {
  if (brouillons.length === 0 || etat.enregistrement) return;
  etat.enregistrement = true;
  afficherSucces('');
  etat.erreur = '';

  const n = brouillons.length;
  try {
    // 1. Relire les valeurs actuelles (l'impression a pu les remettre à 0)
    await chargerSemis();
    const ids = [];
    const valeurs = [];
    for (const b of brouillons) {
      const s = recordsParId.semis.get(b.idSemis);
      if (!s) continue;
      ids.push(b.idSemis);
      valeurs.push(s.nbEtiquettes + b.nb);
    }
    // 2. Écrire uniquement Nb_etiquettes
    await grist.docApi.applyUserActions([
      ['BulkUpdateRecord', 'Semis', ids, { Nb_etiquettes: valeurs }]
    ]);
    brouillons = [];
    majStatut();
    afficherSucces(`✓ ${n} ligne${n > 1 ? 's' : ''} mise${n > 1 ? 's' : ''} à jour.`);
    await chargerSemis();
    afficherSelection();
  } catch (err) {
    console.error(err);
    etat.erreur = 'Échec de l\'enregistrement : ' + err.message + ' — tes saisies sont conservées.';
  } finally {
    etat.enregistrement = false;
  }
}

window.addEventListener('beforeunload', e => {
  if (modifie) { e.preventDefault(); e.returnValue = ''; }
});
// Quand une case change, la liste se recalcule
Vue.watch(() => [etat.filtreMeres, etat.filtreEtiquettes], afficherSelection);

// ===== Application Vue =====
Vue.createApp({
  setup() {
    return {
      etat, libelle, detailEntree, textePlanteMere, texteInfo, texteAlerte,
      nomEtapeIntermediaire, typeInverse, texteNb, valeurEtapeIntermediaire,
      surRecherche, poserBrouillon, voirEtapeIntermediaire,
      enregistrerTout, repondreConfirmation
    };
  }
}).mount('#appSelection');

// ===== Initialisation =====
grist.ready({ requiredAccess: 'full' });

chargerSemis()
  .then(() => {
    afficherSelection();
    initialiserSaisie();
    initialiserEtapeIntermediaire();
    majStatut();
  })
  .catch(err => {
    console.error(err);
    etat.message = 'Erreur de chargement : ' + err.message;
  });