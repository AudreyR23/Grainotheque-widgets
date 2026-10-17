// =============================================
// CONFIGURATION
// =============================================
const ROWS_PER_COL = 20;
const COLS_PER_PAGE = 3;
const PER_PAGE = ROWS_PER_COL * COLS_PER_PAGE;

// =============================================
// AFFICHAGE DES ÉPINGLES
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

  document.getElementById('info-count').textContent =
    sorted.length + " graines avec numéro d'épingle";

  const pagesEl = document.getElementById('pages');
  pagesEl.innerHTML = '';

  for (let p = 0; p < Math.ceil(sorted.length / PER_PAGE); p++) {
    const pageData = sorted.slice(p * PER_PAGE, (p + 1) * PER_PAGE);
    const page = document.createElement('div');
    page.className = 'page-epingles';

    for (let col = 0; col < COLS_PER_PAGE; col++) {
      const column = document.createElement('div');
      column.className = 'column';
      const start = col * ROWS_PER_COL;
      pageData.slice(start, start + ROWS_PER_COL)
        .forEach(g => column.appendChild(makeEntry(g)));
      page.appendChild(column);
    }
    pagesEl.appendChild(page);
  }
}

// =============================================
// INITIALISATION (données via l'API widget de Grist)
// =============================================
const dansGrist = window.self !== window.top;

if (dansGrist) {
  grist.ready({ requiredAccess: 'full' });

  grist.docApi.fetchTable('Varietes').then(v => {
    const seen = new Set();
    const data = [];

    for (let i = 0; i < v.id.length; i++) {
      const num = v.Num_epingle ? v.Num_epingle[i] : 0;
      if (!num || num <= 0 || seen.has(num)) continue;
      seen.add(num);

      data.push({
        type: v.Type ? v.Type[i] : '',
        nom: v.Nom ? v.Nom[i] : '',
        variete: v.Variete ? v.Variete[i] : '',
        num: num,
      });
    }
    render(data);
  }).catch(err => {
    console.error('Erreur Grist :', err);
    document.getElementById('info-count').textContent =
      'Erreur de chargement (voir la console)';
  });
} else {
  document.getElementById('info-count').textContent =
    'Page ouverte hors Grist : utilise cette URL comme widget Custom.';
}