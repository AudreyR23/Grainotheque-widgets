# Outil Achat-repro (Granothèque Grist) — version Vue

Dernière mise à jour : 26 novembre 2026 (refonte « sans Ferrari » du 25/11 et passage aux zones Vue sans composants du 26/11, voir section 8). Version concernée : **test**. La prod (poussée le 20 novembre 2026) n'a pas encore la refonte : à pousser en suivant la section 6.
Outils liés : **Étiquettes sur sachets** (contrat en section 4) et **Semis réalisés** (écrit `Nb_sachets`). Outil de référence pour le style et les conventions : **À gérer**.

## 1. Rôle

Ajouter rapidement des sachets de graines et des plantes mères vivaces dans la table `Millesimes`. Deux onglets :

- **Nouveau millésime** (le plus utilisé, ouvert au démarrage) ;
- **Nouvelle variété**, pour créer ce qui manque en amont, avec enchaînement automatique variété → millésime.

Il n'y a plus d'onglet « Nouvelle espèce » (retiré le 25/11) : une nouvelle espèce se crée directement dans la table `Especes` de Grist. La variété peut partir d'une espèce existante (« modèle de base »).

L'onglet Millésime sait aussi **reprendre les sachets étiquetés** (étiquettes imprimées, sachets pas encore ajoutés dans `Millesimes`).

Usage : PC et tablette. Pas d'impression depuis cet outil.

## 2. Fichiers et données

| Fichier | Rôle |
|---|---|
| `achatrepro.html` | Structure : en-tête et 2 panneaux, chacun dans sa zone Vue (`#appEntete`, `#appMillesime`, `#appVariete`). Aucun composant |
| `achatrepro.js` | Toute la logique (Vue 3.4.38 par unpkg) et l'objet `TEXTES` (section 3 du fichier) |
| `achatrepro.css` | Uniquement ce qui n'est pas dans le commun |
| `../../styles/styles_communs.css` | Styles communs (BEM) |
| `../../script/scriptcommun.js` | Fonctions communes |

`achatrepro_textes.js` n'existe plus (supprimé le 25/11). Ordre des scripts dans le HTML : plugin Grist, Vue, `scriptcommun.js`, `achatrepro.js`.

Accès : `grist.ready({ requiredAccess: 'full' })` (nécessaire aussi pour modifier les choix d'une colonne).

**Tables** (constantes en haut du JS) : `TABLE_ESPECES = 'Especes'`, `TABLE_VARIETES`, `TABLE_MILLESIMES`, `TABLE_SEMIS`. Un renommage dans Grist impose de changer la constante. `Especes` n'est plus que **lue** (modèle de base d'une variété).

**Structure Grist attendue** :

| Table | Colonne | Remarque |
|---|---|---|
| `Especes`, `Varietes` | `Semis_profondeur` | **Texte** : nombre ou fourchette, sans l'unité (`1`, `1-2`, `0,5`) |
| `Especes`, `Varietes` | `Ou_semer` | Choix multiple. Libellé du formulaire : « Où semer ». Nom du champ dans le code : `ouSemer` |
| `Varietes` | `A_reproduire` | Booléen, **colonne de données** (voir section « À reproduire ») |
| `Millesimes` | `Nb_sachets` | **Numérique** : 1 pour un sachet, vide pour une plante mère |
| `Millesimes` | `Nb_plants` | Numérique : nombre de plants d'une plante mère (ajustable dans `a_gerer`) |
| `Millesimes` | `Type_plant` | Choix : type de plant d'une plante mère |
| `Millesimes` | `Nb_saisons_manuel` | Choix : `or.` puis 1 à 20 (à garder alignés avec `NB_SAISONS_MAX`) |
| `Semis` | `Etiq_en_attente` | Numérique, **colonne de données** : sachets imprimés, pas encore ajoutés dans `Millesimes` |
| `Semis` | `Note_attente` | Texte, **colonne de données** : libellé d'une ligne sans variété, saisi à la main dans Semis |
| `Semis` | `Germes_attente` | Booléen (utilisé par `a_gerer`) |

**Fonctions du commun utilisées** : `tableEnLignes`, `listeChoix`, `enListeChoix`, `normaliser`, `anneeDepuisDate`, `dateEnSecondes`, `lieuxFiltres`, `correspondRecherche`, `lireChoixColonnes`, `colonneGrist`, `creerMessageTemporaire`, `effacerAuClic`, `entierOuNull`, `libelle`, `pluriel`, `LISTE_MOIS`.

## 3. Fonctionnalités

### Onglet Millésime
- Variété (champ avec recherche, le Type s'affiche en lecture seule), Nb saisons (`or.` par défaut), année du millésime (année en cours par défaut).
- **Origine obligatoire, une seule au total** : les 6 premiers choix de `Origine` sont des pastilles (`NB_FAVORIS`), suivies d'un bouton « Autre origine » qui ouvre un panneau avec le menu des autres origines et **« ➕ Nouvelle origine… »**. Une seule valeur `etat.millesime.origine`. Une nouvelle origine est ajoutée aux choix de `Millesimes.Origine` dans Grist et sélectionnée ; une origine déjà existante (casse ou accents près) est simplement sélectionnée.
- **Sachet** ou **Plante mère** (cases exclusives) :
  - Sachet : quantité de graines obligatoire (entier ≥ 1). `Nb_sachets` = 1, `Nb_plants` vide.
  - Plante mère : année de plantation, **nombre de plants** (entier ≥ 1), **type de plant** (si la colonne a des choix) et **emplacement(s)** (au moins un, champ avec recherche, pastilles violettes), tous obligatoires. `Nb_plants` = nombre de plants, `Nb_sachets` vide.
- **Champs numériques** (année du millésime, quantité, sachets réels, année de plantation, nombre de plants) : champs **texte** (`type="text" inputmode="numeric"`), contrôlés dans le JS ; une saisie qui n'est pas un entier donne un message d'erreur et rien n'est créé.
- **Années** : 4 chiffres, de `ANNEE_MIN` (2000) à l'année en cours.
- **Convention « une ligne `Semis` par plante mère »** : créée avec `Plantes` = nombre de plants, `Ou` = emplacements, `Date_s` = 1er janvier de l'année de plantation, `Nb_etiquettes` = 0, sans godets ni graines renseignés. C'est ce qui permet à `a_gerer` de la reconnaître.
- `Controle_mere` et `Statut_mere` ne sont **jamais** écrits sur `Millesimes`.
- **Doublon** : contrôlé **au clic** sur « Créer le millésime » (variété + année + origine + nature). S'il existe, un encart d'alerte apparaît à côté du bouton avec « Créer quand même » et « Annuler », et rien n'est créé. L'encart disparaît dès qu'on change la variété, l'année, l'origine ou la nature.
- Le bouton **« ↩ Réinitialiser »** est en haut de chaque panneau, à droite du titre.

### « À reproduire » (décochage automatique)
Le besoin de produire des graines concerne une variété : la case est `Varietes.A_reproduire` (colonne de données). `Semis.A_produire` est une formule `$NomVariete.A_reproduire` (lue par le Plan, jamais écrite).
- À la création d'un millésime, le second envoi contient toujours `['UpdateRecord', 'Varietes', varId, { A_reproduire: false }]`, pour tous les types de millésime et **toutes les origines**. Écrit sans relecture : si la case est déjà vide, Grist ne change rien.
- `chargerVarietes` lit `A_reproduire` (`aReproduire`) **seulement pour le message** ; après la création, `v.aReproduire = false`.
- Message : « · « À reproduire » décoché » si la variété était cochée au chargement.
- `Varietes.En_production` = `any(Semis.lookupRecords(NomVariete=rec.id).A_produire)` : bascule après le décochage.

### « Issu de mes étiquettes »
Principe : tu récoltes, tu remplis `Nb_etiquettes` dans Semis, tu imprimes, tu colles les étiquettes, **puis** tu ajoutes les sachets comme millésimes (un pour toi, le reste en `Don`). La case liste les lignes `Semis` dont `Etiq_en_attente` > 0 (menu à choix unique, `optionsAttente`). Décochée : fonctionnement habituel (achats, réceptions).

| Type de ligne | Reconnaissance | Variété | Origine préremplie | Nb saisons préparé |
|---|---|---|---|---|
| Plante mère | millésime lié avec `Plante_mere` | verrouillée | `Monjardin` | **année du millésime saisi** − année de plantation + 1 |
| Vrai semis | `Date_s` renseignée | verrouillée | `Monjardin` | saisons du millésime source + 1 |
| Hors sachet, variété connue | pas de `Date_s`, variété renseignée | verrouillée | première origine du millésime « or. » de la variété | `or.` |
| **Graines à identifier** | **pas de variété** | **libre** | **aucune (à choisir)** | `or.` |

Le nouveau millésime est toujours un **sachet**. `Nb saisons` est borné entre 1 et `NB_SAISONS_MAX` (20), qui fixe aussi les entrées du menu.

- **Nb saisons d'une plante mère** : compté jusqu'à l'**année du millésime saisie** (la récolte), pas jusqu'à aujourd'hui, comme l'étiquette (`saisonsPourLigne(l, anneeRef)`). Un `watch` sur `etat.millesime.annee` recalcule `Nb saisons` quand l'année est corrigée (année valide seulement, ligne avec variété choisie). Si la récolte date de l'année précédente, **corriger l'année du millésime** (elle est préremplie avec l'année en cours).
- **Sachets réels** : prérempli avec le nombre d'étiquettes, à corriger si tu en as imprimé trop. `Don` = sachets réels − 1 (la colonne `Don` compte des **sachets**). Si sachets réels = 1, `Don` n'est pas écrit. La quantité de graines de **ton** sachet reste obligatoire.
- **Graines à identifier** : un seul bouton, « ➕ Créer la variété » (pour créer une espèce, passer par la table `Especes`). La note préremplit le nom (modifiable). Pendant ce trajet (`etat.parcoursLigne`), l'enchaînement est **forcé** jusqu'au millésime, même si « Enchaîner automatiquement » est décoché. Le bandeau du panneau Variété indique le nombre d'étiquettes (`etat.bandeaux.variete = { nb }`). À l'arrivée : variété présélectionnée, `or.`, sachets réels prérempli ; reste l'origine et la quantité.
- **Nettoyage à la création** : `Etiq_en_attente` est vidé ; la ligne est **supprimée** seulement si c'est une ligne de transit (ni `Date_s`, ni `Nb_graines`, ni `Nb_godets`, ni `Germes`, ni `Plantes`, et `Nb_etiquettes` ≤ 0). Le caractère « transit » est calculé **au chargement de la liste** (`chargerSemisEnAttente`, champ `transit`), sans relecture à la création. Un vrai semis ou la ligne d'une plante mère n'est jamais supprimé.
- Après une création, la case reste cochée et la liste est rechargée (dans `reinitialiserMillesime`).

### Onglet Variété
- **Rien d'obligatoire sauf le nom.**
- Modèle de base (champ avec recherche, copie les champs de l'**espèce** choisie, pas le nom), Nom + Variété, champs communs, Description. `NomVariete` = `Nom\nVariété` (ou `Nom` seul). `Num_epingle` est envoyé à `null` (vide, pas 0). Doublon sur Nom + Variété (sans casse ni accents), affiché en direct pendant la saisie.
- **Champs communs** (écrits directement dans le panneau) : Type, Exposition, Arrosage, Conservation, Famille ; profondeur, durée et température de germination, mois de semis sous abri / pleine terre / récolte ; nature et qualité du sol, où cultiver, **où semer** ; Infos.
- **Contrôles des champs numériques** (messages qui restent affichés jusqu'au prochain clic) : conservation et durée de germination = entiers ; profondeur = nombre ou fourchette, `1 cm` devient `1`, les tirets longs deviennent `-`, le point devient une virgule.
- **Listes de choix** (lues dans `Varietes`, choix vides ignorés au chargement) : pastilles pour les mois, Famille, nature et qualité du sol, où cultiver, où semer. Champ avec recherche pour les **Infos**, avec **« ➕ Nouvelle info… »** : l'info est ajoutée aux choix de `Varietes.Infos` seulement, et sélectionnée.

### Enchaînement (case « Enchaîner automatiquement »)
- Variété → Millésime : variété présélectionnée.

## 4. Choix techniques

- **Trois zones Vue** (`#appEntete`, `#appMillesime`, `#appVariete`), **aucun composant**, comme À gérer : une seule mécanique à comprendre (choix du 26/11). Les trois zones partagent le même `etat`, ce qui permet l'enchaînement d'un panneau à l'autre. Chaque panneau est un `<section v-show>` placé **dans** sa zone ; chaque zone a son propre `return` (ne mettre que ce qu'elle utilise).
- **État** : un objet `etat` réactif. Formulaires `etat.variete`, `etat.millesime` ; fabriques `champsVides()` et `millesimeVide()` pour les réinitialiser. Listes : `especes`, `varietes`, `semisEnAttente`. Choix Grist : `choixVariete`, `choixOrigine`, `choixTypePlant`, `lieux`.
- **Menus et choix écrits à la main** (fonctions en section 4 du JS) :
  - **choix unique** (Nb saisons, Type, Exposition, Arrosage, origine « autres », type de plant, ligne d'étiquettes) : `<div class="menu">` + bouton + `<ul class="menu__liste">`. `etat.menuOuvert` donne le nom du menu ouvert (un seul à la fois) ; `basculerMenu(nom)`, `choisir(objet, cle, valeur)`, `libelleDe(options, valeur)`. Un écouteur sur `document` ferme le menu au clic ailleurs ;
  - **champ avec recherche** (variété du millésime, modèle de base, infos, emplacements) : texte tapé dans `etat.recherches[nom]` ; `ouvrirRecherche`, `saisirRecherche`, `fermerRecherche`, `choisirRecherche`. Résultats par `chercher(options, saisie)` (40 au plus, `LIMITE_RECHERCHE` ; valeurs calculées `resultatsVariete`, `resultatsEspece`) ou `lieuxFiltres` (valeurs calculées `infosProposees`, `lieuxProposes`) ;
  - **pastilles** : `v-for` + `basculerDans(liste, valeur)` (modifie la liste sur place) ; pour les listes avec recherche, `ajouterDans(nom, liste, valeur)` ;
  - **ajout d'un choix** (origine, info) : `etat.ajout = { cible, texte, enCours }`, `ouvrirAjout(cible)`, `annulerAjout`, `validerAjout` ;
  - `sansVides(liste)` ignore les choix vides de Grist, appliqué au chargement dans `demarrer`.
- **Ajout d'un choix dans Grist** : `ajouterChoixColonne` relit les réglages de la colonne, ajoute le choix et écrit avec `ModifyColumn` (`widgetOptions`) ; les autres réglages sont conservés. Candidate au passage dans `scriptcommun.js` (avec `existeDeja`) si un autre outil en a besoin.
- **Format ChoiceList** : `enListeChoix(valeurs)` (commun) / `listeChoix` à la lecture.
- **Dates** : `Millesime` et `Date_s` en secondes UTC, au 1er janvier (`dateEnSecondes(annee + '-01-01')`), lues avec `anneeDepuisDate`.
- **Où sont les textes** : libellés fixes, bandeaux d'enchaînement, avertissements, encarts de doublon et « Don : N sachet(s) » dans le HTML ; messages après une action et libellés de listes dans `TEXTES` (en haut de `achatrepro.js`).
- **Messages** : `dire(texte, erreur, panneau)` ; un succès disparaît après 4 s, une **erreur reste jusqu'au prochain clic** (écouteur en phase de capture) ; chaque message ne s'affiche que dans son panneau (`etat.panneauMessage`).
- **Validations** : `entierOuNull`, `anneeValide`, `nettoyerProfondeur`, `MOTIF_PROFONDEUR`, `erreurChampsCommuns`.
- **Origine de production** : `ORIGINE_PRODUCTION = 'Monjardin'` (affiché « AR » sur l'étiquette).
- **Sachets et plants** : `NB_SACHETS = 1` dans `Nb_sachets` pour un sachet ; `Nb_plants` et `Type_plant` pour une plante mère. `Epuise` teste `Plante_mere` : une plante mère n'est jamais « épuisée ».
- **Styles** : pastille choisie = `pastille--etape` (commun), non choisie = `pastille--choix:not(.pastille--etape)` (local). Bouton principal = `btn--enregistrer`. Rangée de pastilles posée sur un champ = `ligne--sur-champ` (commun). Locaux : `.groupe` (marge basse), `.badge`, `.encart--cote`, `.champ--deroulant`, `.champ--vide`, `.pastille--choix`.

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
3. Détection de doublon (sauf si `forcer`) : seule lecture avant écriture.
4. **Premier envoi** : création du millésime (avec `Don` si sachets réels > 1). Erreur : message rouge + arrêt.
5. **Second envoi, un seul pour tout le reste** : `A_reproduire` décoché sur la variété, nettoyage de la ligne d'étiquettes (`actionLigneEtiquettes(ligne)`, d'après le champ `transit`), ligne `Semis` de la plante mère. **Pas d'annulation** s'il échoue : le message dit quoi vérifier (Millesimes, semis de la variété, ligne d'étiquettes). Ctrl+Z dans Grist reste possible.
6. Message de succès + `reinitialiserMillesime()` (qui recharge la liste des étiquettes).

### Dépendances avec les formules Grist
- `a_gerer` reconnaît une ligne de plante mère avec `millesimeId > 0`, godets = 0 et graines = 0 ; il lit `Ou` pour l'emplacement et `Nb_plants` pour l'effectif.
- Une ligne `Semis` sans `Date_s` ne perturbe pas `Germination_2026`, `Annees_sans_test`, `Dernier_semis`, `Deja_seme_cette_annee` ni `En_production`.
- L'outil « Semis réalisés » écrit aussi dans `Millesimes` (case « Sachet vidé » : `Qtte_graines` et `Nb_sachets` à `null`).

## 5. Pièges rencontrés

- **Copier-coller** : un `return` grignoté a supprimé un contrôle ; un bloc remplacé au mauvais endroit a laissé deux champs avec le même `id` ; un `=` à la place d'un `<=` a modifié la longueur d'une liste. Après chaque modification, relire le bloc autour.
- **Noms recopiés de mémoire** : un remplacement proposé avec une ancienne constante (`COLONNES_CHOIX_ESPECE` au lieu de `COLONNES_CHOIX`) ne correspond à rien dans le fichier. Toujours partir du fichier réel (redéposé dans le projet).
- **Classes renommées** dans le commun : vérifier les règles locales qui s'y appuient (`achatrepro.css` est chargé après le commun).
- **Chemins et cache** : après un déplacement de dossiers, vérifier l'URL du widget dans Grist, les chemins relatifs du HTML, puis recharger de force. `KeyError 'Sachets'` venait d'une ancienne copie encore exécutée.
- **Champ numérique et lettres** : `type="number"` renvoie une valeur vide pour `abc`, donc aucune erreur : champ texte + contrôle.
- **Oubli dans le `return` d'une zone** : `Property "xxx" was accessed during render`, la zone disparaît. Chaque zone n'a que ce qu'elle utilise ; en ajouter une fonction dans le HTML d'un panneau = l'ajouter au `return` de **ce** panneau.
- **Colonne absente d'une table** : `KeyError` (cas de `Semis_GPT`). Les colonnes écrites par `colonnesCommunes` doivent exister dans `Varietes`.
- **Les `watch` s'enchaînent** : `etat.ligneAttenteId` déclenche `chargerLigneAttente`, et `reinitialiserMillesime` remet cet id à vide, ce qui déclenche aussi `annulerLigneAttente`. De même, `chargerLigneAttente` écrit l'année, ce qui déclenche le `watch` de l'année (même résultat, sans effet de bord). L'origine choisie referme le panneau « Autre origine ».
- **`parcoursLigne` reste vrai si le trajet est abandonné** : remis à faux dans `annulerLigneAttente`, `chargerLigneAttente`, `reinitialiserMillesime` et à l'arrivée dans Millésime.
- **Deux envois, pas un** : la ligne `Semis` d'une plante mère a besoin de l'id du millésime tout juste créé.
- `ORIGINE_PRODUCTION` doit correspondre exactement à un choix de la colonne `Origine`.
- **`Note_attente` doit être une colonne de données** (pas une formule).
- **Lecture de `Semis.Ou` en échec** : message dans l'en-tête, création d'une plante mère impossible ; le reste fonctionne.
- **`Nb_godets` / `Nb_graines` à 0, pas vides**, sur la ligne de plante mère : normal, `a_gerer` l'accepte.
- **Renommage global** (`modele` → `espece`, `semisGpt` → `ouSemer`) : Remplacer dans les fichiers, casse respectée, dans l'ordre `MODELE`, `Modele`, `modele` ; les textes accentués (« Modèle de base ») ne bougent pas.
- **Messages de la console sans gravité** : « Erreur de sécurité … file:/// » (Live Server), « accès partitionné à un cookie ou au stockage » (Firefox), messages RPC de Grist.

## 6. Procédure de passage en prod (checklist)

1. Sauvegarder les fichiers prod actuels de tous les outils concernés et le document de prod.
2. Aligner la structure Grist de prod sur celle de test (section 2) : `Especes`, `Semis_profondeur` en Texte, `Ou_semer`, `Varietes.A_reproduire`, `Nb_sachets` numérique, `Nb_plants`, `Type_plant` avec ses choix, `Etiq_en_attente` et `Note_attente` en colonnes de données.
3. Vérifier que `scriptcommun.js` (avec `enListeChoix`, `entierOuNull`) et `styles_communs.css` sont à jour en prod.
4. Copier `achatrepro.html`, `achatrepro.js` et `achatrepro.css`, **supprimer `achatrepro_textes.js`** de la prod, puis (si l'outil d'étiquettes a changé) copier aussi ses fichiers : le contrat les lie. Vérifier l'URL du widget dans Grist.
5. Tester : un sachet, une plante mère, le décochage de `A_reproduire`, un doublon (« Créer quand même », « Annuler »), un enchaînement variété → millésime, « Issu de mes étiquettes » (ligne de transit, vrai semis, plante mère avec changement d'année, ligne sans variété), des saisies non numériques dans chaque champ, l'ajout d'une origine et d'une info (puis supprimer les valeurs de test), chaque menu et chaque champ de recherche.
6. Supprimer les lignes de test dans Grist.

## 7. Reste à faire / idées

- [ ] Pousser la refonte en prod (section 6).
- [ ] `Especes.Date_creaction` : faute de frappe dans le nom de la colonne (les autres tables ont `Date_creation`).
- [ ] Doublons de plante mère : comparer sur l'**année de plantation** plutôt que l'année du millésime, si l'usage le demande.
- [ ] Étiquette : le texte « Récolte : » est prérempli avec l'année précédente en janvier-février, sinon l'année en cours (outil étiquettes) : cohérent avec Achat-repro tant que l'année du millésime saisie est la bonne.
- [ ] Graines à identifier : l'origine n'est jamais devinée ; envisager `Monjardin` par défaut.
- [ ] Doublon en direct du panneau Variété (computed) : à garder ou à ramener au clic comme pour le millésime.
- [ ] Choix dupliqués entre `Especes`, `Varietes` et `Millesimes` (Famille, Infos…) : liste unique plus sûre, mais chantier Grist.
- [ ] Rapprochements avec le commun : `ajouterChoixColonne`, `existeDeja`, `sansVides`, `basculerDans`, `chercher` ; menus d'Achat-repro (`etat.menuOuvert`, `etat.recherches`) et ceux d'À gérer (`ouvertOu`) à unifier si un outil est repris ; `.encart--cote`, `.pastille--choix`, `.badge`, `.champ--deroulant`.
- Abandonné : fusionner la quantité dans un millésime existant (deux sachets = deux lignes, le second va à la boîte à dons).
- Abandonné : plusieurs origines par millésime (une seule, décision du 25/10/2026).
- Abandonné : créer l'espèce automatiquement à la création d'une variété ; panneau « Nouvelle espèce » (retiré le 25/11).
- Clos : décocher `A_reproduire` seulement pour certaines origines (toujours décoché).
- Clos : écart de Nb saisons entre l'étiquette et le millésime d'une plante mère (corrigé le 25/11).
- Clos : composants Vue (remplacés par des zones et des fonctions, 26/11).

### Piste à discuter à part : sachets de mélange
Un sachet de mélange enregistré comme N lignes (une par variété) compte le stock N fois, affiche N cartes dans « À semer », attribue la germination à une variété au hasard, et « Sachet vidé » ne vide qu'une ligne. **Piste retenue pour la pratique, sans changer d'outil** : une variété « Tournesol - Mélange » (rattachée à son espèce, contenu décrit dans la Description) avec un seul millésime par sachet ; les variétés contenues restent dans `Varietes` sans sachet ; à la récolte, millésime « Monjardin » sur la variété reconnue, sinon sur le mélange. Attention : la case `Millesimes.Melange` signifie « plusieurs millésimes d'une même variété », pas un mélange de variétés ; la renommer (par exemple `Plusieurs_millesimes`) imposerait de chercher l'ancien nom dans tous les outils (Achat-repro ne l'utilise pas). Question qui concerne tous les outils : à traiter dans une discussion dédiée.

## 8. Refontes des 25 et 26/11/2026

**25/11, « sans Ferrari »** (alignement sur le mémo, étapes testées une à une) :
1. `creerMillesime` : plus de relecture de la ligne d'étiquettes (champ `transit` calculé au chargement, `actionLigneEtiquettes`) ni d'annulation du millésime si le second envoi échoue ; `TEXTES.suiteEchouee` dit quoi vérifier.
2. Doublon du millésime : contrôle au clic seulement ; un `watch` efface juste l'encart quand variété, année, origine ou nature changent.
3. Nombres en champs texte avec contrôle entier ; `donSachets` et `nbPlants` passent par `entierOuNull` ; tutoiement des bandeaux.
4. `achatrepro_textes.js` supprimé ; `semisGpt` renommé `ouSemer`.
5. `modele(s)` renommé `espece(s)`.
7. Panneau « Nouvelle espèce » retiré (`creerEspece`, `reinitialiserEspece`, `allerCreerEspece`, `doublonsEspece`, `especeCreee`, onglet et section HTML).
8. Allègements : plus de lecture ni d'écriture des choix de `Especes` (`ajouterInfoGrist` n'écrit que dans `Varietes.Infos`) ; une seule liste `optionsAttente` ; bandeau « graines à identifier » réduit à `{ nb }`.
9. `saisonsPourLigne(l, anneeRef)` : le Nb saisons d'une plante mère se compte jusqu'à l'année du millésime saisi, recalculé par un `watch`.

**26/11, une seule mécanique** (même structure qu'À gérer, aucun composant) :
10. `champs-culture` remis directement dans le panneau Variété (`MOIS_VALEURS`, `ajouterInfo`).
11. `ajout-choix` remplacé par `etat.ajout` et `ouvrirAjout` / `annulerAjout` / `validerAjout`.
12. `choix-unique` remplacé par des menus écrits dans le HTML (`etat.menuOuvert`, `basculerMenu`, `choisir`, `libelleDe`) ; les choix vides sont ignorés au chargement (`sansVides`).
13. `choix-recherche` remplacé par `etat.recherches`, `chercher` et les fonctions `…Recherche`.
14. `choix-multiple` remplacé par des `v-for` (`basculerDans`, `ajouterDans`).
15. Découpage en trois zones Vue (`#appEntete`, `#appMillesime`, `#appVariete`) partageant `etat`, chacune avec son `return`.

## 9. Si tu veux un widget plus petit

Ce ne sont plus des nettoyages mais des décisions :
retirer le doublon en direct du panneau Variété (une valeur calculée et son watch) ;
retirer le trajet « Graines à identifier » (parcoursLigne, allerCreerVariete, un bandeau), si tu l'utilises peu ;
retirer la gestion des plantes mères si elle passe un jour entièrement par À gérer. C'est le plus gros gain, mais aussi la fonctionnalité la plus riche.