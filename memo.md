# Mémo : notions à comprendre (à cocher)

## HTML / CSS : structure et apparence

- [ ] **Quand créer un div** : un div pour chaque style différent ou chaque « contenant ». Un seul style sur un seul bloc de texte : une classe suffit, pas de div en plus.
- [ ] **Cadre + contenu = deux éléments imbriqués** : le cadre porte `cadre-info-a-jour`, le texte dedans porte `cadre-info-a-jour-titre`. Le texte est ajouté au cadre avec `cadre.appendChild(info)`.
- [ ] **Où modifier quoi** : l'apparence (couleur, taille, marge) se règle dans le CSS. Le contenu et la structure (quoi afficher, dans quoi) se règlent dans le JS, là où l'élément est créé.
- [ ] **Élément unique ou répété** : un élément unique et toujours présent s'écrit dans le HTML et le JS le remplit. Un élément répété pour chaque ligne est créé par le JS (`createElement`).
- [ ] **`className = '...'` écrase** toutes les classes déjà présentes. `classList.add('...')` en ajoute une sans enlever les autres.
- [ ] **Deux classes sur un élément** (`class="champ champ-etiquettes"`) : les deux styles s'appliquent. La règle `.champ.champ-etiquettes` (collée) vise un élément qui a les deux classes et est plus prioritaire que `.champ` seul.
- [ ] **Sélecteur avec espace** (`.semis-texte .cadre-info-a-jour`) : vise le cadre seulement quand il est à l'intérieur de `.semis-texte`.
- [ ] **Les variables CSS** (`var(--orange-clair)`) : définies une fois dans `:root` de `gestion_commun.css`, utilisables partout. Changer la valeur à un endroit change toute l'appli.
- [ ] **Ordre des feuilles de style** : le commun d'abord, le spécifique ensuite, qui peut ainsi corriger le commun.
- [ ] **`display: flex`** : place les enfants côte à côte (texte à gauche, champ à droite). `align-items: center` les centre verticalement, `justify-content: space-between` les écarte.
- [ ] **`inline-block`** : un bloc qui prend seulement la largeur de son contenu (cadre bleu), au lieu de s'étirer sur toute la ligne.
- [ ] **`position: sticky; bottom: 0`** : l'élément reste collé en bas de l'écran pendant le défilement (barre flottante).
- [ ] **L'attribut `hidden` et le CSS** : un `display` écrit dans une règle peut l'emporter sur `hidden`. La règle `[hidden] { display: none !important; }` force `hidden` à fonctionner.

## JavaScript : fonctionnement

- [ ] **`textContent`** : met du texte brut dans un élément, sans risque. On évite `innerHTML` pour du texte venant des données.
- [ ] **`createElement` puis `append` / `appendChild`** : on fabrique l'élément, on règle sa classe et son texte, puis on l'accroche dans son parent.
- [ ] **Redessiner la liste ou seulement une partie** : redessiner tout un champ en cours de frappe lui fait perdre le focus. C'est pourquoi on ne redessine que la section « En cours » à chaque saisie.
- [ ] **Écouteur sur le parent** (`liste.addEventListener('input', ...)` avec `e.target.closest(...)`) : un seul écouteur sur la liste gère toutes les lignes, y compris celles créées après.
- [ ] **`recordsParId` (Map)** : dictionnaire qui retrouve une ligne par son id, sans parcourir toute la liste.
- [ ] **`brouillons` : écran seulement** : la liste des saisies non enregistrées. Rien n'est écrit dans Grist avant le clic sur Enregistrer. La ✕ ne touche que cette liste.
- [ ] **Relire avant d'écrire** : `enregistrerTout` recharge Semis avant de calculer `Nb_etiquettes + saisie`, pour partir de la valeur réelle (l'impression a pu la remettre à 0).
- [ ] **`async` / `await` / `.then`** : la lecture et l'écriture dans Grist prennent du temps. `await` attend la fin avant de continuer.
- [ ] **`IntersectionObserver`** : surveille si la section « En cours » est visible à l'écran. Il sert à cacher ou montrer le bouton orange flottant.
- [ ] **Où coller un morceau de code** : les fonctions utilitaires vont dans `// ===== Utilitaires =====` (ex. `dateAffichee`). Un doublon d'un même nom de fonction cause des comportements étranges.

## Grist

- [ ] **`fetchTable` vs `onRecords`** : `fetchTable` lit toute la table à la demande et donne les colonnes formules sans mapping. Les autres outils fonctionnent ainsi, donc celui-ci aussi.
- [ ] **`requiredAccess: 'full'`** : obligatoire pour écrire. Grist n'a pas de droit « écriture sur une seule table ».
- [ ] **Colonne ChoiceList** : Grist la stocke `['L', 'a', 'b']`. `listeChoix()` retire le `'L'`. À l'écriture, on remet `['L', ...]`.
- [ ] **Dates** : Grist stocke une date en secondes depuis 1970. `dateAffichee()` convertit en JJ/MM/AAAA pour l'écran.
- [ ] **Colonnes formules sur Semis** (`Plante_mere`, `Annee_plantation_mil`, `Nom`…) : elles arrivent déjà calculées dans `fetchTable`, aucune autre table à lire.

## Méthode de travail et pièges

- [ ] **Le cache** : après modification, Grist peut garder l'ancien JS/CSS. Faire Ctrl + Maj + R, ou mettre `?v=2`, `?v=3`… dans les URL des fichiers (surtout sur tablette).
- [ ] **Dev puis prod** : on teste en dev, puis on recopie en prod. La prod n'est jamais le lieu des essais.
- [ ] **Un test après chaque étape** : si quelque chose casse, on sait quelle modification en est la cause.
- [ ] **Console du navigateur (F12)** : voir les erreurs rouges et les `console.log`. Premier réflexe quand « rien ne se passe ».
- [ ] **Faire une copie avant un gros nettoyage** (`.bak`) pour pouvoir revenir en arrière.

