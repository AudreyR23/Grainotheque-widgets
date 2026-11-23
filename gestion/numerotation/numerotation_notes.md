# Outil « Numérotation » (`numerotation`)

## Rôle
Widget Grist pour gérer les numéros d'épingle (`Varietes.Num_epingle`) :
- attribuer un numéro aux variétés qui n'en ont pas, en comblant d'abord les trous ;
- libérer le numéro d'une variété perdue, pour le réutiliser ;
- corriger les anomalies (doublons, valeurs invalides) en renumérotant ou en libérant.

Prévu pour PC et tablette. Lit `Varietes` et `Millesimes`, écrit seulement dans `Varietes`.

## Fichiers
| Fichier | Rôle |
|---|---|
| `numerotation.html` | Structure et textes, 5 zones Vue |
| `numerotation.css` | Styles propres à l'outil (une seule règle : `encart--anomalies`) |
| `numerotation.js` | Données, calculs, enregistrement ; messages dans le bloc `TEXTES` en haut du fichier |
| `../../styles/styles_communs.css` | Variables, champs, cartes, boutons (nommage BEM) |
| `../../script/scriptcommun.js` | Fonctions communes |

Scripts en fin de `<body>`, dans cet ordre : plugin Grist, Vue 3.4.38 (unpkg), `scriptcommun.js`, `numerotation.js`. Accès Grist : `full`.

## Configuration dans Grist
- Widget personnalisé posé sur une vue de **`Varietes`** : c'est elle qui prévient l'outil d'un changement (`onRecords` sert seulement de signal).
- **Aucune colonne à associer** dans le panneau : l'outil lit les colonnes par leur nom. Une colonne absente déclenche l'alerte « Colonne introuvable » et rien n'est proposé.
- Le filtre et le tri de la vue n'ont **aucun effet** : l'outil lit toute la table (`fetchTable`).

## Données
- `Varietes` lues : `NomVariete`, `Num_epingle`, `Lettre`, `Type` (liste `COLONNES_NECESSAIRES`).
- `Millesimes` lues (seulement pour le filtre « disponible ») : `NomVariete`, `Nb_sachets`, `Plante_mere` (liste `COLONNES_MILLESIMES`).
- Écrites : `Varietes.Num_epingle` et `Varietes.Lettre` (colonnes de données).

## Règles métier
- Numéro **valide** : entier ≥ 1. Cellule **vide** (`null`, `''`) : la variété peut recevoir un numéro. Toute autre valeur (0, décimal, négatif, texte) est **invalide**.
- Prochain numéro : premier trou entre 1 et le max, sinon max + 1 (« nouveau »). Il tient compte des lignes en attente : numéros déjà donnés, numéros libérés.
- Un numéro valide et unique **n'est jamais changé en un autre**. Il peut seulement être **libéré** (variété perdue) : `Num_epingle` vidé.
- Doublons et valeurs invalides : signalés. On peut les **renuméroter** (prochain numéro libre) ou les **libérer**.
- `Lettre` : **vidée** quand une variété reçoit un numéro (attribution ou renumérotation). **Inchangée** quand un numéro est libéré. Elle sert à identifier sur les godets une variété sans numéro.
- Variété **disponible** : au moins un millésime avec `Nb_sachets` ≥ 1 ou `Plante_mere` cochée. À gérer décoche `Plante_mere` quand une plante est déclarée morte. Une plante mère jamais contrôlée compte donc comme vivante.
- Numéro libéré ou renuméroté : **refaire l'épingle physique** et réimprimer la liste (outil Numéros d'épingle).

## Fonctionnement
**En-tête** collé en haut :
- titre et statut (« Chargement… », « ✓ À jour », « Non sauvegardé (N) ») ;
- alerte des colonnes manquantes ;
- message de succès : effacé au prochain clic, sinon après 4 s ;
- message d'erreur : jusqu'au prochain clic ;
- rappel 📌 « Des numéros existants ont changé : refais les épingles concernées et réimprime la liste » après un enregistrement qui contient une libération ou une renumérotation, jusqu'au prochain clic.

**Anomalies** (encart rouge, visible seulement s'il y en a) :
- doublons : le numéro, puis une ligne par variété qui le porte ;
- numéros invalides : le nom et la valeur.

Chaque variété affiche aussi son type et sa disponibilité (« sachet », « 🌱 plante mère », « sachet et 🌱 plante mère », ou en rouge « ni sachet ni plante mère »). Cela aide à choisir laquelle garde le numéro.

Chaque variété a deux boutons, **Renuméroter** et **Libérer**. Ils s'excluent. Le bouton choisi est en orange (`btn--etape`), un second clic annule.

**Prochain numéro à attribuer** : pastille bleue `N° 197`, ou `N° 252 (nouveau)`.

**Variété sans numéro** :
- case « Seulement les variétés disponibles (sachet ou plante mère) », cochée par défaut ;
- recherche sans accents, à plusieurs mots ;
- liste triée par nom, 40 au plus, puis « … N autres, précise ta recherche » ;
- un clic attribue le prochain numéro, en attente. Le champ est vidé et garde le focus.

**Libérer un numéro (variété perdue)** :
- case « Seulement les variétés indisponibles (ni sachet ni plante mère) », cochée par défaut ;
- recherche par nom ou par numéro, liste « N° 12 : Nom » ;
- un clic met la libération en attente. Le numéro devient aussitôt le prochain proposé (s'il n'y a pas de trou plus petit).

**À enregistrer (N)** : une carte orange par ligne en attente, triée par numéro, avec le type (`typeInverse`) et un ✕ pour annuler.
- « N° 12 : Nom » : attribution. Mention « était N° 12, doublon » ou « valeur invalide « 2.5 » » pour une renumérotation.
- « N° 12 libéré : Nom » (mention « était en doublon » si besoin) ou « Valeur « 2.5 » effacée : Nom ».

Puis le bouton « Enregistrer ».

## Enregistrement
1. `Varietes` est relue. Si une colonne manque, rien n'est écrit.
2. Les lignes en attente sont revérifiées (`nettoyerAttentes`) :
   - libération : la variété porte toujours la même valeur ;
   - attribution : la variété existe, est toujours sans numéro, et le numéro n'est pas occupé ;
   - renumérotation : la variété porte toujours la même valeur fautive, et celle-ci est toujours un doublon ou invalide.

   Si une ligne tombe, rien n'est écrit et un message rouge dit combien de lignes ont été retirées.
3. Pas de numéro en double parmi les attributions, uniquement des entiers ≥ 1.
4. **Un seul `applyUserActions`** avec deux `BulkUpdateRecord` :
   - libérées : `Num_epingle` vide ;
   - numérotées : `Num_epingle` et `Lettre` vidée.
5. Seules les lignes enregistrées sont retirées de l'attente. L'outil relit Grist (`charger()`) : l'affichage repart des valeurs écrites. Message « Enregistré : 3 variétés numérotées et 1 numéro libéré. », plus le rappel 📌 si des numéros existants ont changé.

Un Ctrl+Z dans Grist annule tout l'enregistrement d'un coup.

## Choix techniques
- **Vue 3 sans compilation** : 5 zones (`appEntete`, `appAnomalies`, `appFiche`, `appLiberer`, `appAttentes`), chacune montée par son `Vue.createApp(...).mount(...)`.
- **Un seul état réactif** (`etat`). Lignes en attente :
  - `etat.attributions` `{ id: numéro }` ;
  - `etat.anciens` `{ id: valeur fautive }` pour les renumérotations ;
  - `etat.liberations` `{ id: valeur actuelle }`.

  Une variété est soit dans `attributions`, soit dans `liberations`, jamais dans les deux.
- Données Grist hors de `etat` (Vue ne suit pas les `Map`/`Set`) : `recordsParId`, `numerosPris`, `numerosEnDoublon`, `porteursParNumero`, `sansNumero`, `numerotees`, `disponibles`. `recalculer()` copie dans `etat` ce que le HTML affiche ; `recalculerSaisies()` recalcule ce qui dépend des lignes en attente.
- **Numéros libérés** (`numerosLiberes`) : un numéro est libre quand **toutes** les variétés qui le portent sont libérées ou renumérotées. Libérer une seule variété d'un doublon ne libère pas le numéro.
- **Annulation** (✕, second clic) : `apresAnnulation()` relance `nettoyerAttentes()`. Si un numéro libéré puis réattribué redevient occupé, l'attribution est retirée avec le message « Numéro de nouveau occupé… ». `nettoyerAttentes` boucle jusqu'à ce que tout tienne : retirer une attribution peut en invalider une autre.
- **Lectures** : `numeroLecture` fait ignorer une lecture dépassée par une plus récente. `enregistrer()` l'incrémente quand il relit la table, et relance `charger()` après l'écriture.
- **`Millesimes` relue à chaque clic dans un champ de recherche** (`relireMillesimes()`, appelée par `surFocus`), car Grist ne prévient le widget que des changements de `Varietes`. `varietesDisponibles()` remplit aussi `avecSachet` et `plantesMeres` ; `dispoDe(id)` renvoie `'les-deux' | 'sachet' | 'mere' | 'aucun'` pour les anomalies.
- **Messages** : un seul écouteur `click` en phase de capture efface `erreur`, `succes` et `rappel` avant que le bouton agisse.
- **Listes déroulantes** : `etat.menuOuvert` vaut `''`, `'attribuer'` ou `'liberer'`. Les fonctions `menuVisible`, `surFocus`, `ouvrirMenu` et `fermerMenu` servent aux deux champs. `@mousedown.prevent` garde le focus, `@click` (pas `pointerup`) évite une attribution au défilement.
- **Le JS calcule, le HTML met en forme** : le JS renvoie des codes (`action: 'attribuer' | 'liberer'`, `cas: 'doublon' | 'invalide' | 'doublon-libere'`), les textes sont dans le HTML. Exception : les messages d'erreur et de succès, dans `TEXTES`.
- **Lignes en attente conservées au rechargement** : `Vue.watch` profond vers `sessionStorage` (clé `numerotation_saisies`), relues au démarrage par `restaurerSaisies()`, puis vérifiées au premier chargement par `nettoyerAttentes()`.
- **Fonctions du commun utilisées** : `tableEnLignes`, `normaliser`, `correspondRecherche`, `pluriel`, `typeInverse`, `creerMessageTemporaire`.

## Contrat avec les autres outils
- **Numéros d'épingle** (`numero`) lit `Num_epingle` pour imprimer la liste. Il ignore les doublons sans message, car cet outil-ci les signale. Après une libération ou une renumérotation, réimprimer.
- **À gérer** décoche `Millesimes.Plante_mere` quand une plante mère est déclarée morte : c'est ce qui la rend « indisponible » ici.

## Limites
- Les changements de `Millesimes` (sachets, plantes mères) sont vus au prochain clic dans un champ de recherche, au rechargement ou après une modification de `Varietes`. Pas avant : la disponibilité affichée dans les anomalies peut donc avoir un temps de retard.
- On ne choisit pas soi-même le numéro : c'est toujours le prochain libre.
- Libérer une seule variété d'un doublon ne rend pas le numéro libre : l'autre le garde.
- La revérification avant écriture ne porte que sur `Num_epingle` : un changement de `Lettre` fait entre-temps n'empêche pas l'enregistrement (la lettre est vidée de toute façon pour une variété numérotée).

## Pièges rencontrés
- `grist.selectedTable.update([...])` avec `mapColumnNamesBack` : erreur `Invalid column "id"`. Solution : `applyUserActions` + `BulkUpdateRecord`.
- `onRecords` ne donne que les lignes visibles dans la vue : un filtre faisait proposer un numéro déjà pris par une variété masquée. Solution : `fetchTable`.
- Un `BulkUpdateRecord` écrit les mêmes colonnes pour toutes ses lignes : pour vider `Num_epingle` sans toucher à `Lettre`, les libérations ont leur propre `BulkUpdateRecord`, dans le même envoi.

## Classes du commun utilisées
`entete`, `statut`, `statut--non-sauvegarde`, `texte`, `texte--erreur`, `texte--gras`, `texte--succes`, `texte--discret`, `encart`, `encart--succes`, `ligne`, `ligne--entre`, `ligne--sur-champ`, `pastille`, `pastille--info`, `case`, `case__saisie`, `case__texte`, `champ`, `menu`, `menu__liste`, `menu__item`, `menu__item--vide`, `liste-carte`, `carte`, `carte--etape`, `carte__contenu`, `carte__type`, `carte__action`, `btn`, `btn--etape`, `btn--suppr`, `btn--enregistrer`, `btn--grand`.

Classe locale : `encart--anomalies` (variante de `encart`, fond et bord rouges, `word-break`).

## Classes du commun non utilisées par cet outil
(Relevé du 22/11/2026, `styles_communs.css`. À ne pas supprimer sans vérifier les autres outils.)
- Ligne : `ligne--pleine`, `grille`
- Champ : `champ--flexible`, `champ--bouton`
- Menu : `menu__item--choisi`
- Pastilles : `pastille--lieu`, `pastille--categorie`, `pastille--sousabri`, `pastille--pleineterre`, `pastille--plantemere`, `pastille--etape`
- Cartes : `carte--colonne`, `carte--plantemere`, `carte--sousabri`, `carte--pleineterre`, `carte--cliquable`
- Texte : `texte--titre`, `texte--ici`, `texte--etape`, `texte--morte`, `texte--plantemere`, `texte--note`
- Boutons : `btn--actif`, `btn--danger`, `btn--collant`
- `zone-transparente`, `confirmation`, `confirmation__boite`, `confirmation__boutons`
- Règle `[hidden]` (aucun attribut `hidden` dans le HTML)

## Reste à faire
- [ ] Test au doigt sur tablette après la mise en prod : faire défiler les listes déroulantes, aucune attribution ni libération ne doit se déclencher.
- [ ] Discussion du commun : `.btn--enregistrer` (`margin-top: 8px`) écrase `.btn--grand` (14px).
- [ ] Supprimer les anciens fichiers s'ils existent encore : `../script/numerotation.js`, `../styles/numerotation.css`, ancien mémo.
- [ ] Ancien `styles_commun.css` : `.liste-choix.integree` à supprimer et arrondi des `pastille-orga` à vérifier dans « Semis réalisés » (reliquats de l'ancienne version de cet outil).

## Idées pour plus tard
- Choisir soi-même le numéro (un trou précis).
- Alerte à la fermeture avec des lignes non enregistrées (écartée pour l'instant).

## Test de recette
1. Statut « ✓ À jour » ; aucune association demandée dans le panneau ; le filtre de la vue ne change pas le prochain numéro.
2. Anomalies : un doublon et une valeur `2.5` apparaissent sans recharger, puis disparaissent une fois corrigés.
3. Recherche : accents ignorés, plusieurs mots, limite de 40, « Aucune variété (disponible) trouvée ». Case « disponibles » : une variété sans sachet ni plante mère n'apparaît que case décochée.
4. Attribuer 3 variétés, en retirer une (✕) : le numéro libéré est reproposé. Enregistrer : numéros écrits, `Lettre` vidée pour elles seules, un seul Ctrl+Z annule tout.
5. Renuméroter un doublon et une valeur invalide : cartes avec l'ancienne valeur ; enregistrer : anomalies disparues.
6. Libérer une variété indisponible : le prochain numéro devient le sien ; l'attribuer à une autre variété puis enregistrer : `Num_epingle` vide et `Lettre` inchangée pour l'ancienne, numéro et `Lettre` vidée pour la nouvelle.
7. Annuler une libération dont le numéro a été réattribué : l'attribution est retirée, avec un message rouge.
8. Changement dans Grist pendant une attente (numéro donné ailleurs, valeur corrigée) : la carte disparaît.
9. Rechargement (F5) avec des lignes en attente : elles reviennent, sans section vide affichée pendant le chargement ; fermeture de l'onglet : perdues.
10. Statut « Non sauvegardé (N) » : N compte les attributions et les libérations.
11. Enregistrement avec une libération ou une renumérotation : rappel 📌, effacé au clic suivant. Attribution seule : pas de rappel. Le message de succès s'efface au clic suivant.
12. Juste après un enregistrement, les variétés numérotées n'apparaissent plus dans la recherche.
13. `Nb_sachets` changé dans Grist pendant que l'outil est ouvert : pris en compte au clic suivant dans un champ de recherche.
14. Anomalies : type et disponibilité affichés pour chaque variété (« ni sachet ni plante mère » en rouge).