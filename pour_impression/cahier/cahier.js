/* =============================================
   CONFIGURATION
   ============================================= */
const LIGNES_PAR_PAGE = 26;
let varietesParNom = {};
let varietesParId = {};
let derniersRecords = [];

// Ne garde que les textes (une référence Grist arrive sous forme de nombre)
function txt(v) {
  return typeof v === 'string' ? v : '';
}

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
// Lit la valeur d'une colonne pour la ligne i (renvoie def si la colonne n'existe pas)
function col(table, nom, i, def = '') {
  return table[nom] ? table[nom][i] : def;
}

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

// Ajoute une unité après un nombre (affichage uniquement, Grist n'est pas modifié)
// avecUnite(7, 'j') -> "7 j" ; avecUnite(2, 'an', 'ans') -> "2 ans"
function avecUnite(v, singulier, pluriel = singulier) {
  if (v === null || v === undefined || v === '' || v === 0) return '';
  if (typeof v !== 'number') return String(v);   // texte inattendu : affiché tel quel, sans unité
  const nombre = String(v).replace('.', ',');    // 1.5 -> "1,5"
  return `${nombre}\u00A0${v < 2 ? singulier : pluriel}`;  // \u00A0 = espace insécable
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
    <th class="col-conservation">Donné</th>
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
    ${mc('col-s', saisonsFormatted)}
    ${mc('col-qtte', ss.map(s => s.qtte || ''))}
    ${mc('col-germ', germinationFormatted)}
    <td class="col-profond info-bas">${g.profondeur || ''}</td>
    <td class="col-germdur info-bas">${avecUnite(g.germ_duree, 'j')}</td>
    <td class="col-germtemp info-bas">${g.germ_temp || ''}</td>
    <td class="col-sa info-bas">${fmtMois(g.abri)}</td>
    <td class="col-se info-bas">${fmtMois(g.semis_ext)}</td>
    <td class="col-vide1"></td>
    <td class="col-arrosage info-bas">${g.arrosage || ''}</td>
    <td class="col-exposition info-bas">${g.exposition || ''}</td>
    <td class="col-ou info-bas">${fmtVal(g.ou)}</td>
    <td class="col-conservation info-bas">${avecUnite(g.conservation, 'an', 'ans')}</td>
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

    function creerPage(gs) {
      const page = document.createElement('div');
      page.className = 'page-tableau';
      page.innerHTML = `<table>${makeHeader()}<tbody>${gs.map(makeRow).join('')}</tbody></table>`;
      pagesEl.appendChild(page);
    }

    groupeType.forEach(g => {
      const nbLignes = g.sachets.length === 1 ? 2 : g.sachets.length;
      if (lignesPage + nbLignes > LIGNES_PAR_PAGE && pageGraines.length > 0) {
        creerPage(pageGraines);
        pageGraines = [];
        lignesPage = 0;
      }
      pageGraines.push(g);
      lignesPage += nbLignes;
    });

    if (pageGraines.length > 0) creerPage(pageGraines);
  });
}

/* =============================================
   CONSTRUCTION DE LA MAP DES GRAINES
   ============================================= */
function buildGrainesMap(records) {
  const map = new Map();

  records.forEach(r => {
    // 1) Si NomVariete, Variete ou Nom est une référence (nombre), on retrouve la ligne de Varietes
    const refId = [r.NomVariete, r.Variete, r.Nom].find(x => typeof x === 'number' && varietesParId[x]);
    let v = refId ? varietesParId[refId] : {};

    // 2) Sinon, on cherche par texte
    let nomComplet = refId ? v.NomComplet : (txt(r.NomVariete) || `${txt(r.Nom)}\n${txt(r.Variete)}`.trim());
    if (!refId) v = varietesParNom[nomComplet] || {};

    const parts = nomComplet.split('\n');
    const nom = txt(v.Nom) || parts[0] || '';
    const variete = txt(v.Variete) || (parts.length > 1 ? parts[1] : '') || '';

    const key = nomComplet || ('_' + r.id);

    if (!map.has(key)) {
      map.set(key, {
        type: v.Type || txt(r.Type) || '',
        nom,
        variete,
        num_epingle: v.Num_epingle || '',
        nb_epingle: v.Nb_epingle || '',
        profondeur: v.Semis_profondeur || '',
        germ_duree: v.Duree_germ || '',
        germ_temp: v.Temp_germ || '',
        abri: fmtVal(v.Semis_sous_abris),
        semis_ext: fmtVal(v.Semis_pleine_terre),
        arrosage: v.Arrosage || '',
        exposition: v.Exposition || '',
        ou: fmtVal(v.Ou_cultiver),
        conservation: v.Conservation || '',
        sachets: []
      });
    }

    const origine = Array.isArray(r.Origine)
      ? r.Origine.filter(item => item !== 'L').join(', ')
      : r.Origine || '';
    const germinationValue = txt(r.Germination_cahier);

    map.get(key).sachets.push({
      origine: origine,
      sachet: r.Sachets ? String(r.Sachets) : '',
      annee: fmtAnnee(r.Millesime),
      saisons: r.Nb_saisons || r.Nb_saisons_manuel || '',
      qtte: r.Qtte_graines || '',
      germination: germinationValue
    });
  });

  return map;
}

/* =============================================
   INITIALISATION (données via l'API widget de Grist)
   ============================================= */
const dansGrist = window.self !== window.top;

if (dansGrist) {
  grist.ready({ requiredAccess: 'full' });

  Promise.all([
    grist.docApi.fetchTable('Varietes'),
    grist.docApi.fetchTable('Millesimes')
  ]).then(([vd, md]) => {
    // --- Varietes ---
    varietesParNom = {};
    vd.id.forEach((id, i) => {
      const nom = col(vd, 'Nom', i);
      const variete = col(vd, 'Variete', i);
      const nomComplet = `${nom}\n${variete}`.trim();
      if (!nomComplet) return;

      varietesParNom[nomComplet] = {
        Id: id,
        NomComplet: nomComplet,
        Type: col(vd, 'Type', i),
        Nom: nom,
        Variete: variete,
        Num_epingle: col(vd, 'Num_epingle', i),
        Nb_epingle: col(vd, 'Nb_epingle', i),
        Semis_profondeur: col(vd, 'Semis_profondeur', i),
        Duree_germ: col(vd, 'Duree_germ', i),
        Temp_germ: col(vd, 'Temp_germ', i),
        Semis_sous_abris: col(vd, 'Semis_sous_abris', i),
        Semis_pleine_terre: col(vd, 'Semis_pleine_terre', i),
        Arrosage: col(vd, 'Arrosage', i),
        Exposition: col(vd, 'Exposition', i),
        Ou_cultiver: col(vd, 'Ou_cultiver', i),
        Conservation: col(vd, 'Conservation', i)
      };
    });

    varietesParId = {};
    Object.values(varietesParNom).forEach(x => { varietesParId[x.Id] = x; });

    // --- Millesimes ---
    derniersRecords = md.id.map((id, i) => {
      const nom = col(md, 'Nom', i);
      const variete = col(md, 'Variete', i);
      return {
        id: id,
        Type: col(md, 'Type', i),
        Nom: nom,
        Variete: variete,
        NomVariete: col(md, 'NomVariete', i) || `${nom}\n${variete}`.trim(),
        Origine: col(md, 'Origine', i),
        Sachets: col(md, 'Sachets', i),
        Millesime: col(md, 'Millesime', i),
        Nb_saisons: col(md, 'Nb_saisons', i),
        Nb_saisons_manuel: col(md, 'Nb_saisons_manuel', i),
        Qtte_graines: col(md, 'Qtte_graines', i),
        Germination_cahier: col(md, 'Germination_cahier', i, ''),
      };
    });

    render([...buildGrainesMap(derniersRecords).values()]);
  }).catch(error => {
    console.error('❌ Erreur lors du chargement des données Grist :', error);
    const info = document.getElementById('info-count');
    if (info) info.textContent = 'Erreur de chargement (voir la console)';
  });
} else {
  const info = document.getElementById('info-count');
  if (info) info.textContent = 'Page ouverte hors Grist : utilise cette URL comme widget Custom.';
}