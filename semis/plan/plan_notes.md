# Outil Plan (granothèque Grist) : récapitulatif

## Rôle
Plan du jardin en SVG. Il affiche des zones (formes, rotation) et des étiquettes de plantes issues de la table Semis, à placer sur le plan. Impression A3 sur 4 feuilles.

## Fichiers
- plan.html, ../script/main_plan.js, ../styles/plan.css (GitHub, versions dev et prod)
- Widget personnalisé, accès `requiredAccess: 'full'`

## Données
- **Semis** : lit Nom, Variete, Type, Ou (ChoiceList), Plantes, A_produire, Positions.
  Écrit uniquement `Positions` (Texte), en JSON : `[{"x":38,"y":1018,"n":6}, ...]` (n = nombre de pieds, 1 par défaut).
  Position_X et Position_Y ont été supprimées.
- **Plan** : colonnes Zone, X, Y, Rotation, Largeur, Hauteur (une ligne par zone, clé = label de ZONES_DEF).
- La colonne `Positions` doit être visible dans la section du widget, sinon `onRecords` ne la reçoit pas.
- Options du widget (grist.setOption) : `tailleEtiquettes`, `modeTablette`.

## Fonctionnalités
- Plusieurs étiquettes par ligne Semis, quota = colonne Plantes (la valeur de Plantes n'est jamais modifiée).
- Nombre de pieds par étiquette (pastille sur l'étiquette) ; reste à placer = Plantes - somme des pieds posés.
- Noms de zones dans un calque séparé, toujours horizontaux, au-dessus et alignés à gauche de la boîte englobante, avec halo blanc.
- Modes : Vue, Éditer zones, Placer plantes, Sélection (rectangle puis déplacement de groupe).
- Couleurs d'étiquettes selon le type (reconnu par l'emoji).
- Indicateur « ● Non sauvegardé » (variable `modifie`, fonction `majStatut`).
- Mode tablette : bouton Auto / Tablette / PC, pincement à deux doigts, pose en deux touches (toucher la plante dans la liste, puis le plan), appui long pour le nombre de pieds, grosses cibles en CSS (`body[data-tablette="oui"]`).
- Impression A3 paysage, 2x2 feuilles, avec lignes de coupe.

## Choix techniques et conventions
- Noms en français ; état global en haut du fichier.
- `recordsParId` (Map) : `recordsParId.get(id)`, pas `.find`.
- Pendant un glissement, on ne modifie que l'attribut `transform` de l'élément (mémorisé dans `drag`), sans reconstruire le SVG.
- `signaturePositions` : `placements` n'est reconstruit que si les Positions ont changé.
- `modifie = true` bloque la relecture de Grist (étiquettes et zones) jusqu'à la sauvegarde.
- Événements `pointer*` (souris et tactile), `capturer(e)` pour le tactile, `touch-action: none` en CSS.
- FACTEUR_PLAN = 1.6 (zoom des zones par rapport aux coordonnées enregistrées).

## Pièges rencontrés
- Colonne masquée dans la vue : `onRecords` ne la renvoie pas (valeur `undefined`).
- Une accolade ou un `else if` en trop casse tout le fichier : vérifier la console F12.
- Ne pas tester sur la version prod par erreur : vérifier l'URL du widget.
- Cache de l'iframe Grist : Ctrl+Maj+R.
- L'émulation tactile de Chrome demande Ctrl+Maj+M, puis un appareil précis, puis F5.

## Reste à faire (optionnel)
- Confirmation avant suppression avec la croix × (risque d'appui accidentel au doigt).
- Bandeau du mode Édition : « Clic droit = pivoter » n'a pas de sens au doigt.
- Vérifier que `prompt()` fonctionne sur la vraie tablette, sinon boutons − et +.
- Noms de zones : ne déplacer que le nom de la zone glissée (`placerNom`), seulement si les glissements sont saccadés.