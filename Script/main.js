/* =============================================
   CONFIGURATION
   ============================================= */
const LIGNES_PAR_PAGE = 26;
const bouchonne = false; // Mode Grist activé
let varietesParNom = {};
let derniersRecords = [];

/* Abréviations mois */
const MOIS = {
  "Jan": "J", "Fév": "F", "Mar": "M", "Avr": "A", "Mai": "Ma",
  "Jui": "Ju", "Juil": "Jl", "Aou": "Ao", "Sep": "S", "Oct": "O", "Nov": "N", "Déc": "D",
  "Janvier": "J", "Février": "F", "Mars": "M", "Avril": "A", "Juin": "Ju",
  "Juillet": "Jl", "Août": "Ao", "Septembre": "S", "Octobre": "O",
  "Novembre": "N", "Décembre": "D"
};

/* =============================================
   UTILITAIRES
   ============================================= */
function fmtAnnee(v) {
  if (!v) return '';
  if (typeof v === 'number') return new Date(v * 1000).getFullYear().toString();
  if (v instanceof Date) return v.getFullYear().toString();
  if (typeof v === 'string' && v.includes('-')) return v.substring(0, 4);
  return String(v).substring(0, 4);
}

function fmtMois(v) {
  if (!v) return '';
  let src = Array.isArray(v) ? v.filter(item => item !== 'L') : String(v).split(',').map(x => x.trim());
  return src.map(m => MOIS[m] || m).join(' ');
}

function fmtVal(v) {
  if (!v) return '';
  if (Array.isArray(v)) return v.filter(item => item !== 'L').join(', ');
  return String(v);
}

/* =============================================
   EN-TÊTE DU TABLEAU
   ============================================= */
function makeHeader() {
  return `<thead><tr>
    <th class="col-type">Type</th>
    <th class="col-nom">Nom-Variété</th>
    <th class="col-epingle">Ép.</th>
    <th class="col-nbep">Nb</th>
    <th class="col-origine">Orig.</th>
    <th class="col-sachet">Sac.</th>
    <th class="col-annee">Millésime</th>
    <th class="col-s">Sais.</th>
    <th class="col-qtte">Qté</th>
    <th class="col-germ">Germ.</th>
    <th class="col-profond">Nb.gr</th>
    <th class="col-germdur">Nb.go</th>
    <th class="col-germtemp">Année.s</th>
    <th class="col-sa">Date.s</th>
    <th class="col-se">Germé</th>
    <th class="col-vide1">Oups</th>
    <th class="col-arrosage">Planté</th>
    <th class="col-exposition">Date.p</th>
    <th class="col-ou">Où</th>
    <th class="col-vide2">Donné</th>
  </tr></thead>`;
}

/* =============================================
   CONSTRUCTION D'UNE LIGNE
   ============================================= */
function makeRow(g) {
  const ss = g.sachets;
  const nb = ss.length;

  function mc(cls, vals) {
    if (nb <= 1) return `<td class="${cls}">${vals[0] || '&nbsp;'}</td>`;
    return `<td class="${cls} multi">${
      vals.map(v => `<span class="sl">${v || '&nbsp;'}</span>`).join('')
    }</td>`;
  }

  const saisonsFormatted = ss.map(s => {
    if (!s.saisons) return '';
    const val = String(s.saisons).trim().toLowerCase();
    if (val === 'or.' || val === 'or') return 'or.';
    if (!isNaN(val)) return parseInt(val);
    return s.saisons;
  });

  const germinationFormatted = ss.map(s => {
    if (s.germination === null || s.germination === undefined || s.germination === '') return '';
    if (typeof s.germination === 'number') {
      return s.germination === 0 ? '0%' : `${Math.round(s.germination * 100)}%`;
    }
    return s.germination;
  });

  return `<tr class="graine-row">
    <td class="col-type">${g.type || ''}</td>
    <td class="col-nom nom-cell">
      <span class="nom">${g.nom || ''}</span>
      ${g.variete ? `<span class="var">${g.variete}</span>` : ''}
    </td>
    <td class="col-epingle">${g.num_epingle || ''}</td>
    <td class="col-nbep info-gris">${g.nb_epingle || ''}</td>
    ${mc('col-origine', ss.map(s => s.origine || ''))}
    ${mc('col-sachet', ss.map(s => s.sachet || ''))}
    ${mc('col-annee', ss.map(s => fmtAnnee(s.annee)))}
    ${mc('col-saisons', saisonsFormatted)}
    ${mc('col-qtte', ss.map(s => s.qtte || ''))}
    ${mc('col-germ', germinationFormatted)}
    <td class="col-profond info-bas">${g.profondeur || ''}</td>
    <td class="col-germdur info-bas">${g.germ_duree || ''}</td>
    <td class="col-germtemp info-bas">${g.germ_temp || ''}</td>
    <td class="col-sa info-bas">${fmtMois(g.abri)}</td>
    <td class="col-se info-bas">${fmtMois(g.semis_ext)}</td>
    <td class="col-vide1"></td>
    <td class="col-arrosage info-bas">${g.arrosage || ''}</td>
    <td class="col-exposition info-bas">${g.exposition || ''}</td>
    <td class="col-ou info-bas">${fmtVal(g.ou)}</td>
    <td class="col-vide2"></td>
  </tr>`;
}

/* =============================================
   RENDU DES PAGES
   ============================================= */
function render(graines) {
  const infoCountEl = document.getElementById('info-count');
  if (infoCountEl) {
    infoCountEl.textContent = graines.length + ' variétés';
  }

  const pagesEl = document.getElementById('pages');
  if (!pagesEl) {
    console.error("❌ Élément 'pages' introuvable dans le DOM !");
    return;
  }
  pagesEl.innerHTML = '';

  graines.sort((a, b) => {
    const t = (a.type || '').localeCompare(b.type || '', 'fr');
    if (t) return t;
    const n = (a.nom || '').localeCompare(b.nom || '', 'fr');
    if (n) return n;
    return (a.variete || '').localeCompare(b.variete || '', 'fr');
  });

  const parType = [];
  let cur = null, grp = [];
  graines.forEach(g => {
    if (g.type !== cur) {
      if (grp.length) parType.push(grp);
      cur = g.type;
      grp = [g];
    } else {
      grp.push(g);
    }
  });
  if (grp.length) parType.push(grp);

  parType.forEach(groupeType => {
    let pageGraines = [];
    let lignesPage = 0;

    function creerPage(gs, isLast) {
      const page = document.createElement('div');
      page.className = isLast ? 'page-tableau page-last-of-group' : 'page-tableau';
      page.innerHTML = `<table>${makeHeader()}<tbody>${gs.map(makeRow).join('')}</tbody></table>`;
      pagesEl.appendChild(page);
    }

    groupeType.forEach(g => {
      const nbLignes = g.sachets.length === 1 ? 2 : g.sachets.length;
      if (lignesPage + nbLignes > LIGNES_PAR_PAGE && pageGraines.length > 0) {
        creerPage(pageGraines, false);
        pageGraines = [];
        lignesPage = 0;
      }
      pageGraines.push(g);
      lignesPage += nbLignes;
    });

    if (pageGraines.length > 0) creerPage(pageGraines, true);
  });
}

/* =============================================
   CONSTRUCTION DE LA MAP DES GRAINES
   ============================================= */
function buildGrainesMap(records) {
  const map = new Map();

  records.forEach(r => {
    const nomComplet = r.NomVariete || `${r.Nom}\n${r.Variete}`.trim();
    const v = varietesParNom[nomComplet] || {};

    const parts = nomComplet.split('\n');
    const nom = v.Nom || parts[0] || r.Nom || '';
    const variete = v.Variete || (parts.length > 1 ? parts[1] : '') || r.Variete || '';

    const key = nomComplet || ('_' + r.id);

    if (!map.has(key)) {
      map.set(key, {
        type: v.Type || r.Type || '',
        nom,
        variete,
        num_epingle: v.Num_epingle || r.Num_epingle || '',
        nb_epingle: v.Nb_epingle || r.Nb_epingle || '',
        profondeur: v.Semis_profondeur || r.Semis_profondeur || '',
        germ_duree: v.Duree_germ || r.Duree_germ || '',
        germ_temp: v.Temp_germ || r.Temp_germ || '',
        abri: fmtVal(v.Semis_sous_abris || r.Semis_sous_abris),
        semis_ext: fmtVal(v.Semis_pleine_terre || r.Semis_pleine_terre),
        arrosage: v.Arrosage || r.Arrosage || '',
        exposition: v.Exposition || r.Exposition || '',
        ou: fmtVal(v.Ou_cultiver || r.Ou_cultiver),
        sachets: []
      });
    }

    const origine = Array.isArray(r.Origine) ? r.Origine.filter(item => item !== 'L').join(', ') : r.Origine || '';
    const sachet = r.Sachets ? String(r.Sachets) : '';
    const millesime = fmtAnnee(r.Millesime);
    const nbSaisons = r.Nb_saisons || r.Nb_saisons_manuel || '';
    const germinationValue = r.Germination_affichee !== null && r.Germination_affichee !== undefined
      ? (r.Germination_affichee === 0 ? '0%' : Math.round(r.Germination_affichee * 100) + '%')
      : '';

    map.get(key).sachets.push({
      origine: origine,
      sachet: sachet,
      annee: millesime,
      saisons: nbSaisons,
      qtte: r.Qtte_graines || '',
      germination: germinationValue
    });
  });

  return map;
}

/* =============================================
   CHARGEMENT DES DONNÉES LOCALES (Mode Bouchon)
   ============================================= */
async function chargerDonneesLocales(nomFichier) {
  try {
    const response = await fetch(`/Grainotheque-widgets/data/${nomFichier}.json`);
    if (!response.ok) throw new Error(`Fichier introuvable: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Erreur chargement ${nomFichier}.json:`, error);
    return null;
  }
}

async function initialiserDonneesLocales() {
  try {
    const varietesData = await chargerDonneesLocales("Varietes");
    if (!varietesData) return;

    varietesParNom = {};
    Object.entries(varietesData).forEach(([nomVariete, data]) => {
      varietesParNom[nomVariete] = data;
    });

    const millesimesData = await chargerDonneesLocales("Millesimes");
    if (!millesimesData || !Array.isArray(millesimesData)) return;

    derniersRecords = millesimesData.map(record => ({
      ...record,
      id: record.id || Math.random().toString(36).substring(2, 9)
    }));

    const grainesMap = buildGrainesMap(derniersRecords);
    render([...grainesMap.values()]);
  } catch (error) {
    console.error("Erreur initialiserDonneesLocales:", error);
  }
}

/* =============================================
   INITIALISATION (Mode Grist)
   ============================================= */
if (!bouchonne) {
  console.log("Mode GRIST : Chargement des données depuis Grist.");
  grist.ready({ requiredAccess: 'read table' });

  Promise.all([
    grist.docApi.fetchTable('Varietes'),
    grist.docApi.fetchTable('Millesimes')
  ]).then(([varietesData, millesimesData]) => {
    // Charger Varietes
    varietesParNom = {};
    const varietesIds = varietesData.id || [];
    varietesIds.forEach((id, i) => {
      const nom = varietesData.Nom ? varietesData.Nom[i] : '';
      const variete = varietesData.Variete ? varietesData.Variete[i] : '';
      const nomComplet = `${nom}\n${variete}`.trim();
      if (!nomComplet) return;

      varietesParNom[nomComplet] = {
        Type: varietesData.Type ? varietesData.Type[i] : '',
        Nom: nom,
        Variete: variete,
        Num_epingle: varietesData.Num_epingle ? varietesData.Num_epingle[i] : '',
        Nb_epingle: varietesData.Nb_epingle ? varietesData.Nb_epingle[i] : '',
        Semis_profondeur: varietesData.Semis_profondeur ? varietesData.Semis_profondeur[i] : '',
        Duree_germ: varietesData.Duree_germ ? varietesData.Duree_germ[i] : '',
        Temp_germ: varietesData.Temp_germ ? varietesData.Temp_germ[i] : '',
        Semis_sous_abris: varietesData.Semis_sous_abris ? varietesData.Semis_sous_abris[i] : '',
        Semis_pleine_terre: varietesData.Semis_pleine_terre ? varietesData.Semis_pleine_terre[i] : '',
        Arrosage: varietesData.Arrosage ? varietesData.Arrosage[i] : '',
        Exposition: varietesData.Exposition ? varietesData.Exposition[i] : '',
        Ou_cultiver: varietesData.Ou_cultiver ? varietesData.Ou_cultiver[i] : '',
      };
    });

    // Charger Millesimes
    derniersRecords = [];
    const millesimesIds = millesimesData.id || [];
    millesimesIds.forEach((id, i) => {
      derniersRecords.push({
        id: id,
        Type: millesimesData.Type ? millesimesData.Type[i] : '',
        Nom: millesimesData.Nom ? millesimesData.Nom[i] : '',
        Variete: millesimesData.Variete ? millesimesData.Variete[i] : '',
        NomVariete: millesimesData.NomVariete ? millesimesData.NomVariete[i] : `${millesimesData.Nom[i]}\n${millesimesData.Variete[i]}`,
        Origine: millesimesData.Origine ? millesimesData.Origine[i] : '',
        Sachets: millesimesData.Sachets ? millesimesData.Sachets[i] : '',
        Millesime: millesimesData.Millesime ? millesimesData.Millesime[i] : '',
        Nb_saisons: millesimesData.Nb_saisons ? millesimesData.Nb_saisons[i] : millesimesData.Nb_saisons_manuel ? millesimesData.Nb_saisons_manuel[i] : '',
        Qtte_graines: millesimesData.Qtte_graines ? millesimesData.Qtte_graines[i] : '',
        Germination_affichee: millesimesData.Germination_affichee ? millesimesData.Germination_affichee[i] : null,
      });
    });

    // Construire la map et afficher
    const grainesMap = buildGrainesMap(derniersRecords);
    render([...grainesMap.values()]);
  }).catch(error => {
    console.error("❌ Erreur lors du chargement des données Grist :", error);
  });
} else {
  console.log("Mode BOUCHON : Chargement des données locales.");
  document.addEventListener('DOMContentLoaded', initialiserDonneesLocales);
}