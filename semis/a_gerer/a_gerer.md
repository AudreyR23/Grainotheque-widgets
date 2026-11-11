# Granothèque : outil « semis_gestion »

## 1. Rôle

Widget Grist personnalisé (HTML/JS/CSS) qui remplace la vue Grist « à gérer ».
Il sert à :
1. noter la germination des semis dont la durée de germination est dépassée ;
2. noter les plantations (plantés, oups, dons) et leur emplacement.

Usage : PC et tablette, pas d'impression.

## 2. Fichiers

| Fichier | Rôle |
|---|---|
| `semis_gestion.html` | Structure de la page, fenêtre de confirmation |
| `../styles/semis_gestion.css` | Styles |
| `../script/main_semis_gestion.js` | Toute la logique |

Accès demandé : `grist.ready({ requiredAccess: 'full' })`. Il est nécessaire pour écrire dans `Semis` et pour lire les métadonnées (`_grist_Tables`, `_grist_Tables_column`) qui donnent la liste des emplacements.

**Attention au HTML :** l'en-tête doit rester exactement `<header><h1>…<span id="compteurs"></span></h1><span id="statut"></span></header>`. Une modification abîmée a déjà fait disparaître le statut et le bouton « Enregistrer tout ».

## 3. Données

Table utilisée : **Semis** uniquement (pas de chargement de `Varietes` ni de `Millesimes`).

**Colonnes lues** (les formules arrivent déjà calculées avec `fetchTable`) :
`Nom`, `Variete`, `Date_s`, `Nb_godets`, `Nb_graines`, `Graines_semees`, `Germes`, `Germination_duree`, `Jours_ecoules`, `Info_germination`, `Plantes`, `Oups`, `Don_p`, `Reste_a_planter`, `Plante_mere`, `Ou`.

**Colonnes écrites :** `Germes`, `Plantes`, `Oups`, `Don_p`, `Date_p`, `Ou`.

## 4. Fonctionnalités

### En-tête
- Titre « Semis à gérer » avec compteur « n à vérifier · n à planter ».
- Statut : `✓ À jour` ou `● Non sauvegardé (n)`.
- Champ de recherche : filtre les deux listes par nom ou variété. Les accents et les majuscules sont ignorés, plusieurs mots sont acceptés. Les saisies en cours sur les lignes masquées sont conservées et enregistrées.

### Section « À vérifier »
- Lignes où `Germes` est vide **et** `Info_germination` est un nombre (durée de germination dépassée).
- Tri : du plus en retard au moins en retard.
- Par ligne : champ « Germes » et bouton « NG » (met 0 ; un second clic annule).
- Avertissement orange, non bloquant, si germes > graines semées.

### Section « À planter »
- Lignes où `Germes > 0`, `Reste_a_planter > 0` et pas plante mère.
- Tri : du plus ancien au plus récent.
- Détail affiché : semé le · germes · déjà planté · Où (si renseigné) · oups · don · reste.
- Par ligne : champs « Plantés », « Oups », « Don », bouton « Tout » (met tout le reste dans « Plantés »), sélecteur « Où » (pastilles et recherche).
- Date de plantation commune en haut de la section.
- Avertissement orange si plantés + oups + don > reste.

### Règles sur « Où »
- `Ou` vide dans Grist et « Plantés » > 0 : emplacement **obligatoire**, enregistrement refusé avec message rouge.
- `Ou` déjà rempli : emplacement **facultatif**. Sans nouvel emplacement, une fenêtre de confirmation liste les lignes et leur emplacement actuel (Valider / Annuler).
- Les nouveaux emplacements sont **ajoutés** aux anciens, sans doublon.
- Oups ou Don seuls : aucun contrôle sur `Ou`.

### Enregistrement
- Un seul bouton « Enregistrer tout », collant en bas de l'écran, visible seulement s'il y a des saisies.
- Un seul `applyUserActions` : `BulkUpdateRecord` pour les germes, un `UpdateRecord` par plantation.
- Les quantités saisies sont **ajoutées** aux valeurs existantes de Grist (pas de remplacement).
- `Date_p` est écrasée par la date choisie, seulement si « Plantés » > 0 (une seule `Date_p` par semis).
- En cas d'échec : message rouge, saisies conservées.
- Après succès : rechargement de `Semis` et réaffichage des deux listes.

## 5. Choix techniques

- **État global en haut du fichier**, noms de variables en français.
  - `brouillons` : germes en attente `{ idSemis, germes }`
  - `plantations` : plantations en attente `{ idSemis, plantes, oups, don, ou }`
  - `ouParSemis` : Map idSemis → emplacements choisis
  - `recordsParId.semis` : Map des lignes chargées
  - `LIEUX` : choix de la colonne `Ou`, lus dans Grist
  - `recherche`, `enregistrementEnCours`, `modifie`
- **Brouillon = ligne bleue** (pas de liste séparée « à enregistrer », contrairement à `semis_realises`). `majStatut()` calcule `modifie` à partir de `brouillons` + `plantations`.
- **`tableEnLignes()`** transforme le format colonnes de `fetchTable` en tableau de lignes.
- **ChoiceList Grist** : format `['L', 'a', 'b']`, converti avec `listeChoix()` ; à l'écriture : `['L', ...valeurs]`.
- **Dates Grist** : secondes UTC à minuit (`dateEnSecondes`, `dateAffichee`).
- **Délégation d'événements** sur les `<ul>` (une seule écoute par liste, pas par ligne).
- **Listes déroulantes « Où »** : `mousedown` bloqué pour que le champ garde le focus ; sélection au `click` (un défilement tactile ne sélectionne rien).
- **Fenêtre de confirmation dans la page** (pas `confirm()`) : les navigateurs bloquent souvent `confirm()` dans un widget Grist.
- **Quantités en « à ajouter »** : choix assumé. Les corrections se font directement dans Grist (option A retenue).
- Les calculs de germination, de reste et de plante mère restent dans les formules Grist ; l'outil ne les recalcule pas.

## 6. Limites connues

- Un semis sans `Duree_germ` dans `Varietes` n'apparaît jamais dans « À vérifier » (`Info_germination` vaut `""`).
- Les plantes mères apparaissent encore dans « À vérifier » (exclues seulement de « À planter »).
- Pas de correction d'une valeur déjà enregistrée depuis l'outil.
- Pas d'écoute des changements faits ailleurs dans Grist : recharger le widget pour voir des données modifiées.
- Si `Graines_semees` vaut 0 (godets ou graines vides), aucun avertissement de germes excessifs.
- Si la lecture des emplacements échoue, `LIEUX` reste vide et un message s'affiche en bas de page.

## 7. Reste à faire

**Ménage du code (quand les chiffres sont confirmés) :**
1. Dans `afficherVerifier()`, supprimer `const enAttente = …` et le `message.textContent = …` de contrôle, en gardant `majCompteurs();` et le `<p id="message">` (il affiche « Erreur de chargement »).
2. Supprimer le `console.log('Exemple semis :', …)` de l'initialisation.
3. Supprimer le commentaire obsolète `// utilisé à l'étape 2` à côté de `let brouillons`.
4. Supprimer le champ `jours` de `chargerSemis()` (inutilisé).

**Idées non retenues ou facultatives :**
- Regroupement par date de semis : abandonné.
- Retirer les plantes mères de « À vérifier » si elles n'ont pas à être suivies en germination.
- Signaler les semis sans durée de germination.
- Bouton « Corriger » (remplacement des valeurs) si les erreurs de saisie deviennent fréquentes.

## 8. Tests de non-régression

1. Les compteurs et les titres de sections correspondent aux vues Grist filtrées.
2. Germes puis NG, avertissement si germes > semées, enregistrement, vérification dans Grist.
3. Plantation partielle : la ligne reste avec « déjà planté » mis à jour ; plantation du reste : la ligne disparaît.
4. `Ou` vide : erreur rouge. `Ou` rempli sans ajout : fenêtre de confirmation. Avec ajout : `Ou` contient l'ancien et le nouveau.
5. Recherche qui masque une ligne en brouillon, puis enregistrement : le brouillon est bien enregistré.
6. Le statut et le bouton « Enregistrer tout » apparaissent et disparaissent avec les saisies.