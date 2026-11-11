# Granothèque Grist : outil « À semer » (récapitulatif)

> Document de référence pour reprendre l'outil plus tard.
> État : fonctionnel et testé (10 novembre 2026). Visuel migré vers le CSS commun.

## 1. Rôle

Rappeler les variétés à semer **au mois choisi** (mois en cours par défaut) quand elles n'ont pas encore été semées dans leur période de semis. Un bouton « Semer » envoie la variété à l'outil **semis_realises** pour pré-remplir la saisie.

Usage : PC et tablette, lecture seule (À semer n'écrit rien dans les tables). Consultable sur téléphone via la vue Grist.

## 2. Fichiers et installation

| Élément | Détail |
|---|---|
| Widget À semer | `a_semer.html`, `a_semer.js` (hébergé sous `main_a_semer.js`), `a_semer.css` |
| CSS commun | `gestion_commun.css` (variables de couleur, boutons, champs, cadres, **carte**, **pastilles de catégorie**) |
| Ordre des feuilles | `gestion_commun.css` d'abord, `a_semer.css` ensuite |
| Hébergement | GitHub Pages (`audreyr23.github.io/Grainotheque-widgets/...`) |
| À semer, dans Grist | Données : **Varietes**. « Sélectionner par » : vide. Accès : **full** |
| semis_realises, dans Grist | Données : **Semis**. « Sélectionner par » : vide |
| Placement | Les deux widgets doivent être **sur la même page** Grist |

Accès `full` : nécessaire car le widget lit plusieurs tables avec `grist.docApi.fetchTable`, même sans écrire.

## 3. Données lues

| Table | Colonnes utilisées |
|---|---|
| **Varietes** | `Nom`, `Variete`, `Type`, `Semis_sous_abris`, `Semis_pleine_terre` (ChoiceList de mois), `Annees_sans_test` |
| **Millesimes** | `NomVariete`, `Millesime` (date), `Epuise`, `Germination_affichee`, `Sachets`, `Qtte_graines` |
| **Semis** | `NomVariete`, `Date_s` |

Mois attendus dans les ChoiceList : `Jan, Fév, Mar, Avr, Mai, Jui, Juil, Aou, Sep, Oct, Nov, Déc` (comparaison sans accents ni majuscules).

Colonne **chargée mais plus utilisée** : `Deja_seme_cette_annee` (remplacée par le calcul sur la période de semis). À retirer du chargement au prochain ménage.

## 4. Fonctionnalités

### Liste « à semer »

Une variété s'affiche si :

1. le mois choisi est dans `Semis_sous_abris` ou `Semis_pleine_terre` ;
2. elle n'a pas de semis dans sa **période de semis** en cours (voir 5) ;
3. elle n'est pas déjà présente au jardin sous forme de plant, rhizome, caïeu ou bulbe (voir « Plants » ci-dessous) ;
4. elle a au moins un millésime utilisable (voir 6).

### Carte d'une variété

Chaque variété est une carte (même visuel que « À étiqueter ») :

- **Liseré à gauche**, sur toutes les cartes : vert (`--sousabri-moyen`) si sous abri, marron (`--pleineterre-moyen`) si pleine terre, **moitié vert (haut) / moitié marron (bas)** si les deux.
- **Nom** en gras, puis **pastilles** « Sous abri » (vert clair) et « Pleine terre » (beige).
- **Détails en gris** : millésime, germination, ancienneté du test, période de semis (ex. « semis Nov → Fév »).
- **Cadre bleu** (`cadre-info-a-jour`) pour « Déjà semée » et/ou « Plant au jardin ».
- **Bouton « Semer »** (style Enregistrer) à droite, centré verticalement.
- Une carte déjà semée (case cochée) est estompée (`opacity: .6`).

### Filtres et tri

- **Mois** : liste Jan → Déc.
- **Afficher aussi les déjà semées** : les ajoute, estompées.
- **Tri** : nom, germination (meilleure d'abord), plus longtemps sans test (« jamais testé » en tête).
- **Actualiser** : recharge les données Grist (à utiliser après un semis enregistré).

### Plants au jardin

Une ligne de Millesimes dont `Sachets` ressemble à **nombre + p / rhi / c / b** (ex. `1P.`, `2rhi`, `3c.`, `1b.`) compte comme matériel vivant déjà présent :

| Code | Mention dans le cadre bleu |
|---|---|
| `p` | Plant au jardin |
| `rhi` | Rhizome au jardin |
| `c` | Caïeux au jardin |
| `b` | Bulbe au jardin |

La variété est alors « déjà semée » (masquée par défaut). La ligne n'est pas proposée comme sachet de graines, sauf si elle a aussi une `Qtte_graines`. Sans graines, la carte affiche « pas de graines ».

Regex utilisée dans `typeDePlant` : `^\d+(p|rhi|c|b)\.?$`. `\d+` exige un nombre ; `\d*` accepterait aussi « b » ou « c » seuls.

### Sachet « Mél »

Sachet contenant plusieurs millésimes. Traité comme un millésime normal (la colonne `Millesime` contient une date). Si c'est la ligne choisie, la carte affiche « sachet mélangé (plusieurs millésimes) ».

### Bouton « Semer » vers semis_realises

Envoie l'id de la variété à semis_realises, qui la sélectionne dans sa fiche avec le millésime le plus récent et ses derniers semis. Ne crée aucun semis.

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

## 7. Choix techniques

- **Conventions** : variables en français, état global en haut du fichier, `recordsParId` (Maps), `fetchTable` pour lire.
- **`modifie` / `majStatut()`** : non utilisés, l'outil n'écrit rien.
- **Chargement** : `fetchTable` sur Varietes, Millesimes, Semis (tout en mémoire, recalcul à chaque affichage). Pas d'abonnement automatique : rafraîchissement seulement par « Actualiser ». Chaque Map est vidée (`.clear()`) avant rechargement.
- **Communication entre widgets** : `BroadcastChannel('granotheque-semer')`.
  - Le lien « Sélectionner par » de Grist n'a pas été retenu : il ne propose pas un widget personnalisé comme source.
  - L'essai par `setCursorPos` ne fonctionnait pas, et `grist.onRecord` aurait reçu des ids de Semis (widget lié à Semis).
  - `BroadcastChannel` marche entre widgets de **même origine** (même site GitHub Pages) et **chargés en même temps** (même page).
  - Avantages : pas de sélection automatique d'une variété au chargement, et ça marche aussi si on reclique sur la même variété.
- **Rendu** : DOM créé avec `createElement` et `textContent`.

### Classes communes de la carte (dans `gestion_commun.css`)

| Classe | Rôle |
|---|---|
| `.carte` | Conteneur : flex, centrage vertical, fond blanc, bordure grise |
| `.carte-texte` | Colonne de texte (prend la place restante) |
| `.carte-detail` | Détails en gris, petite taille |
| `.carte-mention` | Ligne sous le nom (pastilles ou texte coloré) |
| `.carte-action` | Élément à droite (bouton ou champ), ne se comprime pas |
| `.carte.sousabri`, `.carte.pleineterre`, `.carte.sousabri-pleineterre`, `.carte.plantemere` | Liseré de couleur |
| `.pastille-cat` + `.pastille-sousabri` / `.pastille-pleineterre` | Petites pastilles de catégorie |
| `.texte-plantemere` | Texte vert de la ligne « Plante mère » (pour À étiqueter) |

Classes propres à À semer (dans `a_semer.css`) : `#filtres`, `.champ-filtre`, `.carte.deja-semee`.

Noms volontairement distincts de `.badge` (carte dans À étiqueter, pastille dans l'ancien À semer) et de `.pastille` (lieux dans semis_realises).

### Côté À semer : envoi

```js
const canal = new BroadcastChannel('granotheque-semer');

document.getElementById('liste').addEventListener('pointerdown', e => {
  const btn = e.target.closest('.btn-semer');
  if (!btn) return;
  canal.postMessage({ varieteId: Number(btn.dataset.id) });
});
```

### Côté semis_realises : réception

```js
let donneesChargees = false;           // passe à true en fin d'initialisation

function varieteDemandee(id) {
  if (!id || !donneesChargees) return;
  if (recordsParId.varietes.has(id)) choisirVariete(id);
}

const canal = new BroadcastChannel('granotheque-semer');
canal.onmessage = e => varieteDemandee(e.data && e.data.varieteId);
```

## 8. Limites connues

1. **Sous abri / Pleine terre regroupés** dans le calcul « déjà semée » : un semis sous abri en mars compte aussi pour la fenêtre pleine terre si les mois se suivent. À séparer si une variété disparaît alors que tu voulais la semer aussi dans l'autre mode.
2. **Mois choisi = année en cours** : « Jan » regarde janvier de l'année en cours, donc la saison commencée en novembre de l'an dernier, pas janvier prochain.
3. **Plant sans graines** : la variété est masquée de la liste « à semer », même si on pourrait la multiplier ou la replanter.
4. **Rafraîchissement manuel** : après un semis enregistré dans semis_realises, cliquer sur « Actualiser » dans À semer.
5. **Reconnaissance des plants** : repose sur l'écriture exacte de `Sachets` (nombre + `p` / `rhi` / `c` / `b`). Une autre écriture n'est pas reconnue.
6. **Mobile** : deux widgets sur une page sont serrés sur téléphone ; le bouton « Semer » n'a pas été testé sur tablette ni sur téléphone.
7. **`pointerdown` sur le bouton Semer** : dans une liste qui défile, il se déclenche dès que le doigt se pose, donc aussi au début d'un défilement. À remplacer par `click` si ça gêne sur tablette.

## 9. Reste à faire / idées (rien d'obligatoire)

- [ ] **Tester sur tablette** (défilement, bouton Semer, taille des zones tactiles) et passer `pointerdown` en `click` si besoin.
- [ ] **Migrer « À étiqueter » vers les classes communes** (voir 11).
- [ ] **Export `.ics`** : bouton qui télécharge un événement par variété à semer (instantané, non mis à jour).
- [ ] **Rappel automatique** : script externe (API Grist, GitHub Actions) qui envoie la liste chaque mois. Chantier à part.
- [ ] **Séparer Sous abri / Pleine terre** dans le calcul « déjà semée » (limite 1).
- [ ] **Choisir une année** en plus du mois (limite 2).
- [ ] **Auto-actualisation** après un semis enregistré (au lieu du bouton).
- [ ] **Badge « À produire »** : écarté pour l'instant (colonne `En_production` de Varietes).
- [ ] **Colonne `En_production`** : à décocher à la main quand le nouveau sachet existe.

## 10. Nettoyage possible

- Dans **semis_realises** :
  - `varietePendante` est déclarée mais n'est plus utilisée (ainsi que le `if (varietePendante) ...` en fin d'initialisation).
  - `afficherControle` contient une ligne en double (« ignorés (sans date, hors « or. ») »).
  - Retirer les `console.log` de diagnostic.
- Dans **À semer** :
  - Retirer `dejaSemeCetteAnnee` du chargement des variétés.
  - Retirer le commentaire de `afficher()` « Ligne colorée » (il n'est plus vrai : ce sont des pastilles).
  - Remettre sur des lignes séparées `.filter(...);  if (candidats.length === 0) return null;` (collés par accident, sans effet sur le fonctionnement).
- Dans **gestion_commun.css** : retirer le doublon éventuel de `.erreur` et les commentaires de code mort (`.message.erreur`, `.message.ok`, `.alerte`) s'ils ne servent plus.

## 11. Migration de « À étiqueter » vers les classes communes (non faite)

| Dans le JS de À étiqueter | Remplacer par |
|---|---|
| `li.className = 'badge'` | `li.className = 'carte'` |
| `li.classList.add('plantemere')` | inchangé (`.carte.plantemere` existe dans le commun) |
| `'badge-texte'` | `'carte-texte'` |
| `'badge-detail'` | `'carte-detail'` |
| `mere.className = 'semis-plantemere'` | `mere.className = 'carte-mention texte-plantemere'` |

Ensuite, supprimer dans son CSS : `.badge`, `.badge-texte`, `.badge-detail`, `.badge.plantemere`, `.badge-plantemere`, `.badge-texte .cadre-info-a-jour`. Avant de supprimer, chercher chaque nom dans tous les fichiers (Ctrl+Maj+F).

Point à vérifier : le JS de À étiqueter utilise `semis-plantemere` alors que son CSS définit `.badge-plantemere`. La ligne verte s'affiche pourtant, donc une règle `.semis-plantemere` existe peut-être dans un autre fichier.

## 12. Journal des opérations

1. Création des fichiers de base (HTML, CSS, JS) : liste en lecture seule des variétés à semer au mois en cours.
2. Filtres : choix du mois, case « Afficher aussi les déjà semées », tri (nom, germination, ancienneté du test).
3. Bouton « Semer » : essai par `setCursorPos` (échec : widget lié à Semis, pas de lien possible), puis **`BroadcastChannel`** entre À semer et semis_realises. Ajout de `donneesChargees` et `varieteDemandee` côté semis_realises.
4. Correction d'une coquille de syntaxe en fin de fichier de semis_realises (`.catch(err =`).
5. **Période de semis** (`fenetreDeSemis`) pour gérer les saisons à cheval sur deux années, avec lecture de la table Semis.
6. **Plants au jardin** : `typeDePlant` (plant, rhizome, caïeu, bulbe), filtre dans `millesimeAUtiliser`, cadre bleu, tri sans plantage si pas de graines. Correction de la regex (le « x » désignait un nombre).
7. Sachet « Mél » : traité comme un millésime normal, avec mention « sachet mélangé ».
8. **Refonte visuelle** : carte commune (`.carte`) dans `gestion_commun.css`, liseré de couleur sur toutes les cartes, bouton « Semer » centré à droite avec le style Enregistrer, cadre bleu pour « Déjà semée » / « … au jardin », `a_semer.css` raccourci.
9. **Pastilles** « Sous abri » / « Pleine terre » (`pastille-cat`) dans le commun, avec correction du bug de classe (`badge` sans `sous-abri`).
10. **Liseré moitié vert / moitié marron** pour les variétés qui se sèment sous abri et en pleine terre (`.carte.sousabri-pleineterre`, dégradé net).

## 13. Pièges rencontrés (pour ne pas les refaire)

- Un widget lié à **Semis** reçoit un id de ligne de Semis avec `grist.onRecord`, pas un id de variété.
- « Sélectionner par » ne propose pas un widget personnalisé : utiliser `BroadcastChannel`.
- Au chargement, Grist envoie la 1re ligne de la table liée : à ignorer si on ne veut pas de pré-remplissage automatique.
- Une accolade ou une flèche mal recopiée (`.catch(err =` suivi d'un saut de ligne) bloque tout le fichier JS : console rouge, plus rien ne s'exécute.
- Une classe doit s'écrire pareil dans le CSS, le HTML et le JS (`sous-abri` ≠ `sousabri`) : sinon la règle ne s'applique jamais, sans erreur visible.
- Plusieurs blocs d'une consigne appliqués à moitié (`.clear()` oublié, filtre de `millesimeAUtiliser`, `?.` dans le tri) : appliquer chaque point, un par un.
- Après chaque modification : enregistrer les fichiers, pousser sur GitHub, puis recharger la page Grist avec **Ctrl+F5** (cache).
- Dans les notations données, « x » voulait dire « un nombre » : la regex vérifie `p`, `rhi`, `c`, `b` après un nombre.

## 14. Checklist de test après modification

1. Recharger (Ctrl+F5) : la console ne montre aucune erreur.
2. Mois en cours : la liste n'est pas vide, une variété déjà semée est absente.
3. Case « déjà semées » cochée : elles apparaissent estompées, avec le cadre bleu.
4. Variété avec plant (`1P.`, `2rhi`, `3c.`, `1b.`) : absente de la liste normale, présente avec la case cochée.
5. Les trois tris fonctionnent sans erreur.
6. Les liserés : vert (sous abri), marron (pleine terre), moitié-moitié (les deux) ; les pastilles correspondent.
7. « Semer » : la variété arrive dans semis_realises avec son millésime et ses derniers semis.
8. Après un semis enregistré et « Actualiser » : la variété disparaît de la liste normale.
9. Sur tablette : le défilement ne déclenche pas « Semer » par erreur.