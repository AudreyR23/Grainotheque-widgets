# Granothèque : outil « Cahier »

> Dernière mise à jour : 26/10/2026

## 1. Rôle

Widget Grist personnalisé qui génère une **version papier du cahier de semis** :
un tableau A4 paysage regroupant, par variété, des informations issues de deux
tables Grist (`Varietes` et `Millesimes`). Lecture seule : l'outil ne modifie
jamais les données.

- Accès demandé : `full` (`grist.ready({ requiredAccess: 'full' })`)
- Usage : PC, avec impression
- Volume : environ 541 variétés

## 2. Fichiers

| Fichier | Rôle |
|---|---|
| `cahier.html` | Page du widget : bouton Imprimer, compteur, conteneur `#pages` |
| `../script/main_cahier.js` | Toute la logique (chargement, regroupement, rendu) |
| `../styles/main.css` | Styles **communs** au tableau, aux épingles et aux étiquettes |

Versions dev et prod hébergées sur GitHub.

## 3. Fonctionnement

### Chargement
1. Détection du contexte : `window.self !== window.top`. Hors Grist, un message
   d'aide s'affiche.
2. `grist.docApi.fetchTable('Varietes')` et `fetchTable('Millesimes')` en parallèle.
3. Les données sont chargées **une seule fois** (pas de `grist.onRecords`) :
   recharger le widget pour voir les modifications.

### Structures globales
- `varietesParNom` : variétés indexées par `"Nom\nVariete"`
- `varietesParId` : variétés indexées par l'id de ligne Grist
- `derniersRecords` : lignes de `Millesimes` (un sachet par ligne)

### Regroupement (`buildGrainesMap`)
- Une ligne de `Millesimes` = un sachet. Les sachets sont regroupés par variété
  (clé = nom complet `Nom\nVariete`).
- Gère les colonnes qui arrivent soit en **texte**, soit en **référence Grist**
  (nombre) grâce à `txt()` et à la recherche par id dans `varietesParId`.
- Les colonnes absentes ne plantent pas : `col(table, nom, i, def)` renvoie une
  valeur par défaut.

### Rendu (`render`)
1. Tri par type, puis nom, puis variété (`localeCompare` en `'fr'`).
2. Groupement par type : **un type ne partage jamais une page avec un autre**.
3. Pagination par `LIGNES_PAR_PAGE = 26`. Une variété à 1 sachet compte pour
   2 lignes, sinon 1 ligne par sachet.
4. Une `<div class="page-tableau">` par page, avec son propre en-tête.

### Colonnes affichées (dans l'ordre)
- **Haut de cellule, multi-sachets** (une ligne par sachet) : Orig., Sac.,
  Millésime, Sais., Qté, Germ.
- **Bas de cellule, infos de variété** (classe `info-bas`, petit et gris) :
  Nb.gr, Nb.go, Année.s, Date.s, Germé, Oups, Planté, Date.p, Où, Donné

> Attention : les libellés d'en-tête ne correspondent plus aux noms de classes
> CSS (ex. `col-profond` affiche « Nb.gr », `col-conservation` affiche « Donné »).
> Les classes viennent d'une ancienne version du tableau. Pour la correspondance,
> se fier à `makeHeader()` et `makeRow()`.

### Fonctions utilitaires
| Fonction | Rôle |
|---|---|
| `txt(v)` | Ne garde que les chaînes (ignore les références numériques) |
| `col(table, nom, i, def)` | Lit une colonne sans planter si elle n'existe pas |
| `fmtAnnee(v)` | Timestamp / date / texte, en année sur 4 chiffres |
| `fmtMois(v)` | Mois en abréviations courtes via la table `MOIS` |
| `fmtVal(v)` | Liste Grist en texte (retire l'élément `'L'`) |
| `avecUnite(v, sing, plur)` | Ajoute une unité à un nombre (affichage seul) |

## 4. Choix techniques

- **Affichage seulement** : tout