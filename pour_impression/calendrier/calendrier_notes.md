/
Outils html pr gestion potager
Outils html pr gestion potager


Récents
Widget Grist calendrier
il y a 9 minutes
Grist Codium - Outil " À gérer"
il y a 3 heures
Widget Grist impression numéros
il y a 3 heures
Outil "Cahier"
il y a 5 heures
Outil "Etiquettes"
il y a 8 heures
Outil "Gestion_etiquettes"
il y a 10 heures
Outil "Achatrepro"
il y a 10 heures
Outil "A_gerer"
il y a 20 heures
Doublon de millésime Grist
il y a 4 jours
Table millesime ajustements
il y a 4 jours
Calcul de germination consolidé pour plusieurs semis
il y a 4 jours
Gérer plusieurs semis d'une même variété dans Grist
il y a 4 jours
Grist Codium - Outil Plan potager
il y a 4 jours
Grist Codium - Outil "Boîte à dons"
il y a 4 jours
Fusion des CSS Grist
il y a 4 jours
Grist Codium - Outil "Numérotation"
il y a 4 jours
Grist Codium - Outil « À semer »
il y a 4 jours
Grist Codium - Outil "Semis réalisés"
il y a 4 jours

Instructions
Contexte16 fichiers
Programmé

Privé
Contexte

Nom	
claude	
calendrier notesMD	
cahier notesMD	
cahierCSS	
cahierHTML	
cahierJS	
etiquettes notesMD	
etiquettesCSS	
etiquettesHTML	
etiquettesJS	
mainCSS	
memo des conventionsMD	
scriptcommunJS	
scriptcommunMD	
styles communs bemCSS	
styles communs pourimpressionCSS	
tables gristTEXT	
16 fichiers · 3 % de la capacité du projet utilisée
calendrier notesMD · 9,5 ko · il y a 33 minutes
# Granothèque Grist : widget « Calendrier des semis » (calendrier)
 
## Rôle
Imprimer le calendrier des semis à glisser dans le cahier papier : une page (ou plus) par type de plante,
un tableau plante × mois où chaque case montre si l'on sème sous abri (barre du haut, verte) et/ou en pleine terre
(barre du bas, marron). Pensé pour une impression en noir et blanc (la position de la barre suffit).
Lecture seule : l'outil n'écrit jamais dans Grist.
Usage : impression A4 paysage (PC). Migré en Vue, CSS commun BEM + commun impression.
Accès Grist : `full` (lecture de Varietes par `fetchTable`). Versions dev (branche `Vue`) et prod (`main`).
Volume : environ 143 plantes affichées.
 
## Fichiers
- `calendrier.html`, `calendrier.js`, `calendrier.css`
- Commun : `../../script/scriptcommun.js`, `../../styles/styles_communs.css`, `../../styles/styles_communs_pourimpression.css`
  (chargé entre le commun BEM et le CSS de l'outil).
- Fonctions communes utilisées : `tableEnLignes`, `listeChoix`, `normaliser`, `pluriel`, `typeInverse`.
- N'utilise plus `main.css`.
## Données
- Widget lié à **Millesimes** : `grist.onRecords(afficherMillesimes, { includeColumns: 'normal' })`
  (toutes les colonnes, même masquées dans la vue). Mise à jour en direct.
- **Varietes** relue par `fetchTable('Varietes')` à chaque appel de `onRecords` (`numeroLecture` ignore une lecture dépassée),
  donc aussi à chaque ouverture du widget. Seule limite : une modification faite dans Varietes pendant que le calendrier
  est affiché n'apparaît qu'au rechargement. Jugé suffisant.
- `NomVariete` (Millesimes) arrive en texte (`"Nom\nVariété"`) ; un id est aussi géré (`varieteDuMillesime`).
  Deux variétés de même `NomVariete` : la première est gardée, avertissement dans la console (seul message console restant).
- Colonnes Millesimes : `NomVariete`, `Nb_sachets` (liste `COLONNES_MILLESIMES`).
- Colonnes Varietes : `Nom`, `Variete`, `Type`, `NomVariete`, `Semis_sous_abris`, `Semis_pleine_terre` (liste `COLONNES_VARIETES`).
- Écrites : aucune.
- Panne déjà rencontrée : widget lié à une autre table que Millesimes → calendrier vide. L'alerte « colonnes introuvables » le signale désormais.
## Règles du calendrier
- Seuls les millésimes avec `Nb_sachets` rempli comptent (choix confirmé ; différent du cahier qui se fonde sur `Epuise` :
  un millésime avec `Qtte_graines` sans `Nb_sachets` et les plantes mères n'apparaissent pas ici).
- Regroupement par **plante** = `Varietes.Nom` exact ; une variété n'est comptée qu'une fois même avec plusieurs millésimes.
  Les noms presque identiques ne sont pas fusionnés : ils sont signalés (voir « Points à revoir »).
- Type de la plante = celui de la première variété rencontrée.
- Mois : valeurs des ChoiceList `Semis_sous_abris` / `Semis_pleine_terre` traduites par `NUMERO_MOIS`
  (`Jan`/`Janvier`, `Fév`/`Février`, … `Jui`/`Juin`, `Juil`/`Juillet`, `Aou`/`Août`…). Valeur inconnue : ignorée et signalée.
- **Variété sans aucun mois renseigné** : ignorée dans le calcul (info manquante, pas « ne sème jamais ») et signalée.
  Sans cela, toutes les cases de sa plante seraient hachurées.
- Code de chaque case (`casDuMois`) : `'toutes'` les variétés sèment ce mois-là → barre pleine ; `'certaines'` → barre hachurée ;
  `'aucune'` → place réservée vide (`barre--vide`, l'autre barre ne bouge pas).
- Plante sans aucun mois de semis : non affichée, signalée.
- Tri : type, puis nom (`localeCompare` en `'fr'`), même ordre de types que le cahier.
- Pagination (`recalculerPages`) : un type ne partage jamais une page ; `LIGNES_PAR_COLONNE = 30` ; 2 colonnes par feuille ;
  au-delà de 60 lignes, page « (suite) ». Lecture continue : colonne de gauche (moitié arrondie au-dessus) puis colonne de droite.
- **Lignes vides** (à remplir à la main), sur la dernière page de chaque type, ajoutées **à la fin de la liste** (donc en bas
  de la colonne de droite, l'alphabet n'est jamais coupé) : 3 si le nombre de plantes est impair, 2 s'il est pair, pour que le
  total soit pair et que les deux colonnes finissent à la même hauteur. Pas assez de place : 1 (impair) ou 0 (pair).
  Fabriquées par `ligneVide` (12 cases `'aucune'`) ; elles ne comptent pas dans « N plantes ».
- Titre de chaque feuille : « 🌱 Calendrier des semis · » + `typeInverse(type)` (+ « (suite) ») ;
  légende sur chaque feuille : « Sous abri (barre du haut) », « Pleine terre (barre du bas) », « Certaines variétés seulement ».
## Fonctionnement
- **En-tête collé** (masqué à l'impression) : statut (Chargement… / ✓ Chargé), bouton Imprimer, « N plantes · P pages »,
  avertissement de colonnes introuvables, points à revoir, erreur.
- **Colonnes introuvables** : avertissement rouge, aucun calendrier, Imprimer grisé.
- **Points à revoir dans Grist** : encart repliable (`<details>` / `<summary>`, sans JS) « ⚠ N points à revoir dans Grist ».
  Contenu (`etat.aRevoir`, listes de noms calculées par le JS, phrases dans le HTML) : noms presque identiques
  (même `normaliser(Nom)`, ex. Epinard / Épinard, espace en trop), plantes sans aucun mois, variétés sans aucun mois,
  plantes dont les variétés ont des types différents, mois non reconnus. `total` calculé par le JS. Remplace les messages console.
- **Imprimer** : ferme la fenêtre de détails, attend `Vue.nextTick()`, puis `window.print()`.
- **Mois courant** : colonne surlignée en bleu clair à l'écran, pas à l'impression.
- **Fenêtre de détails** (écran seulement, gardée comme base de fonctionnalités) : clic sur une case hachurée
  (curseur main, contour orange au survol) → « Plante · mois » et la liste de ses variétés avec leurs barres pour ce mois.
  Fermée par ✕, par un clic ailleurs (écouteur `click` sur `document`) ou un clic sur une case non hachurée.
  `@click.stop` sur la case et sur la fenêtre empêche la fermeture immédiate.
- Messages dans le bloc `TEXTES` en haut du JS. Erreur : jusqu'au prochain clic (écouteur `click` en capture).
## Choix techniques
- Zones Vue : `#appEntete`, `#appPages`, `#appDetails` ; un seul `etat`
  (`charge`, `plantes`, `aRevoir`, `pages`, `details`, `zoom`, `colonnesManquantes`, `erreur`).
- `recordsParId` : Maps `varietes` (id), `varietesParNom`, `millesimes`.
- `etat.plantes` = `{ cle, nom, type, varietes: [{ id, nom, abri: [num], terre: [num] }], mois: [12 × { abri, terre }] }`.
- `etat.pages` = `{ type, suite, colonnes: [[plante ou ligne vide]] }` ; clé des lignes = `cle` (`plante-…` / `vide-type-n`).
- Le JS renvoie des codes (`'toutes' | 'certaines' | 'aucune'`) ; le HTML choisit les classes. `estPartielle(cas)` pour le clic.
- `MOIS` : `num`, `court` (en-tête de colonne), `long` (titre de la fenêtre), `valeurs` (lues dans Grist).
- `moisDe(valeur, inconnus)` ajoute les valeurs non reconnues à un `Set`.
- **Zoom d'aperçu** : `zoom: var(--zoom-ecran, 1)` sur `.feuille` (commun impression), facteur calculé par `ajusterZoom`
  (`ResizeObserver` sur `#appPages`, jamais au-delà de 1) ; `zoom: 1` à l'impression.
- Pas de `watch` (pas de filtre).
## CSS (`calendrier.css`)
- `.feuille`, `.zone-feuilles`, `@page`, sauts de page et masquage de `.entete` viennent de `styles_communs_pourimpression.css`
  (padding 15/10/10/10 mm gardé).
- En-tête : `a-revoir` (pleine largeur), `__resume` (rouge, curseur main), `__ligne`.
- Haut de feuille : `calendrier__haut`, `calendrier__titre`, `calendrier__suite`, `calendrier__legende`, `calendrier__cle`, `calendrier__colonnes`.
- Tableau : `tableau-semis` (largeur = moitié de la feuille), `__col-nom` (30 mm), `__titre` (+ `--nom`, `--actuel`),
  `__ligne` (5,5 mm), `__nom` (10 px, coupé par « … »), `__case` (+ `--actuel`, `--cliquable`).
- Barres : `barre` (1,8 mm), `--abri`, `--terre`, `--abri-partielle`, `--terre-partielle` (hachures, écrites après la barre pleine
  pour la remplacer à poids égal), `--vide`, `--legende`, `--fenetre`. Couleurs du commun : `--sousabri-*`, `--pleineterre-*`.
- Fenêtre : `fenetre`, `__titre`, `__tableau`, `__entete` (+ `--nom`), `__cellule`. Bouton ✕ = `btn btn--suppr` du commun.
- `@media print` local (dernier bloc du fichier) : pas de surlignage du mois courant, lignes insécables, `.fenetre` masquée.
- Utilisé du commun : `entete`, `statut`, `ligne` (+ `--pleine`, `--entre`), `btn` (+ `--suppr`), `texte` (+ `--discret`, `--erreur`, `--gras`), balise `h1`.
## Points de vigilance
- Impression : tester l'aperçu en A4 paysage (noir et blanc) après toute modification (local ou commun). Vérifier qu'une
  colonne pleine (30 lignes) ne déborde pas ; sinon baisser `LIGNES_PAR_COLONNE`.
- Ne jamais lancer « Mettre en forme le document » sur le HTML.
- Après un copier-coller de CSS, vérifier que le bloc `@media print` est bien le dernier et complet (oubli déjà arrivé : fenêtre imprimée).
- Noms longs coupés par « … » (colonne de 30 mm) : passer à 32 mm si un nom important est illisible.
## Reste à faire
- [ ] Corriger dans Grist les points listés par l'encart « à revoir » (doublons de noms, types douteux : Haricot en 🌼,
      Pois et Haricots en 🍅, mois manquants).
- [ ] Mise en prod : `styles_communs_pourimpression.css` sur `main` d'abord (commun), puis les 3 fichiers ; URL du widget dans Grist
      (lié à Millesimes, accès complet au document), Ctrl+F5, test d'impression.
- [ ] Après la mise en prod : `main.css` ne sert plus au calendrier.
- [ ] Discussion du commun : `ajusterZoom`, `LARGEUR_FEUILLE_PX` et `colonnesAbsentes` sont identiques dans le cahier et le calendrier
      → candidats à `scriptcommun.js` (ou un JS commun d'impression). L'encart « points à revoir » pourrait servir à d'autres outils.
 
