# Outil « Sélection pour étiquettes » (Granothèque Grist)

## Rôle

Choisir, dans une liste filtrable, les **plants plantés au jardin** et les **plantes mères plantées**, puis saisir un nombre d'étiquettes. Ce nombre est **ajouté** à `Semis.Nb_etiquettes`. L'impression est faite par un autre widget.

## Fichiers

| Fichier | Rôle |
|---|---|
| `selection_etiquettes.html` | Page du widget (copie adaptée du HTML de `gestion_semis`) |
| `../styles/selection_etiquettes.css` | Styles |
| `../script/main_selection_etiquettes.js` | Logique |

Deux versions : dev et prod. On teste en dev, puis on recopie en prod.

## Intégration Grist

- Widget personnalisé sur la table **Semis**.
- `grist.ready({ requiredAccess: 'full' })` : nécessaire pour écrire (Grist n'a pas d'accès « écriture par table »).
- Chargement par `grist.docApi.fetchTable('Semis')`, comme les autres outils. Pas de `onRecords` ni de mapping de colonnes.
- Toutes les colonnes utiles sont déjà sur Semis (colonnes formules comprises) : aucune autre table n'est lue.

## Colonnes lues (table Semis)

`Nom`, `Variete`, `Annee_graine`, `Plantes`, `Date_p`, `Ou` (ChoiceList), `Positions` (chargée mais non affichée), `Nb_etiquettes`, `Etiq_en_attente`, `Plante_mere`, `Annee_plantation_mil`.

## Colonne écrite

**Uniquement `Nb_etiquettes`**. Aucune autre colonne n'est modifiée (ni `Etiq_en_attente`, ni `Plantes`, ni `Ou`, ni `Date_p`).

## Règles de sélection (`entreesEtiquetables()`)

- **Plant** : `Plantes > 0`. `Oups`, `Don_p` et `Reste_a_planter` sont ignorés.
- **Plante mère** : `Plante_mere` vrai **et** `Annee_plantation_mil` renseignée.
- Chaque entrée de la liste est **une ligne de Semis précise** (pas une variété agrégée). Il n'y a donc aucune ambiguïté sur la ligne qui reçoit `Nb_etiquettes`.
- Aucune ligne n'est jamais créée ni supprimée. Une plante mère doit donc avoir une ligne Semis pour apparaître.

## Fonctionnalités

- Liste triée par nom (puis par id), au format `Nom — Variété`.
- Détail sous chaque entrée : « plante mère plantée en AAAA », « N plantés le JJ/MM/AAAA », « graines AAAA », « Où : … ».
- Recherche à la frappe : insensible aux accents et à la casse, plusieurs mots dans n'importe quel ordre. Elle porte sur nom + variété.
- Titre « À étiqueter (N) » ou « (x sur N) » pendant le filtrage, plus compteur dans l'en-tête.
- Badge orange « ⚠ X à imprimer · Y imprimées en attente » si `Nb_etiquettes > 0` ou `Etiq_en_attente > 0`, pour éviter les doublons.
- Champ « Étiquettes » par ligne : entier strictement positif. Toute autre valeur (vide, 0, négatif, décimal) supprime le brouillon.
- Brouillons `{ idSemis, nb }` : ligne en bleu, conservés quand on filtre ou efface la recherche.
- Statut dans l'en-tête : « ✓ À jour » ou « ● Non sauvegardé (n) ». Alerte du navigateur à la fermeture s'il y a des brouillons.
- Barre d'enregistrement collée en bas (messages et bouton « Enregistrer tout »), bouton visible seulement s'il y a des brouillons.
- Message de succès qui disparaît seul après 5 s.

## Enregistrement (`enregistrerTout`)

1. Relit la table Semis (`chargerSemis()`) pour avoir les valeurs **actuelles** de `Nb_etiquettes`.
2. Calcule `Nb_etiquettes actuel + saisie` (vide = 0).
3. Écrit en un seul `BulkUpdateRecord` sur `Nb_etiquettes`.
4. Vide les brouillons, affiche le succès, recharge et réaffiche la liste.

En cas d'échec, un message rouge s'affiche et les brouillons sont conservés. Une ligne supprimée entre-temps (ex. par `achatrepro`) est simplement ignorée.

## Cohabitation avec les autres outils (validée)

- **Etiquettes sur sachets** : lit `Nb_etiquettes > 0`, imprime, puis `Etiq_en_attente += Nb_etiquettes` et `Nb_etiquettes = 0`. La relecture avant écriture évite tout conflit avec la remise à 0.
- **achatrepro** : lit et vide `Etiq_en_attente`, supprime les lignes de transit/vierges. Notre outil ne crée aucune ligne, donc aucun risque.
- **Gestion des semis** : continue à gérer germes, plantés et emplacements. Notre outil ne touche pas ces colonnes.

Test de bout en bout validé : saisie → impression → retour (badge « imprimées en attente ») → nouvelle saisie (3 et non 5, `Etiq_en_attente` intact).

## Conventions respectées

Variables en français, état global en haut du fichier, `modifie` + `majStatut()`, `recordsParId` (Map), utilitaires `tableEnLignes` / `normaliser` / `listeChoix` / `dateAffichee`, `confirmer()` prévue dans le HTML/CSS (non utilisée).

## Pièges rencontrés

- **Cache du JS** : Grist garde l'ancien script. Après modification, faire Ctrl + Maj + R. Sur tablette, utiliser `?v=N` sur les URL du JS et du CSS dans le HTML et incrémenter à chaque changement.
- **`hidden` et CSS** : une règle `display` peut l'emporter sur l'attribut `hidden`, d'où `[hidden] { display: none !important; }` dans le CSS.

## Choix écartés

- `onRecords` + `mapColumnNames` : abandonné au profit de `fetchTable`, comme les autres outils.
- Colonne `Disparue` sur les plantes mères : non ajoutée pour l'instant (option A retenue).
- Affichage de `Positions` : retiré, `Où` suffit à distinguer les lignes.
- Recherche collée en haut (sticky) : essayée, non retenue.

## Nettoyage CSS (à confirmer comme fait)

Règles héritées de `gestion_semis` à supprimer car inutilisées : `.btn-ng`, `.champ-germes`, `.saisie-planter`, `.btn-tout`, `#datePlantation`, bloc « où » (`.bloc-ou`, `.champ-recherche`, `.recherche-ou`, `.liste-choix`, `.pastille*`), `.alerte-germes`, `.liste-semis`, `h2`.
À ajouter : une règle `.champ-etiquettes` (flex: 1, font-size 1.1rem, padding 10px, bordure 1px #aaa, rayon 6px).
À conserver : `.semis*`, `.saisie`, `.btn-principal`, `.erreur`, `.succes`, `.statut*`, `.compteurs`, `#recherche`, `#message`, `#barreEnregistrement*`, `#btnEnregistrer:not([hidden])`, `[hidden]`, `.confirmation*`, `.btn-annuler`, `.btn-valider`.

## Reste à faire / pistes

- [ ] Confirmer le nettoyage CSS en dev, puis recopier en prod avec `?v=N`.
- [ ] Retirer le `console.log` de trace dans `afficherSucces` s'il y est encore, et éventuellement `el.style.display` (redondant avec `[hidden]`).
- [ ] Décider du sort de `#message` (diagnostic : semis chargés / plants / plantes mères) : le garder discret ou le supprimer.
- [ ] Liste longue : envisager un affichage réduit (limite de lignes, bouton « Afficher tout »), ou un bouton « Enregistrer » plus accessible.
- [ ] Plantes mères mortes ou arrachées : aucun statut aujourd'hui, elles restent dans la liste. Piste : colonne `Millesimes.Disparue` (Bool) répercutée sur Semis, puis exclusion.
- [ ] Éventuellement afficher `Positions` en option, ou une confirmation avant enregistrement via `confirmer()`.
- [ ] Éventuellement un bouton pour retirer un brouillon rapidement, ou pour vider tous les brouillons.