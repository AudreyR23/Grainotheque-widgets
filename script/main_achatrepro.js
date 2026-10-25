
/* =============================================
   DONNÉES GRIST CHARGÉES AU DÉMARRAGE
   ============================================= */
let modeles   = [];   // lignes de la table Modele
let varietes  = [];   // lignes de la table Varietes (pour la liste du panneau 2)
let metaChoix = {};   // choix disponibles par colonne (depuis Grist metadata)

/* Valeurs des mois — identiques dans toutes les ChoiceList de mois */
const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jui','Juil','Aou','Sep','Oct','Nov','Déc'];

/* =============================================
   NAVIGATION
   ============================================= */
function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  event.target.classList.add('active');
}

/* Bascule de panneau par programme (sans event, utilisé pour l'enchainement) */
function goToPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  const idx = { variete: 1, millesime: 0, modele: 2 }[id];
  document.querySelectorAll('.nav-btn')[idx].classList.add('active');
}

function chainEnabled() {
  return document.getElementById('chain-auto').checked;
}

function showChainBanner(id, txt) {
  const el = document.getElementById('chain-banner-' + id);
  if (!el) return;
  el.textContent = txt;
  el.classList.add('show');
}

function hideChainBanner(id) {
  const el = document.getElementById('chain-banner-' + id);
  if (!el) return;
  el.classList.remove('show');
}

/* =============================================
   AJOUT TYPE LIE A VARIETE
   ============================================= */   
function chargerTypeMillesime() {
  const id = parseInt(document.getElementById('m-variete').value);

  const v = varietes.find(x => x.id === id);

  document.getElementById('m-type').value = v ? v.Type : '';
}
/* =============================================
   UTILITAIRES — PILLS (cases à cocher style étiquette)
   ============================================= */
function buildPills(containerId, values, selected = []) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  values.forEach(v => {
    const pill = document.createElement('label');
    pill.className = 'choice-pill' + (selected.includes(v) ? ' checked' : '');
    pill.innerHTML = `<input type="checkbox" value="${v}" ${selected.includes(v) ? 'checked' : ''}> ${v}`;
    pill.querySelector('input').addEventListener('change', e => {
      pill.classList.toggle('checked', e.target.checked);
    });
    container.appendChild(pill);
  });
}

function getPills(containerId) {
  const vals = [...document.querySelectorAll(`#${containerId} input:checked`)]
    .map(i => i.value);

  return vals.length ? ["L", ...vals] : ["L"];
}

function setPills(containerId, selected) {
  document.querySelectorAll(`#${containerId} .choice-pill`).forEach(pill => {
    const cb = pill.querySelector('input');
    const checked = selected.includes(cb.value);
    cb.checked = checked;
    pill.classList.toggle('checked', checked);
  });
}

/* =============================================
   UTILITAIRES — SELECTS
   ============================================= */
function fillSelect(id, options, selected = null) {
  const el = document.getElementById(id);
  const prev = el.value;
  el.innerHTML = '<option value="">—</option>';
  options.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o; opt.textContent = o;
    if (o === (selected || prev)) opt.selected = true;
    el.appendChild(opt);
  });
}

function fillMultiSelect(id, options, selected = []) {
  const el = document.getElementById(id);
  el.innerHTML = '';
  options.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o; opt.textContent = o;
    opt.selected = selected.includes(o);
    el.appendChild(opt);
  });
}

function getMultiSelect(id) {
  const el = document.getElementById(id);

  if (!el) return ["L"];

  const vals = [...el.selectedOptions]
    .map(o => o.value)
    .filter(v => v);

  return ["L", ...vals];
}

/* Origines : étiquettes favorites + menu "autres", au format ["L", ...] */
function getOrigines() {
  const favs  = getPills('m-origine-fav').filter(v => v !== 'L');
  const autre = document.getElementById('m-origine-autre').value;
  return ['L', ...favs, ...(autre ? [autre] : [])];
}

/* Sachet : valeur enregistrée dans la colonne Sachets */
const VALEUR_SACHET = '1';

/* Montre ou cache Quantité / Année de plantation selon les cases cochées */
function majChampsMillesime(source) {
  const caseSachet = document.getElementById('m-sachet-check');
  const caseMere   = document.getElementById('m-plante-mere');

  /* Exclusion mutuelle : cocher l'un décoche l'autre */
  if (source === 'sachet' && caseSachet.checked) caseMere.checked = false;
  if (source === 'mere'   && caseMere.checked)   caseSachet.checked = false;

  const sachet = caseSachet.checked;
  const mere   = caseMere.checked;
  document.getElementById('bloc-qtte').classList.toggle('cache', !sachet);
  document.getElementById('bloc-plantation').classList.toggle('cache', !mere);
  if (!sachet) document.getElementById('m-qtte').value = '';
  if (!mere)   document.getElementById('m-annee-plantation').value = '';
  const reelsVisible = !!ligneAttenteChoisie && sachet;
  document.getElementById('bloc-sachets-reels').classList.toggle('cache', !reelsVisible);
  if (!reelsVisible) {
    document.getElementById('m-sachets-reels').value = '';
    majInfoDon();
  }  
  verifierDoublonEnDirect();
}

/* =============================================
   DÉTECTION DE DOUBLONS — MILLÉSIME
   ============================================= */

/* Transforme ["L","Achat","Don"] en "Achat|Don" (sans "L", trié) pour comparer */
function cleOrigine(liste) {
  return (Array.isArray(liste) ? liste : [])
    .filter(v => v && v !== 'L')
    .sort()
    .join('|');
}

/* Renvoie les millésimes existants de même variété + année + origine */
async function trouverDoublonsMillesime(varId, annee, origine, planteMere = false) {
  const data = await grist.docApi.fetchTable('Millesimes');
  const cleCherchee = cleOrigine(origine);
  const doublons = [];

  data.id.forEach((id, i) => {
    if (data.NomVariete[i] !== varId) return;
    if (!!data.Plante_mere[i] !== !!planteMere) return;

    const ts = data.Millesime[i];
    if (!ts) return;
    if (new Date(ts * 1000).getUTCFullYear() !== annee) return;

    if (cleOrigine(data.Origine[i]) !== cleCherchee) return;

    doublons.push({
      id,
      annee,
      origine: cleOrigine(data.Origine[i]).replace(/\|/g, ', '),
      qtte: data.Qtte_graines[i],
      sachets: data.Sachets[i],
    });
  });

  return doublons;
}

/* Renvoie les ids des lignes Semis de cette variété dont "A produire" est coché */
async function trouverSemisAProduire(varId) {
  const data = await grist.docApi.fetchTable('Semis');
  const ids = [];
  data.id.forEach((id, i) => {
    if (data.NomVariete[i] === varId && data.A_produire[i]) ids.push(id);
  });
  return ids;
}

/* =============================================
   ÉTIQUETTES EN ATTENTE (Semis.Etiq_en_attente)
   ============================================= */
const ORIGINE_PRODUCTION = 'Monjardin';   // choix de la colonne Origine affiché "AR" sur l'étiquette

let semisEnAttente = [];          // lignes Semis avec Etiq_en_attente > 0
let ligneAttenteChoisie = null;   // ligne choisie dans la liste
let parcoursLigne = false;   // true pendant le trajet ligne sans variété → espèce → variété → millésime

async function chargerSemisEnAttente() {
  const [semis, mils] = await Promise.all([
    grist.docApi.fetchTable('Semis'),
    grist.docApi.fetchTable('Millesimes')
  ]);

  const milParId = new Map();
  const originesOr = new Map();   // variété -> origines de son millésime "or."
  mils.id.forEach((id, i) => {
    milParId.set(id, {
      saisons: mils.Nb_saisons_manuel[i] || '',
      planteMere: !!mils.Plante_mere[i],
      anneePlantation: mils.Annee_plantation[i] || null
    });
    if (mils.Nb_saisons_manuel[i] === 'or.' && !originesOr.has(mils.NomVariete[i])) {
      originesOr.set(mils.NomVariete[i], cleOrigine(mils.Origine[i]).split('|').filter(Boolean));
    }
  });

  semisEnAttente = [];
  semis.id.forEach((id, i) => {
    const nb = semis.Etiq_en_attente[i];
    if (!(nb > 0)) return;
    semisEnAttente.push({
      id,
      varId: semis.NomVariete[i],
      nb,
      note: ((semis.Note_attente || [])[i] || '').trim(),
      seme: !!semis.Date_s[i],
      mil: milParId.get(semis.Millesime[i]) || null,
      originesOr: originesOr.get(semis.NomVariete[i]) || []
    });
  });
}

function libelleAttente(l) {
  if (!l.varId) {
    return 'Graines à identifier' + (l.note ? ' (' + l.note + ')' : '') +
           ' · ' + l.nb + ' étiquette(s)';
  }
  const v = varietes.find(x => x.id === l.varId);
  const nom = v ? v.Nom + (v.Variete ? ' — ' + v.Variete : '') : '(variété inconnue)';
  const type = (l.mil && l.mil.planteMere) ? 'plante mère'
             : (l.seme ? 'semis' : 'récupération hors sachet');
  return nom + ' · ' + type + ' · ' + l.nb + ' étiquette(s)';
}

function remplirListeAttente() {
  const sel = document.getElementById('m-attente');
  sel.innerHTML = '<option value="">— Choisir une ligne —</option>';
  [...semisEnAttente]
    .sort((a, b) => libelleAttente(a).localeCompare(libelleAttente(b), 'fr'))
    .forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.id;
      opt.textContent = libelleAttente(l);
      sel.appendChild(opt);
    });
}

/* Annule la ligne choisie : le formulaire redevient libre */
function annulerLigneAttente() {
  ligneAttenteChoisie = null;
  parcoursLigne = false;
  document.getElementById('m-variete').disabled = false;
  document.getElementById('m-attente').value = '';
  document.getElementById('bloc-sans-variete').classList.add('cache');
  majChampsMillesime();
}

/* Case "Issu de mes étiquettes" */
async function majModeEtiquettes() {
  const actif = document.getElementById('m-issu-etiquettes').checked;
  document.getElementById('bloc-attente').classList.toggle('cache', !actif);
  if (!actif) { annulerLigneAttente(); return; }
  try {
    await chargerSemisEnAttente();
    remplirListeAttente();
    if (!semisEnAttente.length) {
      showMsg('msg-millesime-etiquettes', 'Aucune étiquette en attente dans Semis.', 'err');
    }
  } catch (e) {
    showMsg('msg-millesime-etiquettes', '❌ Lecture des étiquettes en attente impossible : ' + e.message, 'err');
  }
}

/* Origines → étiquettes favorites + menu "autres" */
function appliquerOrigines(liste) {
  const favs = [...document.querySelectorAll('#m-origine-fav input')].map(i => i.value);
  setPills('m-origine-fav', liste.filter(o => favs.includes(o)));
  const autres = liste.filter(o => !favs.includes(o));
  document.getElementById('m-origine-autre').value = autres[0] || '';
}

/* Nb de saisons du nouveau millésime, même règle que l'étiquette */
function saisonsPourLigne(l) {
  let n;
  if (l.mil && l.mil.planteMere && l.mil.anneePlantation) {
    n = new Date().getFullYear() - l.mil.anneePlantation + 1;
  } else if (!l.seme) {
    return 'or.';
  } else {
    n = parseInt(l.mil ? l.mil.saisons : '');
    n = isNaN(n) ? 1 : n + 1;
  }
  return String(Math.min(Math.max(n, 1), 8));
}

function majInfoDon() {
  const n = parseInt(document.getElementById('m-sachets-reels').value);
  document.getElementById('info-don').textContent = n >= 1 ? 'Don : ' + (n - 1) + ' sachet(s)' : '';
}

/* Préremplissage d'une ligne sans variété (ligneAttenteChoisie doit déjà être définie) */
function preremplirLigneSansVariete(l) {
  document.getElementById('m-millesime').value = new Date().getFullYear();
  document.getElementById('m-nb-saisons').value = 'or.';
  appliquerOrigines([]);   /* l'origine n'est pas devinable : tu la choisis */
  document.getElementById('m-sachet-check').checked = true;
  document.getElementById('m-plante-mere').checked = false;
  majChampsMillesime('sachet');
  document.getElementById('m-sachets-reels').value = l.nb;
  majInfoDon();
  verifierDoublonEnDirect();
}

function chargerLigneAttente() {
  const id = parseInt(document.getElementById('m-attente').value);
  const l = semisEnAttente.find(x => x.id === id);
  if (!l) { annulerLigneAttente(); return; }

  const selV = document.getElementById('m-variete');
  const blocSans = document.getElementById('bloc-sans-variete');
  parcoursLigne = false;

  /* Ligne sans variété : le menu reste libre, boutons de création visibles */
  if (!l.varId) {
    ligneAttenteChoisie = l;
    selV.disabled = false;
    selV.value = '';
    chargerTypeMillesime();
    preremplirLigneSansVariete(l);
    blocSans.classList.remove('cache');
    showMsg('msg-millesime', 'Choisis la variété dans le menu, ou crée-la avec les boutons.', 'ok');
    return;
  }

  /* Ligne avec variété (comportement de l'étape 4) */
  blocSans.classList.add('cache');
  selV.value = l.varId;
  if (selV.value !== String(l.varId)) {
    showMsg('msg-millesime', 'Variété introuvable dans la liste (recharge le widget).', 'err');
    return;
  }
  ligneAttenteChoisie = l;
  selV.disabled = true;
  chargerTypeMillesime();

  document.getElementById('m-millesime').value = new Date().getFullYear();
  document.getElementById('m-nb-saisons').value = saisonsPourLigne(l);

  const produit = (l.mil && l.mil.planteMere) || l.seme;
  appliquerOrigines(produit ? [ORIGINE_PRODUCTION] : l.originesOr);

  document.getElementById('m-sachet-check').checked = true;
  document.getElementById('m-plante-mere').checked = false;
  majChampsMillesime('sachet');

  document.getElementById('m-sachets-reels').value = l.nb;
  majInfoDon();
  verifierDoublonEnDirect();

  if (getOrigines().length < 2) {
    showMsg('msg-millesime', "Origine non reconnue : choisis-la à la main.", 'err');
  }
  document.getElementById('m-qtte').focus();
}

/* Ligne sans variété → panneau Variété (la note préremplit le Nom, modifiable) */
function allerCreerVariete() {
  if (!ligneAttenteChoisie || ligneAttenteChoisie.varId) return;
  parcoursLigne = true;
  goToPanel('variete');
  const champ = document.getElementById('v-nom');
  if (!champ.value.trim() && ligneAttenteChoisie.note) {
    champ.value = ligneAttenteChoisie.note;
    verifierDoublonVarieteEnDirect();
  }
  showChainBanner('variete', '🔗 Graines à identifier (' + ligneAttenteChoisie.nb +
    ' étiquette(s)) : crée la variété, tu reviendras au millésime ensuite.');
  champ.focus();
}

/* Ligne sans variété → panneau Espèce, puis la chaîne continue */
function allerCreerEspece() {
  if (!ligneAttenteChoisie || ligneAttenteChoisie.varId) return;
  parcoursLigne = true;
  goToPanel('modele');
  const champ = document.getElementById('e-nom');
  if (!champ.value.trim() && ligneAttenteChoisie.note) {
    champ.value = ligneAttenteChoisie.note;
    verifierDoublonModeleEnDirect();
  }
  champ.focus();
}

/* Vide Etiq_en_attente ; supprime la ligne si c'est une ligne de transit.
   Renvoie 'supprimee', 'videe' ou 'absente'. */
async function nettoyerLigneAttente(ligne) {
  const data = await grist.docApi.fetchTable('Semis');
  const i = data.id.indexOf(ligne.id);
  if (i === -1) return 'absente';

  const transit = !data.Date_s[i] && !data.Nb_graines[i] && !data.Nb_godets[i]
               && !data.Germes[i] && !data.Plantes[i] && !(data.Nb_etiquettes[i] > 0);

  if (transit) {
    await grist.docApi.applyUserActions([['RemoveRecord', 'Semis', ligne.id]]);
    return 'supprimee';
  }
  await grist.docApi.applyUserActions([
    ['UpdateRecord', 'Semis', ligne.id, { Etiq_en_attente: null }]
  ]);
  return 'videe';
}

function afficherAlerteDoublon(doublons) {
  const d = doublons[0];
  const nb = doublons.length;
  const details = 'année ' + d.annee +
    ', origine : ' + (d.origine || '—') +
    ', quantité : ' + (d.qtte ?? '—');
  document.getElementById('doublon-texte').textContent =
    '⚠️ ' + (nb > 1 ? nb + ' millésimes existent déjà' : 'Un millésime existe déjà') +
    ' (' + details + '). Créer quand même ?';
  document.getElementById('doublon-millesime').classList.add('show');
}

function cacherAlerteDoublon() {
  document.getElementById('doublon-millesime').classList.remove('show');
}
/* Alerte en direct : vérifie dès que variété + année + origine sont remplies */
let verifEnCours = 0;

async function verifierDoublonEnDirect() {
  const varId  = parseInt(document.getElementById('m-variete').value);
  const annee  = parseInt(document.getElementById('m-millesime').value);
  const origine = getOrigines();
  const planteMere = document.getElementById('m-plante-mere').checked;

  if (!varId || !annee || origine.length < 2) {
    cacherAlerteDoublon();
    return;
  }

  /* Évite qu'une ancienne réponse écrase une plus récente */
  const numero = ++verifEnCours;
  try {
    const doublons = await trouverDoublonsMillesime(varId, annee, origine, planteMere);    if (numero !== verifEnCours) return;
    if (doublons.length) afficherAlerteDoublon(doublons);
    else cacherAlerteDoublon();
  } catch (e) {
    console.error('Vérification en direct impossible :', e);
  }
}
/* =============================================
   DÉTECTION DE DOUBLONS — VARIÉTÉ
   ============================================= */

/* "Orange  Bourgoin" et "orange bourgoin" deviennent identiques ; accents ignorés */
function normaliser(txt) {
  return (txt || '').toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function trouverDoublonsVariete(nom, variete) {
  const cle = normaliser(nom) + '|' + normaliser(variete);
  return varietes.filter(v => normaliser(v.Nom) + '|' + normaliser(v.Variete) === cle);
}

function afficherAlerteDoublonVariete(doublons) {
  const d = doublons[0];
  document.getElementById('doublon-variete-texte').textContent =
    '⚠️ ' + (doublons.length > 1 ? doublons.length + ' variétés existent déjà' : 'Une variété existe déjà') +
    ' : ' + d.Nom + (d.Variete ? ' — ' + d.Variete : '') + '. Créer quand même ?';
  document.getElementById('doublon-variete').classList.add('show');
}

function cacherAlerteDoublonVariete() {
  document.getElementById('doublon-variete').classList.remove('show');
}

/* Alerte en direct : appelée à chaque frappe dans Nom ou Variété */
function verifierDoublonVarieteEnDirect() {
  const nom     = document.getElementById('v-nom').value;
  const variete = document.getElementById('v-variete').value;
  if (!nom.trim()) { cacherAlerteDoublonVariete(); return; }

  const doublons = trouverDoublonsVariete(nom, variete);
  if (doublons.length) afficherAlerteDoublonVariete(doublons);
  else cacherAlerteDoublonVariete();
}

/* =============================================
   DÉTECTION DE DOUBLONS — ESPÈCE (MODÈLE)
   ============================================= */

function trouverDoublonsModele(nom) {
  const cle = normaliser(nom);
  return modeles.filter(m => normaliser(m.Nom) === cle);
}

function afficherAlerteDoublonModele(doublons) {
  document.getElementById('doublon-modele-texte').textContent =
    '⚠️ ' + (doublons.length > 1 ? doublons.length + ' espèces existent déjà' : 'Une espèce existe déjà') +
    ' : ' + doublons[0].Nom + '. Créer quand même ?';
  document.getElementById('doublon-modele').classList.add('show');
}

function cacherAlerteDoublonModele() {
  document.getElementById('doublon-modele').classList.remove('show');
}

/* Alerte en direct : appelée à chaque frappe dans le nom de l'espèce */
function verifierDoublonModeleEnDirect() {
  const nom = document.getElementById('e-nom').value;
  if (!nom.trim()) { cacherAlerteDoublonModele(); return; }

  const doublons = trouverDoublonsModele(nom);
  if (doublons.length) afficherAlerteDoublonModele(doublons);
  else cacherAlerteDoublonModele();
}

/* =============================================
   AFFICHER UN MESSAGE
   ============================================= */
function showMsg(id, txt, type) {
  const el = document.getElementById(id);
  el.textContent = txt;
  el.className = 'msg ' + type;
  setTimeout(() => { el.className = 'msg'; }, 4000);
}

/* =============================================
   INITIALISATION — charge les données Grist
   ============================================= */
grist.ready({ requiredAccess: 'full' });

async function init() {
  try {
    /* Charger les modèles */
    const dataModele = await grist.docApi.fetchTable('Modele');
    modeles = dataModele.id.map((id, i) => ({
      id,
      Nom:               dataModele.Nom?.[i]               || '',
      Type:              dataModele.Type?.[i]              || '',
      Conservation:      dataModele.Conservation?.[i]      || '',
      Semis_profondeur:  dataModele.Semis_profondeur?.[i]  || '',
      Duree_germ:        dataModele.Duree_germ?.[i]        || '',
      Temp_germ:         dataModele.Temp_germ?.[i]         || '',
      Semis_sous_abris:  dataModele.Semis_sous_abris?.[i]  || [],
      Semis_pleine_terre:dataModele.Semis_pleine_terre?.[i]|| [],
      Recolte_floraison: dataModele.Recolte_floraison?.[i] || [],
      Exposition:        dataModele.Exposition?.[i]        || '',
      Arrosage:          dataModele.Arrosage?.[i]          || '',
      Nature_du_sol:     dataModele.Nature_du_sol?.[i]     || [],
      Qualite_du_sol:    dataModele.Qualite_du_sol?.[i]    || [],
      Famille:           dataModele.Famille?.[i]           || [],
      Ou_cultiver:       dataModele.Ou_cultiver?.[i]       || [],
      Infos:             dataModele.Infos?.[i]             || [],
    }));

    /* Charger les variétés pour le panneau millésime */
    const dataVar = await grist.docApi.fetchTable('Varietes');
    varietes = dataVar.id.map((id, i) => ({
      id,
      NomVariete: dataVar.NomVariete?.[i] || '',
      Nom:        dataVar.Nom?.[i]        || '',
      Variete:    dataVar.Variete?.[i]    || '',
      Type: dataVar.Type?.[i] || '', 
    })).sort((a, b) => (a.Nom + a.Variete).localeCompare(b.Nom + b.Variete, 'fr'));

     
    /* Charger les métadonnées des colonnes (pour récupérer les choix) */
    const meta = await grist.docApi.fetchTable('_grist_Tables_column');
    const tablesMeta = await grist.docApi.fetchTable('_grist_Tables');

    /* Trouver l'id de la table Varietes */
    const tablesInteressantes = [
        tablesMeta.id[tablesMeta.tableId.indexOf('Varietes')],
        tablesMeta.id[tablesMeta.tableId.indexOf('Millesimes')],
        tablesMeta.id[tablesMeta.tableId.indexOf('Modele')]
   ];


    /* Extraire les choix pour chaque colonne */
    meta.id.forEach((id, i) => {

  if (!tablesInteressantes.includes(meta.parentId[i])) return;

  const col = meta.colId[i];
  const widgetOpts = meta.widgetOptions[i];

  if (!widgetOpts) return;

  try {
    const opts = JSON.parse(widgetOpts);

    if (opts.choices) {
      metaChoix[col] = opts.choices;
    }

  } catch(e) {}
});

    /* Remplir les listes de modèles */
    const selV = document.getElementById('v-modele');
    const selE = document.getElementById('e-modele-base');
    modeles.forEach(m => {
      [selV, selE].forEach(sel => {
        const opt = document.createElement('option');
        opt.value = m.id; opt.textContent = m.Nom;
        sel.appendChild(opt);
      });
    });

    /* Remplir la liste des variétés (panneau 2) */
    const selM = document.getElementById('m-variete');
    varietes.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.Nom + (v.Variete ? ' — ' + v.Variete : '');
      selM.appendChild(opt);
    });

    /* Construire les selects et pills avec les choix Grist */
    const TYPE    = metaChoix['Type']           || [];
    const EXPO    = metaChoix['Exposition']      || [];
    const ARROS   = metaChoix['Arrosage']        || [];
    const PROF    = metaChoix['Semis_profondeur']|| [];
    const FAMILLE = metaChoix['Famille']         || [];
    const NATURE  = metaChoix['Nature_du_sol']   || [];
    const QUALITE = metaChoix['Qualite_du_sol']  || [];
    const OU      = metaChoix['Ou_cultiver']     || [];
    const ORIG    = metaChoix['Origine']         || [];
    const INFOS = metaChoix['Infos'] || metaChoix['Info_supp'] || [];
    const SEMIS_GPT = metaChoix['Semis_GPT'] || [];

    /* Panneau 1 — Variété */
    fillSelect('v-type', TYPE);
    fillSelect('v-profondeur', PROF);
    fillSelect('v-exposition', EXPO);
    fillSelect('v-arrosage', ARROS);
    fillMultiSelect('v-famille', FAMILLE);
    fillMultiSelect('v-nature-sol', NATURE);
    fillMultiSelect('v-qualite-sol', QUALITE);
    fillMultiSelect('v-ou-cultiver', OU);
    buildPills('v-abri', MOIS);
    buildPills('v-terre', MOIS);
    buildPills('v-recolte', MOIS);
    fillMultiSelect('v-infos', INFOS);
    fillMultiSelect('v-semis-gpt', SEMIS_GPT);

    /* Panneau 2 — Millésime */
        const NB_FAVORIS = 6;
    buildPills('m-origine-fav', ORIG.slice(0, NB_FAVORIS));
    fillSelect('m-origine-autre', ORIG.slice(NB_FAVORIS));
    document.getElementById('m-origine-autre').options[0].textContent = 'Autres origines…';
    document.getElementById('m-origine-fav').addEventListener('change', verifierDoublonEnDirect);
    document.getElementById('m-millesime').value = new Date().getFullYear();

    /* Panneau 3 — Modèle */
    fillSelect('e-type', TYPE);
    fillSelect('e-profondeur', PROF);
    fillSelect('e-exposition', EXPO);
    fillSelect('e-arrosage', ARROS);
    fillMultiSelect('e-famille', FAMILLE);
    fillMultiSelect('e-nature-sol', NATURE);
    fillMultiSelect('e-qualite-sol', QUALITE);
    fillMultiSelect('e-ou-cultiver', OU);
    buildPills('e-abri', MOIS);
    buildPills('e-terre', MOIS);
    buildPills('e-recolte', MOIS);
    fillMultiSelect('e-infos', INFOS);

  } catch(e) {
    console.error('Erreur init:', e);
  }
}

/* =============================================
   PANNEAU 1 — Charger un modèle
   ============================================= */
function chargerModele() {
  const id = parseInt(document.getElementById('v-modele').value);
  if (!id) return;
  const m = modeles.find(x => x.id === id);
  if (!m) return;
  appliquerModele(m, 'v');
}

function appliquerModele(m, prefix) {
  /* Texte */
  if (document.getElementById(prefix + '-conservation'))
    document.getElementById(prefix + '-conservation').value = m.Conservation || '';
  if (document.getElementById(prefix + '-duree-germ'))
    document.getElementById(prefix + '-duree-germ').value = m.Duree_germ || '';
  if (document.getElementById(prefix + '-temp-germ'))
    document.getElementById(prefix + '-temp-germ').value = m.Temp_germ || '';

  /* Selects */
  const sel = (id, val) => { if (document.getElementById(id)) document.getElementById(id).value = val || ''; };
  sel(prefix + '-type', m.Type);
  sel(prefix + '-profondeur', m.Semis_profondeur);
  sel(prefix + '-exposition', m.Exposition);
  sel(prefix + '-arrosage', m.Arrosage);

  /* Multi-selects */
  const toArray = v => Array.isArray(v) ? v : (v ? [v] : []);
  fillMultiSelect(prefix + '-famille',    metaChoix['Famille']        || [], toArray(m.Famille));
  fillMultiSelect(prefix + '-nature-sol', metaChoix['Nature_du_sol']  || [], toArray(m.Nature_du_sol));
  fillMultiSelect(prefix + '-qualite-sol',metaChoix['Qualite_du_sol'] || [], toArray(m.Qualite_du_sol));
  fillMultiSelect(prefix + '-ou-cultiver',metaChoix['Ou_cultiver']    || [], toArray(m.Ou_cultiver));
  fillMultiSelect(prefix + '-infos',metaChoix['Infos']                || [], toArray(m.Infos));

  /* Pills mois */
  setPills(prefix + '-abri',    toArray(m.Semis_sous_abris));
  setPills(prefix + '-terre',   toArray(m.Semis_pleine_terre));
  setPills(prefix + '-recolte', toArray(m.Recolte_floraison));
}

function resetVariete() {
  document.getElementById('v-modele').value = '';
  document.getElementById('v-nom').value = '';
  document.getElementById('v-variete').value = '';
  ['v-type','v-profondeur','v-exposition','v-arrosage'].forEach(id => document.getElementById(id).value = '');
  ['v-conservation','v-duree-germ','v-temp-germ'].forEach(id => document.getElementById(id).value = '');
  ['v-famille','v-nature-sol','v-qualite-sol','v-ou-cultiver'].forEach(id => {
    [...document.querySelectorAll(`#${id} option`)].forEach(o => o.selected = false);
  });
  ['v-abri','v-terre','v-recolte'].forEach(id => setPills(id, []));
  [...document.querySelectorAll('#v-infos option')].forEach(o => o.selected = false);
  [...document.querySelectorAll('#v-semis-gpt option')].forEach(o => o.selected = false);
  document.getElementById('v-description').value = '';
  hideChainBanner('variete');
}

/* =============================================
   PANNEAU 3 — Charger un modèle de base
   ============================================= */
function chargerModeleBase() {
  const id = parseInt(document.getElementById('e-modele-base').value);
  if (!id) return;
  const m = modeles.find(x => x.id === id);
  if (!m) return;
  appliquerModele(m, 'e');
}

function resetModele() {
  document.getElementById('e-modele-base').value = '';
  document.getElementById('e-nom').value = '';
  ['e-type','e-profondeur','e-exposition','e-arrosage'].forEach(id => document.getElementById(id).value = '');
  ['e-conservation','e-duree-germ','e-temp-germ'].forEach(id => document.getElementById(id).value = '');
  ['e-famille','e-nature-sol','e-qualite-sol','e-ou-cultiver'].forEach(id => {
    [...document.querySelectorAll(`#${id} option`)].forEach(o => o.selected = false);
  });
  ['e-abri','e-terre','e-recolte'].forEach(id => setPills(id, []));
  [...document.querySelectorAll('#e-infos option')].forEach(o => o.selected = false);
}

function resetMillesime() {
  ligneAttenteChoisie = null;
  document.getElementById('m-variete').disabled = false;
  document.getElementById('m-attente').value = '';
  document.getElementById('m-sachets-reels').value = '';
  majInfoDon();
    parcoursLigne = false;
  document.getElementById('bloc-sans-variete').classList.add('cache');
  document.getElementById('m-variete').value = '';
  document.getElementById('m-millesime').value = new Date().getFullYear();
  document.getElementById('m-nb-saisons').value = 'or.';
  document.getElementById('m-qtte').value = '';
  document.getElementById('m-sachet-check').checked = true;
  setPills('m-origine-fav', []);
  document.getElementById('m-origine-autre').value = '';
  hideChainBanner('millesime');
  document.getElementById('m-plante-mere').checked = false;
  document.getElementById('m-annee-plantation').value = '';
  majChampsMillesime();
  cacherAlerteDoublon();
}

/* =============================================
   PANNEAU 1 — Créer une variété
   ============================================= */
async function creerVariete(forcer = false) {
  const nom     = document.getElementById('v-nom').value.trim();
  const variete = document.getElementById('v-variete').value.trim();
  if (!nom) { showMsg('msg-variete', 'Le nom est obligatoire.', 'err'); return; }
  /* Détection de doublon (sauf si l'utilisateur a déjà confirmé) */
  if (!forcer) {
    const doublons = trouverDoublonsVariete(nom, variete);
    if (doublons.length) { afficherAlerteDoublonVariete(doublons); return; }
  }
  cacherAlerteDoublonVariete();

  /* NomVariete = "Nom\nVariété" ou "Nom" si pas de variété */
  const nomVariete = variete ? nom + '\n' + variete : nom;

  const row = {
    NomVariete:         nomVariete,
    Type:               document.getElementById('v-type').value || null,
    Conservation:       parseFloat(document.getElementById('v-conservation').value) || null,
    Semis_profondeur:   document.getElementById('v-profondeur').value || null,
    Duree_germ:         parseFloat(document.getElementById('v-duree-germ').value) || null,
    Temp_germ:          document.getElementById('v-temp-germ').value || null,
    Semis_sous_abris:   getPills('v-abri'),
    Semis_pleine_terre: getPills('v-terre'),
    Recolte_floraison:  getPills('v-recolte'),
    Exposition:         document.getElementById('v-exposition').value || null,
    Arrosage:           document.getElementById('v-arrosage').value || null,
    Nature_du_sol:      getMultiSelect('v-nature-sol'),
    Qualite_du_sol:     getMultiSelect('v-qualite-sol'),
    Famille:            getMultiSelect('v-famille'),
    Ou_cultiver:        getMultiSelect('v-ou-cultiver'),
    Infos:              getMultiSelect('v-infos'),
    Description:        document.getElementById('v-description').value.trim() || null,
    Semis_GPT:          getMultiSelect('v-semis-gpt'),
  };

  try {
    const result = await grist.docApi.applyUserActions([
      ['AddRecord', 'Varietes', null, row]
    ]);
    const newVarieteId = result && result.retValues ? result.retValues[0] : null;

    showMsg('msg-variete', '✅ Variété créée : ' + nomVariete, 'ok');

    /* Recharger la liste des variétés pour le panneau millésime */
    const dataVar = await grist.docApi.fetchTable('Varietes');
    varietes = dataVar.id.map((id, i) => ({
      id, NomVariete: dataVar.NomVariete?.[i] || '',
      Nom: dataVar.Nom?.[i] || '', 
      Variete: dataVar.Variete?.[i] || '',
      Type: dataVar.Type?.[i] || '',
    })).sort((a, b) => (a.Nom + a.Variete).localeCompare(b.Nom + b.Variete, 'fr'));
    const selM = document.getElementById('m-variete');
    selM.innerHTML = '<option value="">— Choisir une variété —</option>';
    varietes.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.Nom + (v.Variete ? ' — ' + v.Variete : '');
      selM.appendChild(opt);
    });

    resetVariete();
    cacherAlerteDoublonVariete();

      /* Enchainement vers le millésime avec la variété pré-sélectionnée */
    if ((chainEnabled() || parcoursLigne) && newVarieteId) {
      document.getElementById('m-variete').value = newVarieteId;
      chargerTypeMillesime();
      goToPanel('millesime');
      if (parcoursLigne && ligneAttenteChoisie) {
        parcoursLigne = false;
        preremplirLigneSansVariete(ligneAttenteChoisie);
        showChainBanner('millesime', '🔗 Variété "' + nomVariete +
          '" créée — choisis l\'origine et la quantité de tes graines.');
      } else {
        showChainBanner('millesime', '🔗 Variété "' + nomVariete + '" créée — complétez maintenant son millésime.');
      }
      document.getElementById('m-origine-autre').focus();
    }
  } catch(e) {
    showMsg('msg-variete', '❌ Erreur : ' + e.message, 'err');
  }
}

/* =============================================
   PANNEAU 2 — Créer un millésime
   Remplace toute l'ancienne fonction creerMillesime(),
   y compris le bloc commenté /* try { ... } qui la suit.
   ============================================= */
async function creerMillesime(forcer = false) {
  const varId   = parseInt(document.getElementById('m-variete').value);
  const annee   = parseInt(document.getElementById('m-millesime').value);
  const planteMere = document.getElementById('m-plante-mere').checked;
  const anneePlantation = parseInt(document.getElementById('m-annee-plantation').value) || null;

  if (!varId) { showMsg('msg-millesime', 'Choisir une variété.', 'err'); return; }
  if (!annee) { showMsg('msg-millesime', 'Indiquer une année.', 'err'); return; }
  const origineChoisie = getOrigines().length > 1; // getMultiSelect renvoie toujours ["L", ...] même vide
  if (!origineChoisie) { showMsg('msg-millesime', "L'origine est obligatoire.", 'err'); return; }
    const sachet = document.getElementById('m-sachet-check').checked;
  const qtte   = parseFloat(document.getElementById('m-qtte').value) || null;
  if (!sachet && !planteMere) { showMsg('msg-millesime', 'Cocher Sachet et/ou Plante mère.', 'err'); return; }
  if (sachet && !qtte) { showMsg('msg-millesime', 'Indiquer la quantité de graines.', 'err'); return; }
  if (planteMere && !anneePlantation) { showMsg('msg-millesime', "Indiquer l'année de plantation.", 'err'); return; }
  const issuEtiquettes = document.getElementById('m-issu-etiquettes').checked;
  if (issuEtiquettes && !ligneAttenteChoisie) {
    showMsg('msg-millesime', 'Choisir une ligne d\'étiquettes, ou décocher "Issu de mes étiquettes".', 'err');
    return;
  }
  let sachetsReels = null;
  if (ligneAttenteChoisie && sachet) {
    sachetsReels = parseInt(document.getElementById('m-sachets-reels').value);
    if (!(sachetsReels >= 1)) {
      showMsg('msg-millesime', 'Indiquer le nombre de sachets réels (au moins 1).', 'err');
      return;
    }
  }  
  /* Détection de doublon (sauf si l'utilisateur a déjà confirmé) */
  if (!forcer) {
    let doublons = [];
    try {
      doublons = await trouverDoublonsMillesime(varId, annee, getOrigines());
        } catch (e) {
      showMsg('msg-millesime', '⚠️ Détection impossible : ' + e.message, 'err');
      return;
    }
    if (doublons.length) {
      try {
        afficherAlerteDoublon(doublons);
      } catch (e) {
        showMsg('msg-millesime', '⚠️ Affichage du bandeau impossible : ' + e.message, 'err');
      }
      return;
    }
  }
  cacherAlerteDoublon();

  /* Grist stocke les dates en secondes depuis epoch — 1er janvier de l'année */
  const dateTs = Math.floor(new Date(annee + '-01-01T00:00:00Z').getTime() / 1000);

  const v = varietes.find(x => x.id === varId);

  const row = {
    NomVariete:   varId,
    Type: document.getElementById('m-type').value || null,
    Millesime:    dateTs,
    Nb_saisons_manuel: document.getElementById('m-nb-saisons').value || null,
    Origine:      getOrigines(),
    Sachets:      planteMere ? '1p.' : (sachet ? VALEUR_SACHET : null),
    Qtte_graines: sachet ? qtte : null,
    Germination_historique: null, // Forcer à null pour éviter les valeurs par défaut
    Plante_mere: planteMere,
    Annee_plantation: anneePlantation,
  };
    /* Don = sachets réels - 1 (la colonne reste à sa valeur par défaut s'il n'y a rien à donner) */
  if (sachetsReels && sachetsReels > 1) row.Don = sachetsReels - 1;

  /* 1) Création du millésime */
  let newMillesimeId = null;
  try {
    const result = await grist.docApi.applyUserActions([
      ['AddRecord', 'Millesimes', null, row]
    ]);
    newMillesimeId = result && result.retValues ? result.retValues[0] : null;
  } catch (e) {
    showMsg('msg-millesime', '❌ Erreur : ' + e.message, 'err');
    return;
  }
  /* 1b) Décocher "A produire" sur les Semis de cette variété */
  let nbDecoches = 0;
  try {
    const idsADecocher = await trouverSemisAProduire(varId);
    if (idsADecocher.length) {
      await grist.docApi.applyUserActions([
        ['BulkUpdateRecord', 'Semis', idsADecocher,
          { A_produire: idsADecocher.map(() => false) }]
      ]);
      nbDecoches = idsADecocher.length;
    }
  } catch (e) {
    showMsg('msg-millesime',
      '⚠️ Millésime créé, mais le décochage de "A produire" a échoué : ' + e.message, 'err');
    return;
  }
  /* 1c) Ligne d'étiquettes en attente : vidée, ou supprimée si ligne de transit */
  if (ligneAttenteChoisie) {
    try {
      await nettoyerLigneAttente(ligneAttenteChoisie);
    } catch (e) {
      showMsg('msg-millesime',
        '⚠️ Millésime créé, mais le nettoyage de la ligne d\'étiquettes a échoué : ' + e.message, 'err');
      return;
    }
  }
  /* 2) Plante mère : on crée aussi sa ligne dans Semis */
  if (planteMere && newMillesimeId) {
    const anneeP = anneePlantation || annee;
    const dateP = Math.floor(new Date(anneeP + '-01-01T00:00:00Z').getTime() / 1000);

    try {
      await grist.docApi.applyUserActions([
        ['AddRecord', 'Semis', null, {
          NomVariete: varId,
          Millesime: newMillesimeId,
          Date_s: dateP,
          Type: document.getElementById('m-type').value || null,
          Plantes: 1,
          Nb_etiquettes: 0,
        }]
      ]);
    } catch (e) {
      showMsg('msg-millesime',
        '⚠️ Millésime créé, mais la ligne Semis a échoué : ' + e.message, 'err');
      return;
    }
  }

  showMsg('msg-millesime',
    '✅ Millésime ' + annee + ' créé pour ' + (v ? v.Nom : '') +
    (planteMere ? ' (ajouté aussi dans Semis)' : '') +
    (nbDecoches ? ' · "À produire" décoché sur ' + nbDecoches + ' semis' : '') +
    (sachetsReels > 1 ? ' · Don : ' + (sachetsReels - 1) + ' sachet(s)' : ''), 'ok');
  resetMillesime();

  /* Mode étiquettes : on rafraîchit la liste pour enchaîner la ligne suivante */
  if (issuEtiquettes) {
    try { await chargerSemisEnAttente(); remplirListeAttente(); } catch (e) { console.error(e); }
  }
}
/* =============================================
   PANNEAU 3 — Créer un modèle (espèce)
   ============================================= */
async function creerModele(forcer = false) {
  const nom = document.getElementById('e-nom').value.trim();
  if (!nom) { showMsg('msg-modele', 'Le nom est obligatoire.', 'err'); return; }
  /* Détection de doublon (sauf si l'utilisateur a déjà confirmé) */
  if (!forcer) {
    const doublons = trouverDoublonsModele(nom);
    if (doublons.length) { afficherAlerteDoublonModele(doublons); return; }
  }
  cacherAlerteDoublonModele();
  const row = {
    Nom:                nom,
    Type:               document.getElementById('e-type').value || null,
    Conservation:       parseFloat(document.getElementById('e-conservation').value) || null,
    Semis_profondeur:   document.getElementById('e-profondeur').value || null,
    Duree_germ:         parseFloat(document.getElementById('e-duree-germ').value) || null,
    Temp_germ:          document.getElementById('e-temp-germ').value || null,
    Semis_sous_abris:   getPills('e-abri'),
    Semis_pleine_terre: getPills('e-terre'),
    Recolte_floraison:  getPills('e-recolte'),
    Exposition:         document.getElementById('e-exposition').value || null,
    Arrosage:           document.getElementById('e-arrosage').value || null,
    Nature_du_sol:      getMultiSelect('e-nature-sol'),
    Qualite_du_sol:     getMultiSelect('e-qualite-sol'),
    Famille:            getMultiSelect('e-famille'),
    Ou_cultiver:        getMultiSelect('e-ou-cultiver'),
    Infos:              getMultiSelect('e-infos'),
  };

  try {
    const result = await grist.docApi.applyUserActions([
      ['AddRecord', 'Modele', null, row]
    ]);
    const newModeleId = result && result.retValues ? result.retValues[0] : null;

    showMsg('msg-modele', '✅ Espèce créée : ' + nom, 'ok');
    /* Ajouter à la liste des modèles */
    const dataModele = await grist.docApi.fetchTable('Modele');
    modeles = dataModele.id.map((id, i) => ({
      id, Nom: dataModele.Nom?.[i] || '',
      Type: dataModele.Type?.[i] || '',
      Conservation: dataModele.Conservation?.[i] || '',
      Semis_profondeur: dataModele.Semis_profondeur?.[i] || '',
      Duree_germ: dataModele.Duree_germ?.[i] || '',
      Temp_germ: dataModele.Temp_germ?.[i] || '',
      Semis_sous_abris: dataModele.Semis_sous_abris?.[i] || [],
      Semis_pleine_terre: dataModele.Semis_pleine_terre?.[i] || [],
      Recolte_floraison: dataModele.Recolte_floraison?.[i] || [],
      Exposition: dataModele.Exposition?.[i] || '',
      Arrosage: dataModele.Arrosage?.[i] || '',
      Nature_du_sol: dataModele.Nature_du_sol?.[i] || [],
      Qualite_du_sol: dataModele.Qualite_du_sol?.[i] || [],
      Famille: dataModele.Famille?.[i] || [],
      Ou_cultiver: dataModele.Ou_cultiver?.[i] || [],
      Infos: dataModele.Infos?.[i] || [],
    }));
    ['v-modele','e-modele-base'].forEach(id => {
      const sel = document.getElementById(id);
      sel.innerHTML = '<option value="">— Choisir un modèle —</option>';
      modeles.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id; opt.textContent = m.Nom;
        sel.appendChild(opt);
      });
    });
    resetModele();
    cacherAlerteDoublonModele();

    /* Enchainement vers la variété avec le modèle pré-sélectionné et pré-rempli */
    if ((chainEnabled() || parcoursLigne) && newModeleId) {
      document.getElementById('v-modele').value = newModeleId;
      chargerModele();
      document.getElementById('v-nom').value = nom;
      goToPanel('variete');
      document.getElementById('v-variete').focus();
      showChainBanner('variete', '🔗 Espèce "' + nom + '" créée — complétez maintenant sa première variété.');
    }
  } catch(e) {
    showMsg('msg-modele', '❌ Erreur : ' + e.message, 'err');
  }
}
/* Lancement */
init();