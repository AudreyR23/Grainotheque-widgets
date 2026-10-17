   // =============================================
    // CONFIGURATION
    // =============================================
   const ROWS_PER_COL = 20; // Nombre de lignes par colonne (inchangé)
const COLS_PER_PAGE = 3; // Nombre de colonnes par page (3 au lieu de 2)
const PER_PAGE = ROWS_PER_COL * COLS_PER_PAGE; // 20 lignes × 3 colonnes = 60 lignes par page
    const bouchonne = false; // Passez à false pour le mode Grist

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

  // Calculer le nombre de pages nécessaires
  for (let p = 0; p < Math.ceil(sorted.length / PER_PAGE); p++) {
    const pageData = sorted.slice(p * PER_PAGE, (p + 1) * PER_PAGE);

    // Créer une page
    const page = document.createElement('div');
    page.className = 'page-epingles';

    // Créer les 3 colonnes
    for (let col = 0; col < COLS_PER_PAGE; col++) {
      const column = document.createElement('div');
      column.className = 'column'; // Nouvelle classe pour les colonnes

      // Récupérer les données pour cette colonne
      const startIndex = col * ROWS_PER_COL;
      const endIndex = startIndex + ROWS_PER_COL;
      const columnData = pageData.slice(startIndex, endIndex);

      // Ajouter les entrées à la colonne
      columnData.forEach(g => column.appendChild(makeEntry(g)));

      // Ajouter la colonne à la page
      page.appendChild(column);
    }

    // Ajouter la page au conteneur
    pagesEl.appendChild(page);
  }
}

    // =============================================
    // CHARGEMENT DES DONNÉES LOCALES (Mode Bouchon)
    // =============================================
    async function chargerDonneesLocales(nomFichier) {
      try {
        const response = await fetch(`/Grainotheque-widgets/data/${nomFichier}.json`);
        if (!response.ok) {
          throw new Error(`Fichier /Grainotheque-widgets/data/${nomFichier}.json introuvable. Statut: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error(`Erreur lors du chargement de /Grainotheque-widgets/data/${nomFichier}.json :`, error);
        return null;
      }
    }

    async function initialiserDonneesLocales() {
      try {
        const varietesData = await chargerDonneesLocales("Varietes");
        if (!varietesData || typeof varietesData !== 'object') {
          console.error("❌ /Grainotheque-widgets/data/Varietes.json est introuvable ou invalide !");
          return;
        }

        // Convertir l'objet en tableau avec Object.values()
        const varietesArray = Object.values(varietesData);

        // Filtrer et transformer les données pour l'affichage des épingles
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
    // INITIALISATION
    // =============================================
    if (!bouchonne) {
      console.log("Mode GRIST : Connexion à l'API Grist.");
      grist.ready({ requiredAccess: 'read table' });

      grist.onRecords(function(records) {
  const seen = new Set();
  const data = records
    .map(r => {
      // Extraire les champs depuis r.fields (Grist stocke les données dans r.fields)
      const fields = r.fields || r;
      return {
        Type: fields.Type || '',
        Nom: fields.Nom || '',
        Variete: fields.Variete || '',
        Num_epingle: fields.Num_epingle || '',
        fields: fields // Conserver l'objet fields pour débogage si besoin
      };
    })
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
  render(data);
});
    } else {
      console.log("Mode BOUCHON : chargement des données locales depuis JSON");
      document.addEventListener('DOMContentLoaded', initialiserDonneesLocales);
    }
