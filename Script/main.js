/* =============================================
   CONFIGURATION
   ============================================= */

const LIGNES_PAR_PAGE = 26;
const bouchonne = true; // <-- Ajoutez cette ligne pour activer le mode bouchon


function render(graines) {
  document.getElementById('info-count').textContent = graines.length + ' variétés';
  const pagesEl = document.getElementById('pages');
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
      cur = g.type; grp = [g];
    } else { grp.push(g); }
  });
  if (grp.length) parType.push(grp);

  parType.forEach(groupeType => {
    let pageGraines = [];
    let lignesPage = 0;

    function creerPage(gs, isLast) {
      const page = document.createElement('div');
      page.className = isLast ? 'page page-last-of-group' : 'page';
      page.innerHTML = `<table>${makeHeader()}<tbody>${gs.map(makeRow).join('')}</tbody></table>`;
      pagesEl.appendChild(page);
    }

    groupeType.forEach(g => {
      const nbLignes = Math.max(1, g.sachets.length);
      if (lignesPage + nbLignes > LIGNES_PAR_PAGE ) {
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

let varietesParNom = {};

/* Abréviations mois — clés = valeurs exactes dans Grist */
const MOIS = {
  "Jan":"J","Fév":"F","Mar":"M","Avr":"A","Mai":"Ma",
  "Jui":"Ju","Juil":"Jl","Aou":"Ao","Sep":"S","Oct":"O","Nov":"N","Déc":"D",
  "Janvier":"J","Février":"F","Mars":"M","Avril":"A","Juin":"Ju",
  "Juillet":"Jl","Août":"Ao","Septembre":"S","Octobre":"O",
  "Novembre":"N","Décembre":"D"
};

/* =============================================
   UTILITAIRES
   ============================================= */
function fmtAnnee(v) {
  if (!v) return '';
  // Si v est un timestamp Unix (en secondes)
  if (typeof v === 'number') {
    const date = new Date(v * 1000); // Convertir en millisecondes
    return date.getFullYear().toString();
  }
  // Si v est un objet Date
  if (v instanceof Date) {
    return v.getFullYear().toString();
  }
  // Si v est une chaîne (ex: "2024-05-20")
  return String(v).substring(0, 4);
}

function fmtMois(v) {
  if (!v) return '';

  let src = Array.isArray(v) ? [...v] : String(v).split(',').map(x => x.trim());

  // Les Choice List Grist sont renvoyées sous la forme ["L", ...]
  if (Array.isArray(src) && src[0] === 'L') {
    src = src.slice(1);
  }

  return src.map(m => MOIS[m] || m).join(' ');
}

function fmtVal(v) {
  if (!v) return '';

  if (Array.isArray(v)) {
    const vals = v[0] === 'L' ? v.slice(1) : v;
    return vals.join(', ');
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
   Colonnes "par sachet" → multi-lignes si plusieurs millésimes
   Colonnes "info-bas" → données stables depuis Varietes
   ============================================= */
function makeRow(g) {
  const ss = g.sachets;
  const nb = ss.length;

  function mc(cls, vals) {
    if (nb <= 1) return `<td class="${cls}">${vals[0]}</td>`;
    return `<td class="${cls} multi">${
      vals.map(v => `<span class="sl">${v || '&nbsp'}</span>`).join('')
    }</td>`;
  }

  // Formater les saisons : "or." ou nombre
  const saisonsFormatted = ss.map(s => {
    if (!s.saisons) return '';
    const val = String(s.saisons).trim().toLowerCase();
    if (val === 'or.' || val === 'or') {
      return 'or.';
    } else if (!isNaN(val)) {
      return parseInt(val);
    } else {
      return s.saisons;
    }
  });

  return `<tr class="graine-row">
    <td class="col-type">${g.type || ''}</td>
    <td class="col-nom nom-cell">
      <span class="nom">${g.nom || ''}</span>
      ${g.variete ? `<span class="var">${g.variete}</span>` : ''}
    </td>
    <td class="col-epingle">${g.num_epingle || ''}</td>
    <td class="col-nbep info-gris">${g.nb_epingle || ''}</td>
    ${mc('col-origine',   ss.map(s => fmtVal(s.origine)))}
    ${mc('col-sachet',    ss.map(s => s.sachet))}
    ${mc('col-annee',     ss.map(s => fmtAnnee(s.annee)))}
    ${mc('col-saisons',   saisonsFormatted)}  <!-- Utiliser saisonsFormatted -->
    ${mc('col-qtte',      ss.map(s => s.qtte))}
    ${mc('col-germ',      ss.map(s => s.germination))}
    <td class="col-profond   info-bas">${g.profondeur  || ''}</td>
    <td class="col-germdur   info-bas">${g.germ_duree  || ''}</td>
    <td class="col-germtemp  info-bas">${g.germ_temp   || ''}</td>
    <td class="col-sa        info-bas">${fmtMois(g.abri)}</td>
    <td class="col-se        info-bas">${fmtMois(g.semis_ext)}</td>
    <td class="col-vide1"></td>
    <td class="col-arrosage  info-bas">${g.arrosage    || ''}</td>
    <td class="col-exposition info-bas">${g.exposition  || ''}</td>
    <td class="col-ou        info-bas">${fmtVal(g.ou)}</td>
    <td class="col-vide2"></td>
  </tr>`;
}
/* =============================================
   RENDU DES PAGES
   Tri : Type → Nom → Variété
   Groupement par Type avec saut de page entre les groupes
   ============================================= */
function render(graines) {
  document.getElementById('info-count').textContent = graines.length + ' variétés';
  const pagesEl = document.getElementById('pages');
  pagesEl.innerHTML = '';

  graines.sort((a, b) => {
    const t = (a.type || '').localeCompare(b.type || '', 'fr');
    if (t) return t;
    const n = (a.nom || '').localeCompare(b.nom || '', 'fr');
    if (n) return n;
    return (a.variete || '').localeCompare(b.variete || '', 'fr');
  });

  /* Grouper par type */
  const parType = [];
  let cur = null, grp = [];
  graines.forEach(g => {
    if (g.type !== cur) {
      if (grp.length) parType.push(grp);
      cur = g.type; grp = [g];
    } else { grp.push(g); }
  });
  if (grp.length) parType.push(grp);

  parType.forEach(groupeType => {
    let pageGraines = [];
    let lignesPage = 0;

    function creerPage(gs, isLast) {
      const page = document.createElement('div');
      page.className = isLast ? 'page page-last-of-group' : 'page';
      page.innerHTML = `<table>${makeHeader()}<tbody>${gs.map(makeRow).join('')}</tbody></table>`;
      pagesEl.appendChild(page);
    }

    groupeType.forEach(g => {
  // Calculer le nombre de lignes nécessaires pour cette graine
  // Si 1 sachet → 2 lignes (pour afficher correctement les infos)
  // Sinon → nombre de sachets (chaque sachet = 1 ligne)
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
   - Widget lié à Millesimes (onRecords)
   - r.NomVariete = texte complet "Nom\nVariété"
     → sert de clé pour croiser avec varietesParNom
   - Regroupement par variété, sachets agrégés
   ============================================= */

/* Stockage Varietes indexé par NomVariete (texte) */
let derniersRecords = [];

function buildGrainesMap(records) {
  const map = new Map();

  records
    .filter(r => r.Sachets !== null && r.Sachets !== undefined && r.Sachets !== '')
    .forEach(r => {
      const nomComplet = r.NomVariete || '';
      const v = varietesParNom[nomComplet] || {};

      const parts = nomComplet.split('\n');
      const nom = v.Nom || parts[0] || '';
      const variete = v.Variete || parts[1] || '';

      const key = nomComplet || ('_' + r.id);

      if (!map.has(key)) {
        map.set(key, {
          type: v.Type || r.Type || '',
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
          sachets: []
        });
      }

      // Utiliser Nb_saisons depuis Millesimes
      const nbSaisons = r.Nb_saisons || '';
     // Gérer germination : 0% si testé et pas germé, vide si jamais testé
      const germinationValue = r.Germination_affichee !== null
        ? (r.Germination_affichee === 0 ? '0%' : Math.round(r.Germination_affichee * 100) + '%')
        : '';
      
      map.get(key).sachets.push({
        origine: r.Origine || '',
        sachet: r.Sachets || '',
        annee: r.Millesime || '',
        saisons: nbSaisons, // Utiliser Nb_saisons directement
        qtte: r.Qtte_graines || '',
        germination: germinationValue, // Utiliser la nouvelle logique
      });
    });

  return map;
}

/* =============================================
   INITIALISATION GRIST
   Widget lié à Millesimes
   Étape 1 : onRecords — reçoit les données de Millesimes
   Étape 2 : fetchTable('Varietes') — charge les données stables
   Le rendu n'a lieu que quand les deux sources sont prêtes
   ============================================= */
// Fonction pour charger les données locales depuis un fichier JSON
async function chargerDonneesLocales(nomFichier) {
  try {
    // Utilisez "../data/" pour remonter d'un niveau depuis Cahier/
    const response = await fetch(`../data/${nomFichier}.json`);
    if (!response.ok) {
      throw new Error(`Fichier ${nomFichier}.json introuvable.`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erreur lors du chargement de ${nomFichier}.json :`, error);
    return [];
  }
}

// Fonction pour initialiser les données locales
async function initialiserDonneesLocales() {
  try {
    // 1. Charger Varietes.json
    const varietesData = await chargerDonneesLocales("Varietes");
    if (!varietesData || !Array.isArray(varietesData)) {
      console.error("varietesData n'est pas un tableau valide !");
      return;
    }

    // 2. Construire varietesParNom avec Nom + Variete
    varietesParNom = {};
    varietesData.forEach((v) => {
      if (!v.Nom || !v.Variete) {
        console.warn("Donnée Varietes incomplète :", v);
        return;
      }
      const nomComplet = `${v.Nom}\n${v.Variete}`;
      varietesParNom[nomComplet] = v;
    });
    console.log(`varietesParNom chargé avec ${Object.keys(varietesParNom).length} entrées.`);

    // 3. Charger Millesimes.json
    const millesimesData = await chargerDonneesLocales("Millesimes");
    if (!millesimesData || !Array.isArray(millesimesData)) {
      console.error("millesimesData n'est pas un tableau valide !");
      return;
    }

    // 4. Transformer les données pour correspondre au format attendu
    derniersRecords = millesimesData.map(record => {
      // 1. Construire NomVariete à partir de Nom + Variete
      const nomVariete = `${record.Nom}\n${record.Variete}`;

      // 2. Convertir Millesime (timestamp) en date lisible (YYYY-MM-DD)
      const millesimeDate = record.Millesime ? new Date(record.Millesime * 1000).toISOString().split('T')[0] : '';

      // 3. Gérer Germination_affichee
      const germinationAffichee = record.Germination_affichee !== null
        ? record.Germination_affichee
        : (record.Germination_historique !== null ? record.Germination_historique : null);

      // 4. Convertir Sachets (ex: "1" → "Sachet 1")
      const sachets = record.Sachets ? `Sachet ${record.Sachets}` : '';

      // 5. Nettoyer Origine (enlever "L" si présent)
      const origine = Array.isArray(record.Origine)
        ? record.Origine.filter(item => item !== 'L')
        : [];

      // 6. Créer un tableau sachets pour makeRow
      return {
        ...record,
        NomVariete: nomVariete,
        Sachets: sachets,
        Millesime: millesimeDate,
        Germination_affichee: germinationAffichee,
        Nb_saisons: record.Nb_saisons || record.Nb_saisons_manuel || '',
        Origine: origine,
        sachets: [{
          origine: origine,
          sachet: sachets,
          annee: fmtAnnee(record.Millesime),
          saisons: record.Nb_saisons || record.Nb_saisons_manuel || '',
          qtte: record.Qtte_graines || '',
          germination: germinationAffichee !== null
            ? (germinationAffichee === 0 ? '0%' : Math.round(germinationAffichee * 100) + '%')
            : '',
        }]
      };
    });

    console.log("derniersRecords transformé (2 premiers) :", derniersRecords.slice(0, 2));

    // 5. Vérifier les correspondances entre Millesimes et Varietes
    derniersRecords.forEach(r => {
      if (!r.NomVariete) {
        console.warn("Entrée Millesimes sans NomVariete :", r);
      }
      if (!varietesParNom[r.NomVariete]) {
        console.warn(`Aucune correspondance pour NomVariete: "${r.NomVariete}"`);
      }
    });

    // 6. Appeler render
    if (derniersRecords.length > 0) {
      render([...buildGrainesMap(derniersRecords).values()]);
    }
  } catch (error) {
    console.error("Erreur dans initialiserDonneesLocales :", error);
  }
}
   
if(!bouchonne) {
  console.log(" GRIST ");
  grist.ready({ requiredAccess: 'full' });

/* Étape 1 : enregistrer onRecords EN PREMIER */
grist.onRecords(function(records) {
  console.log("Première entrée Millesimes :", records[0]); // Vérifiez que Nb_saisons est présent
  derniersRecords = records;
  /* Rendre seulement si Varietes est déjà chargé */
  if (Object.keys(varietesParNom).length > 0) {
      render([...buildGrainesMap(records).values()]);
  }
});

/* Étape 2 : charger Varietes APRÈS onRecords */
grist.docApi.fetchTable('Varietes').then(data => {
  varietesParNom = {};
  const ids = data.id || [];
  ids.forEach((id, i) => {
    /* Clé = NomVariete (texte complet), même valeur que r.NomVariete dans Millesimes */
    const cle = data.NomVariete ? data.NomVariete[i] : '';
    if (!cle) return;
    varietesParNom[cle] = {
      Type:               data.Type               ? data.Type[i]               : '',
      Nom:                data.Nom                ? data.Nom[i]                : '',
      Variete:            data.Variete             ? data.Variete[i]             : '',
      Num_epingle:        data.Num_epingle         ? data.Num_epingle[i]         : '',
      Nb_epingle:         data.Nb_epingle          ? data.Nb_epingle[i]          : '',
      Semis_profondeur:   data.Semis_profondeur    ? data.Semis_profondeur[i]    : '',
      Duree_germ:         data.Duree_germ          ? data.Duree_germ[i]          : '',
      Temp_germ:          data.Temp_germ           ? data.Temp_germ[i]           : '',
      Semis_sous_abris:   data.Semis_sous_abris    ? data.Semis_sous_abris[i]    : '',
      Semis_pleine_terre: data.Semis_pleine_terre  ? data.Semis_pleine_terre[i]  : '',
      Arrosage:           data.Arrosage            ? data.Arrosage[i]            : '',
      Exposition:         data.Exposition          ? data.Exposition[i]          : '',
      Ou_cultiver:        data.Ou_cultiver         ? data.Ou_cultiver[i]         : '',
    };
    console.log("Semis sous abris :", JSON.stringify(data.Semis_sous_abris[i]));
    console.log("Semis pleine terre :", JSON.stringify(data.Semis_pleine_terre[i]));
    console.log("Où cultiver :", JSON.stringify(data.Ou_cultiver[i]));
  });

  /* Si Millesimes déjà reçus → on peut rendre maintenant */
  if (derniersRecords) {
    render([...buildGrainesMap(derniersRecords).values()]);
  }
}).catch(err => console.error('Erreur fetchTable Varietes :', err));

} else {
  console.log("Mode BOUCHON : chargement des données locales depuis JSON");
  document.addEventListener('DOMContentLoaded', initialiserDonneesLocales);
}