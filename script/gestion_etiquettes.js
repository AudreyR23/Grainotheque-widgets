// ===== État global =====
let modifie = false;
let brouillons = [];   // { idSemis, nb } : étiquettes à ajouter
let enregistrementEnCours = false;
let recherche = '';
let enCoursVisible = false;
const recordsParId = {
  semis: new Map()
};

// ===== Utilitaires (copiés de ton outil) =====
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

function normaliser(texte) {
  return String(texte || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

/*ajouter choix du ou*/
function listeChoix(valeur) {
  // ChoiceList Grist : ['L', 'a', 'b'] → ['a', 'b']
  return Array.isArray(valeur) && valeur[0] === 'L' ? valeur.slice(1) : [];
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
      positions: s.Positions || '',
      nbEtiquettes: s.Nb_etiquettes || 0,
      enAttente: s.Etiq_en_attente || 0,
      planteMere: !!s.Plante_mere,
      anneePlantation: s.Annee_plantation_mil || null
    });
  }
}

// ===== Sélection =====
function entreesEtiquetables() {
  return [...recordsParId.semis.values()].filter(s =>
    s.planteMere ? !!s.anneePlantation : s.plantes > 0);
}

// ===== Affichage =====
function libelle(s) {
  return s.variete ? `${s.nom} — ${s.variete}` : s.nom;
}

function detailEntree(s) {
  const parties = [];
  if (s.plantes > 0) {
    parties.push(`${s.plantes} planté${s.plantes > 1 ? 's' : ''}` +
      (s.datePlantation ? ` le ${dateAffichee(s.datePlantation)}` : ''));
  }
  if (s.anneeGraine) parties.push(`graines ${s.anneeGraine}`);
  if (s.ou.length) parties.push(`Où : ${s.ou.join(', ')}`);
  return parties.join(' · ');
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
  const liste = document.getElementById('listeSelection');
  const tous = entreesEtiquetables().sort((a, b) =>
    libelle(a).localeCompare(libelle(b), 'fr') || a.id - b.id);
  const semis = filtrerParRecherche(tous);
  liste.innerHTML = '';
  document.getElementById('titreSelection').textContent = recherche
    ? `À étiqueter (${semis.length} sur ${tous.length})`
    : `À étiqueter (${tous.length})`;

  for (const s of semis) {
    const li = document.createElement('li');
    li.className = 'carte';
    li.dataset.id = s.id;
        if (s.planteMere) li.classList.add('plantemere');

    const texte = document.createElement('div');
    texte.className = 'carte-texte';
    const ligne1 = document.createElement('strong');
    ligne1.textContent = libelle(s);
    const ligne2 = document.createElement('div');
    ligne2.className = 'carte-detail';
    ligne2.textContent = detailEntree(s);
        texte.appendChild(ligne1);
    if (s.planteMere) {
      const mere = document.createElement('div');
      mere.className = 'carte-mention texte-plantemere';
      mere.textContent = '🌱 Plante mère' + (s.anneePlantation ? ` (plantée en ${s.anneePlantation})` : '');
      texte.appendChild(mere);
    }
    texte.appendChild(ligne2);

        if (s.nbEtiquettes > 0 || s.enAttente > 0) {
      const cadre = document.createElement('div');
      cadre.className = 'cadre-info-a-jour';

      const info = document.createElement('div');
      info.className = 'cadre-info-a-jour-titre';
      const morceaux = [];
      if (s.nbEtiquettes > 0) morceaux.push(`${s.nbEtiquettes} à imprimer`);
      if (s.enAttente > 0) morceaux.push(`${s.enAttente} imprimée${s.enAttente > 1 ? 's' : ''} en attente`);
      info.textContent = morceaux.join(' · ');

      cadre.appendChild(info);
      texte.appendChild(cadre);
    }

    const brouillon = brouillons.find(b => b.idSemis === s.id);
    const champ = document.createElement('input');
    champ.type = 'number';
    champ.min = '1';
    champ.step = '1';
    champ.inputMode = 'numeric';
    champ.placeholder = 'Nb';
    champ.title = 'Nombre d\'étiquettes à ajouter';
    champ.className = 'champ champ-etiquettes';
    if (brouillon) champ.value = brouillon.nb;

    li.append(texte, champ);
    liste.appendChild(li);
  }
  majCompteurs();
}

function majCompteurs() {
  document.getElementById('compteurs').textContent =
    `${entreesEtiquetables().length} à étiqueter`;
}

function initialiserRecherche() {
  document.getElementById('recherche').addEventListener('input', e => {
    recherche = normaliser(e.target.value);
    afficherSelection();
  });
}

// ===== Statut =====
function majStatut() {
  const el = document.getElementById('statut');
  const n = brouillons.length;
  modifie = n > 0;
  el.textContent = modifie ? `● Non sauvegardé (${n})` : '✓ À jour';
  el.classList.toggle('non-sauvegarde', modifie);
  document.getElementById('btnEnregistrer').hidden = !modifie;
  afficherEnCours();
}

// ===== Saisie et brouillons =====
function poserBrouillon(idSemis, nb) {
  brouillons = brouillons.filter(b => b.idSemis !== idSemis);
  if (nb !== null) brouillons.push({ idSemis, nb });
  majStatut();
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
    document.getElementById('btnEnregistrer').addEventListener('click', enregistrerTout);
}
// ===== Section « En cours » =====
function afficherEnCours() {
  const n = brouillons.length;
  document.getElementById('enCours').hidden = n === 0;
  document.getElementById('titreEnCours').textContent = `En cours (${n})`;
  document.getElementById('btnVoirEnCours').textContent = `Voir les « En cours » (${n})`;

  const liste = document.getElementById('listeEnCours');
  liste.innerHTML = '';
  for (const b of brouillons) {
    const s = recordsParId.semis.get(b.idSemis);
    const li = document.createElement('li');
    li.className = 'brouillon';

    const texte = document.createElement('div');
    const ligne1 = document.createElement('strong');
    ligne1.textContent = s ? (s.planteMere ? '🌱 ' : '') + libelle(s) : '(ligne inconnue)';       texte.appendChild(ligne1);
    if (s && s.ou.length) {
      const ligneOu = document.createElement('div');
      ligneOu.className = 'brouillon-detail';
      ligneOu.textContent = s.ou.join(', ');
      texte.appendChild(ligneOu);
    }
    const ligneNb = document.createElement('div');
    ligneNb.className = 'brouillon-nb';
    ligneNb.textContent = `+ ${b.nb} étiquette${b.nb > 1 ? 's' : ''}`;
    texte.appendChild(ligneNb);
        if (s && (s.nbEtiquettes > 0 || s.enAttente > 0)) {
      const alerte = document.createElement('div');
      alerte.className = 'brouillon-alerte';
      const morceaux = [];
      if (s.nbEtiquettes > 0) morceaux.push(`${s.nbEtiquettes} déjà à imprimer`);
      if (s.enAttente > 0) morceaux.push(`${s.enAttente} en attente`);
      alerte.textContent = '⚠ ' + morceaux.join(' · ');
      texte.appendChild(alerte);
    }

    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'btn-suppr';
    bouton.textContent = '✕';
    bouton.title = 'Retirer de la liste';
    bouton.dataset.id = b.idSemis;

    li.append(texte, bouton);
    liste.appendChild(li);
  }
  majBoutonVoir();
}

function majBoutonVoir() {
  document.getElementById('btnVoirEnCours').hidden = brouillons.length === 0 || enCoursVisible;
}

function initialiserEnCours() {
  const section = document.getElementById('enCours');

  // Le bouton flottant n'apparaît que si la section « En cours » est hors de l'écran
  new IntersectionObserver(entrees => {
    enCoursVisible = entrees[0].isIntersecting;
    majBoutonVoir();
  }).observe(section);

  document.getElementById('btnVoirEnCours').addEventListener('click', () => {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // ✕ : retire le brouillon et vide le champ de la ligne (écran uniquement, rien dans Grist)
  document.getElementById('listeEnCours').addEventListener('click', e => {
    const btn = e.target.closest('.btn-suppr');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    poserBrouillon(id, null);
    const champ = document.querySelector(`#listeSelection li[data-id="${id}"] .champ-etiquettes`);
    if (champ) champ.value = '';
  });
}
// ===== Enregistrement =====
let minuterieSucces = null;

function afficherSucces(texte) {
  const el = document.getElementById('messageSucces');
  clearTimeout(minuterieSucces);
  el.textContent = texte;
  el.hidden = !texte;
  if (texte) {
    minuterieSucces = setTimeout(() => afficherSucces(''), 5000);
  }
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
  bouton.textContent = 'Enregistrement…';
  afficherSucces('');
  afficherErreurEnregistrement('');

  const n = brouillons.length;
  try {
    // 1. Relire les valeurs actuelles dans Grist (l'impression a pu les remettre à 0)
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
    afficherErreurEnregistrement('Échec de l\'enregistrement : ' + err.message + ' — tes saisies sont conservées.');
  } finally {
    enregistrementEnCours = false;
    bouton.disabled = false;
    bouton.textContent = 'Enregistrer';
  }
}

window.addEventListener('beforeunload', e => {
  if (modifie) { e.preventDefault(); e.returnValue = ''; }
});

// ===== Initialisation =====
grist.ready({ requiredAccess: 'full' });

chargerSemis()
  .then(() => {
    afficherSucces('');
    afficherSelection();
    initialiserRecherche();
    initialiserSaisie();
    initialiserEnCours();
    majStatut();
    const plants = entreesEtiquetables().filter(s => !s.planteMere).length;
    const meres  = entreesEtiquetables().filter(s => s.planteMere).length;
    document.getElementById('message').textContent =
      `Semis chargés : ${recordsParId.semis.size}\nPlants plantés : ${plants}\nPlantes mères : ${meres}`;
  })
  .catch(err => {
    console.error(err);
    document.getElementById('message').textContent = 'Erreur de chargement : ' + err.message;
  });