# Outil « Sélection pour étiquettes » (Granothèque Grist)

## Rôle

Choisir, dans une liste filtrable, les **plants plantés au jardin** et les **plantes mères plantées**, puis saisir un nombre d'étiquettes. Ce nombre est **ajouté** à `Semis.Nb_etiquettes`. L'impression est faite par un autre widget.

## Fichiers

| Fichier | Rôle |
|---|---|
| `gestion_etiquettes.html` | Page du widget |
| `../styles/gestion_commun.css` | CSS commun à tous les outils (variables, champs, boutons, brouillons, messages, confirmation) |
| `../styles/gestion_etiquettes.css` | CSS propre à cet outil |
| `../script/gestion_etiquettes.js` | Logique |

- Deux versions : dev et prod. On teste en dev, puis on recopie en prod.
- Ordre des feuilles de style dans le HTML : `gestion_commun.css` d'abord, puis `gestion_etiquettes.css`.
- Version dans les URL (`?v=N`) à incrémenter à chaque modification (cache).

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
| Bleu (`.cadre-info-a-jour`) | Info à jour, déjà en base | Cadre « X à imprimer · Y imprimées en attente » dans la carte |
| Orange (`.brouillon`, `.btn-ajouter`, `.brouillon-nb`) | En cours, pas encore enregistré | Section « En cours », bouton « Voir les « En cours » » |
| Rouge (`--erreur`) | Attention / erreur | ⚠ dans « En cours », message d'échec |
| Vert-jaune (`--plantemere`) | Catégorie plante mère | Liseré à gauche de la carte (`.semis.plantemere`) et ligne « 🌱 Plante mère (plantée en AAAA) » (`.semis-plantemere`) |

Les cartes ne changent **jamais** de couleur à la saisie. Le fond d'une carte reste toujours neutre.

## Fonctionnalités

### Liste « À étiqueter »
- Triée par nom (puis par id), format `Nom — Variété`.
- Structure d'une carte (`<li class="semis">`, en flex) :
  - à gauche `.semis-texte` : variété, ligne plante mère (si besoin), détail (« N plantés le JJ/MM/AAAA », « graines AAAA », « Où : … »), cadre bleu (si besoin) ;
  - à droite : petit champ numérique `.champ.champ-etiquettes` (~4,5 rem), centré verticalement.
- Cadre bleu = **deux éléments imbriqués** : un `div.cadre-info-a-jour` (le cadre, `inline-block`, largeur du contenu) qui contient un `div.cadre-info-a-jour-titre` (le texte bleu foncé gras).
- Plante mère : classe `plantemere` sur le `<li>` (liseré) + `div.semis-plantemere`.
- Champ : entier strictement positif. Toute autre valeur (vide, 0, négatif, décimal) supprime le brouillon.

### Recherche
- À la frappe, insensible aux accents et à la casse, plusieurs mots dans n'importe quel ordre, sur nom + variété.
- Titre « À étiqueter (N) » ou « (x sur N) » pendant le filtrage, plus compteur dans l'en-tête.
- Les brouillons survivent au filtrage (le champ est rempli depuis `brouillons`).

### Section « En cours » (orange)
- Entre la recherche et « À étiqueter », visible seulement s'il y a au moins un brouillon.
- Titre « En cours (n) » et bouton **Enregistrer** (sans compteur, comme les autres outils).
- Chaque ligne : variété (🌱 devant si plante mère, option), puis le Où, puis « + x étiquettes » en orange, puis un ⚠ rouge si la ligne a déjà des étiquettes à imprimer ou en attente (anti-doublon).
- ✕ : retire le brouillon **à l'écran uniquement** (rien dans Grist) et vide le champ de la ligne dans la liste.
- Seule cette section est redessinée à chaque saisie (`afficherEnCours()`), pas la liste, pour que le champ garde le focus.

### Barre flottante en bas (`#barreFlottante`, sticky)
- Contient le message de succès (disparaît seul après 5 s) et le bouton orange **« Voir les « En cours » (n) »**.
- Ce bouton n'apparaît que s'il y a des brouillons **et** que la section « En cours » est hors de l'écran (`IntersectionObserver`). Au clic : défilement doux vers la section.

### Statut
- En-tête : « ✓ À jour » ou « ● Non sauvegardé (n) ». Alerte du navigateur à la fermeture s'il y a des brouillons.
- `majStatut()` appelle `afficherEnCours()`.

## Enregistrement (`enregistrerTout`)

1. Relit Semis (`chargerSemis()`) pour avoir les valeurs **actuelles** de `Nb_etiquettes`.
2. Calcule `Nb_etiquettes actuel + saisie` (vide = 0).
3. Écrit en un seul `BulkUpdateRecord` sur `Nb_etiquettes`.
4. Vide les brouillons, affiche le succès, recharge et réaffiche la liste.

En cas d'échec : message rouge, brouillons conservés. Une ligne supprimée entre-temps est ignorée.

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
- **`.brouillon` du CSS commun** : orange et flexible. À appliquer seulement aux lignes de « En cours », jamais aux cartes de la liste.
- **`className = '...'` écrase** les classes existantes : changer la classe d'un cadre lui fait perdre son style (cas du cadre bleu).

## Choix écartés

- `onRecords` + `mapColumnNames` : remplacé par `fetchTable`.
- Colonne `Disparue` sur les plantes mères : non ajoutée.
- Affichage de `Positions` : retiré, `Où` suffit.
- Recherche collée en haut (sticky) : non retenue.
- Bouton Enregistrer flottant avec compteur : remplacé par Enregistrer dans « En cours » + bouton flottant « Voir les En cours ».
- Liste séparée des étiquettes déjà à imprimer : écartée (doublon), remplacée par le cadre bleu.
- ⚠ orange dans la carte : remplacé par le cadre bleu (orange réservé aux brouillons).
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