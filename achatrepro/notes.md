# Outil Achat-repro (Granothèque Grist)

Dernière mise à jour : 23 octobre 2026. Version concernée : **dev** (pas encore copiée en prod).

## 1. Rôle

Ajouter rapidement des sachets de graines et des plantes mères vivaces dans la table `Millesimes`. L'entrée la plus utilisée est l'onglet **Millésime**. Les onglets **Variété** et **Espèce** servent à créer ce qui manque en amont, avec enchaînement automatique.

Usage : PC et tablette. Pas d'impression.

## 2. Fichiers

| Fichier | Rôle |
|---|---|
| `Achat_repro.html` | Structure : 3 panneaux, bandeaux, formulaires |
| `../script/main_achatrepro.js` | Toute la logique |
| `../styles/achatrepro.css` | Styles + bloc tactile |

Accès demandé : `grist.ready({ requiredAccess: 'full' })`.
Tables utilisées : `Modele`, `Varietes`, `Millesimes`, `Semis` (écriture), plus les métadonnées `_grist_Tables` et `_grist_Tables_column`.

## 3. Fonctionnalités

### Onglet Millésime
- Choix de la variété (le Type se charge tout seul, champ en lecture seule).
- Année du millésime **préremplie avec l'année en cours**, modifiable.
- **Origine** obligatoire : 6 étiquettes cliquables (les 6 premiers choix de la colonne `Origine` dans Grist) + un menu « Autres origines… » (une seule origine rare).
- Cases **Sachet** (cochée par défaut) et **Plante mère**, exclusives l'une de l'autre.
  - Sachet : champ *Quantité de graines* visible et obligatoire. `Sachets` = `1`.
  - Plante mère : champ *Année de plantation* visible et obligatoire. `Sachets` = `1p.`. Une ligne est aussi créée dans `Semis`.
- Nb saisons (`or.` par défaut).
- Contrôle : au moins Sachet ou Plante mère doit être coché.

### Détection de doublons (3 onglets)
Bandeau orange **en direct** + **confirmation** (« Créer quand même » / « Annuler ») au clic sur Créer.

| Onglet | Critère de doublon |
|---|---|
| Millésime | variété + année + origine + type de ligne (sachet ou plante mère) |
| Variété | Nom + Variété, sans casse, sans accents, espaces normalisés |
| Espèce | Nom, même normalisation |

Règle voulue : deux sachets = deux lignes (pas de fusion des quantités).

### Enchaînement automatique (case « Enchaîner automatiquement »)
Espèce → Variété : modèle présélectionné et champs remplis, Nom et Type repris, curseur dans « Variété ».
Variété → Millésime : variété présélectionnée, Type repris, année en cours, curseur sur l'origine.

### Tablette
Bloc `@media (pointer: coarse)` : cibles d'environ 44 px, police de 16 px (évite le zoom iPad), listes multiples plus hautes. `@media (max-width: 600px)` : formulaire sur une colonne. Le PC garde son affichage d'origine.

## 4. Choix techniques

- **Données** : `modeles` et `varietes` chargés au démarrage (`init`). `Millesimes` est relu par `fetchTable` à chaque vérification de doublon, donc toujours à jour.
- **Choix des listes** : lus dans les métadonnées Grist (`widgetOptions.choices`). Réordonner les choix dans Grist change l'affichage du widget sans toucher au code. C'est ainsi qu'on choisit les 6 origines favorites.
- **Format ChoiceList** : Grist attend `["L", ...valeurs]`. Les fonctions `getMultiSelect`, `getPills` et `getOrigines` ajoutent toujours le `"L"`. `cleOrigine()` le retire pour comparer.
- **Dates** : `Millesime` et `Date_s` sont en secondes depuis epoch, au 1er janvier en UTC. Comparaison avec `getUTCFullYear()`.
- **Bandeau plutôt que `confirm()`** : les fenêtres natives peuvent être bloquées dans l'iframe d'un widget Grist.
- **Détection en échec** : un échec de lecture (`fetchTable`) affiche un message rouge et **bloque** la création. Une erreur d'affichage du bandeau bloque aussi.
- **Anti-course** : `verifierDoublonEnDirect` utilise un compteur `verifEnCours` pour ignorer les réponses périmées.
- **`normaliser()`** : NFD + suppression des accents + minuscules + espaces réduits.
- **Valeurs de `Sachets`** : constante `VALEUR_SACHET = '1'` ; `'1p.'` écrit en dur pour les plantes mère.
- **Affichage conditionnel** : classe CSS `.cache` (`display:none !important`), pilotée par `majChampsMillesime(source)`.
- **Favoris d'origine** : constante `NB_FAVORIS = 6` dans `init()`.

### Fonctions principales (main_achatrepro.js)
`showPanel`, `goToPanel`, `buildPills`, `getPills`, `setPills`, `fillSelect`, `fillMultiSelect`, `getMultiSelect`, `getOrigines`, `majChampsMillesime`, `cleOrigine`, `trouverDoublonsMillesime`, `afficherAlerteDoublon`, `cacherAlerteDoublon`, `verifierDoublonEnDirect`, `normaliser`, `trouverDoublonsVariete`, `trouverDoublonsModele` (+ leurs `afficher…`, `cacher…`, `verifier…EnDirect`), `creerVariete(forcer)`, `creerMillesime(forcer)`, `creerModele(forcer)`, `reset…`, `init`.

### Branchements HTML à ne pas perdre
- `m-variete` : `onchange="chargerTypeMillesime(); verifierDoublonEnDirect()"`
- `m-millesime` : `oninput="verifierDoublonEnDirect()"`
- `m-origine-fav` : écouteur `change` ajouté dans `init`
- `m-origine-autre` : `onchange="verifierDoublonEnDirect()"`
- `m-sachet-check` : `onchange="majChampsMillesime('sachet')"`
- `m-plante-mere` : `onchange="majChampsMillesime('mere')"`
- `v-nom`, `v-variete` : `oninput="verifierDoublonVarieteEnDirect()"`
- `e-nom` : `oninput="verifierDoublonModeleEnDirect()"`
- Bandeaux : `#doublon-millesime`, `#doublon-variete`, `#doublon-modele`, chacun **dans son propre panneau**, juste avant son `btn-row`.

## 5. Pièges rencontrés

- Un bandeau placé dans le mauvais panneau reste invisible sans erreur.
- Les listes multiples ont `height:60px` en ligne : seul `!important` dans le CSS tactile peut le surcharger.
- Les messages RPC de la console Grist sont du bruit. Pour déboguer sans console, afficher un diagnostic dans `msg-millesime`.
- Si `init()` plante (par exemple référence à un élément HTML supprimé comme l'ancien `m-sachet`), toutes les listes restent vides.
- Un Type vide lors d'un test d'enchaînement donne l'impression que le transfert ne marche pas.

## 6. Procédure de passage en prod

1. Sauvegarder les trois fichiers prod actuels.
2. Vérifier qu'il ne reste aucun `DIAG` dans le JS.
3. Copier les trois fichiers dev vers prod.
4. Tester en prod : un sachet, une plante mère, un enchaînement espèce → variété → millésime.
5. Supprimer les lignes de test dans Grist.

## 7. Reste à faire / idées

- [ ] Passage en prod (voir section 6).
- [ ] Doublons de plante mère : comparer sur l'**année de plantation** plutôt que l'année du millésime, si l'usage le demande.
- [ ] Autres listes multiples (Famille, Nature du sol, Qualité du sol, Où cultiver, Infos, Semis GPT) : à transformer en étiquettes si la sélection au doigt devient pénible. Pour l'instant jugée acceptable.
- [ ] Supprimer la constante `SACHET` devenue inutile dans `init()`.
- [ ] Origine : une seule origine « rare » possible via le menu. Passer à plusieurs si besoin.
- [ ] Colonne `Sachets` : valeurs `1` et `1p.` (nom éventuellement à revoir). Garder `1p.` évite que `Epuise` marque une plante mère comme épuisée.
- Abandonné : fusionner la quantité dans un millésime existant (deux sachets = deux lignes, le second va à la boîte à dons).