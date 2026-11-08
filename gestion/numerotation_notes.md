# Granothèque Grist : outil « Numérotation »

Widget personnalisé (HTML/JS/CSS) pour attribuer les numéros d'épingle (`Num_epingle`) aux variétés sans numéro, en comblant d'abord les trous.

## 1. Fichiers

| Fichier | Rôle |
|---|---|
| `numerotation.html` | Structure de la page |
| `../script/numerotation.js` | Logique (lecture, analyse, attribution, sauvegarde) |
| `../styles/gestion_commun.css` | CSS commun à tous les outils |
| `../styles/numerotation.css` | CSS propre à cet outil (3 règles) |

Hébergement : GitHub Pages.

## 2. Configuration dans Grist

- Widget **Personnalisé** lié à la table **Varietes**.
- Accès : **Complet** (`requiredAccess: 'full'`), car l'outil écrit dans la table.
- Colonnes à associer dans le panneau du widget :
  - `NomVariete` (Text)
  - `Num_epingle` (Numeric)
  - `Lettre` (Text)

## 3. Fonctionnement (état actuel)

Page plate, sans cadres, sur le modèle de « Semis réalisés ». De haut en bas :

1. **Anomalies** (label + cadre `cadre-info-a-jour`) : visible uniquement s'il y a des doublons ou des numéros invalides, sinon masqué en entier.
   - Titres « ⚠ Doublons (N) » / « ⚠ Numéros invalides (N) » : `.cadre-info-a-jour-titre` (bleu, gras).
   - Lignes de détail : `.cadre-info-a-jour-alerte` (rouge, gras).
2. **Prochain numéro à attribuer** : pastille orange (`.pastille`) ajustée à son contenu, sans croix. Affiche `N° 197`, ou `N° 252 (nouveau)` quand il n'y a plus de trou (max + 1).
3. **Variété sans numéro** : champ de recherche + liste déroulante flottante (`.liste-choix`) :
   - fermée tant que rien n'est tapé ;
   - recherche insensible à la casse et aux accents ;
   - tri alphabétique (français), 40 résultats au maximum, puis « … N autres, précise ta recherche » ;
   - un clic sur une variété lui attribue le prochain numéro **en attente** ; le champ est vidé et garde le focus pour enchaîner.
4. **Message** (`#message`) : masqué par défaut. Cadre bleu (`succes`) après sauvegarde, texte rouge (`erreur`) en cas de problème.
5. **À enregistrer (N)** : section masquée quand elle est vide. Une ligne orange par attribution (`N° 12 : Nom`) avec un ✕ pour la retirer, puis le bouton bleu « Enregistrer ».
6. **Statut** en haut à droite : « ✓ À jour » ou « Non sauvegardé ».

Mise à jour en direct : toute modification faite dans Grist recalcule les anomalies et la liste.

## 4. Règles métier

- Numéro **valide** : entier ≥ 1.
- Cellule **vide** : `null`, `undefined` ou `''` → la variété est candidate à un numéro.
- Toute autre valeur (0, décimal, négatif, texte) est **invalide** : signalée dans les anomalies, jamais corrigée, absente de la liste d'attribution.
- Les **doublons** sont signalés, jamais corrigés.
- Les numéros existants ne sont **jamais modifiés** (l'épingle physique est liée à son numéro).
- `Lettre` est vidée uniquement pour les variétés qui reçoivent un numéro.
- Prochain numéro : premier trou entre 1 et le max, sinon max + 1. Il tient compte des attributions en attente (jamais deux fois le même numéro).

## 5. Choix techniques

- Conventions : variables en français, état global en haut du fichier, `majStatut()` pour « non sauvegardé », `recordsParId` (Map).
- **Événements en `click`** (et non `pointerup`) : un défilement au doigt dans la liste ne déclenche aucune attribution. Même choix que « Semis réalisés ».
- `mousedown` bloqué sur la liste (`preventDefault`) : le champ garde le focus jusqu'au `click`. `blur` du champ : la liste se ferme.
- **État global** : `recordsParId`, `attributions` (Map id → numéro en attente), `analyse`, `texteRecherche`, `nonSauvegarde`, `enCours`, `colonnes` (mappings), `LIMITE_LISTE = 40`.
- **Fonctions** :
  - `analyserNumeros()` : retourne `parNumero`, `sansNumero`, `invalides`, `doublons`
  - `calculerProchain()` : prochain numéro libre, attributions en attente incluses
  - `nettoyerAttributions()` : retire les attributions devenues incohérentes après un changement externe dans Grist
  - `ajouterDiv(parent, texte, classe)` : crée une ligne `<div>` (remplace l'ancienne `ajouterLigne`)
  - `afficherAnalyse()` (anomalies), `afficherListe()` (pastille + liste déroulante), `afficherAttentes()`, `afficherMessage(texte, classe)`
  - `sauvegarder()`
- **Contrôles avant écriture** : (1) attributions toujours cohérentes avec Grist, sinon retirées avec un message rouge ; (2) pas de numéro en double, uniquement des entiers ≥ 1.
- **Écriture** : `grist.docApi.applyUserActions` avec `BulkUpdateRecord`, à partir de `grist.selectedTable.getTableId()` et des noms de colonnes reçus dans `onRecords(records, mappings)`.
- **Affichage** : DOM construit avec `textContent` / `createElement`.

## 6. Modifications depuis la première version

| Avant | Maintenant |
|---|---|
| Résumé d'une ligne (`#resume`) | Supprimé |
| Bloc d'analyse repliable (max, trous) | Supprimé |
| « ⚠ Attention (N) » dans le titre du bloc | Bloc **Anomalies** (label + cadre commun) |
| Anomalies avec CSS spécifique | Classes communes `cadre-info-a-jour-titre` / `-alerte` |
| `ajouterLigne` (balises `<p>`) | `ajouterDiv` (balises `<div>`) |
| Compteurs (« N variétés sans numéro ») | Supprimés volontairement |
| Liste intégrée à la page, toujours visible | Liste déroulante flottante, ouverte à la saisie |
| Bouton « Tout annuler » | Supprimé (reste le ✕ par ligne) |
| Prochain numéro en cadre pleine largeur | Pastille ajustée au contenu |
| Bouton « Sauvegarder dans Grist » | Bouton « Enregistrer » (`btn-large`) |
| Événements `pointerup` | Événements `click` |
| Champ de recherche conservé après attribution | Champ vidé, focus conservé |
| `analyserNumeros` calculait max, trous, prochain | Ne garde que ce qui sert |

## 7. Impact sur `gestion_commun.css`

Modifications faites dans le fichier commun pendant ce travail :

- **`.btn:focus-visible`** : corrigé (c'était `.button:focus-visible`, qui ne ciblait rien). **Effet sur tous les outils** : un contour vert apparaît désormais au focus clavier des boutons.
- **`.pastille`** : `border-radius` passé à 6px (16px avant). **Effet sur « Semis réalisés »** : les pastilles « Où » sont aussi moins arrondies. À vérifier si c'est voulu.
- **`.carte`, `.carte h2`, `.carte-alerte`** : ajoutés puis retirés. Vérifier qu'il n'en reste rien.
- **`.liste-choix.integree`** : ajouté puis devenu inutile. **À supprimer** s'il est encore dans le fichier.

Dépendances à connaître :

- `.liste-choix` est en `position: absolute` : elle doit **toujours** être dans un parent `.champ-liste` (`position: relative`).
- Les messages utilisent `.info`, `.succes`, `.erreur`. La classe `.message` n'est **pas** utilisée ici.
- Les anomalies dépendent maintenant de `.cadre-info-a-jour`, `-titre` et `-alerte` : toute modification de ces classes change aussi cet outil.

## 8. CSS de `numerotation.css`

```css
#fiche label { margin-top: 12px; }
#anomalies { margin: 10px 0; }
#prochain { cursor: default; }
```

Raison de chaque règle : espace au-dessus des labels de la fiche ; espace autour du bloc d'anomalies ; pastille non cliquable (`.pastille` a `cursor: pointer`).

Option si une ligne de doublon déborde sur mobile : `#anomalies-contenu { word-break: break-word; }`.

## 9. Éléments de `gestion_commun.css` non utilisés par Numérotation

À **conserver** : ils servent aux autres outils.

**Classes**
- `.champ-select` et `.champ-select::after`
- `.liste-choix li.selection`
- `.liste-choix.integree` et ses règles `li` (à supprimer)
- `.saisie`
- `.brouillon-detail`
- `.btn-ajouter` et `.btn-ajouter:active`
- `.btn-annuler`
- `.btn-valider`
- `.case` et `.case input`
- `.message`
- `.deux-colonnes` et `.une-colonne`
- `.cadre-info-a-jour-ligne`, `-plantemere`
- `.cadre-info`
- `.confirmation`, `.confirmation-boite`, `.confirmation-boutons`
- `.compteurs`
- `.liste-semis`

**Variables**
- `--sousabri-clair/moyen/fonce`
- `--pleineterre-clair/moyen/fonce`
- `--recap-clair/moyen/fonce/moyen2`
- `--plantemere`
- `--blanc`

**Utilisés par Numérotation** : base (`body`, `header`, `h1`, `h2`, `label`, `*`), `.statut`, `.champ` (+ `:focus`), `.champ-liste`, `.liste-choix` (+ `li`, `li:hover`, `li.vide`), `.liste-brouillons`, `.brouillon`, `.btn`, `.btn-large`, `.btn:disabled`, `.btn-enregistrer`, `.btn:focus-visible`, `.btn-suppr`, `.info`, `.succes`, `.erreur`, `.cadre-info-a-jour`, `.cadre-info-a-jour-titre`, `.cadre-info-a-jour-alerte`, `.pastilles`, `.pastille`, `[hidden]`.

## 10. Pièges rencontrés

- `grist.selectedTable.update([...])` avec `mapColumnNamesBack` : erreur `Invalid column "id"`. Solution : `applyUserActions` + `BulkUpdateRecord`.
- **Supprimer un élément du HTML sans nettoyer le JS** fait planter la fonction (`Cannot set properties of null`) : la liste ne s'ouvrait plus après la suppression de `#compteur`. Après tout changement de HTML, vérifier chaque `getElementById`. Ids supprimés : `compteur`, `resume`, `alerte-titre`, `nb-anomalies`, `annuler-tout`, `bloc-analyse`.
- Deux fonctions du même nom dans un fichier JS : la seconde écrase la première sans erreur. Au collage d'une nouvelle version, supprimer l'ancienne.
- `<label for="…">` placé hors du bloc masqué : il reste affiché. Le label doit être dans le conteneur qu'on masque.
- Deux éléments avec le même `id` : le JS ne manipule que le premier.
- `Ctrl+Z` dans Grist annule une sauvegarde faite par l'outil.
- Si `Lettre` n'est pas vidée après sauvegarde, vérifier que les 3 colonnes sont associées.

## 11. Reste à faire

- [ ] Supprimer l'ancienne `afficherAnalyse` (avec `ajouterLigne`) restée dans le JS.
- [ ] **Test au doigt sur tablette après la mise en prod** : faire défiler la liste déroulante, aucune attribution ne doit se déclencher.
- [ ] Facultatif : effacer le message de succès dès la prochaine attribution (`afficherMessage('');` dans l'écouteur `click` de la liste, après `nonSauvegarde = true;`).
- [ ] Supprimer `.liste-choix.integree` du CSS commun s'il y est encore.
- [ ] Vérifier l'arrondi des pastilles dans « Semis réalisés ».
- [ ] Facultatif : passer les couleurs en dur de `.btn-annuler` et `.btn-valider` en variables CSS.

## 12. Idées possibles pour plus tard

- Choisir soi-même le numéro (par exemple en choisissant un trou précis).
- Afficher des informations complémentaires (`Type`, `Nom`) dans la liste.
- Réafficher max et trous dans un bloc repliable si le besoin revient.
- Alerte à la fermeture avec des attributions non sauvegardées (écartée pour l'instant).