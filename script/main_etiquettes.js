const PAR_LIGNE = 5;
const LIGNES_PAR_PAGE = 4;
const ETIQUETTES_PAR_PAGE = PAR_LIGNE * LIGNES_PAR_PAGE; // 20

/* Année en cours — toujours à jour */
const ANNEE_EN_COURS = new Date().getFullYear();

const SVG_NORMALE = `
  <svg class="forme" viewBox="0 0 690 470"
       preserveAspectRatio="none"
       xmlns="http://www.w3.org/2000/svg">
    <polygon
      points="0,0 690,0 517.5,470 172.5,470"
      fill="none" stroke="#000" stroke-width="7"/>
  </svg>
`;

const SVG_INVERSEE = `
  <svg class="forme" viewBox="0 0 690 470"
       preserveAspectRatio="none"
       xmlns="http://www.w3.org/2000/svg">
    <line x1="172.5" y1="0" x2="517.5" y2="0"
          stroke="#000" stroke-width="7"/>
    <line x1="0" y1="470" x2="690" y2="470"
          stroke="#000" stroke-width="7"/>
  </svg>
`;

function makeEtiquette(data, indexDansLigne) {
  const inverse = (indexDansLigne === 1 || indexDansLigne === 3);
  const svg = inverse ? SVG_INVERSEE : SVG_NORMALE;

    const origine = ((data.nb_saisons == 0 ? data.origine_millesime : data.origine_or) || '')
    .replace('Monjardin', 'AR');

  let origineTexte, saisons;
  if (data.vierge) {
    origineTexte = '';
    saisons = '';
  } else if (!data.seme) {
    origineTexte = origine;
    saisons = 'or.';
  } else {
    origineTexte = (origine && origine !== 'AR') ? `${origine} → AR` : 'AR';
    const n = parseInt(data.nb_saisons);
    saisons = isNaN(n) ? 1 : n + 1;
  }
  let libelleDate = 'Semis';
  let valeurDate = data.seme ? (data.annee_semis || '') : '';
  if (!data.vierge && data.plante_mere && data.annee_plantation) {
    origineTexte = (origine && origine !== 'AR') ? `${origine} → AR` : 'AR';
    saisons = ANNEE_EN_COURS - data.annee_plantation + 1;
    libelleDate = 'Plantation';
    valeurDate = data.annee_plantation;
  }
  return `
    <div class="etiquette-wrapper${inverse ? ' inverse' : ''}">
      <div class="etiquette${inverse ? ' inverse' : ''}">
        ${svg}
        <div class="etiquette-content">
          <div class="ligne-nom">${data.nom || ''}</div>
          <div class="ligne-variete">${data.variete || ''}</div>
          <div class="spacer"></div>
          <div class="infos">
            <div>
              <span class="label">Récolte :</span>
              <span class="valeur">🌱 ${ANNEE_EN_COURS}</span>
            </div>
            <div>
              <span class="label">Origine :</span>
              <span class="valeur">${origineTexte}</span>
            </div>
            <div>
              <span class="label">${libelleDate} :</span>
              <span class="valeur">${valeurDate}</span>
            </div>  
          <div class="spacer2"></div>
             </div>
          <div class="ligne-saisons">${(data.vierge || saisons === 'or.') ? '…… saison(s)' : saisons + ' saison(s)'}</div>
        </div>
      </div>
    </div>
  `;
}

function makeLigne(etiquettes) {
  return `
    <div class="ligne-etiquettes">
      ${etiquettes.map((e, i) => makeEtiquette(e, i)).join('')}
    </div>
  `;
}

function render(etiquettes) {
  document.getElementById('info-count').textContent = etiquettes.length + ' étiquette(s)';
  const pagesEl = document.getElementById('pages');
  pagesEl.innerHTML = '';

  for (let p = 0; p < Math.ceil(etiquettes.length / ETIQUETTES_PAR_PAGE); p++) {
    const pageEtiquettes = etiquettes.slice(
      p * ETIQUETTES_PAR_PAGE,
      (p + 1) * ETIQUETTES_PAR_PAGE
    );

    const lignes = [];
    for (let l = 0; l < LIGNES_PAR_PAGE; l++) {
      const ligneEtiquettes = pageEtiquettes.slice(l * PAR_LIGNE, (l + 1) * PAR_LIGNE);
      if (ligneEtiquettes.length > 0) lignes.push(ligneEtiquettes);
    }

    const page = document.createElement('div');
    page.className = 'page-etiquettes';
    page.innerHTML = lignes.map(makeLigne).join('');
    pagesEl.appendChild(page);
  }
}
async function marquerImprimees() {
  const aTraiter = lignes.filter(r => parseInt(r.Nb_etiquettes) > 0);
  if (!aTraiter.length) return;

  // Pas de semis (Date_s vide) et aucune donnée de culture : on supprime
  const aSupprimer = aTraiter.filter(r =>
    !r.Date_s && !r.Nb_graines && !r.Nb_godets && !r.Germes && !r.Plantes
  );
  const idsSuppr = new Set(aSupprimer.map(r => r.id));
  const aRemettreA0 = aTraiter.filter(r => !idsSuppr.has(r.id));

  const msg =
    `${aSupprimer.length} ligne(s) SUPPRIMÉE(S) (étiquettes sans semis)\n` +
    `${aRemettreA0.length} ligne(s) remise(s) à 0 (semis conservés)\n\nConfirmer ?`;
  if (!confirm(msg)) return;

  const table = grist.getTable();
  if (aRemettreA0.length) {
    await table.update(
      aRemettreA0.map(r => ({ id: r.id, fields: { Nb_etiquettes: 0 } }))
    );
  }
  if (aSupprimer.length) {
    await table.destroy(aSupprimer.map(r => r.id));
  }
}
let lignes = [];
grist.ready({ requiredAccess: 'full' });

grist.onRecords(function(records) {
  lignes = records;
  const etiquettes = [];

  records.forEach(r => {
    if ((r.Nom || '').includes('Menthe')) {
  console.log('Menthe:', r.Plante_mere, r.Annee_plantation_mil, r.Nb_saisons_mil);
}
    const nb = parseInt(r.Nb_etiquettes) || 0;
    if (nb <= 0) return;

    // Année de semis depuis Date_s
    let annee_semis = '';
if (r.Date_s) {
  annee_semis = r.Date_s.getFullYear
    ? r.Date_s.getFullYear()
    : new Date(r.Date_s * 1000).getFullYear();
} else if (r.Annee_plantation_mil) {
  annee_semis = r.Annee_plantation_mil;
}

    const data = {
      nom:            r.Nom || '',
      variete:        r.Variete || '',
      annee_semis:    annee_semis,
      nb_saisons:     r.Nb_saisons_mil !== undefined ? r.Nb_saisons_mil : '',
      origine_or:     r.Origine_or || '',
      plante_mere:      r.Plante_mere || false,
      annee_plantation: r.Annee_plantation_mil || null,
      origine_millesime: r.Origine_millesime || '',
      seme: !!r.Date_s,
      vierge: !r.Nom && !r.Variete,
    };

    for (let i = 0; i < nb; i++) {
      etiquettes.push(data);
    }
  });

  render(etiquettes);
});