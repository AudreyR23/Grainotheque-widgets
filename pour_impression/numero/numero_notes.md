# Granothèque Grist : widget « Numéros d'épingle » (numero)

## Rôle
Imprimer la liste des numéros d'épingle : feuilles A4 paysage, 3 colonnes de 20, une case par variété
(type | nom et variété | numéro), triée par numéro, suivie de cases vides numérotées pour la saison suivante.
Lecture seule : l'outil n'écrit jamais dans Grist.
Usage : impression A4 paysage (PC), en début de saison. Accès Grist : `full`. Dev `Vue`, prod `main`.

## Fichiers
- `numero.html`, `numero.js`, `numero.css` (mêmes noms que l'ancien outil).
- Communs : `scriptcommun.js`, `styles_communs.css`, `styles_communs_pourimpression.css` (chargé entre les deux,
  comme dans les 3 autres outils d'impression).
- Fonctions communes utilisées : `tableEnLignes`, `pluriel`, `colonnesAbsentes`, `facteurZoom`, `effacerAuClic`.

## Données
- Widget **lié à Varietes, sans filtre**. `grist.onRecords(charger, { includeColumns: 'normal' })` ne sert que
  de **signal** « Varietes a changé » : les lignes reçues ne sont pas utilisées.
- `charger` relit **toute** la table par `fetchTable('Varietes')` : ni les filtres ni le tri de la vue ne comptent.
- Widget non lié (ou page ouverte hors Grist) : l'en-tête reste sur « Chargement… ». Une ligne filtrée dans le widget
  ne déclenche pas la mise à jour.
- Colonnes lues : `Type`, `Nom`, `Variete`, `Num_epingle` (`COLONNES_NECESSAIRES`). `Nb_epingle` : non utilisée (voulu).
- Écrites : aucune.

## Règles de la liste
- Gardées : `Num_epingle` non vide et > 0.
- Doublons de numéro : la première variété (ordre des id) est gardée, les autres ignorées **sans message**
  (un autre outil signale les doublons).
- Tri par numéro croissant ; numéro affiché tel quel ; variété affichée seulement si elle n'est pas vide.
- Pagination : `LIGNES_PAR_COLONNE` (20) × `COLONNES_PAR_PAGE` (3), remplies colonne par colonne (1-20, 21-40, 41-60).
  Les 3 colonnes existent toujours ; une colonne vide garde sa largeur, sans traits.
- **Emplacements vides** : `NB_EMPLACEMENTS_VIDES` (10) cases après le dernier numéro (`emplacementVide`).
  Seul le numéro est écrit : plus grand numéro + 1, + 2… (1, 2… si aucune épingle).
  Elles comptent dans le nombre de pages, pas dans « N graines ».

## Fonctionnement
- **En-tête collé** (masqué à l'impression) : titre, statut, bouton Imprimer, « N graines avec numéro d'épingle · P pages »,
  avertissement de colonnes introuvables, erreur.
- **Colonnes introuvables** : `colonnesAbsentes(table, COLONNES_NECESSAIRES)` sur la table entière (marche même vide) ;
  alerte rouge, aucune feuille, Imprimer grisé.
- Imprimer grisé aussi pendant le chargement et s'il n'y a aucune épingle. Imprimer = `window.print()`.
- Erreur de chargement : `TEXTES.echec` dans `etat.erreur`, effacée au prochain clic (`effacerAuClic`), comme le cahier.

## Choix techniques
- Zones Vue : `#appEntete`, `#appPages` ; `etat` : `charge`, `nbNumeros`, `pages`, `zoom`, `colonnesManquantes`, `erreur`.
- `epinglesTriees(lignes)` → `[{ id, type, nom, variete, num }]` ; `emplacementVide(num)` (id `vide-N`) ;
  `enPages(liste)` → pages → colonnes → épingles (trois `v-for`).
- Aperçu : `ResizeObserver` sur `#appPages` → `etat.zoom = facteurZoom(largeur)` ; `:style="{ '--zoom-ecran': etat.zoom }"` sur chaque `.feuille`.

## CSS
- Du commun d'impression : `.feuille`, `.zone-feuilles`, `.insecable` (posée dans le HTML sur `.epingle`), `@media print`.
- Local : `feuille--epingles` (flex, `align-items: flex-start`, `gap: 5mm`), `liste-epingles` (+ `--vide`),
  `epingle` (grille `75px 1fr 40px`, hauteur 9,2 mm), `epingle__cellule` (+ `--type`, `--nom`, `--num`),
  `epingle__nom`, `epingle__variete`. Couleurs : `--gris-bordure`, `--noir-intense`.
- Dimensions de l'ancien `main.css`. Seule différence voulue : la dernière page (colonnes alignées en haut).

## Décisions
- 25/11 : retrait de `numeroLecture` (compteur et ses tests) et de `horsGrist` / `dansGrist`, comme dans le cahier.
  Risque accepté : deux modifications très rapprochées dans Grist (rechargement ou modification suivante).

## Points de vigilance
- **Hauteur au plus juste** : 20 × 9,2 mm + 1 px = 184 mm pour 185 mm disponibles (210 − 15 − 10).
  Ne toucher ni à la hauteur d'une épingle, ni au padding vertical de `.feuille`, ni aux traits.
- Une faute de frappe dans un grand `Num_epingle` (1420 au lieu de 142) décale les emplacements vides : visible à l'aperçu.
- Noms longs coupés sans signalement (`overflow: hidden`).

## Reste à faire
- [x] Mise en prod : communs d'abord (`styles_communs_pourimpression.css`, `scriptcommun.js`), puis les 3 fichiers ;
      URL du widget, **lier à Varietes sans filtre**, Ctrl+F5, test d'impression.
- [x] Supprimer `main.css` quand les anciens widgets du cahier et des étiquettes seront supprimés.