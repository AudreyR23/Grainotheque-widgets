# Outil Plan (granothèque Grist) : récapitulatif

## Rôle
Plan du jardin en SVG. Il affiche des zones (formes, rotation) et des étiquettes de plantes issues de la table Semis, à placer sur le plan. Impression A3 sur 4 feuilles.

## Fichiers
- `plan.html`, `plan.js`, `plan.css` + commun `../../script/scriptcommun.js` et `../../styles/styles_communs.css` (GitHub, branche `Vue` en dev, `main` en ligne).
- Scripts en fin de `<body>` : plugin Grist, Vue 3.4.38, `scriptcommun.js`, `plan.js`.
- Widget personnalisé, accès `requiredAccess: 'full'`.

## Refonte en Vue (zone par zone)
Zones prévues : `#appBarre`, `#appPanneau`, `#appZones`, `#appPlantes`, `#appNoms`, `#appSelection`, `#appImpression`. L'outil doit marcher à chaque étape.
- **Étape 1 (26/11)** : barre d'outils = zone Vue `#appBarre` (`header.entete.barre`), classes communes (`btn`, `btn--etape` pour le mode choisi et les coupures visibles, `btn--enregistrer`, `statut`, `entete__message`) ; `btn--compact` local (PC), taille du commun en mode tablette. État partagé `etat` (mode, modifie, enCours, nbPlantes, tailleEtiquettes, modeTablette, coupuresVisibles, colonnesManquantes, succes, erreur, message). `onRecords(…, { includeColumns: 'normal' })`. Alerte « colonnes manquantes » (`COLONNES_SEMIS`, `COLONNES_PLAN`) : aucune étiquette et sauvegarde bloquée. Plan lu avec `tableEnLignes`. Code mort retiré : `trapeze2`, `.zoom-controls`/`.zoom-btn`, `.zone-label`, double test du déplacement du plan, badge de mode, `majStatut`/`messageJusqua`, ancien CSS de la barre.
- Encore en JS « à l'ancienne » (étapes suivantes) : panneau, calques SVG, sélection, impression (`innerHTML`, `getElementById`, `body[data-tablette]`).

## Données
- **Semis** : lit Nom, Variete, Type, Ou (ChoiceList, reçue sans 'L'), Plantes, A_produire, Positions.
  Écrit uniquement `Positions` (Texte), en JSON : `[{"x":38,"y":1018,"n":6}, ...]` (n = nombre de pieds, 1 par défaut).
- **Plan** : colonnes Zone, X, Y, Rotation, Largeur, Hauteur (une ligne par zone, clé = label de ZONES_DEF). `Visible` : jamais lue ni écrite (décision en attente : supprimer ou utiliser).
- Depuis `includeColumns: 'normal'`, `Positions` peut être masquée dans la vue.
- Options du widget (grist.setOption) : `tailleEtiquettes`, `modeTablette`.

## Fonctionnalités
- Plusieurs étiquettes par ligne Semis, quota = colonne Plantes (la valeur de Plantes n'est jamais modifiée).
- Nombre de pieds par étiquette (pastille sur l'étiquette) ; reste à placer = Plantes - somme des pieds posés.
- Noms de zones dans un calque séparé, toujours horizontaux, au-dessus et alignés à gauche de la boîte englobante, avec halo blanc.
- Modes : Vue, Éditer zones, Placer plantes, Sélection (rectangle puis déplacement de groupe). Le mode en cours = bouton orange.
- Couleurs d'étiquettes selon le type (reconnu par l'emoji).
- Statut : « ● Non sauvegardé » (`etat.modifie`), « Sauvegarde… », « ✅ Sauvegardé » (4 s) ; erreur de sauvegarde dans l'en-tête jusqu'au prochain clic.
- Mode tablette : bouton Auto / Tablette / PC, pincement à deux doigts, pose en deux touches (toucher la plante dans la liste, puis le plan), appui long pour le nombre de pieds.
- Impression A3 paysage, 2x2 feuilles, avec lignes de coupe.

## Choix techniques et conventions
- `recordsParId` (Map) : `recordsParId.get(id)`, pas `.find`.
- Pendant un glissement, on ne modifie que l'attribut `transform` de l'élément (mémorisé dans `drag`), sans reconstruire le SVG.
- `signaturePositions` : `placements` n'est reconstruit que si les Positions ont changé.
- `etat.modifie = true` bloque la relecture de Grist (étiquettes et zones) jusqu'à la sauvegarde.
- Événements `pointer*` (souris et tactile), `capturer(e)` pour le tactile, `touch-action: none` en CSS.
- FACTEUR_PLAN = 1.6 (zoom des zones par rapport aux coordonnées enregistrées).

## Pièges rencontrés
- Une accolade ou un `else if` en trop casse tout le fichier : vérifier la console F12.
- Ne pas tester sur la version prod par erreur : vérifier l'URL du widget.
- Cache de l'iframe Grist : Ctrl+Maj+R.
- L'émulation tactile de Chrome demande Ctrl+Maj+M, puis un appareil précis, puis F5.

## Reste à faire (optionnel)
- Confirmation avant suppression avec la croix × (risque d'appui accidentel au doigt) ; `confirm()` de Réinit. plantes → fenêtre `confirmation` du commun.
- Bandeau du mode Édition : « Clic droit = pivoter » n'a pas de sens au doigt.
- Vérifier que `prompt()` fonctionne sur la vraie tablette, sinon boutons − et +.
- Grille de fond : `<pattern id="grid">` défini mais aucun rectangle ne l'utilise (à remettre ou à retirer).
- Noms de zones : ne déplacer que le nom de la zone glissée (`placerNom`), seulement si les glissements sont saccadés.