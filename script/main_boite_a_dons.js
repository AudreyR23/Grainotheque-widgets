// ===== État global =====
let donnees = null;
const varietesParId = new Map();

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

// ===== Rendu =====
function creerCarte(variete) {
  const carte = creer('article', 'carte');

  const entete = creer('div', 'carte-entete');
  const titres = creer('div');
  titres.appendChild(creer('h2', 'carte-nom', variete.nom));
  if (variete.variete) titres.appendChild(creer('p', 'carte-variete', variete.variete));
  entete.appendChild(titres);
  entete.appendChild(creer('span', 'etiquette etiquette-total', libelleSachets(totalSachets(variete))));
  carte.appendChild(entete);

  if (variete.type) {
    const ligneType = creer('p');
    ligneType.appendChild(creer('span', 'etiquette', variete.type));
    carte.appendChild(ligneType);
  }

  if (variete.description) carte.appendChild(creer('p', 'carte-description', variete.description));

  const liste = creer('ul', 'millesimes');
  for (const m of variete.millesimes) {
    const morceaux = [m.annee || 'Année ?'];
    if (m.origine.length) morceaux.push('Origine : ' + m.origine.join(', '));
    morceaux.push(libelleSachets(m.sachets));
    liste.appendChild(creer('li', '', morceaux.join(' · ')));
  }
  carte.appendChild(liste);

  return carte;
}

function afficherListe() {
  const conteneur = document.getElementById('liste');
  conteneur.replaceChildren();
  donnees.varietes.forEach(v => {
    varietesParId.set(v.id, v);
    conteneur.appendChild(creerCarte(v));
  });

  const date = new Date(donnees.genere_le).toLocaleDateString('fr-FR');
  document.getElementById('sousTitre').textContent =
    donnees.varietes.length + ' variété(s) disponible(s) · mis à jour le ' + date;
}

// ===== Démarrage =====
async function demarrer() {
  try {
    const reponse = await fetch('./dons.json?v=' + Date.now());
    if (!reponse.ok) throw new Error('dons.json introuvable (' + reponse.status + ')');
    donnees = await reponse.json();
    afficherListe();
  } catch (erreur) {
    document.getElementById('sousTitre').textContent = 'Erreur : ' + erreur.message;
    console.error(erreur);
  }
}

demarrer();