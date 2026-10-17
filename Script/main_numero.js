 // =============================================
// CONFIGURATION
// =============================================
const ROWS_PER_COL = 20;
const COLS_PER_PAGE = 3;
const PER_PAGE = ROWS_PER_COL * COLS_PER_PAGE;

// 🔹 Détection automatique (à utiliser plus tard)
// const bouchonne = typeof grist === 'undefined';

// 🔹 Pour l'instant, forcez le mode Grist
const bouchonne = false; // Mode Grist activé

  
// =============================================
// FONCTIONS POUR L'AFFICHAGE DES ÉPINGLES
// =============================================
function makeEntry(g) {
  const div = document.createElement('div');
  div.className = 'entry';
  div.innerHTML = `
    <div class="cell cell-type">${g.type || ''}</div>
    <div class="cell cell-name">
      <span class="nom">${g.nom || ''}</span>
      ${g.variete ? `<span class="variete">${g.variete}</span>` : ''}
    </div>
    <div class="cell cell-num">${g.num}</div>
  `;
  return div;
}

function render(data) {
  const sorted = data
    .filter(r => r.num && r.num > 0)
    .sort((a, b) => a.num - b.num);

  document.getElementById('info-count').textContent = sorted.length + ' graines avec numéro d\'épingle';

  const pagesEl = document.getElementById('pages');
  pagesEl.innerHTML = '';

  for (let p = 0; p < Math.ceil(sorted.length / PER_PAGE); p++) {
    const pageData = sorted.slice(p * PER_PAGE, (p + 1) * PER_PAGE);
    const page = document.createElement('div');
    page.className = 'page-epingles';

    for (let col = 0; col < COLS_PER_PAGE; col++) {
      const column = document.createElement('div');
      column.className = 'column';
      const startIndex = col * ROWS_PER_COL;
      const endIndex = startIndex + ROWS_PER_COL;
      const columnData = pageData.slice(startIndex, endIndex);
      columnData.forEach(g => column.appendChild(makeEntry(g)));
      page.appendChild(column);
    }
    pagesEl.appendChild(page);
  }
}

// =============================================
// CHARGEMENT DES DONNÉES LOCALES (Mode Bouchon)
// =============================================
async function chargerDonneesLocales(nomFichier) {
  try {
    // En local (Codium + Live Server) : utilisez un chemin relatif
    const response = await fetch(`../data/${nomFichier}.json`);
    if (!response.ok) {
      throw new Error(`Fichier ../data/${nomFichier}.json introuvable. Statut: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erreur lors du chargement de ../data/${nomFichier}.json :`, error);
    return null;
  }
}

async function initialiserDonneesLocales() {
  try {
    const varietesData = await chargerDonneesLocales("Varietes");
    if (!varietesData || typeof varietesData !== 'object') {
      console.error("❌ ../data/Varietes.json est introuvable ou invalide !");
      return;
    }

    const varietesArray = Object.values(varietesData);
    const seen = new Set();
    const filteredData = varietesArray
      .filter(r => r.Num_epingle && r.Num_epingle > 0)
      .filter(r => {
        if (seen.has(r.Num_epingle)) return false;
        seen.add(r.Num_epingle);
        return true;
      })
      .map(r => ({
        type: r.Type || '',
        nom: r.Nom || '',
        variete: r.Variete || '',
        num: r.Num_epingle,
      }));

    render(filteredData);
  } catch (error) {
    console.error("Erreur dans initialiserDonneesLocales :", error);
  }
}

// =============================================
// CHARGEMENT DES DONNÉES DEPUIS GRIST
// =============================================
async function chargerDonneesGrist() {
  try {
    // Charger la table Varietes depuis Grist
    const varietesData = await grist.docApi.fetchTable('Varietes');
    if (!varietesData || !varietesData.id) {
      console.error("❌ La table Varietes est introuvable dans Grist !");
      return null;
    }

    // Convertir les données de Grist en objet varietesParNom
    const varietesParNom = {};
    const ids = varietesData.id || [];
    for (let i = 0; i < ids.length; i++) {
      const nom = varietesData.Nom ? varietesData.Nom[i] : '';
      const variete = varietesData.Variete ? varietesData.Variete[i] : '';
      const nomComplet = `${nom}\n${variete}`.trim();
      if (!nomComplet) continue;

      varietesParNom[nomComplet] = {
        Type: varietesData.Type ? varietesData.Type[i] : '',
        Nom: nom,
        Variete: variete,
        Num_epingle: varietesData.Num_epingle ? varietesData.Num_epingle[i] : '',
      };
    }

    // Charger la table Millesimes depuis Grist
    const millesimesData = await grist.docApi.fetchTable('Millesimes');
    if (!millesimesData || !millesimesData.id) {
      console.error("❌ La table Millesimes est introuvable dans Grist !");
      return null;
    }

    // Transformer les données pour buildGrainesMap
    const derniersRecords = [];
    const nbEntries = millesimesData.id ? millesimesData.id.length : 0;
    for (let i = 0; i < nbEntries; i++) {
      derniersRecords.push({
        id: millesimesData.id[i],
        Type: millesimesData.Type ? millesimesData.Type[i] : '',
        Nom: millesimesData.Nom ? millesimesData.Nom[i] : '',
        Variete: millesimesData.Variete ? millesimesData.Variete[i] : '',
        NomVariete: millesimesData.NomVariete ? millesimesData.NomVariete[i] : `${millesimesData.Nom[i]}\n${millesimesData.Variete[i]}`,
        Origine: millesimesData.Origine ? millesimesData.Origine[i] : '',
        Sachets: millesimesData.Sachets ? millesimesData.Sachets[i] : '',
        Millesime: millesimesData.Millesime ? millesimesData.Millesime[i] : '',
        Nb_saisons: millesimesData.Nb_saisons ? millesimesData.Nb_saisons[i] : millesimesData.Nb_saisons_manuel ? millesimesData.Nb_saisons_manuel[i] : '',
        Qtte_graines: millesimesData.Qtte_graines ? millesimesData.Qtte_graines[i] : '',
      });
    }

    return { varietesParNom, derniersRecords };
  } catch (error) {
    console.error("❌ Erreur lors du chargement des données depuis Grist :", error);
    return null;
  }
}

// =============================================
// INITIALISATION
// =============================================
if (!bouchonne) {
  console.log("Mode GRIST : Chargement des données depuis Grist.");
  grist.ready({ requiredAccess: 'read table' });

  // Vérifiez que grist.docApi est disponible
  console.log("grist.docApi disponible ?", typeof grist.docApi !== 'undefined');

  // Chargez les données depuis Grist
  Promise.all([
    grist.docApi.fetchTable('Varietes'),
    grist.docApi.fetchTable('Millesimes')
  ]).then(([varietesData, millesimesData]) => {
    console.log("Données Varietes reçues :", varietesData);
    console.log("Données Millesimes reçues :", millesimesData);

    // Vérifiez que les données ne sont pas vides
    if (!varietesData || !millesimesData) {
      console.error("❌ Une des tables est vide ou introuvable !");
      return;
    }

    // Transformez les données pour l'affichage
    const data = [];
    const ids = varietesData.id || [];
    for (let i = 0; i < ids.length; i++) {
      if (varietesData.Num_epingle && varietesData.Num_epingle[i] > 0) {
        data.push({
          type: varietesData.Type ? varietesData.Type[i] : '',
          nom: varietesData.Nom ? varietesData.Nom[i] : '',
          variete: varietesData.Variete ? varietesData.Variete[i] : '',
          num: varietesData.Num_epingle[i],
        });
      }
    }

    console.log("Données transformées pour l'affichage :", data);
    render(data);
  }).catch(error => {
    console.error("❌ Erreur lors du chargement des données depuis Grist :", error);
  });
}