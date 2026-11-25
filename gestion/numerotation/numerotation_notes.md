# Outil « Numérotation » (`numerotation`)

> Dernière mise à jour : 25/11/2026
> Statut : **dev validé** (refonte « pas de Ferrari »). **Prod et test tablette à faire.**

## 1. Rôle
Widget Grist pour gérer les numéros d'épingle (`Varietes.Num_epingle`) :
- attribuer un numéro aux variétés qui n'en ont pas, en comblant d'abord les trous ;
- libérer le numéro d'une variété qui n'a plus rien de disponible, pour le réutiliser ;
- signaler les anomalies (doublons, valeurs invalides), corrigées à la main dans Grist.

Prévu pour PC et tablette. Pas d'impression (la liste s'imprime avec **Numéros d'épingle**). Lit et écrit seulement `Varietes`.

## 2. Fichiers
| Fichier | Rôle |
|---|---|
| `numerotation.html` | Structure et textes, 5 zones Vue |
| `numerotation.js` | Données, calculs, enregistrement ; messages dans le bloc `TEXTES` en haut du fichier (≈ 230 lignes) |
| `../../styles/styles_communs.css` | Tout le CSS : l'outil n'a **pas** de CSS propre (`numerotation.css` supprimé) |
| `../../script/scriptcommun.js` | Fonctions communes |

- Scripts en fin de `<body>` : plugin Grist, Vue 3.4.38 (unpkg), `scriptcommun.js`, `numerotation.js`. Accès Grist : `full`.
- Fonctions du commun utilisées : `tableEnLignes`, `colonnesAbsentes`, `libelle`, `normaliser`, `correspondRecherche`, `pluriel`, `creerMessageTemporaire`, `effacerAuClic`.

## 3. Configuration dans Grist
- Widget personnalisé posé sur une vue de **`Varietes`** : elle prévient l'outil d'un changement (`onRecords` ne sert que de signal).
- **Aucune colonne à associer** dans le panneau : colonnes lues par leur nom.
- Le filtre et le tri de la vue n'ont **aucun effet** : l'outil lit toute la table (`fetchTable`).
- Colonne formule **`Varietes.Disponible`** (Booléen), créée le 25/11/2026 pour cet outil :
  ```python
  any(not m.Epuise for m in Millesimes.lookupRecords(NomVariete=$id))
  ```
  Vraie si la variété a au moins un millésime non épuisé (sachet, graines en vrac ou plante mère, voir la formule `Millesimes.Epuise`). Fausse s'il n'y a aucun millésime ou que des millésimes épuisés. Comme elle est dans `Varietes`, un sachet vidé ailleurs (Semis réalisés) prévient le widget tout seul.
  Une vue de `Varietes` filtrée sur `Disponible` = faux donne la liste de toutes les variétés épuisées, sans outil.

## 4. Données
- Lues (`COLONNES_NECESSAIRES`) : `Nom`, `Variete` (formules), `Type`, `Num_epingle`, `Lettre`, `Disponible` (formule). Une colonne absente → alerte « Colonne introuvable » dans l'en-tête et rien n'est proposé.
- Écrites : `Num_epingle` et `Lettre` (colonnes de données).

## 5. Règles métier
- Numéro **valide** : entier ≥ 1. Cellule **vide** : la variété peut recevoir un numéro. Toute autre valeur (0, décimal, négatif, texte) est **invalide**.
- Prochain numéro : premier trou entre 1 et le max, sinon max + 1 (« nouveau »). Il compte les numéros en attente d'attribution.
- Un numéro **en cours de libération reste pris jusqu'à l'enregistrement** : pour le réutiliser, libérer, enregistrer, puis attribuer.
- Un numéro valide n'est jamais changé en un autre : il peut seulement être libéré (`Num_epingle` vidé).
- `Lettre` : **vidée** quand une variété reçoit un numéro ; **inchangée** quand un numéro est libéré (elle sert à repérer sur les godets une variété sans numéro).
- Doublons et valeurs invalides : signalés, jamais corrigés par l'outil. On vide (ou corrige) la cellule dans Grist ; une variété vidée repasse dans « Variété sans numéro ».
- Numéro libéré : **refaire l'épingle physique** et réimprimer la liste (Numéros d'épingle).

## 6. Fonctionnement
**En-tête** collé : titre ; statut « Chargement… », « ⚠ Erreur de chargement », « ● Non sauvegardé (N) » ou « ✓ À jour » ; alerte des colonnes manquantes ; message de succès (4 s) ; erreur de chargement (jusqu'au prochain chargement réussi) ; erreur d'enregistrement (jusqu'au prochain clic). Tous portent `entete__message`.

**Anomalies** (`encart--alerte`, visible seulement s'il y en a) : consigne « À corriger dans Grist… », doublons (« N° 12 : Nom | Nom ») et numéros invalides (« Nom : valeur « 2.5 » »). Lecture seule.

**Numéros réutilisables (N)** : section repliable (Afficher / Masquer, repliée au départ). Variétés numérotées dont `Disponible` est faux, « N° 12 : Nom » + type, triées par numéro. Bouton **Libérer** : 1er clic, carte en attente et bouton orange (`btn--etape`) ; 2e clic, annulé. Pas de fenêtre de confirmation.

**Prochain numéro à attribuer** : pastille bleue `N° 197` ou `N° 252 (nouveau)`.

**Variété sans numéro** : case « Seulement les variétés disponibles » (cochée par défaut, s'appuie sur `Disponible`) ; recherche sans accents, à plusieurs mots ; liste triée par nom, 40 au plus puis « … N autres, précise ta recherche » ; un clic met l'attribution en attente, le champ est vidé et garde le focus.

**À enregistrer (N)** : une carte orange par ligne, triée par numéro, avec le type et ✕ :
- « N° 12 : Nom » : attribution ;
- « N° 12 libéré : Nom » + « Épingle à refaire, liste à réimprimer (Numéros d'épingle). »

Puis le bouton « Enregistrer ». Lignes en attente perdues au rechargement : voulu.

## 7. Enregistrement
- **Un seul `applyUserActions`**, deux `BulkUpdateRecord` au plus : libérées (`Num_epingle` vide) ; numérotées (`Num_epingle` + `Lettre` vidée). Un Ctrl+Z dans Grist annule tout l'enregistrement.
- **Pas de relecture avant écriture** (décision du 23/11).
- Juste après l'écriture, la copie locale (`recordsParId`) reçoit les nouvelles valeurs et `recalculer()` repart d'elles : un clic rapide, avant que Grist renvoie les lignes, ne peut pas redonner un numéro qui vient d'être écrit. Grist confirme ensuite par `onRecords`.
- Message « Enregistré : 3 variétés numérotées et 1 numéro libéré. »

## 8. Choix techniques
- **Pas de Ferrari** : retirés à la refonte du 25/11 : `sessionStorage`, relecture avant écriture, renumérotation depuis les anomalies, libération qui libérait le numéro avant l'enregistrement (avec ses recalculs après annulation), boucle de nettoyage, relecture de `Millesimes` au clic, `numeroLecture`, `horsGrist`, rappel 📌, fenêtre de confirmation, CSS local. 480 → ≈ 230 lignes.
- **Zones Vue** : `#appEntete`, `#appAnomalies`, `#appReutilisables`, `#appFiche`, `#appAttentes`.
- **Un seul `etat`**. Lignes en attente : `etat.attributions` et `etat.liberations` (`{ id: numéro }`) ; une variété n'est jamais dans les deux (attributions = sans numéro, libérations = numérotées).
- Hors de `etat` : `recordsParId` (Map), `numerosPris` (Set), `sansNumero`.
- `recalculer()` range les variétés, remplit `doublons`, `invalides`, `reutilisables`, retire **sans message** les cartes devenues fausses après un changement dans Grist (variété numérotée ou numéro pris ailleurs ; libération dont le numéro a changé), puis appelle `recalculerSaisies()` (prochain numéro, liste, cartes).
- Liste déroulante : `@mousedown.prevent` garde le focus ; `@click` (pas `pointerup`) évite une attribution au défilement.
- Le JS renvoie des codes (`action: 'attribuer' | 'liberer'`), les textes sont dans le HTML ; messages construits dans `TEXTES`.

## 9. Contrat avec les autres outils
- **Numéros d'épingle** (`numero`) lit `Num_epingle` pour imprimer la liste ; il ignore les doublons (cet outil les signale). Réimprimer après une libération.
- **Semis réalisés** (« Sachet vidé ») et **À gérer** (plante mère morte : `Plante_mere` décochée) rendent un millésime épuisé, donc peuvent faire passer `Disponible` à faux.
- **Achat-repro** crée des millésimes : la variété redevient disponible.

## 10. Limites
- On ne choisit pas soi-même le numéro : c'est toujours le prochain libre.
- Un numéro libéré n'est réutilisable qu'après l'enregistrement.
- Une carte devenue fausse disparaît sans message.

## 11. Pièges rencontrés
- `grist.selectedTable.update([...])` avec `mapColumnNamesBack` : erreur `Invalid column "id"`. Solution : `applyUserActions` + `BulkUpdateRecord`.
- `onRecords` ne donne que les lignes visibles dans la vue : un filtre faisait proposer un numéro déjà pris. Solution : `fetchTable`.
- Un `BulkUpdateRecord` écrit les mêmes colonnes pour toutes ses lignes : les libérations ont leur propre `BulkUpdateRecord` pour ne pas toucher à `Lettre`.
- Refonte du 25/11 : un collage a supprimé la fonction `enregistrer()` (seul son titre restait) et la dernière ligne de `recalculer()` (`recalculerSaisies();`). Effet : `enregistrer is not defined`, la suite du script ne s'exécute plus. Après un remplacement de fonction, Ctrl+Maj+F sur son nom.

## 12. Classes du commun utilisées
`entete`, `entete__message`, `statut` (+ `--non-sauvegarde`), `texte` (+ `--erreur`, `--gras`, `--succes`, `--discret`), `encart` (+ `--succes`, `--alerte`), `ligne` (+ `--entre`, `--sur-champ`), `pastille` (+ `--info`), `case` (+ `__saisie`, `__texte`), `champ`, `menu` (+ `__liste`, `__item`, `__item--vide`), `liste-carte`, `carte` (+ `--etape`, `__contenu`, `__type`, `__action`), `btn` (+ `--etape`, `--suppr`, `--enregistrer`, `--grand`).

## 13. Reste à faire
- [ ] Mise en prod : commun d'abord s'il a changé, puis les fichiers sur `main` (sans `numerotation.css`) ; vérifier l'URL du widget, Ctrl+F5 ; créer la colonne `Disponible` dans la base de prod.
- [ ] Test au doigt sur tablette : faire défiler la liste déroulante, aucune attribution ne doit se déclencher.
- [ ] Supprimer les anciens fichiers s'ils existent encore : `../script/numerotation.js`, `../styles/numerotation.css`, ancien mémo.
- [ ] Ancien `styles_commun.css` : `.liste-choix.integree` à supprimer, arrondi des `pastille-orga` à vérifier (reliquats de l'ancienne version).
- [ ] À trancher plus tard : fusion avec Numéros d'épingle (onglets Attribuer / Imprimer).

## 14. Test de recette
1. Statut « Chargement… » puis « ✓ À jour » ; aucune association demandée ; le filtre de la vue ne change pas le prochain numéro.
2. Colonne `Disponible` renommée : alerte « Colonne introuvable ».
3. Anomalies : un doublon et une valeur `2.5` apparaissent sans recharger, avec la consigne ; vidées dans Grist, elles disparaissent et la variété repasse « sans numéro ».
4. Recherche : accents ignorés, plusieurs mots, limite de 40 ; case cochée : une variété avec `Disponible` faux n'apparaît pas.
5. Sachet vidé dans Semis réalisés, sans recharger : la variété quitte la recherche (case cochée) et, si elle est numérotée, entre dans « Numéros réutilisables ».
6. Attribuer 2 variétés, en retirer une (✕) : son numéro est reproposé ; statut « ● Non sauvegardé (n) ».
7. Libérer : bouton orange, carte « N° 12 libéré », prochain numéro inchangé ; 2e clic ou ✕ : annulé.
8. Enregistrer une attribution et une libération : message « Enregistré : 1 variété numérotée et 1 numéro libéré. » ; dans Grist, `Lettre` vidée pour la numérotée, inchangée pour la libérée ; un seul Ctrl+Z annule tout.
9. Après l'enregistrement : le numéro libéré est proposé ; une attribution faite aussitôt reçoit un numéro différent de ceux qui viennent d'être écrits.
10. Numéro tapé dans Grist sur une variété en attente : sa carte disparaît.
11. F5 avec des cartes en attente : perdues (voulu).

## 15. Journal
- 22/11/2026 : migration Vue (zones, `etat`, CSS BEM), `fetchTable`, filtre « disponibles », libération, renumérotation des anomalies, `sessionStorage`.
- 25/11/2026 : refonte « pas de Ferrari » : retrait de la relecture avant écriture, de `sessionStorage`, de la renumérotation, de la relecture de `Millesimes`, de la confirmation et du CSS local ; colonne formule `Varietes.Disponible` (règle `Epuise`) ; section « Numéros réutilisables » ; anomalies en lecture seule ; libération en attente, numéro libre après l'enregistrement ; nom par `libelle()`.