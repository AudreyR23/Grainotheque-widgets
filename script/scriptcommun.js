// ===== Fonctions communes aux outils =====
// Règle : uniquement des fonctions qui n'utilisent que leurs paramètres
// (aucune variable propre à un outil : etat, modifie, recordsParId...).

function tableEnLignes(tableau) {
  // fetchTable renvoie {colonne: [valeurs...]} → [{id, colonne...}, ...]
  const colonnes = Object.keys(tableau);
  const lignes = [];
  for (let i = 0; i < tableau.id.length; i++) {
    const ligne = {};
    for (const c of colonnes) ligne[c] = tableau[c][i];
    lignes.push(ligne);
  }
  return lignes;
}

function listeChoix(valeur) {
  // ChoiceList Grist : ['L', 'a', 'b'] → ['a', 'b']
  return Array.isArray(valeur) && valeur[0] === 'L' ? valeur.slice(1) : [];
}

function normaliser(texte) {
  // minuscules, sans accents, espaces simplifiés
  return String(texte || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

function anneeDepuisDate(secondes) {
  return typeof secondes === 'number' ? new Date(secondes * 1000).getUTCFullYear() : null;
}

function dateAffichee(secondes) {
  return new Date(secondes * 1000).toLocaleDateString('fr-FR', { timeZone: 'UTC' });
}

function typeInverse(type) {
  // « Arom.Méd 🌿 » → « 🌿 Arom.Méd » (emoji d'abord, puis le texte)
  const m = String(type || '').match(/^(.*?)\s*(\p{Extended_Pictographic}.*)$/u);
  return m ? `${m[2]} ${m[1]}`.trim() : String(type || '');
}