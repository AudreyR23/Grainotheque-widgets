# Granothèque Grist : widget « Cahier » (cahier)

## Rôle
Imprimer le cahier papier emporté au potager : un tableau A4 paysage, une ligne par variété,
avec les sachets (Millesimes) et, en petit gris sous les cases, des rappels de la fiche variété (Varietes).
Lecture seule : l'outil n'écrit jamais dans Grist.
Usage : impression A4 paysage (PC). Migré en Vue, CSS commun BEM.
Accès Grist : `full`. Versions dev (branche `Vue`) et prod (`main`).
Volume : environ 449 variétés affichées (558 dans Varietes).

## Fichiers
- `cahier.html`, `cahier.js`, `cahier.css`
- Commun : `../../script/scriptcommun.js`, `../../styles/styles_communs.css`
- Fonctions communes utilisées : `tableEnLignes`, `listeChoix`, `pluriel`.
- N'utilise plus `main.css` (toujours utilisé par les épingles et l'ancien widget d'étiquettes).

## Données
- Widget lié à **Millesimes** : `grist.onRecords(afficherMillesimes, { includeColumns: 'normal' })`
  (toutes les colonnes, même masquées dans la vue). Mise à jour en direct.
- **Varietes** relue par `fetchTable('Varietes')` à chaque appel de `onRecords`.
  Limite : une modification faite seulement dans Varietes n'est vue qu'à la prochaine modification de Millesimes (ou au rechargement du widget).
- `NomVariete` (Millesimes) arrive de `onRecords` sous forme de **texte** (`"Nom\nVariété"`), pas d'id.
  La variété est donc retrouvée par ce texte (`recordsParId.varietesParNom`).
  Deux variétés de même nom ne sont pas distinguables : la première est gardée, avertissement dans la console.
- `Millesimes.Variete` est la formule `Annees_sans_test` (un nombre) : ne jamais l'utiliser pour retrouver une variété.
- Colonnes Millesimes : `NomVariete`, `Type`, `Origine`, `Nb_sachets`, `Millesime`, `Nb_saisons`,
  `Nb_saisons_manuel`, `Qtte_graines`, `Germination_cahier`, `Epuise` (liste `COLONNES_MILLESIMES`).
- Colonnes Varietes : `Type`, `Nom`, `Variete`, `NomVariete`, `Num_epingle`, `Nb_epingle`, `Semis_profondeur`,
  `Duree_germ`, `Temp_germ`, `Semis_sous_abris`, `Semis_pleine_terre`, `Arrosage`, `Exposition`,
  `Ou_cultiver`, `Conservation` (liste `COLONNES_VARIETES`).
- Écrites : aucune.

## Règles du cahier
- Un sachet = une ligne de Millesimes ; regroupés par variété (clé = id de la ligne Varietes).
- **Sachets épuisés (`Epuise`) exclus dans le code** ; une variété dont tous les sachets sont épuisés disparaît.
  Les variétés sans aucun millésime n'apparaissent pas non plus.
- Tri : type, nom, variété (`localeCompare` en `'fr'`).
- Pagination (`recalculerPages`) : un type ne partage jamais une page avec un autre ;
  `LIGNES_PAR_PAGE = 25` ; une variété à 1 sachet compte pour 2 lignes, sinon 1 ligne par sachet.
- Colonnes « haut de case » (une ligne par sachet) : Orig., Sac., Millésime, Sais., Qté, Germ.
- Colonnes « bas de case » (petit gris, fiche variété) : Nb.gr = `Semis_profondeur` (+ « cm »),
  Nb.go = `Duree_germ` (+ « j »), Année.s = `Temp_germ`, Date.s = `Semis_sous_abris` (mois abrégés),
  Germé = `Semis_pleine_terre` (mois abrégés), Planté = `Arrosage`, Date.p = `Exposition`,
  Où = `Ou_cultiver`, Donné = `Conservation` (+ « an(s) »). Oups : colonne vide à remplir à la main.
- `Semis_profondeur` reste en **texte** (valeurs comme « 1-2 ») : « cm » ajouté toujours, sans test de doublon.
- Unités : `{{ n }}&nbsp;j`, `&nbsp;cm`, `an` / `ans` via `pluriel` (« 1,5 an »), nombres à la française
  (`toLocaleString('fr-FR')`), rien dans une cellule vide.
- « Sais. » : `valeurSaisons` (`or.` reste `or.`, un nombre devient un entier).
- **Légende** en bas de chaque feuille (texte dans le HTML, classe `legende`).

## Fonctionnement
- **En-tête collé** (masqué à l'impression) : statut (Chargement / ✓ Chargé), bouton Imprimer, « N variétés »,
  avertissement de colonnes introuvables, erreur.
- **Colonnes introuvables** : si une colonne des deux listes manque, avertissement rouge, aucun tableau, Imprimer grisé
  (pas de cahier faux).
- **Imprimer** : `window.print()`, ne modifie rien.
- Messages dans le bloc `TEXTES` en haut du JS. Erreur : jusqu'au prochain clic (écouteur `click` en capture).
- `numeroLecture` : une lecture dépassée par une plus récente est ignorée.

## Choix techniques
- Zones Vue : `#appEntete`, `#appPages` ; un seul `etat` (`charge`, `nbVarietes`, `pages`, `zoom`, `colonnesManquantes`, `erreur`).
- `recordsParId` : Maps `varietes` (id), `varietesParNom`, `millesimes`. La liste affichée est copiée dans `etat.pages`
  par `recalculerPages()` ; `etat.pages` = pages → variétés → sachets (trois `v-for` imbriqués).
- Le JS renvoie des valeurs (listes de mois abrégés, nombres, `listeChoix`) ; le HTML met en forme (unités, `join`).
- Pas de `watch` (pas de filtre).
- **Zoom d'aperçu** : `zoom: var(--zoom-ecran, 1)` sur `.feuille`, facteur calculé par `ajusterZoom`
  (`ResizeObserver` sur `#appPages`, jamais au-delà de 1) ; `zoom: 1` à l'impression.

## CSS (`cahier.css`)
- Section « candidat au commun impression » (identique à etiquettes.css, sauf le padding) : `.feuille`
  (padding `15mm 10mm 10mm 10mm`, étiquettes : `10mm`), `@media print` (`@page` A4 paysage marge 0,
  `body` sans padding, `.entete` masqué, saut de page après chaque feuille, lignes insécables).
  À déplacer dans `styles_communs_impression_bem.css` (discussion du commun).
- `#appPages { overflow-x: auto }` à l'écran, `overflow: visible` à l'impression (sinon Firefox n'imprime qu'une feuille).
- Tableau : `tableau`, `tableau__titre`, `tableau__ligne`, `tableau__cellule` (+ `--bas`, `--gris`, `--multi`),
  `tableau__sachet`, `tableau__nom`, `tableau__variete`, `legende`.
- Classes de colonnes (largeur seule) d'après l'en-tête papier : `col-type`, `col-nom`, `col-ep`, `col-nb`,
  `col-orig`, `col-sac`, `col-millesime`, `col-sais`, `col-qte`, `col-germ`, `col-nb-gr`, `col-nb-go`,
  `col-annee-s`, `col-date-s`, `col-germe`, `col-oups`, `col-plante`, `col-date-p`, `col-ou`, `col-donne`.
- Les largeurs totalisent **115 %** (identique à l'ancien main.css) : à rééquilibrer si on touche une colonne.
- Utilisé du commun : `entete`, `statut`, `ligne` (+ `--pleine`), `btn`, `texte` (+ `--discret`, `--gras`, `--erreur`), balise `h1`.

## Points de vigilance
- Impression : tester l'aperçu en A4 paysage après toute modification du CSS (local ou commun : le `body` du commun compte).
- Ne jamais lancer « Mettre en forme le document » sur le HTML.
- Si une colonne est renommée dans Grist, l'avertissement « Colonne introuvable » le signale ; mettre à jour les deux listes.
- Une erreur `Property "xxx" was accessed during render…` : un nom utilisé dans le HTML manque dans le `return` du `setup`.
- Le texte coupé par `ellipsis` (colonnes étroites) n'est pas signalé : vérifier « 1-2 cm » et « 10 ans » à l'impression.

## Reste à faire
- [ ] Mise en prod : copier les 3 fichiers sur `main`, changer l'URL du widget dans Grist (lié à Millesimes), Ctrl+F5, test d'impression. Aucun changement du commun.
- [ ] Ancien `main_cahier.js` et ancien `cahier.html` : à supprimer après la mise en prod. La section « tableau » de `main.css` ne sert plus qu'à eux : à retirer lors de la migration des épingles.
- [x] Discussion du commun : créer `styles_communs_impression_bem.css` (section `.feuille` + `@media print`), en tenant compte du padding propre à chaque outil (étiquettes 10mm, cahier 15mm 10mm 10mm 10mm) ; `ajusterZoom` / `dateEnSecondesGrist` candidats à `scriptcommun.js`.
- [ ] Rééquilibrer les largeurs de colonnes (115 %) si besoin.
- [ ] Éventuel : rafraîchir aussi quand Varietes change seule (bouton « Actualiser »).
Section « Règles du cahier » : « NB_LIGNES_VIDES_PAR_TYPE = 3 lignes vides en fin de chaque type (fabriquées par ligneVide, hauteur d'une variété à 1 sachet, colonne Type pré-remplie), à remplir à la main. Elles comptent dans le nombre de pages mais pas dans « N variétés ». »
Section « Fonctionnement » : « L'en-tête affiche aussi le nombre de pages (etat.pages.length). »
Section « CSS » : remplacer la couleur de la légende et des infos grises par #777 (le gris plus clair ressortait noir dans le PDF de Firefox), et retirer le bloc de test red s'il en reste un.