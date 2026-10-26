/* =============================================
   CONFIGURATION
   MOIS_PAR_PAGE    : nombre de mois par page (6 = 6 colonnes, une par mois,
                      cohérent avec grid-template-columns dans calendrier.css)
   LIGNES_PAR_PAGE  : nombre maximum de plantes par section
                      (S/Abri ou P.Terre, empilées dans la colonne d'un mois)
                      sur une page. Au-delà, la suite passe sur une page
                      supplémentaire, avec l'en-tête du mois répété et la
                      mention "(suite)".
============================================= */
const MOIS_PAR_PAGE = 3;
const LIGNES_PAR_PAGE = 42;

/* =============================================
   DEFINITION DES MOIS
============================================= */
const MOIS_DEF = [
  { num:1,  label:'Janvier',   abrevs:['Jan','Janvier'] },
  { num:2,  label:'Février',   abrevs:['Fév','Février'] },
  { num:3,  label:'Mars',      abrevs:['Mar','Mars'] },
  { num:4,  label:'Avril',     abrevs:['Avr','Avril'] },
  { num:5,  label:'Mai',       abrevs:['Mai'] },
  { num:6,  label:'Juin',      abrevs:['Jui','Juin'] },
  { num:7,  label:'Juillet',   abrevs:['Juil','Juillet'] },
  { num:8,  label:'Août',      abrevs:['Aou','Août'] },
  { num:9,  label:'Septembre', abrevs:['Sep','Septembre'] },
  { num:10, label:'Octobre',   abrevs:['Oct','Octobre'] },
  { num:11, label:'Novembre',  abrevs:['Nov','Novembre'] },
  { num:12, label:'Décembre',  abrevs:['Déc','Décembre'] }
];

const MOIS_COURANT = new Date().getMonth() + 1;

function iconeType(type) {
  if (!type) return '';
  const emojis = type.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu);
  return emojis ? emojis[emojis.length - 1] : '';
}

/* =============================================
   GRIST (2 tables : Millesimes liée au widget + Varietes)
   fetchTable demande l'accès complet
============================================= */
grist.ready({ requiredAccess: 'full' });

let varietesParId = {};
let millesimesRecus = null;

function chargerVarietes() {
  grist.docApi.fetchTable('Varietes')
    .then(data => {
      const ids = data.id || [];
      ids.forEach((id, i) => {
        varietesParId[id] = {
          Nom:        data.Nom        ? data.Nom[i]        : '',
          Type:       data.Type       ? data.Type[i]       : '',
          NomVariete: data.NomVariete ? data.NomVariete[i] : '',
          Semis_sous_abris:   data.Semis_sous_abris   ? data.Semis_sous_abris[i]   : [],
          Semis_pleine_terre: data.Semis_pleine_terre ? data.Semis_pleine_terre[i] : []
        };
      });
      if (millesimesRecus) {
        renderCalendrier(millesimesRecus);
      }
    })
    .catch(err => {
      console.error(err);
      const info = document.getElementById('info-count');
      if (info) info.textContent = 'Erreur de chargement (voir la console)';
    });
}

/* =============================================
   DIFFÉRENCES ENTRE VARIÉTÉS D'UNE MÊME PLANTE
============================================= */
function differenceType(varietes, type) {
  const signatures = varietes.map(v =>
    JSON.stringify(type === 'abri' ? v.abri : v.terre)
  );
  return new Set(signatures).size > 1;
}

function voirDetails(varietes, mois, type) {
  if (typeof varietes === 'string') {
    varietes = JSON.parse(varietes);
  }
  const popup = document.getElementById('popup');
  const moisObj = MOIS_DEF.find(m => m.label === mois);
  let html = `
    <span class="popup-close" onclick="fermerPopup()">✕</span>
    <h2>⚠ Différences — ${mois}</h2>
  `;

  const absentes = [];
  varietes.forEach(v => {
    const liste = type === 'abri' ? v.abri : v.terre;
    const present = liste.some(x => moisObj.abrevs.includes(x));
    if (!present) {
      absentes.push(v.nom);
    }
  });

  if (absentes.length) {
    html += `
      <div class="popup-ligne">
        ${type === 'abri'
          ? '🏠 <b>Sous abri — pas de semis en ' + mois + '</b>'
          : '🌿 <b>Pleine terre — pas de semis en ' + mois + '</b>'}
        <br>
        ${[...new Set(absentes)].join('<br>')}
      </div>
    `;
  }

  popup.innerHTML = html;
  popup.style.display = 'block';
}

function fermerPopup() {
  document.getElementById('popup').style.display = 'none';
}

/* =============================================
   LISTES S/ABRI ET P.TERRE D'UN MOIS
============================================= */
function listesDuMois(liste, mois) {
  const abri = [];
  const terre = [];

  liste.forEach(p => {
    const planteAffichee = iconeType(p.type) + ' ' + p.nom;
    let planteAbri  = planteAffichee;
    let planteTerre = planteAffichee;

    const idPopup = encodeURIComponent(JSON.stringify(p.varietes));

    if (differenceType(p.varietes, 'abri')) {
      planteAbri =
        `<span class="ligne-alerte"
          onclick="voirDetails(decodeURIComponent('${idPopup}'), '${mois.label}', 'abri')">
          ${planteAffichee} *
        </span>`;
    }

    if (differenceType(p.varietes, 'terre')) {
      planteTerre =
        `<span class="ligne-alerte"
          onclick="voirDetails(decodeURIComponent('${idPopup}'), '${mois.label}', 'terre')">
          ${planteAffichee} *
        </span>`;
    }

    if (p.varietes.some(v => v.abri.some(x => mois.abrevs.includes(x)))) {
      if (!abri.includes(planteAbri)) abri.push(planteAbri);
    }

    if (p.varietes.some(v => v.terre.some(x => mois.abrevs.includes(x)))) {
      if (!terre.includes(planteTerre)) terre.push(planteTerre);
    }
  });

  return { abri, terre };
}

/* =============================================
   CARTE D'UN MOIS POUR UNE PAGE DONNÉE
   (page = 0 pour la première page du groupe de mois,
    1 pour la suite, etc.)
   L'en-tête (titre + S/Abri + P.Terre) est répété.
============================================= */
function makeCard(mois, abri, terre, page) {
  const debut = page * LIGNES_PAR_PAGE;
  const fin = debut + LIGNES_PAR_PAGE;

  function colonne(items) {
    const part = items.slice(debut, fin);
    if (part.length) {
      return part.map(n => `<span class="variete-tag">${n}</span>`).join('');
    }
    return page === 0 ? '<span class="vide">—</span>' : '';
  }

  // "(suite)" seulement si ce mois continue réellement sur cette page
  const continueIci = Math.max(abri.length, terre.length) > debut;
  const suite = (page > 0 && continueIci)
    ? ' <span class="mois-suite">(suite)</span>'
    : '';

  const card = document.createElement('div');
  card.className = 'mois-card' + (mois.num === MOIS_COURANT ? ' actuel' : '');

  card.innerHTML = `
    <div class="mois-titre">${mois.label}${suite}</div>
    <div class="mois-body">
      <div class="col-abri">
        <div class="col-label">🏠 S/Abri</div>
        ${colonne(abri)}
      </div>
      <div class="col-terre">
        <div class="col-label">🌿 P.Terre</div>
        ${colonne(terre)}
      </div>
    </div>
  `;

  return card;
}

/* =============================================
   RENDU DES PAGES
   Les mois sont regroupés par MOIS_PAR_PAGE (ex. janvier-juin,
   puis juillet-décembre). Chaque groupe prend autant de pages
   que son mois le plus chargé l'exige.
============================================= */
function renderCalendrier(records) {
  const plantes = {};

  records
    .filter(r => r.Sachets)
    .forEach(r => {
      const v = varietesParId[r.NomVariete] ||
        Object.values(varietesParId).find(x => x.NomVariete === r.NomVariete);

      if (!v) return;

      const nom = v.Nom;

      if (!plantes[nom]) {
        plantes[nom] = { nom: nom, type: v.Type || '', varietes: [] };
      }

      let abri  = v.Semis_sous_abris   || [];
      let terre = v.Semis_pleine_terre || [];

      // ChoiceList Grist : enlève le "L"
      if (Array.isArray(abri)  && abri[0]  === 'L') abri  = abri.slice(1);
      if (Array.isArray(terre) && terre[0] === 'L') terre = terre.slice(1);

      plantes[nom].varietes.push({ nom: v.NomVariete, abri: abri, terre: terre });
    });

  const liste = Object.values(plantes);

  // Listes de chaque mois, calculées une seule fois
  const parMois = MOIS_DEF.map(mois => ({ mois, ...listesDuMois(liste, mois) }));

  // Groupes de mois (6 par page)
  const groupes = [];
  for (let i = 0; i < parMois.length; i += MOIS_PAR_PAGE) {
    groupes.push(parMois.slice(i, i + MOIS_PAR_PAGE));
  }

  const pagesEl = document.getElementById('pages');
  pagesEl.innerHTML = '';

  let nbPagesTotal = 0;

  groupes.forEach(groupe => {
    const maxLignes = Math.max(0, ...groupe.map(m => Math.max(m.abri.length, m.terre.length)));
    const nbPages = Math.max(1, Math.ceil(maxLignes / LIGNES_PAR_PAGE));

    for (let p = 0; p < nbPages; p++) {
      const page = document.createElement('div');
      page.className = 'page-calendrier';

      // Titre et légende uniquement sur la toute première page
      if (nbPagesTotal === 0) {
        page.innerHTML = `
          <h1>🌱 Calendrier des semis</h1>
          <div class="legende">* Plusieurs variétés avec des périodes de semis différentes</div>
        `;
      }

      const grille = document.createElement('div');
      grille.className = 'calendrier';
      groupe.forEach(m => grille.appendChild(makeCard(m.mois, m.abri, m.terre, p)));

      page.appendChild(grille);
      pagesEl.appendChild(page);
      nbPagesTotal++;
    }
  });

  const info = document.getElementById('info-count');
  if (info) info.textContent = liste.length + ' plantes · ' + nbPagesTotal + ' page(s)';
}

grist.onRecords(function (records) {
  millesimesRecus = records;
  if (Object.keys(varietesParId).length) {
    renderCalendrier(records);
  }
});

chargerVarietes();