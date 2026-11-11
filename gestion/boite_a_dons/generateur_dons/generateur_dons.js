// ===== État global =====
let jsonGenere = null;
const varietesParId = new Map();

// ===== Utilitaires =====
function majStatut(texte) {
  document.getElementById('statut').textContent = texte;
}

// Grist renvoie les ChoiceList sous la forme ['L', 'a', 'b'] : on retire le 'L'
function nettoyerListe(valeur) {
  if (!Array.isArray(valeur)) return [];
  return valeur[0] === 'L' ? valeur.slice(1) : valeur;
}

// fetchTable renvoie des colonnes ; on les transforme en lignes
function enLignes(table) {
  const cles = Object.keys(table);
  const lignes = [];
  for (let i = 0; i < table.id.length; i++) {
    const ligne = {};
    for (const cle of cles) ligne[cle] = table[cle][i];
    lignes.push(ligne);
  }
  return lignes;
}

// ===== Génération =====
async function generer() {
  majStatut('Lecture des données…');
  const [tabVarietes, tabMillesimes] = await Promise.all([
    grist.docApi.fetchTable('Varietes'),
    grist.docApi.fetchTable('Millesimes')
  ]);

  varietesParId.clear();
  enLignes(tabVarietes).forEach(v => varietesParId.set(v.id, v));

  // Regroupement des millésimes donnés, par variété
  const donsParVariete = new Map();
  for (const m of enLignes(tabMillesimes)) {
    if (!(m.Don > 0)) continue;
    const variete = varietesParId.get(m.NomVariete);
    if (!variete) continue;
    if (!donsParVariete.has(variete.id)) donsParVariete.set(variete.id, []);
    donsParVariete.get(variete.id).push({
      sachets: m.Don
    });
  }

  const liste = [];
  for (const [id, millesimes] of donsParVariete) {
    const v = varietesParId.get(id);
    liste.push({
      id: id,
      nom: v.Nom || '',
      variete: v.Variete || '',
      description: v.Description || '',
      type: v.Type || '',
      famille: nettoyerListe(v.Famille),
      exposition: v.Exposition || '',
      arrosage: v.Arrosage || '',
      nature_du_sol: nettoyerListe(v.Nature_du_sol),
      qualite_du_sol: nettoyerListe(v.Qualite_du_sol),
      ou_cultiver: nettoyerListe(v.Ou_cultiver),
      infos: nettoyerListe(v.Infos),
      semis_sous_abris: nettoyerListe(v.Semis_sous_abris),
      semis_pleine_terre: nettoyerListe(v.Semis_pleine_terre),
      recolte_floraison: nettoyerListe(v.Recolte_floraison),
      semis_profondeur: v.Semis_profondeur || '',
      duree_germ: v.Duree_germ ?? null,
      temp_germ: v.Temp_germ || '',
      conservation: v.Conservation ?? null,
      millesimes: millesimes
    });
  }
  liste.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

  jsonGenere = { genere_le: new Date().toISOString(), varietes: liste };

  const nbMillesimes = liste.reduce((s, v) => s + v.millesimes.length, 0);
  document.getElementById('resume').textContent =
    liste.length + ' variété(s), ' + nbMillesimes + ' millésime(s) en don.';
  document.getElementById('apercu').value = JSON.stringify(jsonGenere, null, 2);
  document.getElementById('btnTelecharger').disabled = false;
  majStatut('Généré à ' + new Date().toLocaleTimeString('fr-FR'));
}

function telecharger() {
  if (!jsonGenere) return;
  const blob = new Blob([JSON.stringify(jsonGenere, null, 2)], { type: 'application/json' });
  const lien = document.createElement('a');
  lien.href = URL.createObjectURL(blob);
  lien.download = 'dons.json';
  lien.click();
  URL.revokeObjectURL(lien.href);
}

// ===== Démarrage =====
grist.ready({ requiredAccess: 'full' });
document.getElementById('btnGenerer').addEventListener('click', generer);
document.getElementById('btnTelecharger').addEventListener('click', telecharger);