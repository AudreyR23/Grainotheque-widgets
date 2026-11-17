# Outil « À gérer » (`a_gerer`)

## Rôle
Widget Grist pour le suivi de saison : noter la germination des semis, noter les plantations avec leur emplacement, contrôler les plantes mères au printemps. PC et tablette. Lit et écrit dans `Semis` et `Millesimes`.

## Fichiers
| Fichier | Rôle |
|---|---|
| `a_gerer.html` | Structure, 6 zones Vue |
| `a_gerer.css` | Styles propres à l'outil |
| `a_gerer.js` | Données, calculs, enregistrement |
| `../../styles/styles_commun.css` | Variables, champs, cartes, boutons |
| `../../script/scriptcommun.js` | Fonctions communes |

Scripts en fin de `<body>`, dans cet ordre : `grist-plugin-api.js`, Vue 3.4.38 (unpkg), `scriptcommun.js`, `a_gerer.js`. Accès Grist : `full`.

## Données
- `Semis` lues : `Nom`, `Variete`, `Type`, `Date_s`, `Nb_godets`, `Nb_graines`, `Graines_semees`, `Germes`, `Germes_attente`, `Germination_duree`, `Info_germination`, `Plantes`, `Oups`, `Don_p`, `Reste_a_planter`, `Date_p`, `Plante_mere`, `Ou`, `Millesime`.
- `Millesimes` lues : `Nom`, `Variete`, `Type`, `NomVariete`, `Plante_mere`, `Annee_plantation`, `Statut_mere`, `Controle_mere`.
- Choix de `Semis.Ou` lus dans les métadonnées (liste des emplacements).
- Écrites : `Semis` (`Germes`, `Germes_attente`, `Plantes`, `Date_p`, `Ou`, `Oups`, `Don_p`) ; `Millesimes` (`Statut_mere`, `Controle_mere`, `Plante_mere`) ; création possible d'une ligne `Semis` de plante mère.
- Colonnes de **données** à créer : `Semis.Germes_attente` (case), `Millesimes.Statut_mere` (Choix : `Vivante`, `Morte`), `Millesimes.Controle_mere` (Date).
- Une plante mère = une ligne `Millesimes` (`Plante_mere` cochée) + une ligne `Semis` sans godets ni graines portant `Plantes` et `Ou`.

## Fonctionnement
**Bandeau** collé en haut : statut (« À jour » ou « Non sauvegardé (n) »), boutons de navigation (En cours, À contrôler, À vérifier, À planter), messages de succès (5 s) et d'erreur.

**Filtrer/Trier** : recherche par nom ou variété (accents ignorés, plusieurs mots) ; tri habituel ou par nom.

**En cours** : récapitulatif des saisies non enregistrées (germination, plantes mères, plantation). Un clic ramène à la carte, ✕ annule.

**À contrôler** (plantes mères) : par défaut, plantées avant l'année en cours et pas contrôlées cette année. Boutons « Encore là » / « Morte ».
- « Morte » : une pastille par lieu si plusieurs lieux ; on coche ceux où elle est morte.
- Mort totale : `Plante_mere` décochée, lieux retirés de `Ou`, `Plantes = 0`. Mort partielle : seuls les lieux cochés sont retirés.
- « Encore là » sans lieu connu : le lieu devient obligatoire.

**À vérifier** : semis datés, sans germes, dont la durée de germination est dépassée, plus ceux restés « en attente ». Champ « Germes », bouton « NG » (0 germe), case « En attente » (un nouveau contrôle viendra : la carte reste). Option pour inclure les semis sans durée de germination (12 derniers mois).

**À planter** : semis avec germes et reste > 0. Champs Plantés, Oups, Don ; « Tout » ; emplacements (obligatoires si `Ou` est vide dans Grist, facultatifs sinon). Une seule date de plantation pour toute la liste.

## Enregistrement
Un seul bouton « Enregistrer tout », collé en bas.
- Contrôles avant écriture : date de plantation, lieux manquants, lieux morts non cochés.
- Avant d'écrire, rechargement de `Semis` : si une ligne a changé dans Grist depuis le chargement, rien n'est enregistré et l'erreur apparaît sous la section concernée.
- Les quantités sont ajoutées aux valeurs chargées. `Date_p` est écrasée.
- Un seul `applyUserActions`.

## Limites
- Pas de correction d'une valeur déjà enregistrée, pas d'annulation d'un « Morte » : corriger dans Grist.
- Plante mère sans `Ou` sur sa ligne `Semis` : « emplacement inconnu ».
- Une plante replantée après « Morte » : recocher `Plante_mere` et vider `Statut_mere` et `Controle_mere`.
- `Germination_annee` (dans `Millesimes`) compte les germes partiels tant que le total final n'est pas saisi.
- Pas d'écoute des changements faits ailleurs dans Grist : recharger le widget.

## Test de recette
1. Statut « À jour ». Titres et boutons du bandeau justes.
2. Germes, NG, « En attente » : carte orange, ligne « En cours », bouton Enregistrer visible.
3. Plantés + lieu ; lieu manquant : refus avec message sous la section.
4. Plante mère : « Encore là », « Morte » (un lieu et plusieurs).
5. Modifier une valeur dans Grist pendant une saisie : rien n'est enregistré.
6. Recharger la page avec des saisies : elles reviennent.