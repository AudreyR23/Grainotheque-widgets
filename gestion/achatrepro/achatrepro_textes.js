
// ===== Textes de l'outil Achat / repro =====
// Tous les messages affichés après une action (erreurs de saisie, confirmations, erreurs d'écriture)
// et les libellés fabriqués par le code sont ici. Les libellés fixes (titres, champs, boutons,
// bandeaux, avertissements) sont dans achatrepro.html. Chargé AVANT achatrepro.js.
 
const TEXTES = {
  // --- Contrôles de saisie : espèce et variété ---
  nomObligatoire: 'Le nom est obligatoire.',
  conservationEntier: "La conservation doit être un nombre entier d'années.",
  dureeEntier: 'La durée de germination doit être un nombre entier de jours.',
  profondeurFormat: 'La profondeur de semis doit être un nombre ou une fourchette (ex. 1 ou 1-2).',
 
  // --- Contrôles de saisie : millésime ---
  varieteObligatoire: 'Choisir une variété.',
  anneeMillesime: (min, max) => `L'année du millésime doit avoir 4 chiffres (entre ${min} et ${max}).`,
  origineObligatoire: "L'origine est obligatoire.",
  natureObligatoire: 'Cocher Sachet ou Plante mère.',
  quantiteObligatoire: 'Indiquer la quantité de graines.',
  anneePlantation: (min, max) => `L'année de plantation doit avoir 4 chiffres (entre ${min} et ${max}).`,
  nbPlantsObligatoire: 'Indiquer le nombre de plants (entier, au moins 1).',
  typePlantObligatoire: 'Choisir le type de plant.',
  lieuxObligatoires: 'Choisir au moins un emplacement pour la plante mère.',
  ligneObligatoire: 'Choisir une ligne d\'étiquettes, ou décocher "Issu de mes étiquettes".',
  sachetsReelsObligatoire: 'Indiquer le nombre de sachets réels (au moins 1).',
 
  // --- Erreurs d'écriture et de lecture ---
  erreur: e => '❌ Erreur : ' + e,
  detectionImpossible: e => '⚠️ Détection impossible : ' + e,
  decochageEchoue: e => '⚠️ Millésime créé, mais le décochage de "A produire" a échoué : ' + e,
  nettoyageEchoue: e => '⚠️ Millésime créé, mais le nettoyage de la ligne d\'étiquettes a échoué : ' + e,
  ligneSemisEchouee: e => '⚠️ Millésime créé, mais la ligne Semis a échoué : ' + e,
  varieteIntrouvable: 'Variété introuvable dans la liste (recharge le widget).',
  originePasAjoutee: e => '❌ Origine non ajoutée : ' + e,
  infoPasAjoutee: e => '❌ Info non ajoutée : ' + e,
  erreurChargement: e => 'Erreur de chargement : ' + e,
  aucunChoixLieux: 'aucun choix trouvé pour Semis.Ou',
  lieuxNonCharges: e => 'Emplacements non chargés : ' + e + ' (impossible de créer une plante mère).',
 
  // --- Confirmations ---
  especeCreee: nom => ' Espèce créée : ' + nom,
  varieteCreee: nom => ' Variété créée : ' + nom,
  millesimeCree: (annee, nom, planteMere, nbDecoches, don) =>
    ' Millésime ' + annee + ' créé pour ' + nom +
    (planteMere ? ' (ajouté aussi dans Semis)' : '') +
    (nbDecoches ? ' · "À produire" décoché sur ' + nbDecoches + ' semis' : '') +
    (don > 0 ? ' · Don : ' + don + ' sachet(s)' : ''),
  origineExiste: nom => `Cette origine existe déjà : « ${nom} » est sélectionnée.`,
  origineAjoutee: nom => ' Origine ajoutée : ' + nom,
  infoAjoutee: nom => ' Info ajoutée : ' + nom,
 
  // --- Libellés fabriqués par le code (listes) ---
  orOriginal: 'or. (original)',
  varieteInconnue: '(variété inconnue)',
  graineAIdentifier: (note, nb) =>
    'Graines à identifier' + (note ? ' (' + note + ')' : '') + ' · ' + nb + ' étiquette(s)',
  ligneAttente: (variete, type, nb) => variete + ' · ' + type + ' · ' + nb + ' étiquette(s)',
  typeMere: 'plante mère',
  typeSemis: 'semis',
  typeHorsSachet: 'récupération hors sachet'
};
 