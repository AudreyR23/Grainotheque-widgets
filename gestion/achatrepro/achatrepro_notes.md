
# Outil Achat-repro (Granothèque Grist) — version Vue
 
Dernière mise à jour : 18 novembre 2026. Version concernée : **dev** (document de test, copie de la granothèque). Pas encore en prod.
Outil lié : **Étiquettes sur sachets** (contrat en section 4). Outil de référence pour le style et les conventions : **À gérer**.
 
## 1. Rôle
 
Ajouter rapidement des sachets de graines et des plantes mères vivaces dans la table `Millesimes`. Trois onglets :
 
- **Nouveau millésime** (le plus utilisé, ouvert au démarrage) ;
- **Nouvelle variété** et **Nouvelle espèce**, pour créer ce qui manque en amont, avec enchaînement automatique espèce → variété → millésime.
L'onglet Millésime sait aussi **reprendre les sachets étiquetés** (étiquettes imprimées, sachets pas encore ajoutés dans `Millesimes`).
 
Usage : PC et tablette. Pas d'impression depuis cet outil.
 
## 2. Fichiers et données
 
| Fichier | Rôle |
|---|---|
| `achatrepro.html` | Structure : 3 panneaux, 2 composants (`<template id=…>`), un seul point de montage `#app` |
| `achatrepro.js` | Toute la logique (Vue 3.4.38 par unpkg) |
| `achatrepro.css` | Uniquement ce qui n'est pas dans le commun |
| `../../styles/styles_communs_bem.css` | Styles communs (BEM) |
| `../../script/scriptcommun.js` | Fonctions communes |
 
Ordre des scripts dans le HTML : plugin Grist, Vue, `scriptcommun.js`, `achatrepro.js` (le commun appelle `grist`, le JS appelle le commun).
 
Accès : `grist.ready({ requiredAccess: 'full' })`.
 
**Tables** (constantes en haut du JS) : `TABLE_ESPECES = 'Especes'` (anciennement `Modele`), `TABLE_VARIETES`, `TABLE_MILLESIMES`, `TABLE_SEMIS`. Un renommage dans Grist impose de changer la constante.
 
**Colonnes ajoutées dans `Semis`** (colonnes de données, sans formule) :
 
| Colonne | Type | Rôle |
|---|---|---|
| `Etiq_en_attente` | Numérique | Sachets imprimés, pas encore ajoutés dans `Millesimes` |
| `Note_attente` | Texte | Libellé libre pour repérer une ligne sans variété (ex. « menthe du voisin »). Saisi à la main dans Semis |
 
**Fonctions du commun utilisées** : `tableEnLignes`, `listeChoix`, `enListeChoix`, `normaliser`, `anneeDepuisDate`, `lieuxFiltres`, `lireChoixColonnes`, `creerMessageTemporaire`, `libelle`.
 
## 3. Fonctionnalités
 
### Onglet Millésime
- Variété (le Type s'affiche en lecture seule), Nb saisons (`or.` par défaut), année du millésime (année en cours par défaut).
- **Origine obligatoire, une seule au total** : les 6 premiers choix de la colonne `Origine` sont des pastilles (`NB_FAVORIS`), les autres sont dans le menu « Autres origines… ». Une seule valeur `etat.millesime.origine`, donc rien à synchroniser entre pastilles et menu. Écrite `['L', origine]`.
- **Sachet** ou **Plante mère** (cases exclusives) :
  - Sachet : quantité de graines obligatoire. `Sachets` = `1`.
  - Plante mère : année de plantation, **nombre de plants** (entier ≥ 1) et **emplacement(s)** (au moins un, choix de `Semis.Ou`) obligatoires. `Sachets` = `1p.`.
- **Convention « une ligne `Semis` par plante mère »** : créée avec `Plantes` = nombre de plants, `Ou` = emplacements, `Date_s` = 1er janvier de l'année de plantation, `Nb_etiquettes` = 0, sans godets ni graines renseignés (ils restent à 0, valeur par défaut de Grist). C'est ce qui permet à `a_gerer` de la reconnaître.
- `Controle_mere` et `Statut_mere` ne sont **jamais** écrits sur `Millesimes` : la plante est proposée au contrôle l'année suivante.
- **Doublon** (bandeau orange en direct, plus contrôle à la création, « Créer quand même » / « Annuler ») : variété + année + origine + nature (sachet ou plante mère).
### Décochage automatique de « À produire »
À la création d'un millésime, toutes les lignes `Semis` de la **même variété** dont `A_produire` est coché sont décochées (le besoin de produire est satisfait). Tous les types de millésime, sans filtre par origine. `Varietes.En_production` repasse à faux. Le message indique le nombre de semis concernés. La ligne `Semis` d'une plante mère est créée **après** ce décochage, donc jamais concernée.
 
### « Issu de mes étiquettes »
Principe : tu récoltes, tu remplis `Nb_etiquettes` dans Semis, tu imprimes, tu colles les étiquettes, **puis** tu ajoutes les sachets comme millésimes (un pour toi, le reste en `Don`). La case liste les lignes `Semis` dont `Etiq_en_attente` > 0. Décochée : fonctionnement habituel (achats, réceptions).
 
| Type de ligne | Reconnaissance | Variété | Origine préremplie | Nb saisons préparé |
|---|---|---|---|---|
| Plante mère | millésime lié avec `Plante_mere` | verrouillée | `Monjardin` | année en cours − année de plantation + 1 |
| Vrai semis | `Date_s` renseignée | verrouillée | `Monjardin` | saisons du millésime source + 1 |
| Hors sachet, variété connue | pas de `Date_s`, variété renseignée | verrouillée | première origine du millésime « or. » de la variété | `or.` |
| **Graines à identifier** | **pas de variété** | **libre** | **aucune (à choisir)** | `or.` |
 
Le nouveau millésime est toujours un **sachet**. `Nb saisons` est borné entre 1 et 8.
 
- **Sachets réels** : prérempli avec le nombre d'étiquettes, à corriger si tu en as imprimé trop. `Don` = sachets réels − 1 (la colonne `Don` compte des **sachets**). Si sachets réels = 1, `Don` n'est pas écrit. La quantité de graines de **ton** sachet reste obligatoire.
- **Graines à identifier** : deux boutons, « Créer la variété » et « Créer l'espèce ». La note préremplit le nom (modifiable). Pendant ce trajet (`etat.parcoursLigne`), l'enchaînement est **forcé** jusqu'au millésime, même si « Enchaîner automatiquement » est décoché. À l'arrivée : variété présélectionnée, `or.`, sachets réels prérempli ; reste l'origine et la quantité.
- **Nettoyage à la création** : `Etiq_en_attente` est vidé ; la ligne est **supprimée** seulement si c'est une ligne de transit (ni `Date_s`, ni `Nb_graines`, ni `Nb_godets`, ni `Germes`, ni `Plantes`, et `Nb_etiquettes` ≤ 0). Un vrai semis ou la ligne d'une plante mère n'est jamais supprimé.
- Après une création, la case reste cochée et la liste est rechargée (dans `reinitialiserMillesime`).
### Onglet Variété
Modèle de base (copie les champs de l'espèce choisie, pas le nom), Nom + Variété, champs communs, Semis (GPT), Description. `NomVariete` = `Nom\nVariété` (ou `Nom` seul). `Num_epingle` est envoyé à `null` (vide, pas 0). Doublon sur Nom + Variété (sans casse ni accents).
 
### Onglet Espèce
Même formulaire que la variété (sans Semis GPT ni Description), point de départ optionnel. Doublon sur le nom.
 
### Enchaînement (case « Enchaîner automatiquement »)
- Espèce → Variété : espèce présélectionnée comme modèle (champs copiés), nom repris, curseur dans « Variété ».
- Variété → Millésime : variété présélectionnée, curseur sur « Autres origines… ».
## 4. Choix techniques
 
- **Un seul point de montage Vue** (`#app`) : les trois panneaux partagent l'état (enchaînement, listes, `parcoursLigne`). Les panneaux sont en `v-show` pour garder leur saisie quand on change d'onglet.
- **État** : un objet `etat` réactif. Formulaires `etat.modele`, `etat.variete`, `etat.millesime` ; fabriques `champsVides()` et `millesimeVide()` pour les réinitialiser. Listes : `modeles`, `varietes`, `semisEnAttente`. Choix Grist : `choix`, `choixVariete`, `choixOrigine`, `lieux`.
- **Composants** (gabarits `<template id>` dans le HTML, hors de `#app`) :
  - `champs-culture` : les champs communs espèce / variété (props `formulaire`, `choix`, `prefixe` pour les `id`) ;
  - `choix-multiple` : pastilles si la liste compte 15 choix ou moins (`SEUIL_PASTILLES`), sinon champ de recherche + pastilles à retirer (même mécanique que « Où » dans `a_gerer`). Sert aussi aux mois et aux emplacements des plantes mères.
- **Choix des listes** : lus dans les métadonnées Grist avec `lireChoixColonnes` (espèces, variétés, `Millesimes.Origine`, `Semis.Ou`). Réordonner les choix d'`Origine` dans Grist change les 6 pastilles sans toucher au code.
- **Format ChoiceList** : `enListeChoix(valeurs)` (commun) ajoute le `"L"` en un seul endroit ; `listeChoix` le retire à la lecture.
- **Dates** : `Millesime` et `Date_s` en secondes depuis epoch, au 1er janvier en UTC (`Date.UTC(annee, 0, 1) / 1000`), lues avec `anneeDepuisDate`.
- **Doublon en direct** : un `watch` sur variété / année / origine / nature relance `verifierDoublonMillesime`, protégé par un compteur `numeroVerification` (une réponse périmée ne remplace pas la plus récente). Millésimes et Semis sont relus par `fetchTable` à chaque besoin, donc toujours à jour.
- **Bandeau plutôt que `confirm()`** : les fenêtres natives peuvent être bloquées dans l'iframe d'un widget Grist.
- **Messages** : `dire(texte, erreur, panneau)` ; chaque message s'affiche seulement dans son panneau (`etat.panneauMessage`) et disparaît après 4 s.
- **Origine de production** : `ORIGINE_PRODUCTION = 'Monjardin'` (choix stocké dans `Origine`, affiché « AR » sur l'étiquette).
- **Valeurs de `Sachets`** : `VALEUR_SACHET = '1'` ; `'1p.'` pour une plante mère (évite que `Epuise` la marque comme épuisée).
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
1. Contrôles de saisie (variété, année, origine, nature, quantité ou année de plantation + nombre de plants + emplacements).
2. Contrôles « étiquettes » : ligne choisie si la case est cochée, sachets réels ≥ 1.
3. Détection de doublon (sauf si `forcer`).
4. Création du millésime (avec `Don` si sachets réels > 1). Erreur : message rouge + arrêt.
5. Décochage de `A_produire`. Erreur : message rouge + arrêt.
6. Nettoyage de la ligne d'étiquettes en attente. Erreur : message rouge + arrêt.
7. Plante mère : création de la ligne `Semis`.
8. Message de succès + `reinitialiserMillesime()` (qui recharge la liste des étiquettes).
### Dépendances avec les formules Grist
- `Varietes.En_production` = `any(Semis.lookupRecords(NomVariete=rec.id).A_produire)` : bascule après le décochage.
- `a_gerer` reconnaît une ligne de plante mère avec `millesimeId > 0`, godets = 0 et graines = 0 ; il lit `Ou` pour l'emplacement.
- Une ligne `Semis` sans `Date_s` ne perturbe pas `Germination_2026`, `Annees_sans_test`, `Dernier_semis`, `Deja_seme_cette_annee` ni `En_production` (vérifié par lecture des formules et à l'usage).
## 5. Pièges rencontrés
 
- **Gabarits dans le HTML** : pas de balises de composant auto-fermantes (`<choix-multiple … />` ne marche pas dans un gabarit du DOM), et les `<template id>` doivent rester **hors** de `#app`.
- **Les `watch` s'enchaînent** : `etat.ligneAttenteId` déclenche `chargerLigneAttente`, et `reinitialiserMillesime` remet cet id à vide, ce qui déclenche aussi `annulerLigneAttente`. C'est voulu et sans effet de bord ; à garder en tête avant de les modifier.
- **`parcoursLigne` reste vrai si le trajet est abandonné** (clic sur « Créer la variété » puis retour manuel au millésime). Il est remis à faux dans `annulerLigneAttente`, `chargerLigneAttente`, `reinitialiserMillesime` et à l'arrivée dans Millésime.
- **Si le décochage de `A_produire` ou le nettoyage de la ligne d'étiquettes échoue**, le millésime est **déjà créé** et la ligne `Semis` d'une plante mère n'est pas créée. Il faudrait l'ajouter à la main.
- `ORIGINE_PRODUCTION` doit correspondre exactement à un choix de la colonne `Origine`, sinon « Origine non reconnue » et l'origine est à choisir à la main.
- **Lecture de `Semis.Ou` en échec** : un message s'affiche dans l'en-tête et la création d'une plante mère est impossible ; le reste de l'outil fonctionne.
- **`Nb_godets` / `Nb_graines` à 0, pas vides**, sur la ligne de plante mère : normal (valeur par défaut de Grist), `a_gerer` l'accepte.
- Un Type vide lors d'un test d'enchaînement donne l'impression que le transfert ne marche pas.
- Les **noms internes** `modele` / `modeles` désignent encore les espèces (renommage de la table en `Especes`) : sans effet sur Grist.
- Dans la console Grist, choisir l'iframe du widget dans le menu « top » ; les messages RPC sont du bruit.
## 6. Procédure de passage en prod
 
1. Sauvegarder les fichiers prod actuels des **deux outils** (achatrepro : HTML, JS, CSS ; étiquettes : JS).
2. Vérifier dans le document **de prod** : table `Especes` (renommage fait, aucun autre outil n'appelle encore `Modele`), colonnes `Etiq_en_attente` (Numérique) et `Note_attente` (Texte) dans `Semis`.
3. Vérifier que `scriptcommun.js` (avec `enListeChoix`) et `styles_communs_bem.css` sont à jour en prod.
4. Copier le nouveau dossier achatrepro et le JS des étiquettes en prod **en même temps** (le contrat les lie), puis mettre à jour l'URL du widget dans Grist.
5. Tester en prod : un sachet, une plante mère (ligne `Semis` avec `Ou` et `Plantes`), le décochage de `A_produire`, un enchaînement espèce → variété → millésime, puis « Issu de mes étiquettes » (ligne sans variété, vrai semis, plante mère, plusieurs créations de suite).
6. Supprimer les lignes de test dans Grist, puis retirer l'ancienne version de l'outil du dépôt.
## 7. Reste à faire / idées
 
- [ ] Passage en prod (section 6).
- [ ] Décocher `A_produire` seulement pour certaines origines (par exemple pas pour un don ou un achat) ? Actuellement : toujours.
- [ ] Doublons de plante mère : comparer sur l'**année de plantation** plutôt que l'année du millésime, si l'usage le demande.
- [ ] Colonne `Sachets` : valeurs `1` et `1p.` (nom éventuellement à revoir).
- [ ] Étiquette : le texte « Récolte : » affiche toujours l'année en cours, pas l'année du millésime saisi.
- [ ] Graines à identifier : l'origine n'est jamais devinée ; envisager `Monjardin` par défaut si ces graines viennent toujours de ton jardin.
- [ ] Rapprochements avec le commun : voir la liste proposée (classes CSS, composant `choix-multiple`).
- [ ] Renommer `modele(s)` en `especes` dans le JS (confort de lecture seulement).
- Abandonné : fusionner la quantité dans un millésime existant (deux sachets = deux lignes, le second va à la boîte à dons).
- Abandonné : plusieurs origines par millésime (une seule, décision du 25/10/2026).
 
