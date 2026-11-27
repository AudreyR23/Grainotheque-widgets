# Outil « À gérer » (`a_gerer`)

## Rôle
Widget Grist pour le suivi de saison : noter la germination des semis, noter les plantations avec leur emplacement, contrôler et ajuster les plantes mères, préparer la fin de saison. Prévu pour PC et tablette (testé sur téléphone). Lit et écrit dans les tables `Semis` et `Millesimes`.

## Fichiers
| Fichier | Rôle |
|---|---|
| `a_gerer.html` | Structure et textes, 7 zones Vue (en-tête avec filtre et tri, En cours, À vérifier, À planter, À contrôler, Fin de saison, Enregistrer) |
| `a_gerer.css` | Styles propres à l'outil (lieu mort, filtres dans l'en-tête, tri) |
| `a_gerer.js` | Données, calculs, enregistrement ; messages dans le bloc `TEXTES` en haut du fichier |
| `../../styles/styles_communs.css` | Variables, champs, cartes, boutons (nommage BEM) |
| `../../script/scriptcommun.js` | Fonctions communes (dont `aller`, `estLigneMere`, `effacerAuClic`, `entierOuNull`, `enListeChoix`) |

Scripts en fin de `<body>`, dans cet ordre : plugin Grist, Vue 3.4.38 (unpkg), `scriptcommun.js`, `a_gerer.js`. Accès Grist : `full`.

## Données
- `Semis` lues : `Nom`, `Variete`, `Type`, `Date_s`, `Nb_godets`, `Nb_graines`, `Graines_semees`, `Germes`, `Germes_attente`, `Germination_duree`, `Info_germination`, `Plantes`, `Oups`, `Don_p`, `Reste_a_planter`, `Date_p`, `Plante_mere`, `Ou`, `Millesime`, `Cloture`, `Nb_etiquettes`, `Etiq_en_attente`.
- `Millesimes` lues : `Nom`, `Variete`, `Type`, `NomVariete`, `Plante_mere`, `Annee_plantation`, `Statut_mere`, `Controle_mere`, `Nb_plants`, `Germination_semis` (formule).
- Les choix de `Semis.Ou` (emplacements) sont lus dans les métadonnées Grist.
- Écrites : `Semis` (`Germes`, `Germes_attente`, `Plantes`, `Date_p`, `Ou`, `Oups`, `Don_p`, `Cloture`) ; `Millesimes` (`Statut_mere`, `Controle_mere`, `Plante_mere`, `Nb_plants`, `Germination_historique`, `Annee_germination_ref`) ; création possible d'une ligne `Semis` pour une plante mère.
- Colonnes de **données** (pas des formules) : `Semis.Germes_attente` (case), `Semis.Cloture` (case), `Millesimes.Statut_mere` (Choix : `Vivante`, `Morte`), `Millesimes.Controle_mere` (Date), `Millesimes.Nb_plants` (Numérique), `Millesimes.Plante_mere` (case), `Millesimes.Germination_historique` et `Annee_germination_ref` (Numérique).
- Ligne `Semis` avec `Cloture` cochée : ignorée partout dans l'outil (sautée au chargement, seulement comptée), en attendant sa suppression à la main dans Grist.
- **Semis en pleine terre** : reconnu par `Date_p` = `Date_s` (écrite par Semis réalisés au semis ; `enPleineTerre(s)`). Il est déjà à sa place au jardin : quand ses germés sont enregistrés, `Plantes` = total des germés. `Reste_a_planter` tombe donc à 0 (il ne passe jamais par « À planter »), et il apparaît dans le Plan et dans Sélection pour étiquettes, qui ne prennent que les lignes avec `Plantes` > 0.
- Qui lit `Semis.Plantes` : Plan (lignes affichées et nombre de pieds), Sélection pour étiquettes (lignes proposées, « N plantés »), formule `Millesimes.Plantes`, et cet outil (`Reste_a_planter`, volet Fin de saison).
- Une plante mère = une ligne `Millesimes` (`Plante_mere` cochée, `Nb_plants`) + **une seule** ligne `Semis` sans godets ni graines (`estLigneMere`), qui porte `Ou` et `Plantes` (créée par Achat-repro, ou par cet outil s'il n'y en a pas). Vérifié le 25/11/2026 : aucune plante mère n'a plus d'une ligne.
- Plante mère : `Nb_plants` fait foi. `Semis.Plantes` de sa ligne le suit, car il est lu par le **plan** (nombre de pieds à poser) et par les **étiquettes** (« N plantés »). La formule `Millesimes.Plantes` renvoie `Nb_plants` pour une plante mère, sinon la somme des `Semis.Plantes`.

## Fonctionnement
**Bandeau** collé en haut : statut (« À jour » / « Non sauvegardé (n) »), boutons de navigation (En cours, À vérifier, À planter, À contrôler, À clôturer), filtre et tri (`entete__filtres`), message de succès (4 s), erreur de chargement et erreur d'enregistrement (`entete__message`).

**Filtrer/Trier** (dans le bandeau, donc utilisable depuis n'importe quelle section) : recherche par nom ou variété (accents ignorés, plusieurs mots), appliquée à À vérifier, À planter, À contrôler et aux cartes « Au jardin » du volet Fin de saison ; tri habituel ou par nom. Le menu de tri est géré par la zone `#appEntete` (pas de zone à part).

**En cours** : récapitulatif des saisies pas encore enregistrées (germination, plantation, plantes mères, fin de saison), au format « avant → après » (`evolution()` du commun). Un clic ramène à la carte, ✕ annule. En orange : l'essentiel de l'étape (germés, plantés, statut et plants d'une plante mère) ; le reste en gris. « Fin de l'attente » quand une carte en attente est décochée.

**À vérifier** : semis datés, sans germes, durée de germination dépassée, plus ceux laissés « en attente » (semis en pleine terre compris). Option pour inclure les semis sans durée de germination (12 derniers mois).
- Champ « Germes » (« Nouveaux germés » s'il y en a déjà) : nombre **ajouté** aux germés de Grist.
- Bouton « NG » = 0 germé ajouté ; second clic : annule. Fond orange quand il est choisi (ou quand 0 est tapé).
- Case « En attente » : reprend l'état de Grist ; active dès qu'un nombre est saisi. Décocher une carte en attente = fin de l'attente.
- « graines restantes » : calculé d'après Grist seulement (la saisie en cours se voit dans En cours).
- Plus de germés que de graines semées : avertissement rouge sur la carte et dans En cours, sans blocage.
- Semis en pleine terre : à l'enregistrement, `Plantes` = total des germés (voir Données).

**À planter** : semis avec germes et reste > 0, hors plantes mères (les semis en pleine terre n'y arrivent pas, leur reste est à 0). Champs Plantés, Oups, Don (ajoutés aux valeurs de Grist) ; « Tout » (fond orange tant que la saisie correspond à tout planter, pas d'annulation par second clic) ; emplacements (obligatoires si `Ou` est vide dans Grist). Une seule date de plantation. « germination en attente » en gris gras.

**Champs de nombre** (Germes, Plantés, Oups, Don, Nombre de plants) : champs texte (`type="text" inputmode="numeric"`), entiers seulement (`entierOuNull`). Le texte tapé est gardé dans `etat.brut` (clé « idSemis:cle ») ; s'il n'est pas un entier, message rouge sous le champ et refus à l'enregistrement.

**À contrôler** (plantes mères) : par défaut, celles plantées avant l'année en cours et pas contrôlées cette année. Chaque carte affiche le nombre de plants et les lieux.
- « Encore là » : `Statut_mere = Vivante`, `Controle_mere` = aujourd'hui. Sans lieu connu, le lieu devient obligatoire.
- « Ajuster » : marque « Encore là », propose de modifier le nombre de plants (minimum 1) et d'ajouter un emplacement. Second clic : annule l'ajustement.
- « Morte » : une pastille par lieu si plusieurs ; on coche ceux où elle est morte.
  - Mort totale : `Plante_mere` décochée, lieux retirés de `Ou`, `Plantes` et `Nb_plants` à 0.
  - Mort partielle : les lieux cochés sont retirés ; le champ « Nombre de plants » apparaît, prérempli avec le nombre actuel.
- Nombre de plants (Ajuster ou mort partielle, `avecNombrePlants`) : écrit dans `Nb_plants` **et** dans `Semis.Plantes` de la ligne plante mère (la première s'il y en avait plusieurs).
- Ligne Semis créée pour une plante mère sans ligne : `Plantes` = nombre de plants (ajusté, sinon `Nb_plants`, sinon 1).

**Fin de saison** (volet replié en bas, case « Préparer la fin de saison (N lignes) ») : lignes datées, hors plantes mères, qui ne sont ni dans « À vérifier » (compté avec les semis sans durée, quelle que soit la case), ni dans « À planter », ni « En attente » de germination dans Grist. Code `casFinSaison(s)` :
- `jardin` (`Plantes` > 0, semis en pleine terre levés compris) : carte « Au jardin, à décider » avec un bouton « Clôturer » (orange quand il est choisi, second clic : annule). Sans clic, la ligne est gardée et reviendra l'an prochain : rappel pour en faire une plante mère dans Achat-repro.
- `etiquettes` (`Nb_etiquettes` ou `Etiq_en_attente` > 0) : carte dans le même groupe, sans bouton, « Étiquettes en attente : passe d'abord par Achat-repro ».
- `sans-plant` (semis ratés, NG, tout perdu ou donné) : pas de carte, une ligne « N lignes sans plant au jardin » et un bouton « Tout clôturer » (second clic : annule).
- Rappel gris : « N lignes clôturées, à supprimer dans Grist (filtre Cloture) ».
- Dans « En cours » : une seule carte « N lignes à clôturer » (clic : ouvre le volet ; ✕ : tout annuler). Compte dans « Non sauvegardé (n) ».
- À l'enregistrement : `Cloture` cochée, et pour chaque millésime qui a au moins une ligne clôturée et une `Germination_semis` calculée : `Germination_historique` = `Germination_semis` (écrase l'ancienne), `Annee_germination_ref` = année du dernier semis du millésime dont les germés sont notés. Dans le même `applyUserActions` : la copie ne peut pas être oubliée.
- Suppression : à la main dans Grist (filtre `Cloture`), après avoir vérifié la colonne « Germ. » du cahier.
- Plante mère morte (mort totale) : sa ligne Semis (`Plante_mere` décochée sur le millésime, `Ou` vide, `Plantes` = 0) n'est plus une ligne de plante mère et arrive d'elle-même dans « Sans plant au jardin » (ou « Au jardin, à décider » si elle a des étiquettes). Pas de germination copiée (`Germination_semis` vide). Le millésime est gardé (« Morte », date du contrôle, 0 plant). Mort partielle : la ligne reste plante mère, jamais clôturée.

## Enregistrement
Un seul bouton « Enregistrer tout », collé en bas.
- Contrôles avant écriture, dans l'ordre : nombres non entiers (À vérifier, puis À planter), date de plantation, lieux manquants, plante mère sans emplacement, lieux morts non cochés, nombre de plants invalide.
- Pas de relecture avant écriture : les quantités s'ajoutent aux valeurs chargées, rafraîchies après chaque enregistrement. `Date_p` écrasée. Un seul `applyUserActions`.
- Une erreur reste affichée jusqu'au clic suivant (`effacerAuClic(effacerErreurs)`).
- Tous les messages construits par le JS sont dans le bloc `TEXTES` en haut de `a_gerer.js`.

## Choix techniques
- **Vue 3 sans compilation** : une zone `<div id="appXxx">` par bloc, chacune montée par son `Vue.createApp(...).mount(...)`. Tout ce que le HTML appelle doit figurer dans le `return` du `setup`, et seulement ce qu'il appelle.
- **Un seul état réactif** (`etat`). Saisies non enregistrées : `etat.saisies` (par semis), `etat.saisiesMeres` (par millésime) et `etat.clotures` (par semis) ; les ids des deux tables se recoupent, ils ne sont jamais mélangés.
- **Saisies perdues au rechargement** : voulu (pas de `sessionStorage`, pas de `beforeunload`).
- **Le JS calcule, le HTML met en forme** : le JS renvoie des valeurs ou des codes, textes et classes sont dans le HTML. Exception : les messages d'erreur et de succès, regroupés dans `TEXTES`.
- **CSS en BEM** : `bloc`, `bloc__element`, `bloc--variante`. Le défilement sous l'en-tête est géré par `aller()` du commun (pas de `scroll-margin-top`).
- **Pluriel et « avant → après »** : fonctions communes `pluriel()` et `evolution()`.

## Limites
- Pas de correction d'une valeur déjà enregistrée ni d'annulation d'un « Morte » : corriger dans Grist.
- Valeur changée dans Grist pendant une saisie : la saisie s'ajoute à la valeur chargée (recharger le widget avant de saisir si on a modifié Grist).
- Retirer un lieu sans « Morte » n'est pas prévu.
- Plante mère sans `Ou` : « emplacement inconnu ».
- Plante replantée après « Morte » : recocher `Plante_mere`, vider `Statut_mere` et `Controle_mere`, renseigner `Nb_plants`.
- Nombre de plants d'une plante mère changé à la main dans Grist : changer aussi `Semis.Plantes` de sa ligne, ou passer par Ajuster.
- Nombre de plants baissé : les pieds déjà posés sur le plan restent (à gérer dans l'outil Plan, à sa refonte).
- Semis en pleine terre : des plants perdus après la germination ne font pas baisser `Plantes` ; corriger `Plantes` dans Grist. Un ancien semis en pleine terre sans `Date_p` = `Date_s` est traité comme un semis en godets (passe par « À planter »).
- Pas d'écoute des changements faits ailleurs dans Grist : recharger le widget.
- Fin de saison : les vieux restes d'« À vérifier » et d'« À planter » ne vont pas dans le volet ; les sortir d'abord par NG ou Oups.
- Millésime dont une partie des lignes est gardée : après suppression des autres, `Germination_semis` est recalculée sur les lignes gardées seulement, et `Germination_affichee` la préfère à l'historique.
- Les autres outils (Plan, Sélection pour étiquettes, Semis réalisés) ne lisent pas `Cloture` : supprimer les lignes clôturées sans trop attendre.

## Historique des données
- 27/11/2026 : anciens semis en pleine terre mis à jour à la main dans Grist (`Date_p` = `Date_s`, puis `Plantes` = `Germes` pour ceux dont les germés étaient notés), à l'aide de colonnes formules temporaires.

## Classes du commun non utilisées par cet outil
(Relevé du 21/11/2026, `styles_communs.css`, à revérifier. À ne pas supprimer sans vérifier les autres outils.)
- Pastilles : `pastille--info`, `pastille--sousabri`, `pastille--pleineterre`, `pastille--etape`
- Cartes : `carte--sousabri`, `carte--pleineterre`
- Texte : `texte--titre`, `texte--plantemere`
- Boutons : `btn--actif`, `btn--danger`
- Confirmation : `confirmation`, `confirmation__boite`, `confirmation__boutons`
- Règle `[hidden]` (aucun attribut `hidden` dans le HTML)

## Test de recette
1. Statut « À jour » ; titres et boutons du bandeau justes ; types affichés sur les cartes. Filtre tapé depuis le bas de page : les cartes sont filtrées sans remonter ; le menu de tri s'ouvre par-dessus les cartes et se ferme au clic ailleurs.
2. Germes, NG, « En attente » : liseré orange, ligne dans « En cours » au format « avant → après ».
3. Germés additifs : 4 en Grist + 2 saisis → 6. Carte en attente : case cochée par défaut ; décochée → « Fin de l'attente », la carte quitte À vérifier.
4. Plus de germés que de graines : avertissement rouge, enregistré au 1er clic.
5. `2,5` ou `abc` dans Germes, Plantés, Oups, Don ou Nombre de plants : message rouge sous le champ ; « Enregistrer tout » refuse et nomme le semis.
6. Plantés + lieu ; lieu manquant : refus avec message. « Tout » en orange, redevient neutre si on modifie un champ.
7. Plante mère : « Encore là », « Ajuster » (nombre et lieu : `Nb_plants` et `Semis.Plantes` suivent), « Morte » à un lieu, mort partielle avec nouveau nombre de plants, mort totale.
8. Erreur affichée : disparaît au clic suivant. Erreur de chargement (`fetchTable("SemisX")`) : en rouge gras dans l'en-tête.
9. Saisie puis F5 : la saisie disparaît (voulu).
10. Fin de saison : aucune carte d'« À vérifier », « À planter » ou « À contrôler » dans le volet (même case « sans durée » décochée) ; « Clôturer » et « Tout clôturer » en orange, second clic annule ; carte « N lignes à clôturer » dans En cours.
11. Enregistrement d'une clôture : `Cloture` cochée, ligne ignorée après rechargement, rappel « N lignes clôturées » ; `Germination_historique` et `Annee_germination_ref` du millésime remplis ; après suppression dans Grist, la colonne « Germ. » du cahier garde la valeur.
12. Plante mère de test à un lieu marquée « Morte » et enregistrée : « lignes sans plant au jardin » augmente de 1 ; « Tout clôturer » coche sa `Cloture` sans toucher à `Germination_historique`.
13. Semis en pleine terre : dans « À vérifier » tant que ses germés ne sont pas notés ; 12 germés enregistrés → `Germes` = 12, `Plantes` = 12, absent d'« À planter », visible dans le Plan et Sélection pour étiquettes ; en attente 5 puis 3 → `Plantes` = 8 ; NG → `Plantes` = 0, « Sans plant au jardin ». Un semis en godets n'a pas son `Plantes` changé par les germés.