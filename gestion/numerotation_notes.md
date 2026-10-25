# Granothèque Grist : outil « Numérotation »

Widget personnalisé (HTML/JS/CSS) pour attribuer les numéros d'épingle (`Num_epingle`) aux variétés sans numéro, en comblant d'abord les trous.

## 1. Fichiers

| Fichier | Rôle |
|---|---|
| `numerotation.html` | Structure de la page |
| `../script/numerotation.js` | Logique (lecture, analyse, attribution, sauvegarde) |
| `../styles/numerotation.css` | Mise en forme |

Hébergement : GitHub Pages.

## 2. Configuration dans Grist

- Widget **Personnalisé** lié à la table **Varietes**.
- Accès : **Complet** (`requiredAccess: 'full'`), car l'outil écrit dans la table.
- Colonnes à associer dans le panneau du widget :
  - `NomVariete` (Text)
  - `Num_epingle` (Numeric)
  - `Lettre` (Text)

## 3. Fonctionnalités

- **Résumé** d'une ligne : nombre de variétés lues, numéros valides distincts, sans numéro, invalides.
- **Bloc d'analyse repliable** (fermé par défaut) : numéro max, liste des trous, prochain numéro, doublons, numéros invalides.
- **« ⚠ Attention (N) »** rouge dans le titre du bloc s'il y a au moins un doublon ou un numéro invalide (N = numéros en doublon + variétés invalides).
- **Prochain numéro proposé** : premier trou entre 1 et le max, sinon max + 1. Il tient compte des attributions en attente.
- **Liste des variétés sans numéro** :
  - tri alphabétique (français) ;
  - recherche en direct, insensible à la casse et aux accents ;
  - 200 lignes affichées au maximum, avec compteur.
- **Attribution manuelle** : un clic sur une variété lui attribue le prochain numéro, en attente (rien n'est écrit dans Grist).
- **Attributions en attente** : liste triée par numéro, bouton « Annuler » par ligne, bouton « Tout annuler ».
- **Sauvegarde** : bouton « Sauvegarder dans Grist ». Écrit `Num_epingle` et vide `Lettre` pour toutes les variétés en attente, en un seul envoi.
- **Statut** en haut à droite : « À jour » (vert) ou « Non sauvegardé » (rouge).
- **Mise à jour en direct** : toute modification faite dans Grist recalcule l'analyse et la liste.

## 4. Règles métier

- Un numéro est **valide** s'il est un entier ≥ 1.
- Une cellule est **vide** si elle vaut `null`, `undefined` ou `''` : la variété est candidate à un numéro.
- Toute autre valeur (0, décimal, négatif, texte) est **invalide** : signalée, jamais corrigée, absente de la liste d'attribution.
- Les **doublons** sont signalés, jamais corrigés automatiquement.
- Les numéros existants ne sont **jamais modifiés** (l'épingle physique est liée à son numéro).
- `Lettre` est vidée uniquement pour les variétés qui reçoivent un numéro.

## 5. Choix techniques

- Conventions : variables en français, état global en haut du fichier, `majStatut()` pour « non sauvegardé », `recordsParId` (Map) pour retrouver les lignes, événements `pointerup` (PC et tablette).
- **État global** :
  - `recordsParId` : id Grist → ligne
  - `attributions` : Map id → numéro attribué (en attente)
  - `analyse` : résultat de `analyserNumeros()`
  - `texteRecherche`
  - `nonSauvegarde`
  - `enCours` : écriture en cours
  - `colonnes` : noms réels des colonnes associées (`mappings`)
  - `LIMITE_LISTE = 200`
- **Fonctions principales** :
  - `analyserNumeros()` : max, trous, doublons, invalides, sans numéro
  - `calculerProchain()` : prochain numéro libre, attributions en attente incluses
  - `nettoyerAttributions()` : retire les attributions devenues incohérentes après un changement externe dans Grist
  - `afficherAnalyse()`, `afficherListe()`, `afficherAttentes()`, `afficherMessage()`
  - `sauvegarder()`
- **Contrôles avant écriture** (dans `sauvegarder`) :
  1. les attributions sont toujours cohérentes avec Grist (sinon elles sont retirées et un message rouge s'affiche) ;
  2. pas deux fois le même numéro, et uniquement des entiers ≥ 1.
- **Écriture** : `grist.docApi.applyUserActions` avec une action `BulkUpdateRecord`, à partir de `grist.selectedTable.getTableId()` et des noms de colonnes reçus dans `onRecords(records, mappings)`.
- **Affichage** : construction du DOM avec `textContent` / `createElement` (pas de `innerHTML`).

## 6. Pièges rencontrés

- `grist.selectedTable.update([...])` avec `mapColumnNamesBack` a donné l'erreur `Invalid column "id"`. Solution retenue : `applyUserActions` + `BulkUpdateRecord`.
- Si `Lettre` n'est pas vidée après sauvegarde, vérifier que les 3 colonnes sont bien associées.
- Si le nombre de variétés lues est inférieur à celui de la table, vérifier qu'aucun filtre sur la vue ne masque des lignes.
- `Ctrl+Z` dans Grist annule une sauvegarde faite par l'outil.

## 7. Décisions : ce qui n'a pas été fait (volontairement)

- Pas d'alerte à la fermeture avec des attributions non sauvegardées.
- Pas de confirmation avant sauvegarde (l'annulation est possible avant).
- Pas de changement sur la présentation des doublons (hors « ⚠ » dans le titre du bloc).

## 8. Ce qui reste à faire

- [ ] **Test au doigt sur tablette après la mise en prod** : vérifier qu'un défilement de la liste ne déclenche pas une attribution par erreur.
  - Si le problème apparaît : mémoriser la position au `pointerdown` et n'attribuer au `pointerup` que si le déplacement est inférieur à environ 10 px.
- [ ] Volume : jusqu'à 251 numéros au départ, à surveiller si la liste grossit (limite d'affichage actuelle : 200 lignes).

## 9. Idées possibles pour plus tard

- Choisir soi-même le numéro (par exemple en cliquant sur un trou précis) au lieu du seul prochain numéro.
- Afficher des informations complémentaires (`Type`, `Nom`) dans la liste.
- Attribution automatique en lot (non retenue au départ).