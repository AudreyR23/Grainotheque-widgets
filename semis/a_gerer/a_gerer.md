# Outil « À gérer » (`a_gerer`)

## Rôle
Widget Grist pour le suivi de saison : noter la germination des semis, noter les plantations avec leur emplacement, contrôler les plantes mères au printemps. Prévu pour PC et tablette. Lit et écrit dans les tables `Semis` et `Millesimes`.

## Fichiers
| Fichier | Rôle |
|---|---|
| `a_gerer.html` | Structure et textes, 7 zones Vue (voir plus bas) |
| `a_gerer.css` | Styles propres à l'outil (bandeau, défilement, tri) |
| `a_gerer.js` | Données, calculs, enregistrement |
| `../../styles/styles_communs_bem.css` | Variables, champs, cartes, boutons (nommage BEM) |
| `../../script/scriptcommun.js` | Fonctions communes à tous les outils |

Scripts en fin de `<body>`, dans cet ordre : plugin Grist, Vue 3.4.38 (unpkg), `scriptcommun.js`, `a_gerer.js`. Accès Grist : `full`.

## Données
- `Semis` lues : `Nom`, `Variete`, `Type`, `Date_s`, `Nb_godets`, `Nb_graines`, `Graines_semees`, `Germes`, `Germes_attente`, `Germination_duree`, `Info_germination`, `Plantes`, `Oups`, `Don_p`, `Reste_a_planter`, `Date_p`, `Plante_mere`, `Ou`, `Millesime`.
- `Millesimes` lues : `Nom`, `Variete`, `Type`, `NomVariete`, `Plante_mere`, `Annee_plantation`, `Statut_mere`, `Controle_mere`.
- Les choix de `Semis.Ou` (liste des emplacements) sont lus dans les métadonnées Grist.
- Écrites : `Semis` (`Germes`, `Germes_attente`, `Plantes`, `Date_p`, `Ou`, `Oups`, `Don_p`) ; `Millesimes` (`Statut_mere`, `Controle_mere`, `Plante_mere`) ; création possible d'une ligne `Semis` pour une plante mère.
- Colonnes de **données** (pas des formules) à créer : `Semis.Germes_attente` (case), `Millesimes.Statut_mere` (Choix : `Vivante`, `Morte`), `Millesimes.Controle_mere` (Date).
- Une plante mère = une ligne `Millesimes` (`Plante_mere` cochée) + une ligne `Semis` sans godets ni graines, portant `Plantes` et `Ou`.

## Fonctionnement
**Bandeau** collé en haut : statut (« À jour » ou « Non sauvegardé (n) »), boutons de navigation (En cours, À contrôler, À vérifier, À planter), messages de succès (5 s) et d'erreur.

**Filtrer/Trier** : recherche par nom ou variété (accents ignorés, plusieurs mots) ; tri habituel ou par nom.

**En cours** : récapitulatif des saisies pas encore enregistrées (germination, plantes mères, plantation). Un clic ramène à la carte concernée, ✕ annule la saisie.

**À contrôler** (plantes mères) : par défaut, celles plantées avant l'année en cours et pas encore contrôlées cette année. Boutons « Encore là » / « Morte ».
- « Morte » : une pastille par lieu si la plante en a plusieurs ; on coche ceux où elle est morte.
- Mort totale : `Plante_mere` décochée, lieux retirés de `Ou`, `Plantes = 0`. Mort partielle : seuls les lieux cochés sont retirés.
- « Encore là » sans lieu connu : le lieu devient obligatoire.

**À vérifier** : semis datés, sans germes, dont la durée de germination est dépassée, plus ceux laissés « en attente ». Champ « Germes », bouton « NG » (0 germe), case « En attente » (un nouveau contrôle viendra : la carte reste). Option pour inclure les semis sans durée de germination (12 derniers mois).

**À planter** : semis avec germes et reste > 0. Champs Plantés, Oups, Don ; bouton « Tout » ; emplacements (obligatoires si `Ou` est vide dans Grist, facultatifs sinon). Une seule date de plantation pour toute la liste.

## Enregistrement
Un seul bouton « Enregistrer tout », collé en bas.
- Contrôles avant écriture : date de plantation, lieux manquants, lieux morts non cochés.
- Avant d'écrire, `Semis` est rechargé : si une ligne a changé dans Grist depuis le chargement, rien n'est enregistré et l'erreur apparaît sous la section concernée.
- Les quantités sont ajoutées aux valeurs chargées. `Date_p` est écrasée.
- Un seul `applyUserActions`.

## Choix techniques (pour qui lit le code)
- **Vue 3 sans compilation** : une zone `<div id="appXxx">` par bloc (`appEntete`, `appRecherche`, `appEnCours`, `appMeres`, `appVerifier`, `appPlanter`, `appEnregistrer`), chacune montée par son `Vue.createApp(...).mount(...)`. Tout ce que le HTML appelle doit figurer dans le `return` du `setup` de la zone.
- **Un seul état réactif** (`etat`). Les saisies non enregistrées vivent dans `etat.saisies` (par semis) et `etat.saisiesMeres` (par millésime) : les ids des deux tables se recoupent, ils ne sont jamais mélangés.
- **Le JS calcule, le HTML met en forme** : le JS renvoie des valeurs ou des codes (`cas: 'morte'`, `casOu(s)`), les textes, `v-if` et classes sont dans le HTML. Exceptions assumées : les messages d'erreur et de succès, construits au moment d'une décision.
- **Saisies conservées au rechargement** : un `Vue.watch` profond copie `saisies` et `saisiesMeres` dans `sessionStorage` à chaque changement ; au démarrage elles sont relues, puis celles dont la carte n'existe plus sont supprimées. Le contenu disparaît à la fermeture de l'onglet.
- **Vue ne suit pas les `Map`** : `recordsParId` reste une `Map`, et les listes affichées sont copiées dans `etat` par `recalculerTout()`.
- **CSS en BEM** : blocs (`carte`, `btn`, `menu`, `pastille`, `case`, `ligne`, `texte`), éléments `bloc__element`, variantes `bloc--variante`. Les règles ont donc toutes le même poids, c'est l'ordre dans le fichier qui décide.
- **Menus déroulants** : `.menu` est en `position: relative`, `.menu__liste` en `absolute` juste dessous. `@mousedown.prevent` sur la liste garde le focus dans le champ.
- **Bouton collé en bas** : `position: sticky`, avec un conteneur Vue en `display: contents` (`.zone-transparente`) pour que le bouton colle à `<main>` et non à son petit parent.

## Limites
- Pas de correction d'une valeur déjà enregistrée, pas d'annulation d'un « Morte » : corriger dans Grist.
- Plante mère sans `Ou` sur sa ligne `Semis` : « emplacement inconnu ».
- Plante replantée après « Morte » : recocher `Plante_mere` et vider `Statut_mere` et `Controle_mere`.
- `Germination_annee` (dans `Millesimes`) compte les germes partiels tant que le total final n'est pas saisi.
- Pas d'écoute des changements faits ailleurs dans Grist : recharger le widget.
- La détection de modification ne couvre que `Semis`, pas `Millesimes`.

## Test de recette
1. Statut « À jour » ; titres et boutons du bandeau justes.
2. Germes, NG, « En attente » : carte au liseré orange, ligne dans « En cours », bouton Enregistrer visible.
3. Plantés + lieu ; lieu manquant : refus avec message sous la section.
4. Plante mère : « Encore là », « Morte » (avec un lieu, puis plusieurs).
5. Modifier une valeur dans Grist pendant une saisie : rien n'est enregistré.
6. Recharger la page avec des saisies en cours : elles reviennent.
7. Menus « Où » et « Trier par » : ouverts sous leur champ, refermés après un choix.