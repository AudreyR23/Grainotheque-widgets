# Outil « À gérer » (`a_gerer`)

## Rôle
Widget Grist pour le suivi de saison : noter la germination des semis, noter les plantations avec leur emplacement, contrôler et ajuster les plantes mères. Prévu pour PC et tablette (testé sur téléphone). Lit et écrit dans les tables `Semis` et `Millesimes`.

## Fichiers
| Fichier | Rôle |
|---|---|
| `a_gerer.html` | Structure et textes, 7 zones Vue |
| `a_gerer.css` | Styles propres à l'outil (message du bandeau, lieu mort, défilement, tri) |
| `a_gerer.js` | Données, calculs, enregistrement ; messages dans le bloc `TEXTES` en haut du fichier |
| `../../styles/styles_communs.css` | Variables, champs, cartes, boutons (nommage BEM) |
| `../../script/scriptcommun.js` | Fonctions communes |

Scripts en fin de `<body>`, dans cet ordre : plugin Grist, Vue 3.4.38 (unpkg), `scriptcommun.js`, `a_gerer.js`. Accès Grist : `full`.

## Données
- `Semis` lues : `Nom`, `Variete`, `Type`, `Date_s`, `Nb_godets`, `Nb_graines`, `Graines_semees`, `Germes`, `Germes_attente`, `Germination_duree`, `Info_germination`, `Plantes`, `Oups`, `Don_p`, `Reste_a_planter`, `Date_p`, `Plante_mere`, `Ou`, `Millesime`.
- `Millesimes` lues : `Nom`, `Variete`, `Type`, `NomVariete`, `Plante_mere`, `Annee_plantation`, `Statut_mere`, `Controle_mere`, `Nb_plants`.
- Les choix de `Semis.Ou` (emplacements) sont lus dans les métadonnées Grist.
- Écrites : `Semis` (`Germes`, `Germes_attente`, `Plantes`, `Date_p`, `Ou`, `Oups`, `Don_p`) ; `Millesimes` (`Statut_mere`, `Controle_mere`, `Plante_mere`, `Nb_plants`) ; création possible d'une ligne `Semis` pour une plante mère.
- Colonnes de **données** (pas des formules) : `Semis.Germes_attente` (case), `Millesimes.Statut_mere` (Choix : `Vivante`, `Morte`), `Millesimes.Controle_mere` (Date), `Millesimes.Nb_plants` (Numérique), `Millesimes.Plante_mere` (case).
- Une plante mère = une ligne `Millesimes` (`Plante_mere` cochée, `Nb_plants`) + **une seule** ligne `Semis` sans godets ni graines, qui porte `Ou` et `Plantes` (créée par achat-repro, ou par cet outil s'il n'y en a pas).
- Plante mère : `Nb_plants` fait foi. `Semis.Plantes` de sa ligne le suit, car il est lu par le **plan** (nombre de pieds à poser) et par les **étiquettes** (« N plantés »). La formule `Millesimes.Plantes` renvoie `Nb_plants` pour une plante mère, sinon la somme des `Semis.Plantes`.

## Fonctionnement
**Bandeau** collé en haut : statut (« À jour » / « Non sauvegardé (n) »), boutons de navigation (En cours, À vérifier, À planter, À contrôler), messages de succès (5 s) et d'erreur.

**Filtrer/Trier** : recherche par nom ou variété (accents ignorés, plusieurs mots) ; tri habituel ou par nom.

**En cours** : récapitulatif des saisies pas encore enregistrées (germination, plantation, plantes mères), au format « avant → après » (`evolution()` du commun). Un clic ramène à la carte, ✕ annule. En orange : l'essentiel de l'étape (germés, plantés, statut et plants d'une plante mère) ; le reste en gris. « Fin de l'attente » quand une carte en attente est décochée.

**À vérifier** : semis datés, sans germes, durée de germination dépassée, plus ceux laissés « en attente ». Option pour inclure les semis sans durée de germination (12 derniers mois).
- Champ « Germes » (« Nouveaux germés » s'il y en a déjà) : nombre **ajouté** aux germés de Grist. Entiers seulement.
- Bouton « NG » = 0 germé ajouté ; second clic : annule. Fond orange quand il est choisi (ou quand 0 est tapé).
- Case « En attente » : reprend l'état de Grist ; active dès qu'un nombre est saisi. Décocher une carte en attente = fin de l'attente.
- « graines restantes » : calculé d'après Grist seulement (la saisie en cours se voit dans En cours).
- Plus de germés que de graines semées : avertissement rouge sur la carte et dans En cours.

**À planter** : semis avec germes et reste > 0, hors plantes mères. Champs Plantés, Oups, Don (ajoutés aux valeurs de Grist, entiers seulement) ; « Tout » (fond orange tant que la saisie correspond à tout planter, pas d'annulation par second clic) ; emplacements (obligatoires si `Ou` est vide dans Grist). Une seule date de plantation. « germination en attente » en gris gras.

**À contrôler** (plantes mères) : par défaut, celles plantées avant l'année en cours et pas contrôlées cette année. Chaque carte affiche le nombre de plants et les lieux.
- « Encore là » : `Statut_mere = Vivante`, `Controle_mere` = aujourd'hui. Sans lieu connu, le lieu devient obligatoire.
- « Ajuster » : marque « Encore là », propose de modifier le nombre de plants (minimum 1) et d'ajouter un emplacement. Écrit `Nb_plants` **et** `Semis.Plantes` de la ligne plante mère. Second clic : annule l'ajustement.
- Ligne Semis créée pour une plante mère sans ligne : `Plantes` = nombre de plants (ajusté, sinon `Nb_plants`, sinon 1).
- « Morte » : une pastille par lieu si plusieurs ; on coche ceux où elle est morte. Mort totale : `Plante_mere` décochée, lieux retirés de `Ou`, `Plantes` et `Nb_plants` à 0. Mort partielle : seuls les lieux cochés sont retirés, `Nb_plants` et `Plantes` inchangés.

## Enregistrement
Un seul bouton « Enregistrer tout », collé en bas.
- Contrôles avant écriture : date de plantation, lieux manquants, lieux morts non cochés, nombre de plants valide, plusieurs lignes Semis pour une plante mère dont le nombre de plants change.
- Plus de germés que de graines semées : le 1er clic avertit et nomme les semis, un 2e clic enregistre. Si un total change entre les deux clics, nouvel avertissement.
- Avant d'écrire, `Semis` est rechargé : si une ligne a changé dans Grist, rien n'est enregistré (les saisies sont gardées et s'ajouteront aux nouvelles valeurs).
- Quantités ajoutées aux valeurs chargées (germés compris) ; `Date_p` écrasée. Un seul `applyUserActions`.
- Tous les messages construits par le JS sont dans le bloc `TEXTES` en haut de `a_gerer.js`.

## Choix techniques
- **Vue 3 sans compilation** : une zone `<div id="appXxx">` par bloc, chacune montée par son `Vue.createApp(...).mount(...)`. Tout ce que le HTML appelle doit figurer dans le `return` du `setup`, et seulement ce qu'il appelle.
- **Un seul état réactif** (`etat`). Saisies non enregistrées : `etat.saisies` (par semis) et `etat.saisiesMeres` (par millésime) ; les ids des deux tables se recoupent, ils ne sont jamais mélangés.
- **Le JS calcule, le HTML met en forme** : le JS renvoie des valeurs ou des codes, textes et classes sont dans le HTML. Exception : les messages d'erreur et de succès, regroupés dans `TEXTES`.
- **Saisies conservées au rechargement** : `Vue.watch` profond vers `sessionStorage` (clé `a_gerer_saisies`), relues au démarrage (testé sur téléphone).
- **CSS en BEM** : `bloc`, `bloc__element`, `bloc--variante`.
- **Pluriel et « avant → après »** : fonctions communes `pluriel()` et `evolution()`.

## Limites
- Pas de correction d'une valeur déjà enregistrée ni d'annulation d'un « Morte » : corriger dans Grist.
- Retirer un lieu sans « Morte » n'est pas prévu.
- Plante mère sans `Ou` : « emplacement inconnu ».
- Plante replantée après « Morte » : recocher `Plante_mere`, vider `Statut_mere` et `Controle_mere`, renseigner `Nb_plants`.
- Plante mère avec plusieurs lignes Semis : changer le nombre de plants dans Grist.
- Mort partielle : le nombre de plants n'est pas modifié (à décider : demander combien il en reste ?).
- Nombre de plants baissé : les pieds déjà posés sur le plan restent (à gérer dans l'outil plan).
- La détection de modification ne couvre que `Semis` (lignes de germination et de plantation), pas `Millesimes` ni les lignes Semis des plantes mères.
- Pas d'écoute des changements faits ailleurs dans Grist : recharger le widget.
- Nombre de plants d'une plante mère changé à la main dans Grist : changer aussi Semis.Plantes de sa ligne, ou passer par Ajuster.

## À décider plus tard
- Fichier de textes : garder `TEXTES` dans `a_gerer.js`, ou un fichier à part (comme `achatrepro_textes.js`), après comparaison des messages des outils.

## Classes du commun non utilisées par cet outil
(Relevé du 21/11/2026, `styles_communs.css`. À ne pas supprimer sans vérifier les autres outils.)
- Pastilles : `pastille--info`, `pastille--sousabri`, `pastille--pleineterre`, `pastille--etape`
- Cartes : `carte--sousabri`, `carte--pleineterre`
- Texte : `texte--titre`, `texte--plantemere`
- Boutons : `btn--actif`, `btn--danger`
- Confirmation : `confirmation`, `confirmation__boite`, `confirmation__boutons`
- Règle `[hidden]` (aucun attribut `hidden` dans le HTML)

## Test de recette
1. Statut « À jour » ; titres et boutons du bandeau justes.
2. Germes, NG, « En attente » : liseré orange, ligne dans « En cours » au format « avant → après ».
3. Germés additifs : 4 en Grist + 2 saisis → 6. Carte en attente : case cochée par défaut ; décochée → « Fin de l'attente », la carte quitte À vérifier.
4. Plus de germés que de graines : 1er clic refusé avec le nom, 2e clic enregistre.
5. Plantés + lieu ; lieu manquant : refus avec message. « Tout » en orange, redevient neutre si on modifie un champ.
6. Plante mère : « Encore là », « Ajuster » (nombre et lieu : `Nb_plants` et `Semis.Plantes` suivent, le plan permet le nouveau nombre de pieds), « Morte » (un lieu, puis plusieurs).
7. Valeur modifiée dans Grist pendant une saisie : rien n'est enregistré ; la saisie s'ajoute ensuite à la nouvelle valeur.
8. Rechargement avec saisies : elles reviennent (case « En attente » comprise).
9. Nombre à virgule dans Germes ou Plantés : ignoré.