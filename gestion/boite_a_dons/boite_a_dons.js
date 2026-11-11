// ===== État global =====
let donnees = null;
let typeActif = '';   // '' = tous les types
const selection = new Map();   // id variété -> nombre de sachets demandés
let texteRecherche = '';
let moisChoisi = '';   // '' = tous les mois, sinon l'abréviation (ex. 'Mar')
const NOMS_MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Juil', 'Aou', 'Sep', 'Oct', 'Nov', 'Déc'];
const MOIS_LONGS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const varietesParId = new Map();
const CLE_STOCKAGE = 'boite_a_dons_selection';

// ===== Utilitaires =====
function creer(balise, classe, texte) {
  const element = document.createElement(balise);
  if (classe) element.className = classe;
  if (texte) element.textContent = texte;
  return element;
}

function libelleSachets(nombre) {
  return nombre + (nombre > 1 ? ' sachets' : ' sachet');
}

function totalSachets(variete) {
  return variete.millesimes.reduce((somme, m) => somme + (m.sachets || 0), 0);
}

function sauvegarderSelection() {
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify({
      selection: [...selection],
      prenom: document.getElementById('prenom').value
    }));
  } catch (erreur) {
    // stockage indisponible (navigation privée…) : on continue sans mémoriser
  }
}

function restaurerSelection() {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    if (brut) {
      const sauvegarde = JSON.parse(brut);
      for (const [id, nombre] of sauvegarde.selection || []) {
        const variete = varietesParId.get(id);
        if (!variete) continue;                       // plus en don
        const n = Math.min(totalSachets(variete), Number(nombre) || 0);
        if (n > 0) selection.set(id, n);
      }
      document.getElementById('prenom').value = sauvegarde.prenom || '';
    }
  } catch (erreur) {
    // données illisibles : on repart de zéro
  }
  majBarre();
}

// ===== Rendu =====

function majBarre() {
  const sachets = [...selection.values()].reduce((somme, n) => somme + n, 0);
  document.getElementById('barreSelection').hidden = selection.size === 0;
  document.getElementById('resumeSelection').textContent =
    'Ma sélection : ' + libelleSachets(sachets) + ' · ' +
    selection.size + (selection.size > 1 ? ' variétés' : ' variété');
}

function changerQuantite(variete, zone, delta) {
  const maximum = totalSachets(variete);
  const nombre = Math.min(maximum, Math.max(0, (selection.get(variete.id) || 0) + delta));
  if (nombre === 0) selection.delete(variete.id);
  else selection.set(variete.id, nombre);
  remplirSelecteur(zone, variete);
  majBarre();
  sauvegarderSelection();
}

function remplirSelecteur(zone, variete) {
  zone.replaceChildren();
  const nombre = selection.get(variete.id) || 0;
  const maximum = totalSachets(variete);

  if (nombre === 0) {
    const bouton = creer('button', 'btn-demande', "J'en veux");
    bouton.type = 'button';
    bouton.addEventListener('click', () => changerQuantite(variete, zone, 1));
    zone.appendChild(bouton);
    return;
  }

  const moins = creer('button', 'btn-quantite', '−');
  moins.type = 'button';
  moins.addEventListener('click', () => changerQuantite(variete, zone, -1));
  const plus = creer('button', 'btn-quantite', '+');
  plus.type = 'button';
  plus.disabled = nombre >= maximum;
  plus.addEventListener('click', () => changerQuantite(variete, zone, 1));

  zone.append(moins, creer('span', 'quantite', String(nombre)), plus,
    creer('span', 'champ-libelle', 'sur ' + maximum + ' dispo'));
}

function creerCarte(variete) {
  const carte = creer('article', 'carte');

  const entete = creer('div', 'carte-entete');
  const titres = creer('div');
  titres.appendChild(creer('h2', 'carte-nom', variete.nom));
  if (variete.variete) titres.appendChild(creer('p', 'carte-variete', variete.variete));
  entete.appendChild(titres);
  entete.appendChild(creer('span', 'etiquette etiquette-total', libelleSachets(totalSachets(variete))));
  carte.appendChild(entete);

  if (variete.description) carte.appendChild(creer('p', 'carte-description', variete.description));

  const zoneSelection = creer('div', 'selecteur');
  remplirSelecteur(zoneSelection, variete);
  carte.appendChild(zoneSelection);

  const fiche = creer('details', 'fiche');
  fiche.appendChild(creer('summary', '', 'Voir la fiche'));
  fiche.appendChild(creerBloc('Culture', [
    creerChamp('Type', variete.type),
    creerChamp('Famille', variete.famille),
    creerChamp('Exposition', variete.exposition),
    creerChamp('Arrosage', variete.arrosage),
    creerChamp('Où cultiver', variete.ou_cultiver),
    creerChamp('Nature du sol', variete.nature_du_sol),
    creerChamp('Qualité du sol', variete.qualite_du_sol),
    creerChamp('Infos', variete.infos)
  ]));
  fiche.appendChild(creerBloc('Semis & germination', [
    creerChamp('Semis s/abri', variete.semis_sous_abris),
    creerChamp('Semis PT', variete.semis_pleine_terre),
    creerChamp('Récolte', variete.recolte_floraison),
    creerChamp('Profondeur', variete.semis_profondeur),
    creerChamp('Durée germ.', variete.duree_germ != null ? variete.duree_germ + ' j' : ''),
    creerChamp('T° germ.', variete.temp_germ)
  ]));
  carte.appendChild(fiche);

  return carte;
}

function normaliser(texte) {
  return String(texte || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function correspond(variete) {
  if (typeActif && variete.type !== typeActif) return false;
   if (moisChoisi && !variete.semis_sous_abris.includes(moisChoisi) && !variete.semis_pleine_terre.includes(moisChoisi)) return false;
  if (texteRecherche) {
    const cible = normaliser([variete.nom, variete.variete, variete.description].join(' '));
    if (!texteRecherche.split(' ').every(mot => cible.includes(mot))) return false;
  }
  return true;
}

function afficherListe() {
  const conteneur = document.getElementById('liste');
  conteneur.replaceChildren();
  const affichees = donnees.varietes.filter(correspond);
  affichees.forEach(v => conteneur.appendChild(creerCarte(v)));
  if (!affichees.length) conteneur.appendChild(creer('p', 'aide', 'Aucune variété ne correspond.'));

  const filtres = [];
  if (typeActif) filtres.push(typeActif);
    if (moisChoisi) filtres.push('à semer en ' + MOIS_LONGS[NOMS_MOIS.indexOf(moisChoisi)].toLowerCase());
  const date = new Date(donnees.genere_le).toLocaleDateString('fr-FR');
  document.getElementById('sousTitre').textContent =
    affichees.length + ' variété(s) disponible(s)' +
    (filtres.length ? ' · ' + filtres.join(' · ') : '') + ' · mis à jour le ' + date;
}

function creerChamp(libelle, valeur) {
  const champ = creer('div', 'champ');
  champ.appendChild(creer('div', 'champ-libelle', libelle));
  const contenu = creer('div', 'champ-valeur');
  const valeurs = Array.isArray(valeur) ? valeur : (valeur ? [valeur] : []);
  valeurs.forEach(x => contenu.appendChild(creer('span', 'etiquette', String(x))));
  champ.appendChild(contenu);
  return champ;
}

function creerBloc(titre, champs) {
  const bloc = creer('section', 'bloc');
  bloc.appendChild(creer('h3', 'bloc-titre', titre));
  const grille = creer('div', 'bloc-grille');
  champs.forEach(c => grille.appendChild(c));
  bloc.appendChild(grille);
  return bloc;
}

function creerPastille(type, libelle) {
  const bouton = creer('button', 'pastille', libelle);
  bouton.type = 'button';
  bouton.dataset.type = type;
  bouton.addEventListener('click', () => {
    typeActif = type;
    majPastilles();
    afficherListe();
  });
  return bouton;
}

function majPastilles() {
  document.querySelectorAll('.pastille').forEach(bouton =>
    bouton.classList.toggle('active', bouton.dataset.type === typeActif));
}

function creerPastilles() {
  const nav = document.getElementById('pastilles');
  nav.replaceChildren();
  const comptes = new Map();
  donnees.varietes.forEach(v => {
    if (v.type) comptes.set(v.type, (comptes.get(v.type) || 0) + 1);
  });
  const types = [...comptes.keys()].sort((a, b) => a.localeCompare(b, 'fr'));
  nav.appendChild(creerPastille('', 'Tous (' + donnees.varietes.length + ')'));
  types.forEach(t => nav.appendChild(creerPastille(t, t + ' (' + comptes.get(t) + ')')));
  majPastilles();
}

// ===== Panneau « Ma sélection » =====
function lignesSelection() {
  const lignes = [];
  for (const [id, nombre] of selection) {
    const v = varietesParId.get(id);
    if (!v) continue;
    const nom = v.variete ? v.nom + ' (' + v.variete + ')' : v.nom;
    lignes.push({ nom: nom, nombre: nombre });
  }
  lignes.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  return lignes;
}

function construireMessage() {
  const prenom = document.getElementById('prenom').value.trim();
  const texte = [prenom ? 'Bonjour, ici ' + prenom + '.' : 'Bonjour,'];
  texte.push('Je voudrais ces graines de ta boîte à dons :');
  lignesSelection().forEach(l => texte.push('- ' + l.nom + ' : ' + libelleSachets(l.nombre)));
  texte.push('Merci !');
  return texte.join('\n');
}

function ouvrirPanneau() {
  const liste = document.getElementById('listeSelection');
  liste.replaceChildren();
  lignesSelection().forEach(l =>
    liste.appendChild(creer('li', '', l.nom + ' : ' + libelleSachets(l.nombre))));
  document.getElementById('message').value = construireMessage();
  document.getElementById('retourCopie').textContent = '';
  document.getElementById('panneau').showModal();
}

async function copierMessage() {
  const zone = document.getElementById('message');
  const retour = document.getElementById('retourCopie');
  try {
    await navigator.clipboard.writeText(zone.value);
    retour.textContent = 'Message copié.';
  } catch (erreur) {
    zone.select();
    retour.textContent = document.execCommand('copy')
      ? 'Message copié.'
      : 'Copie impossible : sélectionne le texte et copie-le à la main.';
  }
}

async function partagerMessage() {
  try {
    await navigator.share({ text: document.getElementById('message').value });
  } catch (erreur) {
    // partage annulé : rien à faire
  }
}

function initialiserPanneau() {
  document.getElementById('btnVoirSelection').addEventListener('click', ouvrirPanneau);
  document.getElementById('btnCopier').addEventListener('click', copierMessage);
  document.getElementById('btnFermer').addEventListener('click', () =>
    document.getElementById('panneau').close());
  document.getElementById('prenom').addEventListener('input', () => {
    document.getElementById('message').value = construireMessage();
    sauvegarderSelection();
  });
    if (navigator.share) {
    const bouton = document.getElementById('btnPartager');
    bouton.hidden = false;
    bouton.addEventListener('click', partagerMessage);
  }
}

function initialiserFiltres() {
  const liste = document.getElementById('selectMois');
  liste.replaceChildren();
  const tous = creer('option', '', 'À semer en : tous les mois');
  tous.value = '';
  liste.appendChild(tous);
  NOMS_MOIS.forEach((abreviation, i) => {
    const option = creer('option', '', MOIS_LONGS[i]);
    option.value = abreviation;
    liste.appendChild(option);
  });
  liste.addEventListener('change', () => {
    moisChoisi = liste.value;
    liste.classList.toggle('active', moisChoisi !== '');
    afficherListe();
  });
  document.getElementById('recherche').addEventListener('input', evenement => {
    texteRecherche = normaliser(evenement.target.value.trim());
    afficherListe();
  });
}

// ===== Démarrage =====
async function demarrer() {
  try {
    const reponse = await fetch('./dons.json?v=' + Date.now());
    if (!reponse.ok) throw new Error('dons.json introuvable (' + reponse.status + ')');
    donnees = await reponse.json();
    donnees.varietes.forEach(v => varietesParId.set(v.id, v));
    restaurerSelection();
    creerPastilles();
    afficherListe();
    initialiserPanneau();
    initialiserFiltres();
  } catch (erreur) {
    document.getElementById('sousTitre').textContent = 'Erreur : ' + erreur.message;
    console.error(erreur);
  }
}

demarrer();