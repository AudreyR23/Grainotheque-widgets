# Outil Achat-repro (Granothèque Grist) — version Vue

Dernière mise à jour : 28 novembre 2026 (refonte du 25/11, zones Vue sans composants du 26/11, liste « À enregistrer » et section Variété repliable du 28/11, voir section 8). Version concernée : **test**. La prod (poussée le 20 novembre 2026) n'a pas encore la refonte : à pousser en suivant la section 6.
Outils liés : **Étiquettes sur sachets** (contrat en section 4) et **Semis réalisés** (écrit `Nb_sachets`). Outils de référence pour le style et les conventions : **Semis réalisés** (page, section repliable, liste « À enregistrer ») et **À gérer**.

## 1. Rôle

Ajouter rapidement des sachets de graines et des plantes mères vivaces dans la table `Millesimes`, **par séries** (10 à 30 à la suite : achats, reproduction). Chaque millésime saisi est ajouté à une liste « À enregistrer » ; un seul bouton **Enregistrer** écrit toute la liste dans Grist.

Une page, de haut en bas :

1. **En-tête collé** : titre, statut (Chargement… / ● Non sauvegardé (n) / ✓ À jour), navigation (« En cours (n) » seulement s'il y a des cartes, « ➕ Nouvelle variété », « Nouveau millésime »), messages.
2. **À enregistrer (n)** : une carte par millésime ajouté, ✕ pour la retirer, bouton Enregistrer. Section masquée quand la liste est vide.
3. **Nouvelle variété** : section repliable, **fermée par défaut** (bouton Masquer / Afficher). Pour créer ce qui manque en amont ; la variété est créée **tout de suite** dans Grist.
4. **Nouveau millésime** : toujours visible (ce qu'on fait le plus souvent).

Il n'y a plus d'onglets (remplacés le 28/11) ni de panneau « Nouvelle espèce » (retiré le 25/11) : une nouvelle espèce se crée directement dans la table `Especes`. La variété peut partir d'une espèce existante (« modèle de base »).

Le formulaire Millésime sait aussi **reprendre les sachets étiquetés** (étiquettes imprimées, sachets pas encore ajoutés dans `Millesimes`).

Usage : PC et tablette. Pas d'impression depuis cet outil.

## 2. Fichiers et données

| Fichier | Rôle |
|---|---|
| `achatrepro.html` | Structure : `<main class="page">` avec 4 zones Vue dans l'ordre de la page : `#appEntete` (le `<header>`), `#appEnCours`, `#appVariete`, `#appMillesime`. Aucun composant |
| `achatrepro.js` | Toute la logique (Vue 3.4.38 par unpkg) et l'objet `TEXTES` (section 3 du fichier) |
| `achatrepro.css` | Uniquement ce qui n'est pas dans le commun |
| `../../styles/styles_communs.css` | Styles communs (BEM) |
| `../../script/scriptcommun.js` | Fonctions communes |

`achatrepro_textes.js` n'existe plus (supprimé le 25/11). Ordre des scripts dans le HTML : plugin Grist, Vue, `scriptcommun.js`, `achatrepro.js`.

Accès : `grist.ready({ requiredAccess: 'full' })` (nécessaire aussi pour modifier les choix d'une colonne).

**Tables** (constantes en haut du JS) : `TABLE_ESPECES = 'Especes'`, `TABLE_VARIETES`, `TABLE_MILLESIMES`, `TABLE_SEMIS`. Un renommage dans Grist impose de changer la constante. `Especes` n'est plus que **lue** (modèle de base d'une variété).

**Lu au démarrage** : `Especes`, `Varietes`, **`Millesimes`** (pour l'alerte « existe déjà »), choix des colonnes (`lireChoixColonnes`), choix de `Semis.Ou`. `Semis` et `Millesimes` sont relus quand on coche « Issu de mes étiquettes ».

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

**Fonctions du commun utilisées** : `tableEnLignes`, `listeChoix`, `enListeChoix`, `normaliser`, `anneeDepuisDate`, `dateEnSecondes`, `lieuxFiltres`, `correspondRecherche`, `lireChoixColonnes`, `colonneGrist`, `creerMessageTemporaire`, `effacerAuClic`, `entierOuNull`, `libelle`, `pluriel`, `aller`, `LISTE_MOIS`.

## 3. Fonctionnalités

### Nouveau millésime
- Variété (champ avec recherche, le Type s'affiche en lecture seule), Nb saisons (`or.` par défaut), année du millésime (année en cours par défaut).
- **Alerte « existe déjà », en direct** : dès que la variété et une année valide sont choisies, une ligne bleue (`texte--info`) indique « Déjà n millésime(s) AAAA pour cette variété : origine (quantité) ; … » pour la **même variété, la même année et la même nature** (sachet ou plante mère). C'est une **information**, jamais un blocage (décision du 28/11, comme « déjà semé en AAAA » dans Semis réalisés). Elle ne regarde **pas** les cartes de la liste (« j'ai les sachets en main »). La liste `etat.millesimesExistants` est lue au démarrage et relue après chaque Enregistrer ; un changement fait ailleurs dans Grist n'est vu qu'au rechargement.
- **Origine obligatoire, une seule au total** : les 6 premiers choix de `Origine` sont des pastilles (`NB_FAVORIS`), suivies d'un bouton « Autre origine » qui ouvre un panneau avec le menu des autres origines et **« ➕ Nouvelle origine… »**. Une seule valeur `etat.millesime.origine`. Une nouvelle origine est ajoutée aux choix de `Millesimes.Origine` dans Grist et sélectionnée ; une origine déjà existante (casse ou accents près) est simplement sélectionnée.
- **Sachet** ou **Plante mère** (cases exclusives) :
  - Sachet : quantité de graines obligatoire (entier ≥ 1). `Nb_sachets` = 1, `Nb_plants` vide.
  - Plante mère : année de plantation, **nombre de plants** (entier ≥ 1), **type de plant** (si la colonne a des choix) et **emplacement(s)** (au moins un, champ avec recherche, pastilles violettes), tous obligatoires. `Nb_plants` = nombre de plants, `Nb_sachets` vide.
- **Champs numériques** (année du millésime, quantité, sachets réels, année de plantation, nombre de plants) : champs **texte** (`type="text" inputmode="numeric"`), contrôlés dans le JS ; une saisie qui n'est pas un entier donne un message d'erreur et rien n'est ajouté.
- **Années** : 4 chiffres, de `ANNEE_MIN` (2000) à l'année en cours.
- **« Ajouter à la liste »** (bouton orange `btn--grand btn--etape`) : contrôles de saisie, puis une carte est ajoutée dans `etat.aEnregistrer` ; **rien n'est écrit dans Grist**. Ensuite (`viderSaisieMillesime`) : sont **gardés** l'année, l'origine, le nombre de saisons et la nature (sachet / plante mère) ; sont **vidés** la variété, la quantité, les sachets réels, les champs de plante mère, la ligne d'étiquettes choisie et le bandeau ; le curseur retourne dans « Variété ».
- Le bouton **« ↩ Réinitialiser »** (en haut du formulaire, à droite du titre) remet tout le formulaire à zéro et relit les étiquettes en attente. Il ne touche pas à la liste.
- **Convention « une ligne `Semis` par plante mère »** : créée avec `Plantes` = nombre de plants, `Ou` = emplacements, `Date_s` = 1er janvier de l'année de plantation, `Nb_etiquettes` = 0, sans godets ni graines renseignés. C'est ce qui permet à `a_gerer` de la reconnaître.
- `Controle_mere` et `Statut_mere` ne sont **jamais** écrits sur `Millesimes`.

### Liste « À enregistrer »
- Une carte orange (`carte carte--etape`) par millésime : variété + type, année, origine, saisons (« original » pour `or.`), quantité de graines **ou** plants / année de plantation / emplacements, « don : n sachet(s) » s'il y en a. ✕ retire la carte (`retirerDeLaListe`).
- Le statut de l'en-tête passe à « ● Non sauvegardé (n) » ; le bouton « En cours (n) » (orange) descend sur les cartes.
- **Perdue au rechargement** : voulu (règle du mémo).
- Une ligne d'étiquettes **prise par une carte** n'est plus proposée dans le menu (`optionsAttente` la filtre) ; elle revient si la carte est retirée.
- **Enregistrer** (`btn--enregistrer btn--grand`) : voir « Ordre des opérations ».

### « À reproduire » (décochage automatique)
Le besoin de produire des graines concerne une variété : la case est `Varietes.A_reproduire` (colonne de données). `Semis.A_produire` est une formule `$NomVariete.A_reproduire` (lue par le Plan, jamais écrite).
- À l'enregistrement, le second envoi contient `['UpdateRecord', 'Varietes', varId, { A_reproduire: false }]` **une fois par variété distincte** de la liste, pour tous les types de millésime et **toutes les origines**. Écrit sans relecture : si la case est déjà vide, Grist ne change rien.
- `chargerVarietes` lit `A_reproduire` (`aReproduire`) **seulement pour le message** ; après l'enregistrement, `v.aReproduire = false`.
- Message : « 3 millésimes enregistrés · « À reproduire » décoché pour 2 variétés » (la 2ᵉ partie seulement si des variétés étaient cochées au chargement).
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
- **Graines à identifier** : un seul bouton, « ➕ Créer la variété » (pour créer une espèce, passer par la table `Especes`). Il **ouvre la section Variété** et descend dessus ; la note préremplit le nom (modifiable). Le bandeau de la section indique le nombre d'étiquettes (`etat.bandeaux.variete = { nb }`). Après la création, on redescend au millésime : variété présélectionnée, `or.`, sachets réels prérempli ; reste l'origine et la quantité.
- **Nettoyage à l'enregistrement** : `Etiq_en_attente` est vidé ; la ligne est **supprimée** seulement si c'est une ligne de transit (ni `Date_s`, ni `Nb_graines`, ni `Nb_godets`, ni `Germes`, ni `Plantes`, et `Nb_etiquettes` ≤ 0). Le caractère « transit » est calculé **au chargement de la liste** (`chargerSemisEnAttente`, champ `transit`), sans relecture. Un vrai semis ou la ligne d'une plante mère n'est jamais supprimé. La carte garde `{ id, transit }` de sa ligne.
- La case reste cochée après « Ajouter » et après « Enregistrer » ; la liste des lignes est relue après Enregistrer (`rafraichirEtiquettes`).

### Nouvelle variété
- Section **repliable** : `etat.varieteOuverte` (faux au chargement), bouton Masquer / Afficher (largeur fixe `.reserve`), contenu dans un `<div v-show>`. Le bouton « ➕ Nouvelle variété » de l'en-tête l'ouvre et descend dessus (`ouvrirVariete()` = ouvrir + `aller('appVariete')`) ; il est orange tant qu'elle est ouverte. La saisie d'une variété à moitié remplie reste en mémoire tant que la page n'est pas rechargée.
- **Rien d'obligatoire sauf le nom.**
- Modèle de base (champ avec recherche, copie les champs de l'**espèce** choisie, pas le nom), Nom + Variété, champs communs, Description. `NomVariete` = `Nom\nVariété` (ou `Nom` seul). `Num_epingle` est envoyé à `null` (vide, pas 0). Doublon sur Nom + Variété (sans casse ni accents), affiché en direct pendant la saisie, avec « Créer quand même » / « Annuler » (`creerVariete(forcer)`).
- **Champs communs** (écrits directement dans la section) : Type, Exposition, Arrosage, Conservation, Famille ; profondeur, durée et température de germination, mois de semis sous abri / pleine terre / récolte ; nature et qualité du sol, où cultiver, **où semer** ; Infos.
- **Contrôles des champs numériques** (messages qui restent affichés jusqu'au prochain clic) : conservation et durée de germination = entiers ; profondeur = nombre ou fourchette, `1 cm` devient `1`, les tirets longs deviennent `-`, le point devient une virgule.
- **Listes de choix** (lues dans `Varietes`, choix vides ignorés au chargement) : pastilles pour les mois, Famille, nature et qualité du sol, où cultiver, où semer. Champ avec recherche pour les **Infos**, avec **« ➕ Nouvelle info… »** : l'info est ajoutée aux choix de `Varietes.Infos` seulement, et sélectionnée.
- **Après la création** (toujours, plus de case « Enchaîner » depuis le 28/11) : la variété est présélectionnée dans le millésime, un bandeau l'annonce (`etat.bandeaux.millesime`), et la page redescend sur le millésime (`aller('appMillesime')` dans un `Vue.nextTick`). La section Variété reste ouverte, vide.

### Messages
Tous dans l'en-tête (comme Semis réalisés) : succès `etat.succes` (4 s, `afficherSucces`), erreur `etat.erreur` (reste jusqu'au prochain clic), erreur de chargement `etat.erreurChargement`. `dire(texte, erreur = false)`. Plus de message par panneau.

## 4. Choix techniques

- **Quatre zones Vue** (`#appEntete`, `#appEnCours`, `#appVariete`, `#appMillesime`), **aucun composant**, comme À gérer et Semis réalisés : une seule mécanique à comprendre (choix du 26/11). Les zones partagent le même `etat`, ce qui permet l'enchaînement de l'une à l'autre. Chaque bloc est un `<section>` **dans** sa zone ; chaque zone a son propre `return` (ne mettre que ce qu'elle utilise). `aller` et `ouvrirVariete` sont dans le `return` de `#appEntete` (boutons de navigation).
- **État** : un objet `etat` réactif. Formulaires `etat.variete`, `etat.millesime` ; fabriques `champsVides()` et `millesimeVide()` pour les réinitialiser. Listes : `especes`, `varietes`, `millesimesExistants`, `semisEnAttente`, `aEnregistrer`. Choix Grist : `choixVariete`, `choixOrigine`, `choixTypePlant`, `lieux`. Indicateurs : `varieteOuverte`, `charge`, `enregistrement`, `menuOuvert`, `parcoursLigne`.
- **Menus et choix écrits à la main** (fonctions en section 4 du JS) :
  - **choix unique** (Nb saisons, Type, Exposition, Arrosage, origine « autres », type de plant, ligne d'étiquettes) : `<div class="menu">` + bouton + `<ul class="menu__liste">`. `etat.menuOuvert` donne le nom du menu ouvert (un seul à la fois) ; `basculerMenu(nom)`, `choisir(objet, cle, valeur)`, `libelleDe(options, valeur)`. Un écouteur sur `document` ferme le menu au clic ailleurs ;
  - **champ avec recherche** (variété du millésime, modèle de base, infos, emplacements) : texte tapé dans `etat.recherches[nom]` ; `ouvrirRecherche`, `saisirRecherche`, `fermerRecherche`, `choisirRecherche`. Résultats par `chercher(options, saisie)` (40 au plus, `LIMITE_RECHERCHE` ; valeurs calculées `resultatsVariete`, `resultatsEspece`) ou `lieuxFiltres` (valeurs calculées `infosProposees`, `lieuxProposes`) ;
  - **pastilles** : `v-for` + `basculerDans(liste, valeur)` (modifie la liste sur place) ; pour les listes avec recherche, `ajouterDans(nom, liste, valeur)` ;
  - **ajout d'un choix** (origine, info) : `etat.ajout = { cible, texte, enCours }`, `ouvrirAjout(cible)`, `annulerAjout`, `validerAjout` ;
  - `sansVides(liste)` ignore les choix vides de Grist, appliqué au chargement dans `demarrer`.
- **Ajout d'un choix dans Grist** : `ajouterChoixColonne` relit les réglages de la colonne, ajoute le choix et écrit avec `ModifyColumn` (`widgetOptions`) ; les autres réglages sont conservés. Candidate au passage dans `scriptcommun.js` (avec `existeDeja`) si un autre outil en a besoin.
- **Format ChoiceList** : `enListeChoix(valeurs)` (commun) / `listeChoix` à la lecture.
- **Dates** : `Millesime` et `Date_s` en secondes UTC, au 1er janvier (`dateEnSecondes(annee + '-01-01')`), lues avec `anneeDepuisDate`.
- **Où sont les textes** : libellés fixes, bandeaux d'enchaînement, avertissements, encarts de doublon de variété et « Don : N sachet(s) » dans le HTML ; messages après une action et libellés de listes dans `TEXTES` (en haut de `achatrepro.js`).
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

Achatrepro, à l'enregistrement de la liste (second envoi) :
  - vide Etiq_en_attente de la ligne choisie par la carte ;
  - supprime la ligne si c'est une ligne de transit
    (sans Date_s, Nb_graines, Nb_godets, Germes, Plantes, et Nb_etiquettes <= 0).
```

Si tu modifies l'un des deux outils, vérifie ce contrat : c'est lui qui évite de perdre des étiquettes imprimées.

### Ordre des opérations
**« Ajouter à la liste »** (`ajouterALaListe`) : contrôles de saisie (variété, année sur 4 chiffres, origine, nature, quantité ou année de plantation + nombre de plants + type de plant + emplacements) ; contrôles « étiquettes » (ligne choisie si la case est cochée, sachets réels ≥ 1) ; la variété doit exister dans `etat.varietes` ; carte poussée dans `etat.aEnregistrer` ; saisie partiellement vidée. Aucun accès à Grist.

**« Enregistrer »** (`enregistrerTout`) :
1. Rien si la liste est vide ou si un enregistrement est en cours.
2. **Premier envoi** : un `AddRecord` `Millesimes` par carte (avec `Don` si > 0), tous dans le même `applyUserActions` ; Grist renvoie les identifiants dans l'ordre (`retValues`). Erreur : message rouge, **rien n'est écrit, les cartes restent**.
3. La liste est **vidée** (les millésimes existent : pas de doublon possible si la suite échoue).
4. **Second envoi, un seul pour tout le reste** : `A_reproduire` décoché (une fois par variété distincte), nettoyage de la ligne d'étiquettes de chaque carte (`actionLigneEtiquettes`), ligne `Semis` de chaque plante mère (avec l'identifiant du millésime). **Pas d'annulation** s'il échoue : `TEXTES.suiteEchouee` dit quoi vérifier.
5. `v.aReproduire = false` en local, `chargerMillesimes()` (alerte), `rafraichirEtiquettes()`, message « n millésimes enregistrés ».

Ctrl+Z dans Grist défait le second envoi, puis le premier : **deux Ctrl+Z** pour défaire toute la série.

### Dépendances avec les formules Grist
- `a_gerer` reconnaît une ligne de plante mère avec `millesimeId > 0`, godets = 0 et graines = 0 ; il lit `Ou` pour l'emplacement et `Nb_plants` pour l'effectif.
- Une ligne `Semis` sans `Date_s` ne perturbe pas `Germination_2026`, `Annees_sans_test`, `Dernier_semis`, `Deja_seme_cette_annee` ni `En_production`.
- L'outil « Semis réalisés » écrit aussi dans `Millesimes` (case « Sachet vidé » : `Qtte_graines` et `Nb_sachets` à `null`).

## 5. Pièges rencontrés

- **Copier-coller** : un `return` grignoté a supprimé un contrôle ; un bloc remplacé au mauvais endroit a laissé deux champs avec le même `id` ; un `=` à la place d'un `<=` a modifié la longueur d'une liste. Après chaque modification, relire le bloc autour.
- **Restes après une suppression** (28/11) : une ligne `afficherMessage` et deux `<p>` de l'ancien message par panneau étaient restés, inoffensifs mais morts. Après chaque retrait, Ctrl+Maj+F sur **tous** les noms retirés (0 résultat).
- **Noms recopiés de mémoire** : un remplacement proposé avec une ancienne constante (`COLONNES_CHOIX_ESPECE` au lieu de `COLONNES_CHOIX`) ne correspond à rien dans le fichier. Toujours partir du fichier réel (redéposé dans le projet).
- **Classes renommées** dans le commun : vérifier les règles locales qui s'y appuient (`achatrepro.css` est chargé après le commun).
- **Chemins et cache** : après un déplacement de dossiers, vérifier l'URL du widget dans Grist, les chemins relatifs du HTML, puis recharger de force. `KeyError 'Sachets'` venait d'une ancienne copie encore exécutée.
- **Champ numérique et lettres** : `type="number"` renvoie une valeur vide pour `abc`, donc aucune erreur : champ texte + contrôle.
- **Oubli dans le `return` d'une zone** : `Property "xxx" was accessed during render`, la zone disparaît. Chaque zone n'a que ce qu'elle utilise ; une fonction appelée par le HTML d'un bloc (ou un bouton de l'en-tête : `aller`, `ouvrirVariete`) doit être dans le `return` de **cette** zone.
- **Colonne absente d'une table** : `KeyError` (cas de `Semis_GPT`). Les colonnes écrites par `colonnesCommunes` doivent exister dans `Varietes`.
- **Les `watch` s'enchaînent** : `etat.ligneAttenteId` déclenche `chargerLigneAttente` ; `viderSaisieMillesime` remet cet id à vide, ce qui déclenche aussi `annulerLigneAttente` (même résultat, sans effet de bord). `chargerLigneAttente` écrit l'année, ce qui déclenche le `watch` de l'année. L'origine choisie referme le panneau « Autre origine ».
- **`aller` juste après un changement de l'écran** : une section qui change de hauteur déplace ce qui est dessous. D'où `Vue.nextTick(() => aller('appMillesime'))` après la création d'une variété.
- **`parcoursLigne` reste vrai si le trajet est abandonné** : remis à faux dans `annulerLigneAttente`, `chargerLigneAttente`, `reinitialiserMillesime`, `viderSaisieMillesime` et à l'arrivée dans Millésime.
- **Deux envois, pas un** : la ligne `Semis` d'une plante mère a besoin de l'id du millésime tout juste créé. D'où la liste vidée entre les deux : si le second échoue, un nouvel « Enregistrer » ne doit pas recréer les millésimes.
- **Une carte garde des copies** (nom, type de la variété, `ligne: { id, transit }`) : l'affichage ne dépend pas d'une relecture. Si une variété est modifiée ailleurs entre « Ajouter » et « Enregistrer », la carte l'ignore (limite acceptée).
- `ORIGINE_PRODUCTION` doit correspondre exactement à un choix de la colonne `Origine`.
- **`Note_attente` doit être une colonne de données** (pas une formule).
- **Lecture de `Semis.Ou` en échec** : message dans l'en-tête, création d'une plante mère impossible ; le reste fonctionne.
- **`Nb_godets` / `Nb_graines` à 0, pas vides**, sur la ligne de plante mère : normal, `a_gerer` l'accepte.
- **Renommage global** (`modele` → `espece`, `semisGpt` → `ouSemer`) : Remplacer dans les fichiers, casse respectée, dans l'ordre `MODELE`, `Modele`, `modele` ; les textes accentués (« Modèle de base ») ne bougent pas.
- **Messages de la console sans gravité** : « Erreur de sécurité … file:/// » (Live Server), « accès partitionné à un cookie ou au stockage » (Firefox), messages RPC de Grist.

## 6. Procédure de passage en prod (checklist)

1. Sauvegarder les fichiers prod actuels de tous les outils concernés et le document de prod.
2. Aligner la structure Grist de prod sur celle de test (section 2) : `Especes`, `Semis_profondeur` en Texte, `Ou_semer`, `Varietes.A_reproduire`, `Nb_sachets` numérique, `Nb_plants`, `Type_plant` avec ses choix, `Etiq_en_attente` et `Note_attente` en colonnes de données.
3. Vérifier que `scriptcommun.js` (avec `enListeChoix`, `entierOuNull`, `aller`) et `styles_communs.css` (avec `.page`, `.reserve`, `.texte--info`, `.groupe` sans marge) sont à jour en prod. Commun d'abord.
4. Copier `achatrepro.html`, `achatrepro.js` et `achatrepro.css`, **supprimer `achatrepro_textes.js`** de la prod, puis (si l'outil d'étiquettes a changé) copier aussi ses fichiers : le contrat les lie. Vérifier l'URL du widget dans Grist.
5. Tester : une série de 3 cartes (un sachet, une plante mère, une ligne d'étiquettes avec dons) puis Enregistrer (Millesimes, Semis, `A_reproduire` décoché, ligne d'étiquettes vidée ou supprimée, deux Ctrl+Z pour défaire) ; l'alerte « existe déjà » (année en cours, autre année, plante mère) ; ✕ qui retire une carte (la ligne d'étiquettes revient dans le menu) ; la section Variété (Afficher / Masquer, « ➕ Nouvelle variété » de l'en-tête, création puis retour au millésime, doublon « Créer quand même ») ; « Issu de mes étiquettes » (ligne de transit, vrai semis, plante mère avec changement d'année, ligne sans variété) ; des saisies non numériques dans chaque champ ; l'ajout d'une origine et d'une info (puis supprimer les valeurs de test) ; chaque menu et chaque champ de recherche.
6. Supprimer les lignes de test dans Grist.

## 7. Reste à faire / idées

- [ ] Pousser la refonte en prod (section 6).
- [ ] `Especes.Date_creaction` : faute de frappe dans le nom de la colonne (les autres tables ont `Date_creation`).
- [ ] Doublons de plante mère : comparer sur l'**année de plantation** plutôt que l'année du millésime, si l'usage le demande.
- [ ] Étiquette : le texte « Récolte : » est prérempli avec l'année précédente en janvier-février, sinon l'année en cours (outil étiquettes) : cohérent avec Achat-repro tant que l'année du millésime saisie est la bonne.
- [ ] Graines à identifier : l'origine n'est jamais devinée ; envisager `Monjardin` par défaut.
- [ ] Doublon de **variété** : il garde « Créer quand même » / « Annuler » ; l'aligner sur le millésime (simple information) si ça gêne.
- [ ] Après la création d'une variété, la section Variété reste ouverte : la refermer automatiquement si ça devient pénible.
- [ ] Choix dupliqués entre `Especes`, `Varietes` et `Millesimes` (Famille, Infos…) : liste unique plus sûre, mais chantier Grist.
- [ ] Rapprochements avec le commun : `ajouterChoixColonne`, `existeDeja`, `sansVides`, `basculerDans`, `chercher` ; menus d'Achat-repro (`etat.menuOuvert`, `etat.recherches`) et ceux d'À gérer (`ouvertOu`) à unifier si un outil est repris ; `.encart--cote`, `.pastille--choix`, `.badge`, `.champ--deroulant`.
- Abandonné : fusionner la quantité dans un millésime existant (deux sachets = deux lignes, le second va à la boîte à dons).
- Abandonné : plusieurs origines par millésime (une seule, décision du 25/10/2026).
- Abandonné : créer l'espèce automatiquement à la création d'une variété ; panneau « Nouvelle espèce » (retiré le 25/11).
- Abandonné : alerte de doublon qui regarde aussi les cartes de la liste (« j'ai les sachets en main », 28/11).
- Clos : décocher `A_reproduire` seulement pour certaines origines (toujours décoché).
- Clos : écart de Nb saisons entre l'étiquette et le millésime d'une plante mère (corrigé le 25/11).
- Clos : composants Vue (remplacés par des zones et des fonctions, 26/11).
- Clos : onglets, case « Enchaîner », messages par panneau, blocage au doublon de millésime (28/11).

### Sachets de mélange
Décidé le 25/11 : un sachet de mélange de variétés = **une variété « Espèce - Mélange »** (ex. « Tournesol - Mélange », contenu décrit dans la Description) avec un seul millésime par sachet ; les variétés contenues restent dans `Varietes` sans sachet ; à la récolte, millésime « Monjardin » sur la variété reconnue, sinon sur le mélange. La case `Millesimes.Melange` a été supprimée le 26/11 : Achat-repro ne l'utilisait pas.

## 8. Refontes des 25, 26 et 28/11/2026

**25/11, « sans Ferrari »** (alignement sur le mémo, étapes testées une à une) :
1. `creerMillesime` : plus de relecture de la ligne d'étiquettes (champ `transit` calculé au chargement, `actionLigneEtiquettes`) ni d'annulation du millésime si le second envoi échoue ; `TEXTES.suiteEchouee` dit quoi vérifier.
2. Doublon du millésime : contrôle au clic seulement (remplacé le 28/11, étape 17).
3. Nombres en champs texte avec contrôle entier ; `donSachets` et `nbPlants` passent par `entierOuNull` ; tutoiement des bandeaux.
4. `achatrepro_textes.js` supprimé ; `semisGpt` renommé `ouSemer`.
5. `modele(s)` renommé `espece(s)`.
7. Panneau « Nouvelle espèce » retiré (`creerEspece`, `reinitialiserEspece`, `allerCreerEspece`, `doublonsEspece`, `especeCreee`, onglet et section HTML).
8. Allègements : plus de lecture ni d'écriture des choix de `Especes` (`ajouterInfo` n'écrit que dans `Varietes.Infos`) ; une seule liste `optionsAttente` ; bandeau « graines à identifier » réduit à `{ nb }`.
9. `saisonsPourLigne(l, anneeRef)` : le Nb saisons d'une plante mère se compte jusqu'à l'année du millésime saisi, recalculé par un `watch`.

**26/11, une seule mécanique** (même structure qu'À gérer, aucun composant) :
10. `champs-culture` remis directement dans le panneau Variété (`MOIS_VALEURS`, `ajouterInfo`).
11. `ajout-choix` remplacé par `etat.ajout` et `ouvrirAjout` / `annulerAjout` / `validerAjout`.
12. `choix-unique` remplacé par des menus écrits dans le HTML (`etat.menuOuvert`, `basculerMenu`, `choisir`, `libelleDe`) ; les choix vides sont ignorés au chargement (`sansVides`).
13. `choix-recherche` remplacé par `etat.recherches`, `chercher` et les fonctions `…Recherche`.
14. `choix-multiple` remplacé par des `v-for` (`basculerDans`, `ajouterDans`).
15. Découpage en zones Vue partageant `etat`, chacune avec son `return`.

**28/11, page « comme Semis réalisés »** (étapes testées une à une) :
16. Alerte « existe déjà » en direct : `etat.millesimesExistants`, `chargerMillesimes`, valeur calculée `millesimesMemeAnnee` (variété + année + nature), ligne bleue dans le HTML.
17. Blocage au doublon retiré : `trouverDoublonsMillesime`, `etat.doublonsMillesime`, `doublonMillesimeMasque`, le `watch` qui les effaçait, `creerMillesime(forcer)`, `TEXTES.detectionImpossible`, l'encart « Créer quand même » du millésime.
18. Messages dans l'en-tête : `etat.succes` / `etat.erreur` (texte), `dire(texte, erreur)` ; plus de `etat.message`, `panneauMessage` ni de paramètre `panneau`.
19. Case « Enchaîner automatiquement » retirée (`etat.chaine`) : l'enchaînement variété → millésime est toujours actif.
20. Onglets remplacés par une section Variété repliable (`etat.varieteOuverte`, `ouvrirVariete`, `aller`) ; navigation de l'en-tête « ➕ Nouvelle variété » / « Nouveau millésime ».
21. Section Variété remontée en haut de la page ; `<main class="page">`.
22. Ménage : `afficherMessage` et les deux `<p>` `panneauMessage` de la zone Variété retirés (restes de l'étape 18).
23. « Ajouter à la liste » : `etat.aEnregistrer`, `ajouterALaListe`, `viderSaisieMillesime`, `retirerDeLaListe`, zone `#appEnCours` (cartes), statut « Non sauvegardé (n) / À jour », bouton « En cours (n) » ; `optionsAttente` exclut les lignes déjà prises.
24. « Enregistrer » (`enregistrerTout`) : deux envois pour toute la liste ; `creerMillesime`, `TEXTES.millesimeCree` retirés ; `TEXTES.millesimesEnregistres`.

## 9. Si tu veux un widget plus petit

Ce ne sont plus des nettoyages mais des décisions :
- retirer le trajet « Graines à identifier » (`parcoursLigne`, `allerCreerVariete`, un bandeau), si tu l'utilises peu ;
- retirer le doublon de variété en direct (une valeur calculée et son `watch`) ;
- retirer la gestion des plantes mères si elle passe un jour entièrement par À gérer. C'est le plus gros gain, mais aussi la fonctionnalité la plus riche.