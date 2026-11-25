# Granothèque Grist : widget « Calendrier des semis » (calendrier)

> Dernière mise à jour : 25/11/2026

## Rôle
Imprimer le calendrier des semis à glisser dans le cahier papier : une page (ou plus) par type de plante,
un tableau plante × mois où chaque case montre si l'on sème sous abri (barre du haut, verte) et/ou en pleine terre
(barre du bas, marron). Pensé pour une impression en noir et blanc (la position de la barre suffit).
Lecture seule : l'outil n'écrit jamais dans Grist.
Usage : impression A4 paysage (PC). Migré en Vue, CSS commun + commun impression.
Accès Grist : `full` (lecture de Varietes par `fetchTable`). Versions dev (branche `Vue`) et prod (`main`).
Volume : environ 143 plantes affichées.

## Fichiers
- `calendrier.html`, `calendrier.js`, `calendrier.css`
- Commun : `../../script/scriptcommun.js`, `../../styles/styles_communs.css`, `../../styles/styles_communs_pourimpression.css`
  (chargé entre le commun et le CSS de l'outil).
- Fonctions communes utilisées : `tableEnLignes`, `listeChoix`, `normaliser`, `pluriel`, `colonnesAbsentes`, `facteurZoom`,
  `LISTE_MOIS`, `numeroMois`, `indexerVarietes`, `varieteReferencee`.
- N'utilise plus `main.css`.

## Données
- Widget lié à **Millesimes** : `grist.onRecords(afficherMillesimes, { includeColumns: 'normal' })`
  (toutes les colonnes, même masquées dans la vue). Mise à jour en direct.
- **Varietes** relue par `fetchTable('Varietes')` à chaque appel de `onRecords` (donc à chaque ouverture du widget),
  puis indexée par `indexerVarietes` (commun) : `{ parId, parNom, doublons }`, rangé dans `recordsParId.varietes`.
  Une modification faite dans Varietes pendant que le calendrier est affiché n'apparaît qu'au rechargement : jugé suffisant.
- `NomVariete` (Millesimes) arrive en texte (`"Nom\nVariété"`) ; `varieteReferencee` (commun) gère le texte et l'id.
  Deux variétés de même `NomVariete` : la première est gardée, les autres sont signalées dans « points à revoir ».
- Colonnes Millesimes : `NomVariete`, `Nb_sachets` (liste `COLONNES_MILLESIMES`).
- Colonnes Varietes : `Nom`, `Variete`, `Type`, `NomVariete`, `Semis_sous_abris`, `Semis_pleine_terre` (liste `COLONNES_VARIETES`,
  vérifiée sur la table entière : marche même si Varietes est vide).
- Écrites : aucune.
- Panne déjà rencontrée : widget lié à une autre table que Millesimes → calendrier vide. L'alerte « colonnes introuvables » le signale.

## Règles du calendrier
- **Seuls les millésimes avec `Nb_sachets` rempli comptent** (décision confirmée le 25/11). Le Cahier, lui, filtre sur `Epuise` :
  les plantes mères et les sachets en vrac (`Qtte_graines` sans `Nb_sachets`) sont dans le Cahier mais pas ici. Voulu.
  Le filtre est dans chaque outil, pas dans le commun : les deux choix ne se gênent pas.
- Regroupement par **plante** = `Varietes.Nom` exact ; une variété n'est comptée qu'une fois même avec plusieurs millésimes.
  Les noms presque identiques ne sont pas fusionnés : ils sont signalés.
- Type de la plante = celui de la première variété rencontrée (affiché tel quel, emoji en tête).
- Mois : valeurs de `Semis_sous_abris` / `Semis_pleine_terre` traduites par `numeroMois` (commun). Valeur inconnue : ignorée et signalée.
- **Variété sans aucun mois renseigné** : ignorée dans le calcul (info manquante, pas « ne sème jamais ») et signalée.
  Sans cela, toutes les cases de sa plante seraient hachurées.
- Code de chaque case (`casDuMois`) : `'toutes'` les variétés sèment ce mois-là → barre pleine ; `'certaines'` → barre hachurée ;
  `'aucune'` → place réservée vide (`barre--vide`, l'autre barre ne bouge pas).
- Plante sans aucun mois de semis : non affichée, signalée.
- Tri : type, puis nom (`localeCompare` en `'fr'`), même ordre de types que le cahier.
- Pagination (`recalculerPages`) : un type ne partage jamais une page ; `LIGNES_PAR_COLONNE = 30` ; 2 colonnes par feuille ;
  au-delà de 60 lignes, page « (suite) ». Lecture continue : colonne de gauche (moitié arrondie au-dessus) puis colonne de droite.
- **Lignes vides** (à remplir à la main), dernière page de chaque type, ajoutées **après la dernière plante** (l'alphabet n'est
  jamais coupé, elles tombent en bas de la colonne de droite). Total visé pair, pour que les deux colonnes finissent à la même
  hauteur : 3 si le nombre de plantes est impair, 2 s'il est pair ; page presque pleine : 1 ou 0. Exemples chiffrés dans le
  commentaire de `recalculerPages`. Fabriquées par `ligneVide` ; elles ne comptent pas dans « N plantes ».
- Titre de chaque feuille : « 🌱 Calendrier des semis · » + type (+ « (suite) ») ;
  légende sur chaque feuille : « Sous abri (barre du haut) », « Pleine terre (barre du bas) », « Certaines variétés seulement ».

## Fonctionnement
- **En-tête collé** (masqué à l'impression) : statut (Chargement… / ✓ Chargé), bouton Imprimer, « N plantes · P pages »,
  colonnes introuvables, points à revoir, erreur de chargement.
- **Colonnes introuvables** : message rouge (`entete__message`), aucun calendrier, Imprimer grisé.
- **Erreur de chargement** : `TEXTES.erreurChargement(detail)` dans `etat.message`, affichée dans l'en-tête (`entete__message`)
  jusqu'au prochain chargement réussi (pas d'`effacerAuClic` : l'outil n'a pas d'autre erreur).
- **Points à revoir dans Grist** : encart repliable (`<details>` / `<summary>`, sans JS) « ⚠ N points à revoir dans Grist ».
  Contenu (`etat.aRevoir` ; listes calculées par le JS, phrases dans le HTML) : variétés en double dans Varietes (même `NomVariete`),
  noms presque identiques (même `normaliser(Nom)`), plantes sans aucun mois, variétés sans aucun mois, types différents selon
  les variétés, mois non reconnus. `total` calculé par le JS.
- **Imprimer** : `window.print()`.
- **Mois courant** : colonne surlignée en bleu clair à l'écran, pas à l'impression.

## Choix techniques
- Zones Vue : `#appEntete`, `#appPages` ; un seul `etat` (`charge`, `plantes`, `aRevoir`, `pages`, `zoom`, `colonnesManquantes`, `message`).
- `recordsParId` : `varietes` (résultat de `indexerVarietes`), `millesimes` (Map id → ligne).
- `etat.plantes` = `{ cle, nom, type, mois: [12 × { abri, terre }] }`.
- `etat.pages` = `{ type, suite, colonnes: [[plante ou ligne vide]] }` ; clé des lignes = `cle` (`plante-…` / `vide-type-n`).
- Le JS renvoie des codes (`'toutes' | 'certaines' | 'aucune'`) ; le HTML choisit les classes.
- `moisDe(valeur, inconnus)` ajoute les valeurs non reconnues à un `Set`.
- **Zoom d'aperçu** : `facteurZoom` (commun) dans un `ResizeObserver` sur `#appPages` ; `:style="{ '--zoom-ecran': etat.zoom }"` sur `.feuille`.
- Pas de `watch` (pas de filtre).

## CSS (`calendrier.css`)
- Du commun d'impression : `.feuille`, `.zone-feuilles`, `.tableau`, `.tronque`, `.insecable`, `@page`, sauts de page, masquage de `.entete`.
- En-tête : `a-revoir` (pleine largeur), `__resume` (rouge, curseur main), `__ligne`.
- Haut de feuille : `calendrier__haut`, `calendrier__titre`, `calendrier__suite`, `calendrier__legende`, `calendrier__cle`, `calendrier__colonnes`.
- Tableau : `tableau-semis` (largeur = moitié de la feuille), `__col-nom` (30 mm), `__titre` (+ `--nom`, `--actuel`),
  `__ligne` (6,5 mm), `__nom` (12 px), `__case` (+ `--actuel`).
- Barres : `barre` (1,8 mm), `--abri`, `--terre`, `--abri-partielle`, `--terre-partielle` (hachures, écrites après la barre pleine
  pour la remplacer à poids égal), `--vide`, `--legende`. Couleurs du commun : `--sousabri-*`, `--pleineterre-*`.
- `@media print` local (dernier bloc du fichier) : pas de surlignage du mois courant.
- Utilisé du commun : `entete`, `entete__message`, `statut`, `ligne` (+ `--pleine`), `btn`, `texte` (+ `--discret`, `--erreur`, `--gras`), balise `h1`.

## Décisions
- 25/11 : filtre sur `Nb_sachets` gardé (pas `Epuise`, voir « Règles »).
- 25/11 : pas de fusion avec le Cahier ; lecture de Varietes mise en commun (`indexerVarietes`, `varieteReferencee`).
- 25/11 : retrait de la fenêtre de détails (clic sur une case hachurée) : inutile sur papier. Code récupérable dans Git.
- 25/11 : retrait de `numeroLecture` et du message hors Grist (comme le Cahier) ; erreur de chargement selon la convention (`etat.message`).
- Lignes vides « à hauteur égale » gardées malgré leur subtilité (commentaire avec exemples).

## Points de vigilance
- Impression : tester l'aperçu en A4 paysage (noir et blanc) après toute modification (local ou commun). Vérifier qu'une
  colonne pleine (30 lignes) ne déborde pas ; sinon baisser `LIGNES_PAR_COLONNE`.
- Ne jamais lancer « Mettre en forme le document » sur le HTML.
- Après un copier-coller de CSS, vérifier que le bloc `@media print` est bien le dernier et complet.
- Noms longs coupés par « … » (colonne de 30 mm) : passer à 32 mm si un nom important est illisible.

## Reste à faire
- [ ] Corriger dans Grist les points listés par l'encart « à revoir » (doublons, types douteux : Haricot en 🌼, Pois et Haricots en 🍅, mois manquants).
- [ ] Mise en prod : commun d'abord (`scriptcommun.js` avec `indexerVarietes` / `varieteReferencee`, `styles_communs_pourimpression.css`),
      puis les 3 fichiers ; URL du widget dans Grist (lié à Millesimes, accès complet au document), Ctrl+F5, test d'impression.
- [ ] Discussion du Cahier : adopter `indexerVarietes` / `varieteReferencee` ; corriger sa note qui qualifie le filtre `Nb_sachets`
      du Calendrier d'« erreur » (c'est un choix). L'encart « points à revoir » pourrait lui servir (mêmes doublons de noms).