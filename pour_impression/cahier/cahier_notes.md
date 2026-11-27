# Granothèque Grist : widget « Cahier » (cahier)

> Dernière mise à jour : 26/11/2026

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
  Deux variétés de même `NomVariete` ne devraient pas exister : la première est gardée, **sans message** dans le Cahier
  (les sachets des deux seraient rangés sous la première). Le Calendrier les signale dans ses « points à revoir ».
- **`Origine`** (liste de choix reçue de `onRecords`) : `buildGrainesMap` accepte une liste avec ou sans `'L'` en tête
  (`filter(item => item !== 'L')`) ou un texte simple. `listeChoix` du commun reste inchangée (elle renvoie `[]` sans `'L'`,
  et les autres outils s'appuient là-dessus).
- `Millesimes.Variete` est la formule `Annees_sans_test` (un nombre) : ne jamais l'utiliser pour retrouver une variété.
- Colonnes Millesimes : `NomVariete`, `Type`, `Origine`, `Nb_sachets`, `Millesime`, `Nb_saisons`,
  `Nb_saisons_manuel`, `Qtte_graines`, `Germination_cahier`, `Epuise`, `Plante_mere`, `Lieu_cahier` (liste `COLONNES_MILLESIMES`).
- Colonnes Varietes : `Type`, `Nom`, `Variete`, `NomVariete`, `Num_epingle`, `Nb_epingle`, `Semis_profondeur`,
  `Duree_germ`, `Temp_germ`, `Semis_sous_abris`, `Semis_pleine_terre`, `Arrosage`, `Exposition`,
  `Ou_cultiver`, `Conservation` (liste `COLONNES_VARIETES`).
- Écrites : aucune.
- **Dépendance à la table Semis** :
  - `Germination_cahier` (formule) lit les semis. En fin de saison, si on supprime des lignes Semis sans recopier leur
    germination dans `Millesimes.Germination_historique`, la colonne « Germ. » se vide.
    Prévu dans la proposition de clôture (Analyse globale).
  - `Lieu_cahier` (formule Texte, ajoutée le 26/11) lit `Semis.Ou` de la ligne Semis de la plante mère. Si on supprime cette
    ligne Semis, le lieu disparaît du cahier. Formule :
    ```python
    if not $Plante_mere:
      return ""
    lieux = []
    for s in Semis.lookupRecords(Millesime=$id):
      for l in (s.Ou or []):
        if l not in lieux:
          lieux.append(l)
    return ", ".join(lieux)
    ```

## Règles du cahier
- Un sachet = une ligne de Millesimes ; regroupés par variété (clé = id de la ligne Varietes).
- **Sachets épuisés (`Epuise`) exclus dans le code** ; une variété dont tous les sachets sont épuisés disparaît.
  Les variétés sans aucun millésime n'apparaissent pas non plus.
  Les plantes mères (jamais épuisées) et les sachets avec `Qtte_graines` mais sans `Nb_sachets` apparaissent : voulu.
  Le Calendrier filtre volontairement sur `Nb_sachets` (décision du 25/11) : ces plantes mères et ces sachets en vrac
  sont dans le Cahier mais pas dans le Calendrier.
- Tri : type, nom, variété (`localeCompare` en `'fr'`).
- **Pagination** (`recalculerPages`) : un type ne partage jamais une page avec un autre ;
  `LIGNES_PAR_PAGE = 26` ; une variété à 1 sachet compte pour 2 lignes, sinon 1 ligne par sachet.
  Mesures (26/11) : une ligne de variété à 1 sachet ≈ 13,3 mm, donc 1 unité ≈ 6,7 mm ; la zone utile (185 mm moins
  l'en-tête du tableau et la légende) contient environ 26,5 unités au maximum. 26 est donc proche du maximum :
  si une page pleine déborde (page blanche, légende seule sur une page), revenir à 25.
- **Lignes vides** : `NB_LIGNES_VIDES_PAR_TYPE = 3` en fin de chaque type (fabriquées par `ligneVide`), à remplir à la main.
  `nom` et `variete` contiennent une espace insécable (` `) : sans texte, leurs `<span>` n'ont aucune hauteur et la ligne
  ne ferait que la moitié d'une variété à 1 sachet (mesuré : 15 contre 29). Avec elle, la ligne fait 2 lignes, comme le compte
  de `recalculerPages`. Colonne Type pré-remplie. Elles comptent dans le nombre de pages mais pas dans « N variétés ».
- **Plantes mères** (`Plante_mere`) : chaque millésime a sa ligne dans la variété. Un sachet affiche `Qtte_graines` dans « Qté » ;
  une plante mère affiche à la place la liste de ses lieux (`Lieu_cahier`) sur les deux cases « Qté » et « Germ. » fusionnées
  (« Germ. » n'a pas de sens pour une mère : `Germination_cahier` vaut `""`).
  La fusion se fait seulement pour les variétés qui contiennent au moins une mère (`avecMere`, calculé par `buildGrainesMap`) :
  les autres gardent deux cellules. Dans une variété avec mère, les lignes de sachet ont deux moitiés (`tableau__demi`) qui
  reproduisent deux cellules. Les lieux sont en 7 px sur 2 lignes au plus (`tableau__lieu`, `max-height: 6mm`) : une 3e ligne
  serait coupée sans avertissement.
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
- Un sachet : `{ origine, sachet, annee, saisons, qtte, germination, mere, lieu }`. Une variété : `{ id, avecMere, … , sachets }`.
- Le JS renvoie des valeurs (listes d'initiales de mois, nombres, `listeChoix`) ; le HTML met en forme (unités, `join`).
- Pas de `watch` (pas de filtre).
- **Zoom d'aperçu** : `zoom: var(--zoom-ecran, 1)` sur `.feuille` (commun) ; facteur `facteurZoom` du commun,
  appelé dans un `ResizeObserver` sur `#appPages` ; `zoom: 1` à l'impression.
  Les mesures faites dans l'inspecteur sont à l'échelle de ce zoom : seuls les rapports comptent.
- Une variable du JS n'est pas visible dans la console de Firefox si elle n'est pas dans le contexte de l'iframe du widget :
  pour inspecter `etat`, utiliser un `console.log` provisoire dans le code.

## CSS
- Du commun d'impression (`styles_communs_pourimpression.css`) : `.feuille` (A4 paysage, padding `15mm 10mm 10mm 10mm`,
  `print-color-adjust: exact`), `.zone-feuilles`, `.tronque`, `.tableau`, `.insecable`, `@media print`.
- **`print-color-adjust: exact` (avec le préfixe `-webkit-`) est nécessaire** : sans lui, Firefox imprime les petits textes gris
  en noir dans le PDF. Ce n'était pas un problème de finesse du trait.
- `cahier.css` : `tableau__titre`, `tableau__cellule` (+ `--bas`, `--gris`, `--multi`), `tableau__sachet`, `tableau__nom`,
  `tableau__variete`, `tableau__demi` (+ `--droite`), `tableau__lieu`, `legende`.
  Le gris des infos et de la légende est `var(--gris-moyen)` (`#888`, variable du commun).
- Lignes du tableau : classe `insecable` (commun) sur le `<tr>` ; plus de `tableau__ligne`.
- Classes de colonnes (largeur seule) d'après l'en-tête papier : `col-type`, `col-nom`, `col-ep`, `col-nb`,
  `col-orig`, `col-sac`, `col-millesime`, `col-sais`, `col-qte`, `col-germ`, `col-nb-gr`, `col-nb-go`,
  `col-annee-s`, `col-date-s`, `col-germe`, `col-oups`, `col-plante`, `col-date-p`, `col-ou`, `col-donne`.
- **Largeurs : total 100 %** (rééquilibrées le 25/11 : anciennes valeurs ÷ 1,15, rendu identique ; l'ancien total de 115 %
  était réduit en silence par le navigateur). Pour ajuster une colonne : retirer à une autre ce qu'on ajoute, le total reste 100.
  `col-qte` et `col-germ` ont la même largeur : les deux moitiés d'une cellule fusionnée tombent donc au bon endroit ;
  si on change l'une des deux, revoir `tableau__demi`.
- Utilisé du commun : `entete`, `statut`, `ligne` (+ `--pleine`), `btn`, `texte` (+ `--discret`, `--gras`, `--erreur`), balise `h1`.

## Décisions
- 25/11 : retrait de `numeroLecture` (une lecture dépassée par une plus récente pouvait écraser l'affichage ; le risque,
  deux modifications très rapprochées dans Grist, est accepté : rechargement ou modification suivante) et de `horsGrist`.
- 25/11 : pas de fusion avec le Calendrier ; deux widgets, lecture de Varietes mise en commun (`indexerVarietes`, `varieteReferencee`).
- 25/11 : doublons de `NomVariete` ignorés dans le Cahier (« ne devrait pas arriver ») ; le Calendrier les signale.
- 26/11 : pas de pagination mesurée par le navigateur : après mesure, une unité ≈ 6,7 mm et une page en contient 26,5 au maximum,
  le gain restant possible est d'environ une unité par page. `LIGNES_PAR_PAGE` passe de 25 à 26.
- 26/11 : `listeChoix` du commun non modifiée pour `Origine` (la correction locale suffit, voir « Données »).
- 26/11 : lieu des plantes mères dans la case « Qté », colonne formule `Lieu_cahier` dans Millesimes (plutôt qu'une lecture
  de Semis dans le Cahier). Fusion Qté + Germ. limitée aux variétés qui ont une mère (jamais pour un simple sachet).

## Points de vigilance
- Impression : tester l'aperçu en A4 paysage après toute modification du CSS (local ou commun : le `body` du commun compte).
- Ne jamais lancer « Mettre en forme le document » sur le HTML.
- Si une colonne est renommée dans Grist, l'avertissement « Colonne introuvable » le signale ; mettre à jour les deux listes.
- Une erreur `Property "xxx" was accessed during render…` : un nom utilisé dans le HTML manque dans le `return` du `setup`.
- Le texte coupé par `ellipsis` (colonnes étroites) n'est pas signalé : vérifier « 1-2 cm » et « 10 ans » à l'impression,
  ainsi que les listes de lieux des plantes mères (coupées au-delà de 2 lignes).
- Après un changement de police, de padding ou de hauteur de ligne dans le CSS : refaire le PDF, car `LIGNES_PAR_PAGE` suppose
  une unité de 6,7 mm.

## Reste à faire
- [x] Mise en prod : commun d'abord, puis copier les 3 fichiers sur `main`, changer l'URL du widget dans Grist (lié à Millesimes), Ctrl+F5, test d'impression.
- [x] Supprimer l'ancien `main_cahier.js` et l'ancien `cahier.html` après la mise en prod. La section « tableau » de `main.css` ne sert plus qu'à eux : à retirer lors de la migration des épingles.
- [x] Calendrier (sa discussion) : traité dans ses propres notes.
- [ ] Remettre en prod après l'ajout des lieux des plantes mères (`Lieu_cahier` d'abord dans Grist, puis les 3 fichiers du Cahier).