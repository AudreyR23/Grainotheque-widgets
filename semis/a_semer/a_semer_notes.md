# Granothèque Grist : outil « À semer » (récapitulatif v2)

> Document de référence pour reprendre l'outil plus tard.
> État : fonctionnel et testé (novembre 2026). Architecture Vue 3, CSS commun et JS commun.
> Remplace `a_semer_recapitulatif.md` (version d'avant la conversion Vue).

## 1. Rôle

Rappeler les variétés à semer **au mois choisi** (mois en cours par défaut) quand elles n'ont pas encore été semées dans leur période de semis. Le bouton « Semer » envoie la variété à l'outil **semis réalisés**, qui pré-remplit sa fiche.

Usage : PC et tablette, lecture seule (À semer n'écrit rien dans les tables). Consultable sur téléphone via la vue Grist.

## 2. Fichiers et installation

| Élément | Détail |
|---|---|
| Widget À semer | `a_semer.html`, `a_semer.js`, `a_semer.css` (dans le dossier du widget) |
| CSS commun | `../../styles/gestion_commun.css` (variables de couleur, boutons, champs, cadres, **carte**, **pastilles**, **type**) |
| JS commun | `gestion_commun.js` (fonctions utilitaires partagées, voir 8) |
| Hébergement | GitHub Pages (`audreyr23.github.io/Grainotheque-widgets/...`) |
| À semer, dans Grist | Données : **Varietes**. « Sélectionner par » : vide. Accès : **full** |
| semis réalisés, dans Grist | Données : **Semis**. « Sélectionner par » : vide |
| Placement | Les deux widgets doivent être **sur la même page** Grist |

Accès `full` : nécessaire car le widget lit plusieurs tables avec `grist.docApi.fetchTable`, même sans écrire.

**Ordre de chargement dans le HTML** :

1. `gestion_commun.css`, puis `a_semer.css` ;
2. en fin de `<body>` : Vue 3.4.38 (jsdelivr), puis `grist-plugin-api.js`, puis `gestion_commun.js`, puis `a_semer.js`.

Pas d'élément `message` dans le HTML : une erreur de chargement n'apparaît que dans la console (F12).

`a_semer.css` ne contient que : `#filtres`, `#filtres label`, `.champ-filtre`, `.carte.deja-semee`.

## 3. Données lues

| Table | Colonnes utilisées |
|---|---|
| **Varietes** | `Nom`, `Variete`, `Type` (affiché à côté du nom), `Semis_sous_abris`, `Semis_pleine_terre` (ChoiceList de mois), `Annees_sans_test` |
| **Millesimes** | `NomVariete`, `Millesime` (date), `Epuise`, `Germination_affichee`, `Sachets`, `Qtte_graines` |
| **Semis** | `NomVariete`, `Date_s` |

Mois attendus dans les ChoiceList : `Jan, Fév, Mar, Avr, Mai, Jui, Juil, Aou, Sep, Oct, Nov, Déc` (comparaison sans accents ni majuscules). Si un libellé est renommé dans Grist, l'outil ne le reconnaît plus.

La colonne `Deja_seme_cette_annee` n'est plus lue : elle est remplacée par le calcul sur la période de semis (voir 5). Elle peut rester dans la table.

## 4. Fonctionnalités

### Liste « à semer »

Une variété s'affiche si :

1. le mois choisi est dans `Semis_sous_abris` ou `Semis_pleine_terre` ;
2. elle n'a pas de semis dans sa **période de semis** en cours (voir 5) ;
3. elle n'est pas déjà au jardin sous forme de plant, rhizome, caïeu ou bulbe (voir « Plants » ci-dessous) ;
4. elle a au moins un millésime utilisable (voir 6).

### Titre avec décompte

- Sans filtre : « À semer en Nov (6) ».
- Avec une case Sous abri / Pleine terre cochée : « À semer en Nov (2 sur 6) ».
- Le nombre ne compte que les variétés **non** estompées, même quand « Afficher aussi les déjà semées » est cochée.

### Carte d'une variété

Même visuel que « Sélection pour étiquettes », à partir des classes communes :

- **Liseré à gauche** sur toutes les cartes : vert (`--sousabri-moyen`) si sous abri, marron (`--pleineterre-moyen`) si pleine terre, **moitié vert (haut) / moitié marron (bas)** si les deux.
- **Nom** en gras, puis le **type** en petit gris, emoji d'abord (« 🌼 Fleurs », via `typeInverse`).
- **Pastilles** « Sous abri » (vert clair) et « Pleine terre » (beige).
- **Deux lignes grises** : (1) millésime, germination, ancienneté du test ; (2) période de semis (« semis Nov → Fév »).
- **Cadre bleu** (`cadre-info`) pour « Déjà semée » et/ou « Plant au jardin » (ou Rhizome, Caïeux, Bulbe).
- **Bouton « Semer »** (style Enregistrer) à droite, centré verticalement, avec un `aria-label` contenant le nom de la variété.
- Une carte déjà semée (case cochée) est estompée (`opacity: .6`).

### Filtres et tri

- **Mois** : liste Jan → Déc.
- **Afficher aussi les déjà semées** : ajoute les variétés déjà semées, estompées.
- **Sous abri** et **Pleine terre** : deux cases cumulables. Une seule cochée garde les variétés qui peuvent se semer dans ce mode ce mois-ci (même si elles se sèment aussi dans l'autre). Les deux cochées ne gardent que celles qui se sèment dans les deux modes.
- **Tri** : nom, % de germination (meilleur d'abord), test (plus longtemps sans test d'abord, « jamais testé » en tête).
- **Actualiser** : recharge les données Grist. Le bouton est grisé pendant le chargement.

### Plants au jardin

Une ligne de Millesimes dont `Sachets` ressemble à **nombre + p / rhi / c / b** (ex. `1P.`, `2rhi`, `3c.`, `1b.`) compte comme matériel vivant déjà présent :

| Code | Mention dans le cadre bleu |
|---|---|
| `p` | Plant au jardin |
| `rhi` | Rhizome au jardin |
| `c` | Caïeux au jardin |
| `b` | Bulbe au jardin |

La variété est alors « déjà semée » (masquée par défaut). La ligne n'est pas proposée comme sachet de graines, sauf si elle a aussi une `Qtte_graines`. Sans graines, la carte affiche « pas de graines ».

Regex de `typeDePlant` : `^\d+(p|rhi|c|b)\.?$`. `\d+` exige un nombre ; `\d*` accepterait aussi « b » ou « c » seuls.

### Sachet « Mél »

Sachet contenant plusieurs millésimes, traité comme un millésime normal (la colonne `Millesime` contient une date). Si c'est la ligne choisie, la carte affiche « sachet mélangé (plusieurs millésimes) ».

### Bouton « Semer » vers semis réalisés

Envoie l'id de la variété à semis réalisés, qui la sélectionne dans sa fiche avec le millésime le plus récent et ses derniers semis. Ne crée aucun semis.

## 5. Période de semis (anti-doublon sur deux années)

Fonction `fenetreDeSemis(liste, mois, annee)` :

- Regroupe les mois de `Semis_sous_abris` + `Semis_pleine_terre` en une **fenêtre continue** qui contient le mois choisi (ex. Nov → Fév, à cheval sur deux années).
- Une variété est « déjà semée » s'il existe un `Date_s` dans cette fenêtre (début inclus, fin exclue : le 1er jour du mois suivant).
- Une variété semée en décembre ne réapparaît donc pas en janvier, et une variété semée en janvier réapparaît bien en novembre.

## 6. Choix du millésime à utiliser

Fonction `millesimeAUtiliser(varieteId)` :

1. Candidats : millésimes **non épuisés** (`Epuise` faux), sauf les lignes plant sans graines.
2. Le **plus récent** parmi ceux qui ont une date.
3. Sinon, celui avec le **meilleur taux** de `Germination_affichee`.
4. Sinon aucun : la variété est masquée (sauf plant au jardin).

La germination est affichée en % (si la valeur est ≤ 1, elle est multipliée par 100).

## 7. Architecture Vue

### Principe

- Une seule zone Vue : `<div id="appSemer">`. Elle contient le titre, le bouton Actualiser, les filtres et la liste des cartes.
- Le **HTML décrit l'affichage** (`v-for`, `v-if`, `:class`, `@click`, `v-model`, `{{ }}`). Le **JS garde les données et les fonctions**.
- Le JS ne contient plus de `createElement`, de `className` ni d'`innerHTML`.
- Vue reconstruit sa zone : tout ce qui est interactif doit être **dans** `#appSemer`.

### État (`etat`, `Vue.reactive`)

| Propriété | Rôle |
|---|---|
| `mois` | Mois choisi (1 à 12), lié à la liste des mois |
| `afficherDejaSemees` | Case « Afficher aussi les déjà semées » |
| `tri` | `'nom'`, `'germination'` ou `'test'` |
| `filtreSousAbri`, `filtrePleineTerre` | Les deux cases de filtre |
| `nombre` | Texte du décompte dans le titre (`'6'` ou `'2 sur 6'`) |
| `chargement` | `true` pendant `actualiser()` (grise le bouton) |
| `lignes` | Cartes à afficher (calculées par `afficher()`) |

### Flux

1. `actualiser()` : `chargerDonnees()` (lit les trois tables), puis `afficher()`.
2. `Vue.watch(() => [etat.mois, etat.afficherDejaSemees, etat.tri, etat.filtreSousAbri, etat.filtrePleineTerre], afficher)` : un changement de filtre recalcule la liste.
3. `afficher()` : appelle `varietesASemer()`, applique les filtres Sous abri / Pleine terre, calcule `etat.nombre` et `etat.lignes`.
4. Le HTML parcourt `etat.lignes`.

### Fonctions appelées par le HTML

Toutes doivent figurer dans le `return` du `setup` de `Vue.createApp`, sinon l'avertissement « was accessed during render but is not defined » apparaît.

`etat`, `MOIS`, `actualiser`, `libelle`, `categorie`, `texteDetail`, `textePeriode`, `texteInfos`, `semer`, `typeInverse` (fournie par le commun).

| Fonction | Rôle |
|---|---|
| `libelle(v)` | « Nom — Variété » |
| `categorie(l)` | `sousabri`, `pleineterre` ou `sousabri-pleineterre` (classe du liseré) |
| `texteDetail(l)` | Millésime, germination, test (ou « pas de graines ») |
| `textePeriode(l)` | « semis Nov → Fév » |
| `texteInfos(l)` | « Déjà semée · Plant au jardin » pour le cadre bleu |
| `semer(id)` | Envoie la variété par `BroadcastChannel` |

### Calcul (inchangé par la conversion)

`typeDePlant`, `fenetreDeSemis`, `millesimeAUtiliser`, `comparerSelonTri`, `varietesASemer`, `texteGermination`, `texteTest`, `recordsParId`.

## 8. CSS commun et JS commun

### Classes de la carte (dans `gestion_commun.css`)

| Classe | Rôle |
|---|---|
| `.carte` | Conteneur : flex, centrage vertical, fond blanc, bordure grise |
| `.carte-titre` | Colonne de texte (prend la place restante) |
| `.carte-detail` | Ligne grise, petite taille |
| `.carte-mention` | Ligne sous le nom (pastilles ou texte coloré) |
| `.carte-type` | Type de la variété, petit et gris, après le nom |
| `.carte-action` | Élément à droite (bouton ou champ), ne se comprime pas |
| `.carte.sousabri`, `.carte.pleineterre`, `.carte.sousabri-pleineterre`, `.carte.plantemere` | Liseré de couleur |
| `.pastille-cat` + `.pastille-sousabri` / `.pastille-pleineterre` | Pastilles de catégorie |
| `.cadre-info`, `.cadre-info-titre` | Cadre bleu d'information |
| `.carte-titre .cadre-info` | Même cadre, réduit au contenu quand il est dans une carte |
| `.texte-plantemere`, `.texte-ici` | Ligne verte « plante mère » / ligne violette de localisation (utilisées par Étiquettes) |

Noms volontairement distincts de `.badge` et de `.pastille` (lieux dans semis réalisés).

### Fonctions de `gestion_commun.js`

`tableEnLignes`, `listeChoix`, `normaliser`, `anneeDepuisDate`, `dateAffichee`, `typeInverse`.

Règles :
- uniquement des fonctions qui n'utilisent **que leurs paramètres** (jamais `etat`, `modifie` ou `recordsParId`) ;
- aucune de ces fonctions ne doit être redéfinie dans un outil : une copie locale masque le commun, et un `const` du même nom bloque tout le fichier ;
- modifier le commun touche **tous** les outils : tester les trois ensuite ;
- en prod, mettre à jour le commun **avant** les outils qui l'utilisent.

### `typeInverse(type)`

Met l'emoji d'abord (« Arom.Méd 🌿 » devient « 🌿 Arom.Méd »). Ne pas modifier les choix de la colonne dans Grist : semis réalisés les compare en texte exact.

### Logique de couleurs (commune aux outils)

| Couleur | Sens |
|---|---|
| Neutre | Sans information particulière |
| Bleu | Information à jour en base |
| Orange | En cours de saisie, pas encore enregistré |
| Rouge | Attention, erreur |
| Vert-jaune (`--plantemere`) | Plante mère |
| Violet (`--ici-*`) | Localisation (📍) |
| Vert foncé / marron | Mode de semis : sous abri / pleine terre |

## 9. Communication avec semis réalisés

`BroadcastChannel('granotheque-semer')`.

- Le lien « Sélectionner par » de Grist n'a pas été retenu : il ne propose pas un widget personnalisé comme source.
- `setCursorPos` ne fonctionnait pas, et `grist.onRecord` aurait reçu des ids de Semis (widget lié à Semis).
- `BroadcastChannel` marche entre widgets de **même origine** (même site GitHub Pages) et **chargés en même temps** (même page).
- Avantages : pas de pré-remplissage automatique au chargement, et ça marche aussi si on reclique sur la même variété.

**Envoi, côté À semer** :

```js
const canal = new BroadcastChannel('granotheque-semer');

function semer(id) {
  canal.postMessage({ varieteId: id });
}
```

```html
<button type="button" class="btn btn-enregistrer carte-action"
        :aria-label="`Semer ${libelle(l.v)}`" @click="semer(l.v.id)">Semer</button>
```

**Réception, côté semis réalisés** :

```js
let donneesChargees = false;           // passe à true en fin d'initialisation

function varieteDemandee(id) {
  if (!id || !donneesChargees) return;
  if (recordsParId.varietes.has(id)) choisirVariete(id);
}

const canal = new BroadcastChannel('granotheque-semer');
canal.onmessage = e => varieteDemandee(e.data && e.data.varieteId);
```

## 10. Limites connues

1. **Sous abri / Pleine terre regroupés** dans le calcul « déjà semée » : un semis sous abri en mars compte aussi pour la fenêtre pleine terre si les mois se suivent. À séparer si une variété disparaît alors que tu voulais la semer aussi dans l'autre mode.
2. **Mois choisi = année en cours** : « Jan » regarde janvier de l'année en cours, donc la saison commencée en novembre de l'an dernier, pas janvier prochain.
3. **Plant sans graines** : la variété est masquée de la liste « à semer », même si on pourrait la multiplier ou la replanter.
4. **Rafraîchissement manuel** : après un semis enregistré dans semis réalisés, cliquer sur « Actualiser ».
5. **Reconnaissance des plants** : repose sur l'écriture exacte de `Sachets` (nombre + `p` / `rhi` / `c` / `b`).
6. **Mobile** : deux widgets sur une page sont serrés sur téléphone. Le bouton « Semer » (maintenant en `click`) n'a pas été testé sur tablette ni sur téléphone.
7. **Liste vide** : aucun message, la zone reste simplement vide.
8. **Erreur de chargement** : visible seulement dans la console.
9. **Bouton Semer toujours visible**, même sur une carte « pas de graines » ou « Plant au jardin » : la fiche de semis réalisés dira alors « Aucun millésime disponible ».
10. **Germination** : `g <= 1` suppose une fraction. Une valeur historique de 1 stockée comme 1 % s'afficherait 100 %.

## 11. Reste à faire / idées

Par priorité :

- [ ] Cacher le bouton Semer quand il n'y a pas de graines (`v-if="l.mil"`).
- [ ] Message de liste vide : « Aucune variété à semer en Nov » (`v-if="etat.lignes.length === 0"`).
- [ ] **Actualisation automatique** : semis réalisés envoie un message sur le même `BroadcastChannel` après un enregistrement, et À semer appelle `actualiser`.
- [ ] Retour visuel après un clic sur Semer (« Envoyé à Semis réalisés »), utile si l'autre outil n'est pas sur la page.
- [ ] Erreur de chargement visible dans la zone Vue (petit `.erreur`).
- [ ] « Données du HH:MM » à côté d'Actualiser.
- [ ] Lire les libellés de mois depuis Grist (comme Étiquettes lit les choix de Type), pour ne pas dépendre de `Jui` / `Juil`.
- [ ] Vérifier `texteGermination` (limite 10).
- [ ] Remplacer `Vue.watch` + `afficher()` par un `computed` (plus avancé).
- [ ] Convention **BEM** pour les classes (`carte__titre`, `carte--sousabri`) : décidé de ne pas renommer maintenant. À appliquer aux nouvelles classes. Au prochain nettoyage, remplacer `.carte-titre .cadre-info` par une classe de variante. Attention : en BEM, le modificateur doit être écrit **après** `.carte` dans le fichier (sinon le dégradé du liseré moitié-moitié disparaît).
- [ ] **Export `.ics`** : bouton qui télécharge un événement par variété à semer (instantané, non mis à jour).
- [ ] **Rappel automatique** : script externe (API Grist, GitHub Actions) qui envoie la liste chaque mois. Chantier à part.
- [ ] Séparer Sous abri / Pleine terre dans « déjà semée » (limite 1), choisir une année en plus du mois (limite 2).
- [ ] Badge « À produire » : écarté pour l'instant (colonne `En_production` de Varietes, à décocher à la main quand le nouveau sachet existe).

## 12. Nettoyage possible

- **semis réalisés** : /TO DO/
  - `varietePendante` n'est plus utilisée (ainsi que le `if (varietePendante) ...` en fin d'initialisation) ;
  - `afficherControle` a une ligne en double (« ignorés (sans date, hors « or. ») ») ;
  - retirer les `console.log` de diagnostic.


## 13. Journal des opérations

1. Fichiers de base (HTML, CSS, JS) : liste en lecture seule des variétés à semer au mois en cours.
2. Filtres : mois, case « Afficher aussi les déjà semées », tri.
3. Bouton « Semer » : essai par `setCursorPos` (échec), puis `BroadcastChannel`. Ajout de `donneesChargees` et `varieteDemandee` côté semis réalisés.
4. Correction d'une coquille de syntaxe en fin de fichier de semis réalisés (`.catch(err =`).
5. **Période de semis** (`fenetreDeSemis`) pour les saisons à cheval sur deux années, avec lecture de la table Semis.
6. **Plants au jardin** : `typeDePlant`, filtre dans `millesimeAUtiliser`, tri sans plantage si pas de graines. Correction de la regex (le « x » désignait un nombre).
7. Sachet « Mél » : traité comme un millésime normal, avec mention « sachet mélangé ».
8. **Refonte visuelle** : carte commune (`.carte`), liseré de couleur, bouton « Semer » centré à droite, cadre bleu, `a_semer.css` raccourci.
9. **Pastilles** « Sous abri » / « Pleine terre » (`pastille-cat`), avec correction d'un bug de classe (`badge` sans `sous-abri`).
10. **Liseré moitié vert / moitié marron** pour les variétés des deux modes.
11. **Harmonisation avec Étiquettes** : renommages des classes (`carte-titre`, `cadre-info`, `liste-carte`), chemins `../../styles/`, Vue 3.4.38 chargé par jsdelivr.
12. **Conversion Vue, par étapes** :
    - titre avec décompte et suppression du message d'erreur ;
    - `pointerdown` remplacé par `click` sur Semer ;
    - mois, case et tri en `v-model`, Actualiser en `@click`, `Vue.watch` ;
    - cases Sous abri / Pleine terre et titre « (x sur N) » ;
    - liste en `v-for`, plus aucun `createElement` ni `className`.
13. Période de semis sur une ligne à part (`textePeriode`).
14. Type affiché à côté du nom (`.carte-type`), puis emoji d'abord avec `typeInverse`.
15. **JS commun** : `gestion_commun.js` (6 fonctions) pour À semer, Étiquettes et semis réalisés.
16. Nettoyage de `dejaSemeCetteAnnee` et du `if` mal indenté de `millesimeAUtiliser`.

## 14. Pièges rencontrés

- Un widget lié à **Semis** reçoit un id de ligne de Semis avec `grist.onRecord`, pas un id de variété.
- « Sélectionner par » ne propose pas un widget personnalisé : utiliser `BroadcastChannel`.
- Au chargement, Grist envoie la 1re ligne de la table liée : à ignorer si on ne veut pas de pré-remplissage.
- Une accolade ou une flèche mal recopiée (`.catch(err =` suivi d'un saut de ligne) bloque tout le fichier JS.
- Une classe doit s'écrire pareil dans le CSS, le HTML et le JS (`sous-abri` ≠ `sousabri`).
- Vue reconstruit sa zone : un écouteur JS posé sur un élément de la zone est perdu.
- `class` et `:class` s'additionnent, alors que `className =` écrase tout.
- Une fonction appelée par le HTML doit être dans le `return` du `setup`, y compris celles qui viennent du commun.
- Une fonction du commun ne doit pas être redéfinie dans l'outil.
- Des blocs d'une consigne appliqués à moitié (`.clear()` oublié, filtre de `millesimeAUtiliser`, `?.` dans le tri) : appliquer chaque point, un par un.
- Après chaque modification : enregistrer les fichiers, pousser sur GitHub, puis recharger avec **Ctrl+Maj+R** (cache).
- Pour supprimer un nom, le chercher dans tous les fichiers (Ctrl+Maj+F), avec une forme précise (`.type`, `type:`) quand le mot est courant.
- Dans les notations données, « x » voulait dire « un nombre ».

## 15. Checklist de test après modification

1. Recharger (Ctrl+Maj+R) : aucune erreur rouge, aucun avertissement Vue dans la console.
2. Titre « À semer en Nov (n) » ; le mois en cours est sélectionné.
3. Changer de mois : titre et liste changent.
4. Case « déjà semées » : les cartes estompées apparaissent, le nombre du titre ne change pas.
5. Cases Sous abri et Pleine terre : filtrage correct, titre « (x sur N) », retour à « (N) » quand elles sont décochées.
6. Les trois tris réordonnent la liste sans erreur.
7. Variété avec plant (`1P.`, `2rhi`, `3c.`, `1b.`) : absente de la liste normale, présente grisée avec la case cochée.
8. Liserés : vert, marron, moitié-moitié ; pastilles et type (emoji d'abord) corrects.
9. « Semer » : la variété arrive dans semis réalisés avec son millésime et ses derniers semis.
10. Après un semis enregistré et « Actualiser » : la variété disparaît de la liste normale.
11. Sur tablette : le défilement ne déclenche pas « Semer ».
12. Tester aussi **Étiquettes** et **semis réalisés** après toute modification du commun.

## 16. Points que je n'ai pas pu vérifier

Ils reposent sur ce que tu m'as dit avoir fait seule, sans que j'aie revu les fichiers :
- `semis réalisés` utilise bien les cinq fonctions communes (je n'en avais vu qu'une version ancienne).