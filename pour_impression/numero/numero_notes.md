# Granothèque Grist : widget « Numéros d'épingle » (numero)

## Rôle
Imprimer la liste des numéros d'épingle : feuilles A4 paysage, 3 colonnes de 20, une case par numéro
(type | nom et variété | numéro), en série continue de 1 au plus grand numéro, suivie de cases vides numérotées
pour la saison suivante. Les numéros libres gardent leur case, à remplir à la main.
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
- **Série continue** (`serieComplete`) : une case par numéro, de 1 au plus grand numéro + `NB_EMPLACEMENTS_VIDES` (10).
  Un numéro sans variété (libre au milieu, ou après le plus grand) devient un emplacement vide (`emplacementVide`) :
  seul le numéro est écrit. Exemple : 67 rempli, 68 numéro seul, 69 rempli. Aucune épingle : cases 1 à 10.
- Les cases vides comptent dans le nombre de pages, pas dans « N graines ».
- Numéro affiché tel quel ; variété affichée seulement si elle n'est pas vide.
- Pagination : `LIGNES_PAR_COLONNE` (20) × `COLONNES_PAR_PAGE` (3), remplies colonne par colonne (1-20, 21-40, 41-60).
  Les 3 colonnes existent toujours ; une colonne vide garde sa largeur, sans traits.

## Fonctionnement
- **En-tête collé** (masqué à l'impression) : titre, statut, bouton Imprimer, « N graines avec numéro d'épingle · P pages »,
  avertissement de colonnes introuvables, erreur.
- **Colonnes introuvables** : `colonnesAbsentes(table, COLONNES_NECESSAIRES)` sur la table entière (marche même vide) ;
  alerte rouge, aucune feuille, Imprimer grisé.
- Imprimer grisé aussi pendant le chargement et s'il n'y a aucune épingle. Imprimer = `window.print()`.
- Erreur de chargement : `TEXTES.echec` dans `etat.erreur`, effacée au prochain clic (`effacerAuClic`), comme le cahier.

## Choix techniques
- Zones Vue : `#appEntete`, `#appPages` ; `etat` : `charge`, `nbNumeros`, `pages`, `zoom`, `colonnesManquantes`, `erreur`.
- `epinglesTriees(lignes)` → `[{ id, type, nom, variete, num }]` triées ; `emplacementVide(num)` (id `vide-N`) ;
  `serieComplete(epingles)` (Map locale numéro → épingle, non affichée) ; `enPages(liste)` → pages → colonnes → épingles (trois `v-for`).
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
- 26/11 : série continue de 1 au plus grand numéro ; les numéros libres gardent leur case (ajout à la main).

## Points de vigilance
- **Hauteur au plus juste** : 20 × 9,2 mm + 1 px = 184 mm pour 185 mm disponibles (210 − 15 − 10).
  Ne toucher ni à la hauteur d'une épingle, ni au padding vertical de `.feuille`, ni aux traits.
- **Le nombre de pages dépend du plus grand numéro**, pas du nombre de variétés : une faute de frappe (1420 au lieu de 142)
  donnerait ~1 300 cases vides, une vingtaine de pages. Visible au nombre de pages de l'en-tête.
- Un `Num_epingle` non entier (12,5) ou en texte ne correspond à aucun numéro de la série : **il n'est pas imprimé**.
  Sans effet si les données sont propres (un autre outil contrôle les numéros).
- Noms longs coupés sans signalement (`overflow: hidden`).

## Reste à faire
- [x] Mise en prod : communs d'abord (`styles_communs_pourimpression.css`, `scriptcommun.js`), puis les 3 fichiers ;
      URL du widget, **lier à Varietes sans filtre**, Ctrl+F5, test d'impression.
- [x] Supprimer `main.css` quand les anciens widgets du cahier et des étiquettes seront supprimés.
- [x] Mise en prod de la série continue : copier `numero.js` sur `main`, Ctrl+F5, test d'impression.