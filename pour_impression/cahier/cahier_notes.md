# Granothèque Grist : widget « Cahier » (cahier)

> Dernière mise à jour : 25/11/2026

## Rôle
Imprimer le cahier papier emporté au potager : un tableau A4 paysage, une ligne par variété,
avec les sachets (Millesimes) et, en petit gris sous les cases, des rappels de la fiche variété (Varietes).
Lecture seule : l'outil n'écrit jamais dans Grist.
Usage : impression A4 paysage (PC). Migré en Vue, CSS commun BEM.
Accès Grist : `full`. Versions dev (branche `Vue`) et prod (`main`).
Volume : environ 449 variétés affichées (558 dans Varietes).

## Fichiers
- `cahier.html`, `cahier.js`, `cahier.css`
- Commun : `../../script/scriptcommun.js`, `../../styles/styles_communs.css`, `../../styles/styles_communs_pourimpression.css` (chargé entre le commun et `cahier.css`)
- Fonctions communes utilisées : `tableEnLignes`, `listeChoix`, `pluriel`, `anneeDepuisDate`, `colonnesAbsentes`, `effacerAuClic`, `facteurZoom`, `numeroMois`, `LISTE_MOIS`, `indexerVarietes`, `varieteReferencee`.
- N'utilise plus `main.css` (toujours utilisé par les épingles et l'ancien widget d'étiquettes).

## Données
- Widget lié à **Millesimes** : `grist.onRecords(afficherMillesimes, { includeColumns: 'normal' })`
  (toutes les colonnes, même masquées dans la vue). Mise à jour en direct.
- **Varietes** relue par `fetchTable('Varietes')` à chaque appel de `onRecords`, puis indexée par `indexerVarietes`
  (`indexVarietes` : `parId`, `parNom`, `doublons`).
  Limite : une modification faite seulement dans Varietes n'est vue qu'à la prochaine modification de Millesimes (ou au rechargement du widget).
- `NomVariete` (Millesimes) arrive de `onRecords` sous forme de **texte** (`"Nom\nVariété"`), parfois d'id selon la vue.
  `varieteReferencee(indexVarietes, r.NomVariete)` gère les deux.
  Deux variétés de même nom ne sont pas distinguables : la première est gardée, avertissement dans la console.
- `Millesimes.Variete` est la formule `Annees_sans_test` (un nombre) : ne jamais l'utiliser pour retrouver une variété.
- Colonnes Millesimes : `NomVariete`, `Type`, `Origine`, `Nb_sachets`, `Millesime`, `Nb_saisons`,
  `Nb_saisons_manuel`, `Qtte_graines`, `Germination_cahier`, `Epuise` (liste `COLONNES_MILLESIMES`).
- Colonnes Varietes : `Type`, `Nom`, `Variete`, `NomVariete`, `Num_epingle`, `Nb_epingle`, `Semis_profondeur`,
  `Duree_germ`, `Temp_germ`, `Semis_sous_abris`, `Semis_pleine_terre`, `Arrosage`, `Exposition`,
  `Ou_cultiver`, `Conservation` (liste `COLONNES_VARIETES`).
- Écrites : aucune.
- **Dépendance à la table Semis** : `Germination_cahier` (formule) lit les semis. En fin de saison, si on supprime
  des lignes Semis sans recopier leur germination dans `Millesimes.Germination_historique`, la colonne « Germ. » se vide.
  Prévu dans la proposition de clôture (Analyse globale).

## Règles du cahier
- Un sachet = une ligne de Millesimes ; regroupés par variété (clé = id de la ligne Varietes).
- **Sachets épuisés (`Epuise`) exclus dans le code** ; une variété dont tous les sachets sont épuisés disparaît.
  Les variétés sans aucun millésime n'apparaissent pas non plus.
  Les plantes mères (jamais épuisées) et les sachets avec `Qtte_graines` mais sans `Nb_sachets` apparaissent : voulu.
  Le Calendrier filtre sur `Nb_sachets` : c'est une erreur du Calendrier, à corriger dans sa discussion (utiliser `Epuise`).
- Tri : type, nom, variété (`localeCompare` en `'fr'`).
- Pagination (`recalculerPages`) : un type ne partage jamais une page avec un autre ;
  `LIGNES_PAR_PAGE = 26` ; une variété à 1 sachet compte pour 2 lignes, sinon 1 ligne par sachet.
- **Lignes vides** : `NB_LIGNES_VIDES_PAR_TYPE = 3` en fin de chaque type (fabriquées par `ligneVide`,
  hauteur d'une variété à 1 sachet, colonne Type pré-remplie), à remplir à la main.
  Elles comptent dans le nombre de pages mais pas dans « N variétés ».
- Colonnes « haut de case » (une ligne par sachet) : Orig., Sac., Millésime, Sais., Qté, Germ.
- Colonnes « bas de case » (petit gris, fiche variété) : Nb.gr = `Semis_profondeur` (+ « cm »),
  Nb.go = `Duree_germ` (+ « j »), Année.s = `Temp_germ`, Date.s = `Semis_sous_abris` (initiales des mois),
  Germé = `Semis_pleine_terre` (initiales des mois), Planté = `Arrosage`, Date.p = `Exposition`,
  Où = `Ou_cultiver`, Donné = `Conservation` (+ « an(s) »). Oups : colonne vide à remplir à la main.
- `Semis_profondeur` reste en **texte** (valeurs comme « 1-2 ») : « cm » ajouté toujours, sans test de doublon.
- Unités : `&nbsp;j`, `&nbsp;cm`, `an` / `ans` via `pluriel` (« 1,5 an »), nombres à la française
  (`toLocaleString('fr-FR')`), rien dans une cellule vide.
- « Sais. » : `valeurSaisons` (`or.` reste `or.`, un nombre devient un entier).
- **Légende** en bas de chaque feuille (texte dans le HTML, classe `legende`). Pas de phrase sur les initiales des mois (voulu).

## Fonctionnement
- **En-tête collé** (masqué à l'impression) : statut (Chargement / ✓ Chargé), bouton Imprimer,
  « N variétés · N pages » (`etat.pages.length`), avertissement de colonnes introuvables, erreur.
- **Colonnes introuvables** : si une colonne des deux listes manque, avertissement rouge, aucun tableau, Imprimer grisé
  (pas de cahier faux).
- **Imprimer** : `window.print()`, ne modifie rien.
- Messages d'erreur dans le bloc `TEXTES` en haut du JS. Erreur : jusqu'au prochain clic (`effacerAuClic`).
- Hors Grist, la page reste sur « Chargement… » (pas de message dédié : retiré le 25/11, voir « Décisions »).

## Choix techniques
- Zones Vue : `#appEntete`, `#appPages` ; un seul `etat` (`charge`, `nbVarietes`, `pages`, `zoom`, `colonnesManquantes`, `erreur`).
- `recordsParId.millesimes` (Map) et `indexVarietes` (résultat de `indexerVarietes`, deux Maps). La liste affichée est copiée
  dans `etat.pages` par `recalculerPages()` ; `etat.pages` = pages → variétés → sachets (trois `v-for` imbriqués).
- Le JS renvoie des valeurs (listes d'initiales de mois, nombres, `listeChoix`) ; le HTML met en forme (unités, `join`).
- Pas de `watch` (pas de filtre).
- **Zoom d'aperçu** : `zoom: var(--zoom-ecran, 1)` sur `.feuille` (commun) ; facteur `facteurZoom` du commun,
  appelé dans un `ResizeObserver` sur `#appPages` ; `zoom: 1` à l'impression.

## CSS
- Du commun d'impression (`styles_communs_pourimpression.css`) : `.feuille` (A4 paysage, padding `15mm 10mm 10mm 10mm`,
  `print-color-adjust: exact`), `.zone-feuilles`, `.tronque`, `.tableau`, `.insecable`, `@media print`.
- **`print-color-adjust: exact` (avec le préfixe `-webkit-`) est nécessaire** : sans lui, Firefox imprime les petits textes gris
  en noir dans le PDF. Ce n'était pas un problème de finesse du trait.
- `cahier.css` : `tableau__titre`, `tableau__cellule` (+ `--bas`, `--gris`, `--multi`), `tableau__sachet`, `tableau__nom`,
  `tableau__variete`, `legende`. Le gris des infos et de la légende est `var(--gris-legende)` (`#888`, variable du commun).
- Lignes du tableau : classe `insecable` (commun) sur le `<tr>` ; plus de `tableau__ligne`.
- Classes de colonnes (largeur seule) d'après l'en-tête papier : `col-type`, `col-nom`, `col-ep`, `col-nb`,
  `col-orig`, `col-sac`, `col-millesime`, `col-sais`, `col-qte`, `col-germ`, `col-nb-gr`, `col-nb-go`,
  `col-annee-s`, `col-date-s`, `col-germe`, `col-oups`, `col-plante`, `col-date-p`, `col-ou`, `col-donne`.
- **Largeurs : total 100 %** (rééquilibrées le 25/11 : anciennes valeurs ÷ 1,15, rendu identique ; l'ancien total de 115 %
  était réduit en silence par le navigateur). Pour ajuster une colonne : retirer à une autre ce qu'on ajoute, le total reste 100.
- Utilisé du commun : `entete`, `statut`, `ligne` (+ `--pleine`), `btn`, `texte` (+ `--discret`, `--gras`, `--erreur`), balise `h1`.

## Décisions
- 25/11 : retrait de `numeroLecture` (une lecture dépassée par une plus récente pouvait écraser l'affichage ; le risque,
  deux modifications très rapprochées dans Grist, est accepté : rechargement ou modification suivante) et de `horsGrist`.
- 25/11 : pas de fusion avec le Calendrier ; deux widgets, lecture de Varietes mise en commun (`indexerVarietes`, `varieteReferencee`).
- 26/11 : pas de bouton Actualiser, le rechargement du widget suffit.
- 26/11 : Pour le problème d'Origine dans le Cahier, il existe une autre solution écartée car demande de repasser sur ous les outils pour un gain d'une ligne dans Cahier. Tu peux faire accepter à listeChoix les deux formes de liste, celle de fetchTable (avec 'L') et celle de onRecords (sans 'L') :
js
function listeChoix(valeur) {
  // ChoiceList Grist : ['L', 'a', 'b'] (fetchTable) ou ['a', 'b'] (onRecords) → ['a', 'b']
  if (!Array.isArray(valeur)) return [];
  return valeur[0] === 'L' ? valeur.slice(1) : valeur;
}
Le Cahier pourrait alors garder listeChoix(r.Origine), et la règle à ajouter au mémo deviendrait inutile. Tu as déjà coché la correction locale, donc tu n'as rien à faire de plus. C'est juste une possibilité pour plus tard.


## Points de vigilance
- Impression : tester l'aperçu en A4 paysage après toute modification du CSS (local ou commun : le `body` du commun compte).
- Ne jamais lancer « Mettre en forme le document » sur le HTML.
- Si une colonne est renommée dans Grist, l'avertissement « Colonne introuvable » le signale ; mettre à jour les deux listes.
- Une erreur `Property "xxx" was accessed during render…` : un nom utilisé dans le HTML manque dans le `return` du `setup`.
- Le texte coupé par `ellipsis` (colonnes étroites) n'est pas signalé : vérifier « 1-2 cm » et « 10 ans » à l'impression.

## Reste à faire
- [x] Mise en prod : commun d'abord, puis copier les 3 fichiers sur `main`, changer l'URL du widget dans Grist (lié à Millesimes), Ctrl+F5, test d'impression.
- [x] Supprimer l'ancien `main_cahier.js` et l'ancien `cahier.html` après la mise en prod. La section « tableau » de `main.css` ne sert plus qu'à eux : à retirer lors de la migration des épingles.
- [x] Calendrier (sa discussion) : filtrer sur `Epuise` au lieu de `Nb_sachets` ; retirer `numeroLecture` et `horsGrist` ; utiliser `indexerVarietes` / `varieteReferencee` (et supprimer `varieteDuMillesime`) ; retirer la `LARGEUR_FEUILLE_PX` inutilisée ; utiliser `effacerAuClic`.
- [] 