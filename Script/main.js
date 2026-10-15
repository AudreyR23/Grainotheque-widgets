/* =============================================
   CONFIGURATION
   ============================================= */
const LIGNES_PAR_PAGE = 26;
const bouchonne = true; // Passez à false pour le mode Grist
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
  if (typeof v === 'number') {
    const date = new Date(v * 1000);
    return date.getFullYear().toString();
  }
  if (v instanceof Date) {
    return v.getFullYear().toString();
  }
  if (typeof v === 'string' && v.includes('-')) {
    return v.substring(0, 4); // Format "YYYY-MM-DD"
  }
  return String(v).substring(0, 4);
}

function fmtMois(v) {
  if (!v) return '';
  let src = Array.isArray(v) ? v.filter(item => item !== 'L') : String(v).split(',').map(x => x.trim());
  return src.map(m => MOIS[m] || m).join(' ');
}

function fmtVal(v) {
  if (!v) return '';
  if (Array.isArray(v)) {
    return v.filter(item => item !== 'L').join(', ');
  }
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

  // Formater les saisons
  const saisonsFormatted = ss.map(s => {
    if (!s.saisons) return '';
    const val = String(s.saisons).trim().toLowerCase();
    if (val === 'or.' || val === 'or') return 'or.';
    if (!isNaN(val)) return parseInt(val);
    return s.saisons;
  });

  // Formater la germination
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

  // Grouper par type
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
  page.className = isLast ? 'page-tableau page-last-of-group' : 'page-tableau'; // <-- Modification ici
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
    // Utiliser NomVariete directement (déjà au format "Nom\nVariete" dans vos données)
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

    // Nettoyer Origine
    const origine = Array.isArray(r.Origine) ? r.Origine.filter(item => item !== 'L').join(', ') : r.Origine || '';

    // Nettoyer Sachets
    const sachet = r.Sachets ? String(r.Sachets) : '';

    // Nettoyer Millesime
    const millesime = fmtAnnee(r.Millesime);

    // Nettoyer Nb_saisons
    const nbSaisons = r.Nb_saisons || r.Nb_saisons_manuel || '';

    // Nettoyer Germination_affichee
    const germinationValue = r.Germination_affichee !== null && r.Germination_affichee !== undefined
      ? (r.Germination_affichee === 0 ? '0%' : Math.round(r.Germination_affichee * 100) + '%')
      : '';

    // Ajouter le sachet
    map.get(key).sachets.push({
      origine: origine,
      sachet: sachet,
      annee: millesime,
      saisons: nbSaisons,
      qtte: r.Qtte_graines || '',  // Utilise la clé exacte du JSON ("Qtte_graines" avec majuscule)  // Vérifie les deux orthographes possibles
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
    if (!response.ok) {
      throw new Error(`Fichier /Grainotheque-widgets/data/${nomFichier}.json introuvable. Statut: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erreur lors du chargement de /data/${nomFichier}.json :`, error);
    return null;
  }
}

async function initialiserDonneesLocales() {
  try {
    // 1. Charger Varietes.json
    const varietesData = await chargerDonneesLocales("Varietes");
    if (!varietesData) {
      console.error("❌ /Grainotheque-widgets/data/Varietes.json est introuvable ou invalide !");
      return;
    }

    // 2. Construire varietesParNom avec les clés "Nom\nVariete"
    varietesParNom = {};
    Object.entries(varietesData).forEach(([nomVariete, data]) => {
      varietesParNom[nomVariete] = data;
    });
    console.log(`✅ varietesParNom chargé avec ${Object.keys(varietesParNom).length} entrées.`);
    console.log("Exemple de clé :", Object.keys(varietesParNom)[0]);

    // 3. Charger Millesimes.json
    const millesimesData = await chargerDonneesLocales("Millesimes");
    if (!millesimesData || !Array.isArray(millesimesData)) {
      console.error("❌ /data/Millesimes.json est introuvable ou invalide !");
      return;
    }

    // 4. Transformer les données pour buildGrainesMap
    derniersRecords = millesimesData.map(record => {
      return {
        ...record,
        id: record.id || Math.random().toString(36).substring(2, 9)
      };
    });

    console.log("✅ derniersRecords (2 premiers) :", derniersRecords.slice(0, 2));

    // 5. Vérifier les correspondances
    derniersRecords.forEach(r => {
      const nomComplet = r.NomVariete || `${r.Nom}\n${r.Variete}`.trim();
      if (!varietesParNom[nomComplet]) {
        console.warn(`⚠️ Aucune correspondance pour "${nomComplet}"`);
      }
    });

    // 6. Construire la map et rendre
    const grainesMap = buildGrainesMap(derniersRecords);
    const graines = [...grainesMap.values()];
    console.log("✅ Graines générées (2 premières) :", graines.slice(0, 2));
    render(graines);

  } catch (error) {
    console.error("❌ Erreur dans initialiserDonneesLocales :", error);
  }
}

/* =============================================
   INITIALISATION
   ============================================= */
if (!bouchonne) {
  console.log("Mode GRIST : Connexion à l'API Grist.");
  console.log("Clés dans r :", Object.keys(r));  // Affiche toutes les clés disponibles
  grist.ready({ requiredAccess: 'full' });

  grist.onRecords(function(records) {
    console.log("Première entrée Millesimes :", records[0]);
    // Nettoyer les records Grist
    derniersRecords = records.map(r => {
      const fields = r.fields || r;
      return {
        id: fields.id || r.id,
        Type: fields.Type || '',
        Nom: fields.Nom || '',
        Variete: fields.Variete || '',
        NomVariete: fields.NomVariete ? (Array.isArray(fields.NomVariete) ? `${fields.Nom}\n${fields.Variete}` : fields.NomVariete) : `${fields.Nom}\n${fields.Variete}`,
        Origine: fields.Origine || '',
        Sachets: fields.Sachets || '',
        Millesime: fields.Millesime || '',
        Nb_saisons: fields.Nb_saisons || fields.Nb_saisons_manuel || '',
        Qtte_graines: fields.Qtte_graines || '',
        Germination_affichee: fields.Germination_affichee,
        sachets: Array.isArray(fields.sachets) ? fields.sachets : [{
          origine: Array.isArray(fields.Origine) ? fields.Origine.filter(item => item !== 'L').join(', ') : fields.Origine || '',
          sachet: fields.Sachets || '',
          annee: fmtAnnee(fields.Millesime),
          saisons: fields.Nb_saisons || fields.Nb_saisons_manuel || '',
          qtte: fields.Qtte_graines || '',
          germination: fields.Germination_affichee !== null && fields.Germination_affichee !== undefined
            ? (fields.Germination_affichee === 0 ? '0%' : `${Math.round(fields.Germination_affichee * 100)}%`)
            : ''
        }]
      };
    });

    if (Object.keys(varietesParNom).length > 0) {
      render([...buildGrainesMap(derniersRecords).values()]);
    }
  });

  grist.docApi.fetchTable('Varietes').then(data => {
    varietesParNom = {};
    const ids = data.id || [];
    ids.forEach((id, i) => {
      const nom = data.Nom ? data.Nom[i] : '';
      const variete = data.Variete ? data.Variete[i] : '';
      const nomComplet = `${nom}\n${variete}`.trim();
      if (!nomComplet) return;
      varietesParNom[nomComplet] = {
        Type: data.Type ? data.Type[i] : '',
        Nom: nom,
        Variete: variete,
        Num_epingle: data.Num_epingle ? data.Num_epingle[i] : '',
        Nb_epingle: data.Nb_epingle ? data.Nb_epingle[i] : '',
        Semis_profondeur: data.Semis_profondeur ? data.Semis_profondeur[i] : '',
        Duree_germ: data.Duree_germ ? data.Duree_germ[i] : '',
        Temp_germ: data.Temp_germ ? data.Temp_germ[i] : '',
        Semis_sous_abris: data.Semis_sous_abris ? data.Semis_sous_abris[i] : '',
        Semis_pleine_terre: data.Semis_pleine_terre ? data.Semis_pleine_terre[i] : '',
        Arrosage: data.Arrosage ? data.Arrosage[i] : '',
        Exposition: data.Exposition ? data.Exposition[i] : '',
        Ou_cultiver: data.Ou_cultiver ? data.Ou_cultiver[i] : '',
      };
    });

    if (derniersRecords) {
      render([...buildGrainesMap(derniersRecords).values()]);
    }
  }).catch(err => console.error('Erreur fetchTable Varietes :', err));

} else {
    console.log("Mode BOUCHON : Chargement des données locales depuis /data/");
  document.addEventListener('DOMContentLoaded', initialiserDonneesLocales);
}