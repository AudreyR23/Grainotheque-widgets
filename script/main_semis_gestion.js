// ===== État global =====
let modifie = false;
let brouillons = [];   // utilisé à l'étape 2
let enregistrementEnCours = false;
let plantations = [];   // { idSemis, plantes, oups, don } : quantités à ajouter
let recherche = '';   // texte de recherche normalisé

const recordsParId = {
  semis: new Map()
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

function dateAffichee(secondes) {
  return new Date(secondes * 1000).toLocaleDateString('fr-FR', { timeZone: 'UTC' });
}

function dateDuJour() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function dateEnSecondes(iso) {
  const [a, m, j] = iso.split('-').map(Number);
  return Date.UTC(a, m - 1, j) / 1000;
}

function normaliser(texte) {
  return String(texte || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

// ===== Statut =====
function majStatut() {
  const el = document.getElementById('statut');
  const n = brouillons.length + plantations.length;
  modifie = n > 0;
  el.textContent = modifie ? `● Non sauvegardé (${n})` : '✓ À jour';
  el.classList.toggle('non-sauvegarde', modifie);
  document.getElementById('btnEnregistrer').hidden = !modifie;
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
      date: typeof s.Date_s === 'number' ? s.Date_s : null,
      godets: s.Nb_godets || 0,
      graines: s.Nb_graines || 0,
      semees: s.Graines_semees || ((s.Nb_godets || 0) * (s.Nb_graines || 0)),
      plantes: s.Plantes || 0,
      oups: s.Oups || 0,
      don: s.Don_p || 0,
      reste: typeof s.Reste_a_planter === 'number' ? s.Reste_a_planter : 0,
      germes: s.Germes,                               // null = pas encore noté
      duree: s.Germination_duree || null,
      jours: typeof s.Jours_ecoules === 'number' ? s.Jours_ecoules : null,
      info: s.Info_germination                        // 'En attente' | nombre (jours de retard) | 'OK' | 'NG' | ''
    });
  }
}

// ===== Affichage =====
function libelle(s) {
  return s.variete ? `${s.nom} — ${s.variete}` : s.nom;
}

function semisAVerifier() {
  // Germes vide ET durée de germination dépassée (Info_germination = nombre de jours de retard)
  return [...recordsParId.semis.values()]
    .filter(s => (s.germes === null || s.germes === undefined) && typeof s.info === 'number')
    .sort((a, b) => b.info - a.info);
}

function afficherVerifier() {
  const liste = document.getElementById('listeVerifier');
  const titre = document.getElementById('titreVerifier');
  const tous = semisAVerifier();
  const semis = filtrerParRecherche(tous);
  liste.innerHTML = '';
  titre.textContent = recherche
    ? `À vérifier (${semis.length} sur ${tous.length})`
    : `À vérifier (${tous.length})`;

  for (const s of semis) {
    const li = document.createElement('li');
    li.className = 'semis';
    li.dataset.id = s.id;

    const ligne1 = document.createElement('strong');
    ligne1.textContent = libelle(s);

    const ligne2 = document.createElement('div');
    ligne2.className = 'semis-detail';
    ligne2.textContent =
      `semé le ${s.date ? dateAffichee(s.date) : '?'} · ${s.godets} × ${s.graines} graines · ` +
      `germination ${s.duree} j · `;
    const retard = document.createElement('span');
    retard.className = 'semis-retard';
    retard.textContent = `${s.info} j de retard`;
    ligne2.appendChild(retard);

    const brouillon = brouillons.find(b => b.idSemis === s.id);
    li.classList.toggle('brouillon', !!brouillon);

    const saisie = document.createElement('div');
    saisie.className = 'saisie';
    const champ = document.createElement('input');
    champ.type = 'number';
    champ.min = '0';
    champ.step = '1';
    champ.inputMode = 'numeric';
    champ.placeholder = 'Germes';
    champ.className = 'champ-germes';
    if (brouillon) champ.value = brouillon.germes;
    const btnNg = document.createElement('button');
    btnNg.type = 'button';
    btnNg.className = 'btn-ng';
    btnNg.textContent = 'NG';
    saisie.append(champ, btnNg);

    const alerte = document.createElement('div');
    alerte.className = 'alerte-germes';
    alerte.hidden = true;

    li.append(ligne1, ligne2, saisie, alerte);
    majAlerteGermes(s.id);
    liste.appendChild(li);
  }

  const enAttente = [...recordsParId.semis.values()].filter(s => s.info === 'En attente').length;
  document.getElementById('message').textContent =
    `Semis chargés : ${recordsParId.semis.size}\nEn attente (durée pas atteinte) : ${enAttente}`;
    majCompteurs();
}

function majAlerteGermes(idSemis) {
  const li = document.querySelector(`#listeVerifier li[data-id="${idSemis}"]`);
  if (!li) return;
  const alerte = li.querySelector('.alerte-germes');
  const s = recordsParId.semis.get(idSemis);
  const b = brouillons.find(x => x.idSemis === idSemis);
  const trop = !!(b && s && s.semees > 0 && b.germes > s.semees);
  alerte.hidden = !trop;
  if (trop) alerte.textContent = `⚠ ${b.germes} germes pour seulement ${s.semees} graines semées.`;
}

// ===== Recherche et compteurs =====
function filtrerParRecherche(semis) {
  if (!recherche) return semis;
  const mots = recherche.split(' ');
  return semis.filter(s => {
    const texte = normaliser(s.nom + ' ' + s.variete);
    return mots.every(mot => texte.includes(mot));
  });
}

function majCompteurs() {
  document.getElementById('compteurs').textContent =
    `${semisAVerifier().length} à vérifier · ${semisAPlanter().length} à planter`;
}

function initialiserRecherche() {
  document.getElementById('recherche').addEventListener('input', e => {
    recherche = normaliser(e.target.value);
    afficherVerifier();
    afficherPlanter();
  });
}

// ===== Saisie et brouillons =====
function poserBrouillon(idSemis, germes) {
  brouillons = brouillons.filter(b => b.idSemis !== idSemis);
  if (germes !== null) brouillons.push({ idSemis, germes });
  const li = document.querySelector(`#listeVerifier li[data-id="${idSemis}"]`);
  if (li) li.classList.toggle('brouillon', germes !== null);
  majAlerteGermes(idSemis);
  majStatut();
}

function initialiserSaisie() {
  const liste = document.getElementById('listeVerifier');

  liste.addEventListener('input', e => {
    const champ = e.target.closest('.champ-germes');
    if (!champ) return;
    const id = Number(champ.closest('li').dataset.id);
    const texte = champ.value.trim();
    const valeur = Number(texte);
    poserBrouillon(id, texte !== '' && valeur >= 0 ? valeur : null);
  });

  liste.addEventListener('click', e => {
    const btn = e.target.closest('.btn-ng');
    if (!btn) return;
    const li = btn.closest('li');
    const champ = li.querySelector('.champ-germes');
    const id = Number(li.dataset.id);
    if (champ.value === '0') {          // 2e clic : on annule
      champ.value = '';
      poserBrouillon(id, null);
    } else {
      champ.value = '0';
      poserBrouillon(id, 0);
    }
  });

  document.getElementById('btnEnregistrer').addEventListener('click', enregistrerTout);
}

// ===== À planter =====
function semisAPlanter() {
  return [...recordsParId.semis.values()]
    .filter(s => s.germes > 0 && s.reste > 0)
    .sort((a, b) => (a.date || 0) - (b.date || 0));
}

function afficherPlanter() {
  const liste = document.getElementById('listePlanter');
  const tous = semisAPlanter();
  const semis = filtrerParRecherche(tous);
  liste.innerHTML = '';
  document.getElementById('titrePlanter').textContent = recherche
    ? `À planter (${semis.length} sur ${tous.length})`
    : `À planter (${tous.length})`;
  for (const s of semis) {
    const brouillon = plantations.find(p => p.idSemis === s.id);
    const li = document.createElement('li');
    li.className = 'semis';
    li.dataset.id = s.id;
    li.classList.toggle('brouillon', !!brouillon);

    const ligne1 = document.createElement('strong');
    ligne1.textContent = libelle(s);

    const ligne2 = document.createElement('div');
    ligne2.className = 'semis-detail';
    ligne2.textContent =
      `semé le ${s.date ? dateAffichee(s.date) : '?'} · ${s.germes} germes · ` +
      `déjà planté ${s.plantes} · oups ${s.oups} · don ${s.don} · reste ${s.reste}`;

    const saisie = document.createElement('div');
    saisie.className = 'saisie-planter';
    for (const [cle, texte] of [['plantes', 'Plantés'], ['oups', 'Oups'], ['don', 'Don']]) {
      const champ = document.createElement('input');
      champ.type = 'number';
      champ.min = '0';
      champ.step = '1';
      champ.inputMode = 'numeric';
      champ.placeholder = texte;
      champ.dataset.champ = cle;
      if (brouillon && brouillon[cle]) champ.value = brouillon[cle];
      saisie.appendChild(champ);
    }
    const btnTout = document.createElement('button');
    btnTout.type = 'button';
    btnTout.className = 'btn-tout';
    btnTout.textContent = 'Tout';
    saisie.appendChild(btnTout);

    const alerte = document.createElement('div');
    alerte.className = 'alerte-germes';
    alerte.hidden = true;

    li.append(ligne1, ligne2, saisie, alerte);
    liste.appendChild(li);
    majAlertePlanter(s.id);
  }
}

function majAlertePlanter(idSemis) {
  const li = document.querySelector(`#listePlanter li[data-id="${idSemis}"]`);
  if (!li) return;
  const alerte = li.querySelector('.alerte-germes');
  const s = recordsParId.semis.get(idSemis);
  const p = plantations.find(x => x.idSemis === idSemis);
  const total = p ? p.plantes + p.oups + p.don : 0;
  const trop = !!(p && s && total > s.reste);
  alerte.hidden = !trop;
  if (trop) alerte.textContent = `⚠ ${total} saisis pour seulement ${s.reste} restant(s).`;
}

function poserPlantation(idSemis) {
  const li = document.querySelector(`#listePlanter li[data-id="${idSemis}"]`);
  if (!li) return;
  const lire = cle => {
    const v = Number(li.querySelector(`[data-champ="${cle}"]`).value);
    return v > 0 ? v : 0;
  };
  const p = { idSemis, plantes: lire('plantes'), oups: lire('oups'), don: lire('don') };
  plantations = plantations.filter(x => x.idSemis !== idSemis);
  const vide = p.plantes === 0 && p.oups === 0 && p.don === 0;
  if (!vide) plantations.push(p);
  li.classList.toggle('brouillon', !vide);
  majAlertePlanter(idSemis);
  majStatut();
}

function initialiserPlanter() {
  const liste = document.getElementById('listePlanter');
  document.getElementById('datePlantation').value = dateDuJour();

  liste.addEventListener('input', e => {
    const champ = e.target.closest('input[data-champ]');
    if (!champ) return;
    poserPlantation(Number(champ.closest('li').dataset.id));
  });

  liste.addEventListener('click', e => {
    const btn = e.target.closest('.btn-tout');
    if (!btn) return;
    const li = btn.closest('li');
    const id = Number(li.dataset.id);
    const s = recordsParId.semis.get(id);
    li.querySelector('[data-champ="plantes"]').value = s.reste;
    li.querySelector('[data-champ="oups"]').value = '';
    li.querySelector('[data-champ="don"]').value = '';
    poserPlantation(id);
  });
}

// ===== Enregistrement =====
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
  if ((brouillons.length === 0 && plantations.length === 0) || enregistrementEnCours) return;
  const dateP = document.getElementById('datePlantation').value;
  if (plantations.some(p => p.plantes > 0) && !dateP) {
    afficherErreurEnregistrement('Renseigne la date de plantation.');
    return;
  }

  enregistrementEnCours = true;
  const bouton = document.getElementById('btnEnregistrer');
  bouton.disabled = true;
  bouton.textContent = 'Enregistrement…';
  afficherSucces('');
  afficherErreurEnregistrement('');

  const n = brouillons.length + plantations.length;
  try {
    const actions = [];
    if (brouillons.length) {
      actions.push([
        'BulkUpdateRecord', 'Semis',
        brouillons.map(b => b.idSemis),
        { Germes: brouillons.map(b => b.germes) }
      ]);
    }
    for (const p of plantations) {
      const s = recordsParId.semis.get(p.idSemis);
      if (!s) continue;
      const champs = {};
      if (p.plantes > 0) { champs.Plantes = s.plantes + p.plantes; champs.Date_p = dateEnSecondes(dateP); }
      if (p.oups > 0) champs.Oups = s.oups + p.oups;
      if (p.don > 0) champs.Don_p = s.don + p.don;
      actions.push(['UpdateRecord', 'Semis', p.idSemis, champs]);
    }
    await grist.docApi.applyUserActions(actions);
    brouillons = [];
    plantations = [];
    majStatut();
    afficherSucces(`✓ ${n} ligne${n > 1 ? 's' : ''} mise${n > 1 ? 's' : ''} à jour.`);
    await chargerSemis();
    afficherVerifier();
    afficherPlanter();
  } catch (err) {
    console.error(err);
    afficherErreurEnregistrement('Échec de l\'enregistrement : ' + err.message + ' — tes saisies sont conservées.');
  } finally {
    enregistrementEnCours = false;
    bouton.disabled = false;
    bouton.textContent = 'Enregistrer tout';
  }
} 

window.addEventListener('beforeunload', e => {
  if (modifie) { e.preventDefault(); e.returnValue = ''; }
});

// ===== Initialisation =====
grist.ready({ requiredAccess: 'full' });

chargerSemis()
  .then(() => {
    afficherVerifier();
    afficherPlanter();
    initialiserSaisie();
    initialiserPlanter();
    initialiserRecherche();
    majStatut();
    console.log('Exemple semis :', [...recordsParId.semis.values()][0]);
  })
  .catch(err => {
    console.error(err);
    document.getElementById('message').textContent = 'Erreur de chargement : ' + err.message;
  });