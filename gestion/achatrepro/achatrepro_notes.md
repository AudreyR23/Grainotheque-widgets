# Outil Achat-repro (Granothèque Grist) — version Vue

Dernière mise à jour : 21 novembre 2026. Version concernée : **prod** (poussée le 20 novembre 2026, puis testée sur téléphone). La copie de test de la granothèque sert aux essais.
Outils liés : **Étiquettes sur sachets** (contrat en section 4) et **Semis réalisés** (écrit `Nb_sachets`). Outil de référence pour le style et les conventions : **À gérer**.

## 1. Rôle

Ajouter rapidement des sachets de graines et des plantes mères vivaces dans la table `Millesimes`. Trois onglets :

- **Nouveau millésime** (le plus utilisé, ouvert au démarrage) ;
- **Nouvelle variété** et **Nouvelle espèce**, pour créer ce qui manque en amont, avec enchaînement automatique espèce → variété → millésime.

L'onglet Millésime sait aussi **reprendre les sachets étiquetés** (étiquettes imprimées, sachets pas encore ajoutés dans `Millesimes`).

Usage : PC et tablette. Pas d'impression depuis cet outil.

## 2. Fichiers et données

| Fichier | Rôle |
|---|---|
| `achatrepro.html` | Structure : 3 panneaux, 5 composants (`<template id=…>`), un seul point de montage `#app` |
| `achatrepro_textes.js` | `TEXTES` : messages après une action (erreurs de saisie, confirmations, erreurs d'écriture) et libellés fabriqués par le code. Chargé avant `achatrepro.js` |
| `achatrepro.js` | Toute la logique (Vue 3.4.38 par unpkg) |
| `achatrepro.css` | Uniquement ce qui n'est pas dans le commun |
| `../../styles/styles_communs.css` | Styles communs (BEM) |
| `../../script/scriptcommun.js` | Fonctions communes |

Ordre des scripts dans le HTML : plugin Grist, Vue, `scriptcommun.js`, `achatrepro_textes.js`, `achatrepro.js`.

Accès : `grist.ready({ requiredAccess: 'full' })` (nécessaire aussi pour modifier les choix d'une colonne).

**Tables** (constantes en haut du JS) : `TABLE_ESPECES = 'Especes'` (anciennement `Modele`), `TABLE_VARIETES`, `TABLE_MILLESIMES`, `TABLE_SEMIS`. Un renommage dans Grist impose de changer la constante.

**Structure Grist attendue** :

| Table | Colonne | Remarque |
|---|---|---|
| `Especes`, `Varietes` | `Semis_profondeur` | **Texte** : nombre ou fourchette, sans l'unité (`1`, `1-2`, `0,5`) |
| `Especes`, `Varietes` | `Ou_semer` | Choix multiple, mêmes 5 choix dans les deux tables (anciennement `Semis_GPT`). Libellé du formulaire : « Où semer ». **Nom interne du champ dans le code : `semisGpt`** |
| `Millesimes` | `Nb_sachets` | **Numérique** (anciennement `Sachets`) : 1 pour un sachet, vide pour une plante mère |
| `Millesimes` | `Nb_plants` | Numérique : nombre de plants d'une plante mère (ajustable dans `a_gerer`) |
| `Millesimes` | `Type_plant` | Choix : type de plant d'une plante mère |
| `Millesimes` | `Nb_saisons_manuel` | Choix : `or.` puis 1 à 20 (à garder alignés avec `NB_SAISONS_MAX` ; une valeur hors liste est acceptée mais s'affiche en gris) |
| `Semis` | `Etiq_en_attente` | Numérique, **colonne de données** : sachets imprimés, pas encore ajoutés dans `Millesimes` |
| `Semis` | `Note_attente` | Texte, **colonne de données** (pas de formule) : libellé d'une ligne sans variété, saisi à la main dans Semis |
| `Semis` | `Germes_attente` | Booléen (utilisé par `a_gerer`) |

**Fonctions du commun utilisées** : `tableEnLignes`, `listeChoix`, `enListeChoix`, `normaliser`, `anneeDepuisDate`, `dateEnSecondes`, `lieuxFiltres`, `correspondRecherche`, `lireChoixColonnes`, `creerMessageTemporaire`, `libelle`, `pluriel`.

## 3. Fonctionnalités

### Onglet Millésime
- Variété (menu avec recherche, le Type s'affiche en lecture seule), Nb saisons (`or.` par défaut), année du millésime (année en cours par défaut).
- **Origine obligatoire, une seule au total** : les 6 premiers choix de `Origine` sont des pastilles (`NB_FAVORIS`), suivies d'un bouton « Autre origine » qui ouvre un panneau avec le menu des autres origines et **« ➕ Nouvelle origine… »**. Une seule valeur `etat.millesime.origine`, donc rien à synchroniser. Le nom de l'origine choisie dans le menu s'affiche sur le bouton, et le panneau se referme à chaque choix. Une nouvelle origine est ajoutée aux choix de `Millesimes.Origine` dans Grist et sélectionnée ; une origine déjà existante (casse ou accents près) est simplement sélectionnée.
- **Sachet** ou **Plante mère** (cases exclusives) :
  - Sachet : quantité de graines obligatoire (entier). `Nb_sachets` = 1, `Nb_plants` vide.
  - Plante mère : année de plantation, **nombre de plants** (entier ≥ 1), **type de plant** (si la colonne a des choix) et **emplacement(s)** (au moins un, menu avec recherche, pastilles violettes comme dans `a_gerer`), tous obligatoires. `Nb_plants` = nombre de plants, `Nb_sachets` vide.
- **Années** : 4 chiffres, de `ANNEE_MIN` (2000) à l'année en cours, pour l'année du millésime et l'année de plantation.
- **Convention « une ligne `Semis` par plante mère »** : créée avec `Plantes` = nombre de plants, `Ou` = emplacements, `Date_s` = 1er janvier de l'année de plantation, `Nb_etiquettes` = 0, sans godets ni graines renseignés (ils restent à 0, valeur par défaut de Grist). C'est ce qui permet à `a_gerer` de la reconnaître.
- `Controle_mere` et `Statut_mere` ne sont **jamais** écrits sur `Millesimes` : la plante est proposée au contrôle l'année suivante.
- **Doublon** (encart d'alerte en direct, à côté du bouton « Créer », avec « Créer quand même » et « Annuler », plus un contrôle à la création) : variété + année + origine + nature (sachet ou plante mère).
- Le bouton **« ↩ Réinitialiser »** est en haut de chaque panneau, à droite du titre.

### Décochage automatique de « À produire »
À la création d'un millésime, toutes les lignes `Semis` de la **même variété** dont `A_produire` est coché sont décochées (le besoin de produire est satisfait). Tous les types de millésime, sans filtre par origine. `Varietes.En_production` repasse à faux. Le message indique le nombre de semis concernés. La ligne `Semis` d'une plante mère est créée **après** ce décochage, donc jamais concernée.

### « Issu de mes étiquettes »
Principe : tu récoltes, tu remplis `Nb_etiquettes` dans Semis, tu imprimes, tu colles les étiquettes, **puis** tu ajoutes les sachets comme millésimes (un pour toi, le reste en `Don`). La case liste les lignes `Semis` dont `Etiq_en_attente` > 0 (menu à choix unique). Décochée : fonctionnement habituel (achats, réceptions).

| Type de ligne | Reconnaissance | Variété | Origine préremplie | Nb saisons préparé |
|---|---|---|---|---|
| Plante mère | millésime lié avec `Plante_mere` | verrouillée | `Monjardin` | année en cours − année de plantation + 1 |
| Vrai semis | `Date_s` renseignée | verrouillée | `Monjardin` | saisons du millésime source + 1 |
| Hors sachet, variété connue | pas de `Date_s`, variété renseignée | verrouillée | première origine du millésime « or. » de la variété | `or.` |
| **Graines à identifier** | **pas de variété** | **libre** | **aucune (à choisir)** | `or.` |

Le nouveau millésime est toujours un **sachet**. `Nb saisons` est borné entre 1 et `NB_SAISONS_MAX` (20), qui fixe aussi les entrées du menu.

- **Sachets réels** : prérempli avec le nombre d'étiquettes, à corriger si tu en as imprimé trop. `Don` = sachets réels − 1 (la colonne `Don` compte des **sachets**). Si sachets réels = 1, `Don` n'est pas écrit. La quantité de graines de **ton** sachet reste obligatoire.
- **Graines à identifier** : deux boutons, « Créer la variété » et « Créer l'espèce ». La note préremplit le nom (modifiable). Pendant ce trajet (`etat.parcoursLigne`), l'enchaînement est **forcé** jusqu'au millésime, même si « Enchaîner automatiquement » est décoché. À l'arrivée : variété présélectionnée, `or.`, sachets réels prérempli ; reste l'origine et la quantité.
- **Nettoyage à la création** : `Etiq_en_attente` est vidé ; la ligne est **supprimée** seulement si c'est une ligne de transit (ni `Date_s`, ni `Nb_graines`, ni `Nb_godets`, ni `Germes`, ni `Plantes`, et `Nb_etiquettes` ≤ 0). Un vrai semis ou la ligne d'une plante mère n'est jamais supprimé.
- Après une création, la case reste cochée et la liste est rechargée (dans `reinitialiserMillesime`).

### Onglets Variété et Espèce
- **Rien d'obligatoire sauf le nom.**
- Variété : modèle de base (menu avec recherche, copie les champs de l'espèce choisie, pas le nom), Nom + Variété, champs communs, Description. `NomVariete` = `Nom\nVariété` (ou `Nom` seul). `Num_epingle` est envoyé à `null` (vide, pas 0). Doublon sur Nom + Variété (sans casse ni accents).
- Espèce : mêmes champs sans Description, point de départ optionnel. Doublon sur le nom.
- **Champs communs** (composant `champs-culture`) : Type, Exposition, Arrosage, Conservation, Famille ; profondeur, durée et température de germination, mois de semis sous abri / pleine terre / récolte ; nature et qualité du sol, où cultiver, **où semer** ; Infos.
- **Contrôles des champs numériques** (messages d'erreur qui restent affichés jusqu'au prochain clic) : conservation et durée de germination = entiers ; profondeur = nombre ou fourchette, `1 cm` devient `1`, les tirets longs deviennent `-`, le point devient une virgule. Ces champs sont en texte : un champ numérique renverrait une valeur vide pour `abc`, sans erreur visible.
- **Listes de choix** : pastilles pour les mois, Famille, nature et qualité du sol, où cultiver, où semer (les choix vides de Grist sont ignorés). Menu avec recherche pour les **Infos**, avec **« ➕ Nouvelle info… »** : l'info est ajoutée aux choix de `Especes.Infos` **et** de `Varietes.Infos` (une variété créée à la suite d'une espèce reçoit ainsi ses infos) et sélectionnée.

### Enchaînement (case « Enchaîner automatiquement »)
- Espèce → Variété : espèce présélectionnée comme modèle (champs copiés), nom repris, curseur dans « Variété ».
- Variété → Millésime : variété présélectionnée.

## 4. Choix techniques

- **Un seul point de montage Vue** (`#app`) : les trois panneaux partagent l'état (enchaînement, listes, `parcoursLigne`). Les panneaux sont en `v-show` pour garder leur saisie quand on change d'onglet.
- **État** : un objet `etat` réactif. Formulaires `etat.modele`, `etat.variete`, `etat.millesime` ; fabriques `champsVides()` et `millesimeVide()` pour les réinitialiser. Listes : `modeles`, `varietes`, `semisEnAttente`. Choix Grist : `choix`, `choixVariete`, `choixOrigine`, `choixTypePlant`, `lieux`.
- **Composants** (gabarits `<template id>` dans le HTML, hors de `#app`) :
  - `champs-culture` : champs communs espèce / variété (props `formulaire`, `choix`, `prefixe` pour les `id`) ;
  - `choix-multiple` : pastilles, ou champ de recherche + pastilles à retirer avec l'attribut `menu` ; l'attribut `lieu` colore les pastilles choisies en violet ;
  - `choix-unique` : bouton qui ouvre une liste (comme « Trier par » dans `a_gerer`). `vide` ajoute une entrée « rien de choisi » dans la liste ; `placeholder` n'écrit le texte que sur le bouton, sans entrée. Se ferme par un clic n'importe où ailleurs (écouteur sur `document`, car Safari ne donne pas le focus aux boutons) ;
  - `choix-recherche` : champ de saisie, liste qui se réduit à chaque lettre (40 résultats maximum) ; ne permet pas de revenir à « rien » (on utilise « Réinitialiser ») ;
  - `ajout-choix` : bouton qui ouvre un petit champ pour ajouter un choix ; reçoit une fonction `sur-ajout` qui renvoie `true` si l'ajout a réussi.
- **Choix des listes** : lus dans les métadonnées Grist avec `lireChoixColonnes`. **Ajout d'un choix** : `ajouterChoixColonne` relit les réglages de la colonne, ajoute le choix et écrit avec `ModifyColumn` (`widgetOptions`) ; les couleurs et autres réglages existants sont conservés.
- **Format ChoiceList** : `enListeChoix(valeurs)` (commun) ajoute le `"L"` en un seul endroit ; `listeChoix` le retire à la lecture.
- **Dates** : `Millesime` et `Date_s` en secondes depuis epoch, au 1er janvier en UTC (`dateEnSecondes(annee + '-01-01')`), lues avec `anneeDepuisDate`.
- **Doublon en direct** : un `watch` sur variété / année / origine / nature relance `verifierDoublonMillesime`, protégé par un compteur `numeroVerification`. Millésimes et Semis sont relus par `fetchTable` à chaque besoin, donc toujours à jour.
- **Où sont les textes** : libellés fixes, bandeaux d'enchaînement, avertissements, encarts de doublon et « Don : N sachet(s) » dans le HTML (le JS ne garde que les données : `etat.bandeaux.variete = { type: 'espece', nom }`, `donSachets`, `etat.doublonsMillesime`) ; messages après une action et libellés de listes dans `TEXTES`. Restent dans le JS : les erreurs techniques (`throw new Error(...)`, `console.error`) et les commentaires.
- **Messages** : `dire(texte, erreur, panneau)` ; un succès disparaît après 4 s, une **erreur reste affichée jusqu'au prochain clic** (écouteur de `document` en phase de capture : un clic sur « Créer » efface l'ancienne erreur avant que le bouton revalide, donc elle réapparaît s'il reste un problème) ; chaque message s'affiche seulement dans son panneau (`etat.panneauMessage`).
- **Validations** : `entierOuNull`, `anneeValide`, `nettoyerProfondeur`, `MOTIF_PROFONDEUR`, `erreurChampsCommuns`.
- **Origine de production** : `ORIGINE_PRODUCTION = 'Monjardin'` (choix stocké dans `Origine`, affiché « AR » sur l'étiquette).
- **Sachets et plants** : valeurs numériques, plus de lettres. `NB_SACHETS = 1` dans `Nb_sachets` pour un sachet ; `Nb_plants` et `Type_plant` pour une plante mère. `Epuise` teste `Plante_mere`, donc une plante mère n'est jamais « épuisée ».
- **Styles** : pastille choisie = `pastille--etape` (commun), pastille non choisie = `pastille--choix:not(.pastille--etape)` (local). Bouton principal bleu = `btn--enregistrer` (commun) ; `btn--collant` (commun) le colle en bas de l'écran, non utilisé dans cet outil. Rangée de pastilles posée sur un champ = `ligne--sur-champ` (commun). Locaux : `.bloc`, `.badge`, `.encart--alerte`, `.encart--cote`, `.ligne--bas`, `.champ--deroulant` (la flèche ; s'ajoute à `champ--bouton` du commun, qui fournit le texte à gauche et le curseur main), `.champ--vide`, `.pastille--choix`. `.grille` et `.entete` sont dans le commun.
- **Pluriels et dates** : `pluriel(n, 'étiquette')` (commun) pour « 1 étiquette » / « 4 étiquettes » ; `dateEnSecondes` (commun) pour les dates écrites dans Grist.

### Contrat entre les deux outils (achatrepro ↔ étiquettes)

```text
Colonnes Semis : Etiq_en_attente (Numérique), Note_attente (Texte).

Outil d'étiquettes, « Marquer comme imprimées », pour chaque ligne avec Nb_etiquettes > 0 :
  - Etiq_en_attente = Etiq_en_attente + Nb_etiquettes (addition si déjà > 0) ;
  - Nb_etiquettes = 0 ;
  - AUCUNE suppression, y compris pour les lignes sans variété.

Achatrepro, à la création du millésime :
  - vide Etiq_en_attente de la ligne choisie ;
  - supprime la ligne si c'est une ligne de transit
    (sans Date_s, Nb_graines, Nb_godets, Germes, Plantes, et Nb_etiquettes <= 0).
```

Si tu modifies l'un des deux outils, vérifie ce contrat : c'est lui qui évite de perdre des étiquettes imprimées.

### Ordre des opérations dans `creerMillesime(forcer)`
1. Contrôles de saisie (variété, année sur 4 chiffres, origine, nature, quantité ou année de plantation + nombre de plants + type de plant + emplacements).
2. Contrôles « étiquettes » : ligne choisie si la case est cochée, sachets réels ≥ 1.
3. Détection de doublon (sauf si `forcer`).
4. **Lectures préalables** (avant toute écriture) : lignes `Semis` de la variété dont `A_produire` est coché ; ligne d'étiquettes choisie (`actionNettoyageLigne` renvoie l'action à envoyer, ou `null` si la ligne a disparu ou changé : message « Cette ligne d'étiquettes a changé », rien n'est créé, la liste est rechargée).
5. **Premier envoi** : création du millésime (avec `Don` si sachets réels > 1). Erreur : message rouge + arrêt.
6. **Second envoi, un seul pour tout le reste** (tout ou rien) : décochage de `A_produire`, nettoyage de la ligne d'étiquettes, ligne `Semis` de la plante mère. S'il échoue, le millésime créé à l'étape 5 est supprimé (`RemoveRecord`) ; si cette suppression échoue aussi, un message le dit.
7. Message de succès + `reinitialiserMillesime()` (qui recharge la liste des étiquettes).

### Dépendances avec les formules Grist
- `Varietes.En_production` = `any(Semis.lookupRecords(NomVariete=rec.id).A_produire)` : bascule après le décochage.
- `a_gerer` reconnaît une ligne de plante mère avec `millesimeId > 0`, godets = 0 et graines = 0 ; il lit `Ou` pour l'emplacement et `Nb_plants` pour l'effectif.
- Une ligne `Semis` sans `Date_s` ne perturbe pas `Germination_2026`, `Annees_sans_test`, `Dernier_semis`, `Deja_seme_cette_annee` ni `En_production`.
- L'outil « Semis réalisés » écrit aussi dans `Millesimes` (case « Sachet vidé » : `Qtte_graines` et `Nb_sachets` à `null`).

## 5. Pièges rencontrés

- **Copier-coller** : un `return` grignoté a supprimé le contrôle du nombre de plants ; un bloc remplacé au mauvais endroit a laissé deux champs avec le même `id` ; un `=` à la place d'un `<=` dans un gabarit a modifié la longueur d'une liste (cases vides). Après chaque modification, relire le bloc autour.
- **Classes renommées** : quand une classe est renommée dans le commun (par exemple `pastille--choisie` devenue `pastille--etape`), vérifier les règles locales qui s'y appuient : à spécificité égale, la règle écrite en dernier gagne, et `achatrepro.css` est chargé après le commun.
- **Chemins et cache** : après un déplacement de dossiers, vérifier l'URL du widget dans Grist, les chemins relatifs du HTML, puis faire un rechargement forcé. L'erreur `KeyError 'Sachets'` venait d'une ancienne copie encore exécutée.
- **Champ numérique et lettres** : un champ `type="number"` renvoie une valeur vide pour `abc`, donc aucune erreur. Pour obtenir un message, utiliser un champ texte avec un contrôle.
- **Gabarits dans le HTML** : pas de balises de composant auto-fermantes, et les `<template id>` doivent rester **hors** de `#app`. Dans un gabarit du DOM, les attributs sont en minuscules : utiliser `champ-id`, `sur-ajout`, `@update:model-value`. Un composant n'a pas accès à `etat` : seulement à ses props.
- **Champ de la colonne qui n'existe pas dans une table** : un champ écrit dans une table sans cette colonne donne `KeyError` (cas de `Semis_GPT` puis `SemisGpt`). Les colonnes écrites par `colonnesCommunes` doivent exister dans `Especes` **et** `Varietes`.
- **Les `watch` s'enchaînent** : `etat.ligneAttenteId` déclenche `chargerLigneAttente`, et `reinitialiserMillesime` remet cet id à vide, ce qui déclenche aussi `annulerLigneAttente`. C'est voulu et sans effet de bord ; à garder en tête avant de les modifier.
- **`parcoursLigne` reste vrai si le trajet est abandonné** (clic sur « Créer la variété » puis retour manuel au millésime). Il est remis à faux dans `annulerLigneAttente`, `chargerLigneAttente`, `reinitialiserMillesime` et à l'arrivée dans Millésime.
- **Deux envois, pas un** : la ligne `Semis` d'une plante mère a besoin de l'id du millésime tout juste créé. D'où deux `applyUserActions` : le millésime, puis tout le reste. Si le second échoue, le millésime est annulé ; seul cas résiduel : si l'annulation échoue aussi, il faut vérifier `Millesimes`, les semis de la variété et la ligne d'étiquettes à la main.
- `ORIGINE_PRODUCTION` doit correspondre exactement à un choix de la colonne `Origine`, sinon « Origine non reconnue » et l'origine est à choisir à la main.
- **`Note_attente` doit être une colonne de données** : si c'est une colonne de formule, on ne peut pas y saisir de note et l'outil lit toujours vide.
- **Lecture de `Semis.Ou` en échec** : un message s'affiche dans l'en-tête et la création d'une plante mère est impossible ; le reste de l'outil fonctionne.
- **`Nb_godets` / `Nb_graines` à 0, pas vides**, sur la ligne de plante mère : normal (valeur par défaut de Grist), `a_gerer` l'accepte.
- **Messages de la console sans gravité** : « Erreur de sécurité … file:/// » (vient du serveur local Live Server, absente en prod) ; « accès partitionné à un cookie ou au stockage » (information de Firefox pour un widget affiché dans Grist) ; messages RPC de Grist.
- Dans la console Grist, choisir l'iframe du widget dans le menu « top ».

## 6. Procédure de passage en prod (checklist pour les prochaines fois)

1. Sauvegarder les fichiers prod actuels de tous les outils concernés (achatrepro, étiquettes, semis réalisés) et le document de prod.
2. Aligner la structure Grist de prod sur celle de test (section 2) : table `Especes`, `Semis_profondeur` en Texte (valeurs nettoyées), `Ou_semer`, `Nb_sachets` numérique, `Nb_plants`, `Type_plant` avec ses choix, `Etiq_en_attente` et `Note_attente` en colonnes de données, formules par défaut retirées.
3. Vérifier que `scriptcommun.js` (avec `enListeChoix`) et `styles_communs.css` sont à jour en prod.
4. Copier les outils en même temps (le contrat les lie), puis mettre à jour l'URL de chaque widget dans Grist.
5. Tester : un sachet, une plante mère, le décochage de `A_produire`, un enchaînement espèce → variété → millésime, « Issu de mes étiquettes » (ligne sans variété, vrai semis, plante mère, plusieurs créations de suite), « Sachet vidé » dans « Semis réalisés », l'ajout d'une origine et d'une info (puis supprimer les valeurs de test).
6. Supprimer les lignes de test dans Grist, puis retirer l'ancienne version de l'outil du dépôt.

## 7. Reste à faire / idées

- [ ] Renommer `semisGpt` en `ouSemer` dans le code (`champsVides`, `modeleDepuisLigne`, `colonnesCommunes`, HTML) : le champ s'appelle encore comme l'ancienne colonne `Semis_GPT`.
- [ ] Nettoyage du code et du CSS signalé lors de l'audit du 20 novembre (voir la liste communiquée).
- [ ] `Especes.Date_creaction` : faute de frappe dans le nom de la colonne (les autres tables ont `Date_creation`).
- [ ] Décocher `A_produire` seulement pour certaines origines (par exemple pas pour un don ou un achat) ? Actuellement : toujours.
- [ ] Doublons de plante mère : comparer sur l'**année de plantation** plutôt que l'année du millésime, si l'usage le demande.
- [ ] Étiquette : le texte « Récolte : » affiche toujours l'année en cours, pas l'année du millésime saisi.
- [ ] Graines à identifier : l'origine n'est jamais devinée ; envisager `Monjardin` par défaut si ces graines viennent toujours de ton jardin.
- [ ] Choix dupliqués entre `Especes`, `Varietes` et `Millesimes` (Famille, Infos…) : une liste unique serait plus sûre, mais c'est un chantier Grist.
- [ ] Rapprochements avec le commun : `.encart--alerte`, `.pastille--choix`, `.badge`, `.bloc`, `.champ--deroulant` (déjà associée à `champ--bouton` du commun), et les composants `choix-unique` / `choix-recherche` si `a_gerer` en a besoin. `ajouterChoixColonne` et `existeDeja` pourraient rejoindre `scriptcommun.js` si un autre outil en a besoin.
- [ ] Renommer `modele(s)` en `especes` dans le JS (confort de lecture seulement).
- Abandonné : fusionner la quantité dans un millésime existant (deux sachets = deux lignes, le second va à la boîte à dons).
- Abandonné : plusieurs origines par millésime (une seule, décision du 25/10/2026).
- Abandonné : créer l'espèce automatiquement à la création d'une variété (peu utile).