# Outil « Sélection pour étiquettes » (Granothèque Grist)

## Rôle

Choisir, dans une liste filtrable, les **plants plantés au jardin** et les **plantes mères plantées**, puis saisir un nombre d'étiquettes. Ce nombre est **ajouté** à `Semis.Nb_etiquettes`. L'impression est faite par un autre widget.

## Fichiers

| Fichier | Rôle |
|---|---|
| `gestion_etiquettes.html` | Page du widget |
| `../styles/gestion_commun.css` | CSS commun à tous les outils (variables, champs, boutons, etapeintermediaires, messages, confirmation) |
| `../styles/gestion_etiquettes.css` | CSS propre à cet outil |
| `../script/gestion_etiquettes.js` | Logique |

- Deux versions : dev et prod. On teste en dev, puis on recopie en prod.
- Ordre des feuilles de style dans le HTML : `gestion_commun.css` d'abord, puis `gestion_etiquettes.css`.
- Version dans les URL (`?v=N`) à incrémenter à chaque modification (cache).
- `aria-label` est vide sur le champ de recherche.

## Intégration Grist

- Widget personnalisé sur la table **Semis**.
- `grist.ready({ requiredAccess: 'full' })` : nécessaire pour écrire.
- Chargement par `grist.docApi.fetchTable('Semis')`, comme les autres outils (pas de `onRecords` ni de mapping).
- Toutes les colonnes utiles sont déjà sur Semis (colonnes formules comprises) : aucune autre table n'est lue.

## Colonnes

- **Lues** : `Nom`, `Variete`, `Annee_graine`, `Plantes`, `Date_p`, `Ou` (ChoiceList), `Positions` (chargée, non affichée), `Nb_etiquettes`, `Etiq_en_attente`, `Plante_mere`, `Annee_plantation_mil`.
- **Écrite** : uniquement `Nb_etiquettes`. Rien d'autre n'est modifié.

## Règles de sélection (`entreesEtiquetables()`)

- **Plant** : `Plantes > 0`. `Oups`, `Don_p`, `Reste_a_planter` sont ignorés.
- **Plante mère** : `Plante_mere` vrai **et** `Annee_plantation_mil` renseignée.
- Chaque entrée = **une ligne de Semis précise** : aucune ambiguïté sur la ligne qui reçoit `Nb_etiquettes`.
- Aucune ligne n'est créée ni supprimée. Une plante mère doit avoir une ligne Semis pour apparaître.

## Logique de couleurs

| Couleur | Signification | Où dans l'outil |
|---|---|---|
| Neutre (fond de page, bordure grise) | Entrée sans information | Cartes de « À étiqueter » |
| Bleu (`.cadre-info`) | Info à jour, déjà en base | Cadre « X à imprimer · Y imprimées en attente » dans la carte |
| Orange (`.etape-intermediaire`, `.btn-ajouter`, `.etape-intermediaire-nb`) | En cours, pas encore enregistré | Section « En cours », bouton « Voir les « En cours » » |
| Rouge (`--erreur`) | Attention / erreur | ⚠ dans « En cours », message d'échec |
| Vert-jaune (`--plantemere`) | Catégorie plante mère | Liseré à gauche de la carte (`.semis.plantemere`) et ligne « 🌱 Plante mère (plantée en AAAA) » (`.semis-plantemere`) |

Les cartes ne changent **jamais** de couleur à la saisie. Le fond d'une carte reste toujours neutre.

## Fonctionnalités

### Liste « À étiqueter »
- Triée par nom (puis par id), format `Nom — Variété`.
- Structure d'une carte (`<li class="semis">`, en flex) :
  - à gauche `.semis-texte` : variété, ligne plante mère (si besoin), détail (« N plantés le JJ/MM/AAAA », « graines AAAA », « Où : … »), cadre bleu (si besoin) ;
  - à droite : petit champ numérique `.champ.champ-etiquettes` (~4,5 rem), centré verticalement.
- Cadre bleu = **deux éléments imbriqués** : un `div.cadre-info` (le cadre, `inline-block`, largeur du contenu) qui contient un `div.cadre-info-titre` (le texte bleu foncé gras).
- Plante mère : classe `plantemere` sur le `<li>` (liseré) + `div.semis-plantemere`.
- Champ : entier strictement positif. Toute autre valeur (vide, 0, négatif, décimal) supprime le etape-intermediare.

### Recherche
- À la frappe, insensible aux accents et à la casse, plusieurs mots dans n'importe quel ordre, sur nom + variété.
- Titre « À étiqueter (N) » ou « (x sur N) » pendant le filtrage, plus compteur dans l'en-tête.
- Les etapeintermediaires survivent au filtrage (le champ est rempli depuis `etapeintermediaires`).

### Section « En cours » (orange)
- Entre la recherche et « À étiqueter », visible seulement s'il y a au moins un etape-intermediare.
- Titre « En cours (n) » et bouton **Enregistrer** (sans compteur, comme les autres outils).
- Chaque ligne : variété (🌱 devant si plante mère, option), puis le Où, puis « + x étiquettes » en orange, puis un ⚠ rouge si la ligne a déjà des étiquettes à imprimer ou en attente (anti-doublon).
- ✕ : retire le etape-intermediare **à l'écran uniquement** (rien dans Grist) et vide le champ de la ligne dans la liste.
- Seule cette section est redessinée à chaque saisie (`afficherEtapeIntermediaire()`), pas la liste, pour que le champ garde le focus.

### Barre flottante en bas (`#barreFlottante`, sticky)
- Contient le message de succès (disparaît seul après 5 s) et le bouton orange **« Voir les « En cours » (n) »**.
- Ce bouton n'apparaît que s'il y a des etapeintermediaires **et** que la section « En cours » est hors de l'écran (`IntersectionObserver`). Au clic : défilement doux vers la section.

### Statut
- En-tête : « ✓ À jour » ou « ● Non sauvegardé (n) ». Alerte du navigateur à la fermeture s'il y a des etapeintermediaires.
- `majStatut()` appelle `afficherEtapeIntermediaire()`.

## Enregistrement (`enregistrerTout`)

1. Relit Semis (`chargerSemis()`) pour avoir les valeurs **actuelles** de `Nb_etiquettes`.
2. Calcule `Nb_etiquettes actuel + saisie` (vide = 0).
3. Écrit en un seul `BulkUpdateRecord` sur `Nb_etiquettes`.
4. Vide les etapeintermediaires, affiche le succès, recharge et réaffiche la liste.

En cas d'échec : message rouge, etapeintermediaires conservés. Une ligne supprimée entre-temps est ignorée.

## Cohabitation avec les autres outils (validée)

- **Etiquettes sur sachets** : lit `Nb_etiquettes > 0`, imprime, puis `Etiq_en_attente += Nb_etiquettes` et `Nb_etiquettes = 0`. La relecture avant écriture évite tout conflit.
- **achatrepro** : lit et vide `Etiq_en_attente`, supprime les lignes de transit/vierges. Notre outil ne crée aucune ligne.
- **Gestion des semis** : gère germes, plantés, emplacements. Notre outil ne touche pas ces colonnes.

Test de bout en bout validé : saisie → impression → retour (cadre bleu « imprimées en attente ») → nouvelle saisie (3 et non 5, `Etiq_en_attente` intact).

## Conventions respectées

Variables en français, état global en haut du fichier, `modifie` + `majStatut()`, `recordsParId` (Map), utilitaires `tableEnLignes` / `normaliser` / `listeChoix` / `dateAffichee`, `confirmer()` prévue dans le HTML/CSS commun (non utilisée).

## Pièges rencontrés

- **Cache JS/CSS** : Ctrl + Maj + R, ou `?v=N` dans les URL (tablette).
- **`hidden` et CSS** : une règle `display` peut l'emporter sur `hidden`, d'où `[hidden] { display: none !important; }` (dans le CSS commun).
- **`.etape-intermediaire` du CSS commun** : orange et flexible. À appliquer seulement aux lignes de « En cours », jamais aux cartes de la liste.
- **`className = '...'` écrase** les classes existantes : changer la classe d'un cadre lui fait perdre son style (cas du cadre bleu).

## Choix écartés

- `onRecords` + `mapColumnNames` : remplacé par `fetchTable`.
- Colonne `Disparue` sur les plantes mères : non ajoutée.
- Affichage de `Positions` : retiré, `Où` suffit.
- Recherche collée en haut (sticky) : non retenue.
- Bouton Enregistrer flottant avec compteur : remplacé par Enregistrer dans « En cours » + bouton flottant « Voir les En cours ».
- Liste séparée des étiquettes déjà à imprimer : écartée (doublon), remplacée par le cadre bleu.
- ⚠ orange dans la carte : remplacé par le cadre bleu (orange réservé aux etapeintermediaires).
- Fond coloré pour les plantes mères : écarté (conflit avec bleu et orange), liseré retenu.

## Reste à faire / pistes

- [ ] Mettre la version prod à jour avec les derniers HTML/CSS/JS (avec `?v=N`).
- [ ] Peaufiner le CSS de détail (espacements, couleur du ⚠, `margin-top` du cadre bleu).
- [ ] Vérifier le contraste du texte `--plantemere` en plein soleil ; sinon ajouter `--plantemere-fonce` (#5f7a00) pour les textes.
- [ ] Décider du sort de `#message` (diagnostic) : garder discret ou supprimer.
- [ ] Retirer le `console.log` de trace dans `afficherSucces` s'il y est encore.
- [ ] Liste longue : envisager un affichage réduit (limite de lignes, « Afficher tout »).
- [ ] Plantes mères mortes ou arrachées : aucun statut aujourd'hui. Piste : colonne `Millesimes.Disparue` (Bool) répercutée sur Semis.
- [ ] Éventuellement une confirmation avant enregistrement via `confirmer()`, ou un bouton « Tout retirer ».
## Évolutions depuis la dernière version

### Vue.js
- Vue 3 chargé par CDN (`vue@3.4.38`) en fin de `<body>`, avant `grist-plugin-api.js` et le JS de l'outil.
- Tout l'affichage est dans `<div id="appSelection">` : liste, section « À ajouter », barre flottante, message, confirmation.
- Le HTML décrit l'affichage (`v-for`, `v-if`, `v-show`, `:class`, `:value`, `@click`, `@input`, `{{ }}`). Le JS garde les données (`etat`, `brouillons`, `recordsParId`) et les fonctions.
- `etat` (Vue.reactive) en haut du JS : titre, entrees, etapeIntermediaire, etapeVisible, erreur, succes, message, enregistrement, confirmation.
- Toujours en JS classique : `initialiserSaisie` (écouteur sur la liste), `IntersectionObserver`, statut dans l'en-tête (hors de Vue).

### Renommages
| Avant | Après |
|---|---|
| section « En cours » / brouillons | « Étape intermédiaire » / « À ajouter » |
| `#enCours`, `etat.enCours` | `#etapeIntermediaire`, `etat.etapeIntermediaire` |
| `etat.enCoursVisible` | `etat.etapeVisible` |
| `.brouillon*`, `.liste-brouillons` | `.etape-intermediaire*`, `.liste-etape-intermediaires` |
| `afficherEnCours` | `majEtapeIntermediaire` |
| `valeurBrouillon` | `valeurEtapeIntermediaire` |
| `initialiserEnCours` / `voirEnCours` | `initialiserEtapeIntermediaire` / `voirEtapeIntermediaire` |
| `.semis`, `.semis-texte`, `.semis-detail` | `.carte`, `.carte-titre`, `.carte-detail` |
| `.cadre-info-a-jour*` | `.cadre-info*` |
| `.semis-plantemere` | `.carte-mention` + `.texte-plantemere` |

### CSS
- `gestion_commun.css` contient les cartes partagées (`.carte*`), les cadres d'info (`.cadre-info*`), l'étape intermédiaire et la confirmation.
- `.carte-titre .cadre-info` : même cadre bleu, réduit au contenu quand il est dans une carte. Les deux règles s'additionnent.
- Plante mère : liseré à gauche (`.carte.plantemere`) et ligne de texte (`.carte-mention.texte-plantemere`). Ne jamais mettre `.plantemere` comme règle de texte, sinon tout le `li` rétrécit.
- `.erreur` sert aussi au ⚠ (petite taille).
- CSS spécifique : `.champ.champ-etiquettes`, `#etapeIntermediaire`, `#barreFlottante`, `.etape-intermediaire-nb`.
  - les noms réels dans le CSS sont `--ici-*` et `.texte-ici` (et non `--ou-*` / `.texte-ou`) ;


### Supprimé du JS
`initialiserRecherche`, `majBoutonVoir`, `afficherErreurEnregistrement`, `retirerBrouillon`, `enregistrementEnCours`, l'écouteur de ✕ et de « Enregistrer », la colonne `positions`.

### Inchangé
Règles de sélection, écriture de `Nb_etiquettes` uniquement (valeur relue puis additionnée), cohabitation avec les autres outils, logique de couleurs.

### Pièges
- Vue ne gère que ce qui est dans `#appSelection`.
- Saisie invalide (0, -2, 1.5) : le champ est vidé aussitôt par Vue.
- `className =` écrase les classes ; un élément reçoit la somme de toutes les règles qui lui correspondent.
- Cache : Ctrl + Maj + R ou `?v=N`.

## Évolutions : violet, filtres rapides, accessibilité

### Localisation en violet
- Variables dans `:root` de `gestion_commun.css` : `--ou-clair`, `--ou-moyen`, `--ou-fonce`.
- Classe `.texte-ou { color: var(--ou-fonce); }`, placée après `.etape-intermediaire-detail` (sinon le gris l'emporte).
- Le Où a sa propre ligne : `📍 Pot.BC`, dans la carte (`carte-mention texte-ou`) et dans « À ajouter » (`etape-intermediaire-detail texte-ou`).
- `detailEntree` ne contient plus le Où.
- Règle de couleurs : violet = emplacement affiché, orange = en cours de saisie (les pastilles de « Semis réalisés » restent orange).
- Le 📍 évite de dépendre de la couleur seule (soleil, daltonisme).

### Filtres rapides (cases à cocher)
- Deux cases sous la recherche : « Plantes mères » et « Déjà des étiquettes » (à imprimer ou en attente). Elles se cumulent entre elles et avec la recherche.
- `etat.filtreMeres` et `etat.filtreEtiquettes` dans `etat`.
- `v-model="etat.filtreMeres"` lie la case à la donnée dans les deux sens, sans écouteur à écrire.
- `Vue.watch(() => [etat.filtreMeres, etat.filtreEtiquettes], afficherSelection)` : quand une case change, la liste se recalcule.
- Le titre passe à « (x sur N) » dès qu'un filtre est actif.
- CSS spécifique : `.filtres` dans `gestion_etiquettes.css`.

### Accessibilité
- `aria-label` sur la recherche, sur chaque champ « Nb » (avec le nom de la variété) et sur chaque ✕ de « À ajouter ».
- `:aria-label="..."` avec les deux-points : la valeur est calculée par Vue.

### Décisions
- Pas de recherche par lieu dans cet outil.
- Pas de classe `.alerte` pour l'instant : `.erreur` sert au ⚠ et à l'échec d'enregistrement.
- Pas de message « lignes ignorées », pas de souci de contraste du vert plante mère.

### À faire plus tard
- [ ] Rendre `brouillons` réactif + `computed` pour « À ajouter » (supprime `majEtapeIntermediaire` et `valeurEtapeIntermediaire`).
- [ ] Recherche avec `v-model` + liste calculée (supprime `afficherSelection` et `surRecherche`).
- [ ] Utiliser `confirmer()` à l'enregistrement quand une ligne a déjà des étiquettes.
- [ ] Mettre la version prod à jour (chemins, `?v=N`).