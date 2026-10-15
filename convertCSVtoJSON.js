const fs = require('fs');
const csv = require('csv-parser');

// Dossiers d'entrée et de sortie
const inputDir = './'; // Dossier contenant vos CSV
const outputDir = './data/'; // Dossier de sortie pour les JSON

// Créer le dossier de sortie s'il n'existe pas
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Fonction pour nettoyer une valeur
function nettoyerValeur(valeur) {
  if (valeur === null || valeur === undefined || valeur === '') {
    return '';
  }
  if (Array.isArray(valeur)) {
    return valeur
      .filter(x => x !== 'L' && x !== null && x !== undefined)
      .map(x => String(x).trim());
  }
  return String(valeur).trim();
}

// Remplacez votre fonction timestampToDate existante par celle-ci :
function timestampToDate(millesime) {
  if (!millesime || millesime === '' || millesime === '0') {
    return ''; // Valeur vide
  }

  // Si c'est une année directe (ex: "2026" ou 2026)
  if (/^\d{4}$/.test(String(millesime))) {
    return String(millesime); // Retourne l'année telle quelle
  }

  // Si c'est un timestamp Unix (ex: 1767225600)
  if (!isNaN(parseInt(millesime))) {
    const date = new Date(parseInt(millesime) * 1000);
    const year = date.getFullYear();
    return year !== 1970 ? String(year) : ''; // Évite 1970 si le timestamp est invalide
  }

  // Si c'est une date ISO (ex: "2026-10-10")
  if (typeof millesime === 'string' && millesime.includes('-')) {
    return millesime.substring(0, 4); // Extraire l'année
  }

  return ''; // Valeur par défaut
}

// Fonction pour traiter Varietes.csv
function traiterVarietes() {
  return new Promise((resolve, reject) => {
    const varietesParId = {}; // Pour le calendrier et le plan
    const varietesParNom = {}; // Pour les autres outils
    let nextId = 1; // ID auto-incrémenté pour simuler Grist

    fs.createReadStream(`${inputDir}Granothýque-Varietes.csv`)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (row) => {
        try {
          const nom = nettoyerValeur(row.Nom);
          const variete = nettoyerValeur(row.Variete);
          const nomVariete = variete ? `${nom}\n${variete}` : nom;
          const id = nextId++;

          // Structure pour le calendrier et le plan (varietesParId)
          varietesParId[id] = {
            id: id,
            Nom: nom,
            Type: nettoyerValeur(row.Type),
            NomVariete: nomVariete,
            Variete: variete,
            Semis_sous_abris: nettoyerValeur(row.Semis_sous_abris),
            Semis_pleine_terre: nettoyerValeur(row.Semis_pleine_terre),
            Famille: nettoyerValeur(row.Famille),
            Ou_cultiver: nettoyerValeur(row.Ou_cultiver),
          };

          // Structure pour les autres outils (varietesParNom)
          varietesParNom[nomVariete] = {
            Type: nettoyerValeur(row.Type),
            Nom: nom,
            Variete: variete,
            Num_epingle: nettoyerValeur(row.Num_epingle),
            Nb_epingle: nettoyerValeur(row.Nb_epingle),
            Semis_profondeur: nettoyerValeur(row.Semis_profondeur),
            Duree_germ: nettoyerValeur(row.Duree_germ),
            Temp_germ: nettoyerValeur(row.Temp_germ),
            Semis_sous_abris: nettoyerValeur(row.Semis_sous_abris),
            Semis_pleine_terre: nettoyerValeur(row.Semis_pleine_terre),
            Arrosage: nettoyerValeur(row.Arrosage),
            Exposition: nettoyerValeur(row.Exposition),
            Ou_cultiver: nettoyerValeur(row.Ou_cultiver),
            Infos: nettoyerValeur(row.Infos),
            Famille: nettoyerValeur(row.Famille),
            Nature_du_sol: nettoyerValeur(row.Nature_du_sol),
            Qualite_du_sol: nettoyerValeur(row.Qualite_du_sol),
            Conservation: nettoyerValeur(row.Conservation),
          };
        } catch (error) {
          console.error(`Erreur dans Varietes.csv :`, error);
        }
      })
      .on('end', () => {
        // Écrire varietesParId pour le calendrier et le plan
        fs.writeFileSync(`${outputDir}Varietes_par_id.json`, JSON.stringify(varietesParId, null, 2));
        // Écrire varietesParNom pour les autres outils
        fs.writeFileSync(`${outputDir}Varietes.json`, JSON.stringify(varietesParNom, null, 2));
        console.log(`✅ Varietes_par_id.json et Varietes.json générés avec ${Object.keys(varietesParId).length} variétés.`);
        resolve({ varietesParId, varietesParNom });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Fonction pour traiter Millesimes.csv
function traiterMillesimes({ varietesParId, varietesParNom }) {
  return new Promise((resolve, reject) => {
    const millésimes = [];
    const millésimesPourCalendrier = [];

    fs.createReadStream(`${inputDir}Granothýque-Millesimes.csv`)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (row) => {
        try {
          const nom = nettoyerValeur(row.Nom);
          const variete = nettoyerValeur(row.Variete);
          const nomVariete = variete ? `${nom}\n${variete}` : nom;

          // Trouver l'ID correspondant dans varietesParId
          const varieteObj = Object.values(varietesParId).find(v => v.NomVariete === nomVariete);
          const idVariete = varieteObj ? varieteObj.id : null;

          // Structure pour les autres outils (derniersRecords)
         const millesimeAnnee = timestampToDate(row.Millesime);
const germinationAffichee = row.Germination_affichee !== null && row.Germination_affichee !== ''
  ? parseFloat(row.Germination_affichee) / 100  // <-- Divise par 100 pour convertir 8 en 0.08
  : null;
const sachets = row.Sachets ? `Sachet ${row.Sachets}` : 'Sachet 1';
const origine = nettoyerValeur(row.Origine);

const record = {
  ...(varietesParNom[nomVariete] || {}),
  NomVariete: nomVariete,
  Sachets: row.Sachets || '1', // Conserve la valeur brute de Sachets (ex: "1" ou "1p.")
  Millesime: millesimeAnnee, // Année nettoyée (ex: "2026")
  Germination_affichee: germinationAffichee,
  Nb_saisons: nettoyerValeur(row.Nb_saisons) || nettoyerValeur(row.Nb_saisons_manuel),
  Origine: origine,
  sachets: [{
    origine: origine,
    sachet: row.Sachets || '1', // Valeur brute de Sachets (ex: "1" ou "1p.")
    annee: millesimeAnnee, // Année nettoyée (ex: "2026")
    saisons: nettoyerValeur(row.Nb_saisons) || nettoyerValeur(row.Nb_saisons_manuel),
    qtte: row.Qtte_graines || '', // Valeur brute de Qtte_graines (ex: "100")
    germination: germinationAffichee !== null
  ? (germinationAffichee === 0 ? '0%' : Math.round(germinationAffichee * 100) + '%')
  : ''
  }]
};
millésimes.push(record);

          // Structure pour le calendrier (millesimesRecus)
          const millésimePourCalendrier = {
  id: millésimesPourCalendrier.length + 1,
  NomVariete: idVariete || nomVariete,
  Sachets: sachets,
  Millesime: parseInt(row.Millesime) || Math.floor(new Date().getTime() / 1000), // <-- On garde le timestamp ici
  Origine: origine,
  Nb_saisons: nettoyerValeur(row.Nb_saisons) || nettoyerValeur(row.Nb_saisons_manuel),
  Qtte_graines: row.Qtte_graines ? parseInt(row.Qtte_graines) : null,
};
          millésimesPourCalendrier.push(millésimePourCalendrier);
        } catch (error) {
          console.error(`Erreur dans Millesimes.csv :`, error);
        }
      })
      .on('end', () => {
        // Écrire Millesimes.json pour les autres outils
        fs.writeFileSync(`${outputDir}Millesimes.json`, JSON.stringify(millésimes, null, 2));
        // Écrire Millesimes_pour_calendrier.json pour le calendrier
        fs.writeFileSync(`${outputDir}Millesimes_pour_calendrier.json`, JSON.stringify(millésimesPourCalendrier, null, 2));
        console.log(`✅ Millesimes.json et Millesimes_pour_calendrier.json générés avec ${millésimes.length} entrées.`);
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Fonction pour traiter Semis.csv (pour le plan)
function traiterSemis({ varietesParId }) {
  return new Promise((resolve, reject) => {
    const semis = [];

    fs.createReadStream(`${inputDir}Granothýque-Plan.csv`)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (row) => {
        try {
          const nom = nettoyerValeur(row.Nom);
          const variete = nettoyerValeur(row.Variete);
          const nomVariete = variete ? `${nom}\n${variete}` : nom;

          // Trouver l'ID correspondant dans varietesParId
          const varieteObj = Object.values(varietesParId).find(v => v.NomVariete === nomVariete);
          const idVariete = varieteObj ? varieteObj.id : null;

          // Structure pour le plan (records)
          const semisRecord = {
            id: semis.length + 1,
            Nom: nom,
            Variete: variete,
            NomVariete: nomVariete,
            Ou: nettoyerValeur(row.Ou_cultiver) || nettoyerValeur(row.Ou) || [],
            Position_X: row.Position_X ? parseInt(row.Position_X) : null,
            Position_Y: row.Position_Y ? parseInt(row.Position_Y) : null,
            Plantes: row.Plantes ? parseInt(row.Plantes) : 0,
            A_produire: row.A_produire ? row.A_produire.toLowerCase() === 'true' : false,
          };
          semis.push(semisRecord);
        } catch (error) {
          console.error(`Erreur dans Semis.csv :`, error);
        }
      })
      .on('end', () => {
        fs.writeFileSync(`${outputDir}Semis.json`, JSON.stringify(semis, null, 2));
        console.log(`✅ Semis.json généré avec ${semis.length} entrées.`);
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Fonction pour traiter Plan.csv (pour le plan)
function traiterPlan() {
  return new Promise((resolve, reject) => {
    const planRecords = [];

    fs.createReadStream(`${inputDir}Granothýque-Plan.csv`)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (row) => {
        try {
          const planRecord = {
            id: planRecords.length + 1,
            Zone: nettoyerValeur(row.Zone),
            X: row.X ? parseInt(row.X) : 0,
            Y: row.Y ? parseInt(row.Y) : 0,
            Rotation: row.Rotation ? parseInt(row.Rotation) : 0,
            Largeur: row.Largeur ? parseInt(row.Largeur) : 0,
            Hauteur: row.Hauteur ? parseInt(row.Hauteur) : 0,
          };
          planRecords.push(planRecord);
        } catch (error) {
          console.error(`Erreur dans Plan.csv :`, error);
        }
      })
      .on('end', () => {
        fs.writeFileSync(`${outputDir}Plan.json`, JSON.stringify(planRecords, null, 2));
        console.log(`✅ Plan.json généré avec ${planRecords.length} entrées.`);
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Fonction pour traiter Modele.csv (si nécessaire)
function traiterModele() {
  return new Promise((resolve, reject) => {
    const modeles = {};
    fs.createReadStream(`${inputDir}Granothýque-Modele.csv`)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (row) => {
        try {
          const nom = nettoyerValeur(row.Nom);
          modeles[nom] = {
            Type: nettoyerValeur(row.Type),
            Conservation: nettoyerValeur(row.Conservation),
            Semis_profondeur: nettoyerValeur(row.Semis_profondeur),
            Duree_germ: nettoyerValeur(row.Duree_germ),
            Temp_germ: nettoyerValeur(row.Temp_germ),
            Semis_sous_abris: nettoyerValeur(row.Semis_sous_abris),
            Semis_pleine_terre: nettoyerValeur(row.Semis_pleine_terre),
            Recolte_floraison: nettoyerValeur(row.Recolte_floraison),
            Exposition: nettoyerValeur(row.Exposition),
            Arrosage: nettoyerValeur(row.Arrosage),
            Nature_du_sol: nettoyerValeur(row.Nature_du_sol),
            Qualite_du_sol: nettoyerValeur(row.Qualite_du_sol),
            Famille: nettoyerValeur(row.Famille),
            Ou_cultiver: nettoyerValeur(row.Ou_cultiver),
            Infos: nettoyerValeur(row.Infos),
          };
        } catch (error) {
          console.error(`Erreur dans Modele.csv :`, error);
        }
      })
      .on('end', () => {
        fs.writeFileSync(`${outputDir}Modele.json`, JSON.stringify(modeles, null, 2));
        console.log(`✅ Modele.json généré avec ${Object.keys(modeles).length} modèles.`);
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Exécuter le traitement
async function main() {
  try {
    console.log('🔄 Début du traitement des CSV...');
    const { varietesParId, varietesParNom } = await traiterVarietes();
    await traiterMillesimes({ varietesParId, varietesParNom });
    await traiterSemis({ varietesParId });
    await traiterPlan();
    await traiterModele();
    console.log('🎉 Tous les fichiers JSON ont été générés avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors du traitement :', error);
  }
}

main();
