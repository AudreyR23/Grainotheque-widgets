# Granothèque Grist : widget « Numéros d'épingle » (numero)

## Rôle
Imprimer la liste des numéros d'épingle : feuilles A4 paysage, 3 colonnes de 20, une case par variété
(type | nom et variété | numéro), triée par numéro.
Lecture seule : l'outil n'écrit jamais dans Grist.
Usage : impression A4 paysage (PC). Migré en Vue, CSS commun BEM + commun impression.
Accès Grist : `full`. Versions dev (branche `Vue`) et prod (`main`).

## Fichiers
- `numero.html`, `numero.js`, `numero.css` (mêmes noms que l'ancien outil : remplacés, rien à supprimer)
- Commun : `../../script/scriptcommun.js`, `../../styles/styles_communs.css`,
  `../../styles/styles_communs_impression_bem.css` (**premier outil à le charger**)
- Ordre des CSS : commun BEM, commun impression, `numero.css`.
- Fonctions communes utilisées : `tableEnLignes`, `pluriel`.
- N'utilise plus `main.css`.

## Données
- Widget **lié à Varietes, sans filtre** : `grist.onRecords(charger, { includeColumns: 'normal' })` ne sert
  que de **signal** « Varietes a changé » (les lignes reçues ne sont pas utilisées). Une ligne filtrée dans
  le widget ne déclencherait pas la mise à jour.
- **Varietes** relue par `fetchTable('Varietes')` à chaque signal : toute la table, sans les filtres ni le tri de la vue.
  Mise à jour en direct.
- Widget non lié : `onRecords` n'est jamais appelé, l'en-tête reste sur « Chargement… ».
- Colonnes lues : `Type`, `Nom`, `Variete`, `Num_epingle` (liste `COLONNES_NECESSAIRES`).
- `Nb_epingle` existe dans Varietes mais n'est pas utilisée ici (voulu).
- Écrites : aucune.

## Règles de la liste
- Gardées : `Num_epingle` non vide et > 0.
- **Doublons de numéro** : la première variété rencontrée (ordre des id) est gardée, les autres ignorées
  **sans message** (un autre outil signale les doublons).
- Tri par numéro croissant.
- Pagination : `LIGNES_PAR_COLONNE = 20` × `COLONNES_PAR_PAGE = 3` = 60 par page, remplies **colonne par colonne**
  (1-20, 21-40, 41-60). Les 3 colonnes sont toujours créées, même vides sur la dernière page
  (une colonne vide est gardée pour la largeur, sans traits).
- **Emplacements vides** : `NB_EMPLACEMENTS_VIDES = 10` cases à la suite du dernier numéro (fabriquées par
  `emplacementVide`), à remplir à la main pour la saison suivante. Seul le numéro est écrit : plus grand numéro + 1, + 2…
  (1, 2… si aucune épingle). Elles comptent dans le nombre de pages, pas dans « N graines ».
  Une faute de frappe dans un grand `Num_epingle` (1420 au lieu de 142) décale ces numéros : visible à l'aperçu.
- Numéro affiché tel quel (pas de `toLocaleString`). Variété affichée seulement si elle n'est pas vide.

## Fonctionnement
- **En-tête collé** (masqué à l'impression) : titre, statut (Chargement… / ✓ Chargé), bouton Imprimer,
  « N graines avec numéro d'épingle · P pages », avertissement de colonnes introuvables, erreur.
- **Colonnes introuvables** : test `c in table` sur le résultat de `fetchTable` (fonctionne même si la table est vide) ;
  avertissement rouge, aucune feuille, Imprimer grisé.
- Imprimer grisé aussi pendant le chargement et s'il n'y a aucune épingle.
- **Imprimer** : `window.print()`, ne modifie rien.
- Hors Grist (Live Server) : message `TEXTES.horsGrist`.
- Messages dans le bloc `TEXTES` en haut du JS. Erreur : jusqu'au prochain clic (écouteur `click` en capture).

## Choix techniques
- Zones Vue : `#appEntete`, `#appPages` ; un seul `etat` (`charge`, `nbNumeros`, `pages`, `zoom`, `colonnesManquantes`, `erreur`).
- Pas de `recordsParId` (aucune relecture avant écriture), pas de `watch` (pas de filtre).
- `numeroLecture` : une lecture dépassée par une plus récente est ignorée.
- `epinglesTriees(lignes)` : filtre, doublons, tri → `[{ id, type, nom, variete, num }]`.
- `emplacementVide(num)` : mêmes champs, tous vides sauf `num` ; id `vide-N` (pas de collision avec les id numériques).
- `enPages([...epingles, ...vides])` : `etat.pages` = pages → colonnes → épingles (trois `v-for` imbriqués).
- **Zoom d'aperçu** : `ajusterZoom` (`ResizeObserver` sur `#appPages`, jamais au-delà de 1),
  `:style="{ '--zoom-ecran': etat.zoom }"` sur chaque `.feuille` ; `zoom: 1` à l'impression (commun impression).

## CSS
- Du **commun impression** : `.feuille` (A4 paysage, padding `15mm 10mm 10mm 10mm`, police Arial 9px var(--noir)),
  `.zone-feuilles` (défilement à l'écran, `overflow: visible` à l'impression), `@media print`
  (`@page` A4 paysage marge 0, `body` sans padding, `.entete` masqué, saut de page après chaque feuille).
- **Local** (`numero.css`) : `feuille--epingles` (flex, `align-items: flex-start` pour qu'une colonne incomplète
  s'arrête à sa dernière épingle, `gap: 5mm`), `liste-epingles` (colonne) + `liste-epingles--vide` (sans traits,
  posée par `:class="{ 'liste-epingles--vide': !colonne.length }"`),
  `epingle` (grille `75px 1fr 40px`, hauteur 9,2 mm), `epingle__cellule` (+ `--type`, `--nom`, `--num`),
  `epingle__nom`, `epingle__variete` ; `@media print` : `.epingle` insécable.
- Dimensions identiques à l'ancien `main.css`. Le trait gauche de la 1re colonne est conservé
  (le bloc qui le retirait était en commentaire dans `main.css`). Seule différence voulue : la dernière page
  (colonnes incomplètes alignées en haut, colonne vide sans traits).
- Utilisé du commun BEM : `entete`, `statut`, `ligne` (+ `--pleine`), `btn`, `texte` (+ `--discret`, `--gras`, `--erreur`), balise `h1`.

## Points de vigilance
- **Hauteur au plus juste** : 20 × 9,2 mm = 184 mm + 1 px de trait du haut, pour 185 mm disponibles
  (210 − 15 − 10). Ne pas augmenter la hauteur d'une épingle, le padding vertical de la feuille ni les traits.
  `box-sizing: border-box` (commun BEM) est indispensable : sans lui, les traits s'ajoutent à la hauteur.
- Impression : tester l'aperçu en A4 paysage après toute modification du CSS (local ou communs).
- Ne jamais lancer « Mettre en forme le document » sur le HTML.
- Noms longs : la cellule coupe le texte (`overflow: hidden`) sans le signaler.
- Si une colonne est renommée dans Grist, l'avertissement « Colonne introuvable » le signale ; mettre à jour `COLONNES_NECESSAIRES`.

## Reste à faire
- [ ] Mise en prod : **d'abord** `styles_communs_impression_bem.css` sur `main`, puis les 3 fichiers de l'outil,
      vérifier l'URL du widget dans Grist, **lier le widget à Varietes sans filtre**, Ctrl+F5, test d'impression.
- [ ] Cahier et étiquettes : passer au commun impression (liste dans la discussion du commun).
- [ ] `ajusterZoom` et `LARGEUR_FEUILLE_PX` (recopiés dans les 3 outils d'impression) : candidats à `scriptcommun.js`
      (fonction qui renvoie seulement le facteur ; chaque outil garde `etat.zoom = …`).
- [ ] Après suppression des anciens widgets du cahier et des étiquettes : supprimer `main.css`.
- Écarté : contrôle des valeurs non numériques et des doublons de `Num_epingle` (un autre outil s'en charge).
- [ ] Mémo conventions : mettre à jour la section « Outils d'impression ».