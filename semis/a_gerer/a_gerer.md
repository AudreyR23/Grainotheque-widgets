# Outil « À gérer » (`a_gerer`)

## Rôle
Widget Grist pour le suivi de saison : noter la germination des semis, noter les plantations avec leur emplacement, contrôler et ajuster les plantes mères. Prévu pour PC et tablette (testé sur téléphone). Lit et écrit dans les tables `Semis` et `Millesimes`.

## Fichiers
| Fichier | Rôle |
|---|---|
| `a_gerer.html` | Structure et textes, 7 zones Vue |
| `a_gerer.css` | Styles propres à l'outil (bandeau, défilement, tri) |
| `a_gerer.js` | Données, calculs, enregistrement |
| `../../styles/styles_communs_bem.css` | Variables, champs, cartes, boutons (nommage BEM) |
| `../../script/scriptcommun.js` | Fonctions communes |

Scripts en fin de `<body>`, dans cet ordre : plugin Grist, Vue 3.4.38 (unpkg), `scriptcommun.js`, `a_gerer.js`. Accès Grist : `full`.

## Données
- `Semis` lues : `Nom`, `Variete`, `Type`, `Date_s`, `Nb_godets`, `Nb_graines`, `Graines_semees`, `Germes`, `Germes_attente`, `Germination_duree`, `Info_germination`, `Plantes`, `Oups`, `Don_p`, `Reste_a_planter`, `Date_p`, `Plante_mere`, `Ou`, `Millesime`.
- `Millesimes` lues : `Nom`, `Variete`, `Type`, `NomVariete`, `Plante_mere`, `Annee_plantation`, `Statut_mere`, `Controle_mere`, `Nb_plants`.
- Les choix de `Semis.Ou` (emplacements) sont lus dans les métadonnées Grist.
- Écrites : `Semis` (`Germes`, `Germes_attente`, `Plantes`, `Date_p`, `Ou`, `Oups`, `Don_p`) ; `Millesimes` (`Statut_mere`, `Controle_mere`, `Plante_mere`, `Nb_plants`) ; création possible d'une ligne `Semis` pour une plante mère.
- Colonnes de **données** (pas des formules) : `Semis.Germes_attente` (case), `Millesimes.Statut_mere` (Choix : `Vivante`, `Morte`), `Millesimes.Controle_mere` (Date), `Millesimes.Nb_plants` (Numérique), `Millesimes.Plante_mere` (case).
- Une plante mère = une ligne `Millesimes` (`Plante_mere` cochée, `Nb_plants`) + une ligne `Semis` sans godets ni graines, qui porte `Ou` (et `Plantes`).

## Fonctionnement
**Bandeau** collé en haut : statut (« À jour » / « Non sauvegardé (n) »), boutons de navigation (En cours, À contrôler, À vérifier, À planter), messages de succès (5 s) et d'erreur.

**Filtrer/Trier** : recherche par nom ou variété (accents ignorés, plusieurs mots) ; tri habituel ou par nom.

**En cours** : récapitulatif des saisies pas encore enregistrées (germination, plantes mères, plantation). Un clic ramène à la carte, ✕ annule.

**À contrôler** (plantes mères) : par défaut, celles plantées avant l'année en cours et pas contrôlées cette année. Chaque carte affiche le nombre de plants et les lieux.
- « Encore là » : `Statut_mere = Vivante`, `Controle_mere` = aujourd'hui. Sans lieu connu, le lieu devient obligatoire.
- « Ajuster » : marque « Encore là », propose de modifier `Nb_plants` (minimum 1) et d'ajouter un emplacement. Second clic : annule l'ajustement.
- « Morte » : une pastille par lieu si plusieurs ; on coche ceux où elle est morte. Mort totale : `Plante_mere` décochée, lieux retirés de `Ou`, `Plantes` et `Nb_plants` à 0. Mort partielle : seuls les lieux cochés sont retirés, `Nb_plants` inchangé.

**À vérifier** : semis datés, sans germes, durée de germination dépassée, plus ceux laissés « en attente ». Champ « Germes », bouton « NG », case « En attente ». Option pour inclure les semis sans durée de germination (12 derniers mois).

**À planter** : semis avec germes et reste > 0. Champs Plantés, Oups, Don ; « Tout » ; emplacements (obligatoires si `Ou` est vide dans Grist). Une seule date de plantation.

## Enregistrement
Un seul bouton « Enregistrer tout », collé en bas.
- Contrôles avant écriture : date de plantation, lieux manquants, lieux morts non cochés, nombre de plants valide.
- Avant d'écrire, `Semis` est rechargé : si une ligne a changé dans Grist, rien n'est enregistré.
- Quantités ajoutées aux valeurs chargées ; `Date_p` écrasée. Un seul `applyUserActions`.

## Choix techniques
- **Vue 3 sans compilation** : une zone `<div id="appXxx">` par bloc, chacune montée par son `Vue.createApp(...).mount(...)`. Tout ce que le HTML appelle doit figurer dans le `return` du `setup`.
- **Un seul état réactif** (`etat`). Saisies non enregistrées : `etat.saisies` (par semis) et `etat.saisiesMeres` (par millésime) ; les ids des deux tables se recoupent, ils ne sont jamais mélangés.
- **Le JS calcule, le HTML met en forme** : le JS renvoie des valeurs ou des codes, textes et classes sont dans le HTML.
- **Saisies conservées au rechargement** : `Vue.watch` profond vers `sessionStorage`, relues au démarrage (testé sur téléphone).
- **CSS en BEM** : `bloc`, `bloc__element`, `bloc--variante`.

## Limites
- Pas de correction d'une valeur déjà enregistrée ni d'annulation d'un « Morte » : corriger dans Grist.
- Retirer un lieu sans « Morte » n'est pas prévu.
- Plante mère sans `Ou` : « emplacement inconnu ».
- Plante replantée après « Morte » : recocher `Plante_mere`, vider `Statut_mere` et `Controle_mere`, renseigner `Nb_plants`.
- La détection de modification ne couvre que `Semis`, pas `Millesimes`.
- Pas d'écoute des changements faits ailleurs dans Grist : recharger le widget.

## Test de recette
1. Statut « À jour » ; titres et boutons du bandeau justes.
2. Germes, NG, « En attente » : liseré orange, ligne dans « En cours ».
3. Plantés + lieu ; lieu manquant : refus avec message.
4. Plante mère : « Encore là », « Ajuster » (nombre et lieu), « Morte » (un lieu, puis plusieurs).
5. Valeur modifiée dans Grist pendant une saisie : rien n'est enregistré.
6. Rechargement avec saisies : elles reviennent.