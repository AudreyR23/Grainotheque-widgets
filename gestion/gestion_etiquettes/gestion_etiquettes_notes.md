# Granothèque Grist : outil « Sélection pour étiquettes » (gestion_etiquettes)

## Rôle
Choisir, parmi les lignes de Semis déjà plantées ou plantes mères, combien d'étiquettes imprimer.
Il n'imprime rien : il écrit seulement `Semis.Nb_etiquettes`. Migré en Vue, CSS commun BEM.
Accès Grist : `full`. Versions dev (branche `Vue`) et prod (`main`).
Refonte du 24/11/2026 : nettoyage selon le mémo des conventions (plus de `sessionStorage`, de relecture avant écriture ni de `beforeunload`).
28/11/2026 : cases « Semis » et « Masquer les clôturées ».

## Fichiers
- `gestion_etiquettes.html`, `gestion_etiquettes.js`, `gestion_etiquettes.css`
- Commun : `../../script/scriptcommun.js`, `../../styles/styles_communs.css`
- Fonctions communes utilisées : `tableEnLignes`, `listeChoix`, `normaliser`, `correspondRecherche`, `libelle`,
  `dateAffichee`, `creerMessageTemporaire`, `pluriel`, `entierOuNull`, `aller`, `estLigneMere`, `effacerAuClic`.
- Le type (`Semis.Type`, formule) est affiché tel quel : l'emoji est déjà en tête dans Grist (plus de `typeInverse`).

## Circuit des étiquettes (3 outils)
1. **Cet outil** : `Nb_etiquettes += saisie`.
2. **Widget d'impression** (Étiquettes) : une étiquette par unité de `Nb_etiquettes` ; « Marquer comme imprimées » fait
   `Etiq_en_attente += Nb_etiquettes` puis `Nb_etiquettes = 0`. Il ne supprime rien.
3. **achat-repro** (« Issu de mes étiquettes ») : vide `Etiq_en_attente` à la création du millésime et supprime
   la ligne si c'est une ligne de transit.
- On fait une chose à la fois : soit on édite les étiquettes (outils 1 puis 2), soit on ajoute dans la base (outil 3).
- Fusion avec le widget d'impression : non recommandée. Le widget d'impression doit rester une page propre, triée par la vue Grist,
  et la sélection se fait souvent à un autre moment.

## Données (table Semis, lue par `fetchTable`)
Lues : `Nom`, `Variete`, `Type`, `Annee_graine`, `Plantes`, `Date_p`, `Ou`, `Nb_etiquettes`, `Etiq_en_attente`,
`Plante_mere`, `Annee_plantation_mil`, `Nb_godets`, `Nb_graines`, `Millesime`, `Cloture`.
Écrite : `Nb_etiquettes` uniquement (un seul `BulkUpdateRecord`).

## Quelles cartes apparaissent (« À étiqueter »)
- Plante mère : seulement sa ligne « mère » (`estLigneMere`, dans le commun : millésime plante mère, sans godets ni graines,
  créée par achat-repro). Année de plantation facultative (« année de plantation inconnue »).
- Autres : lignes avec `Plantes > 0`.
- **Lignes clôturées** (`Semis.Cloture`, cochée par À gérer en fin de saison) : masquées par défaut (case « Masquer les clôturées »,
  `etat.masquerCloturees`, cochée au démarrage). Décochée, elles reviennent. Appliqué dans `entreesEtiquetables()` : le nombre de
  « À étiqueter (n) » en tient compte.
- Tri par nom ; recherche texte ; filtres « Plantes mères », « Semis » (lignes qui ne sont pas des plantes mères) et « Déjà des étiquettes ».
  « Plantes mères » + « Semis » cochées ensemble = les deux types (liste complète) : `if (etat.filtreMeres !== etat.filtreSemis)`.
- Titre : « À étiqueter (y) », ou « (x sur y) » quand la liste est réduite (une seule interpolation, sans `<template>`, sur une ligne).
- Une plante mère sans année s'imprime avec « …… saison(s) » (règle du widget d'impression et d'achat-repro).

## Fonctionnement
- **Saisie** : champ « Nb » par carte (`type="text"` + `inputmode="numeric"`), entiers > 0 seulement (`entierOuNull`).
  `etat.saisies` (idSemis → nombre) et `etat.brut` (texte tapé). Un texte invalide (« abc », « 2,5 », « 0 », « -1 ») n'est pas pris en compte
  et la carte affiche « ⚠ Nombre entier supérieur à 0 attendu » (`saisieInvalide`).
  `type="number"` n'est pas utilisé : il renvoie une chaîne vide pour un texte invalide, donc impossible de signaler l'erreur.
- **À ajouter** : récapitulatif trié par nom ; clic sur une carte = défilement jusqu'à sa carte (recherche, filtres et case
  « Masquer les clôturées » remis à zéro si elle est masquée) ; ✕ retire la saisie (`@click.stop`). Alerte si la ligne a déjà des étiquettes à imprimer ou en attente.
- **En-tête collé** : statut (Chargement / À jour / Non sauvegardé (n) / Erreur de chargement), boutons « À ajouter » et « À étiqueter »,
  message de succès (4 s) et message d'erreur de chargement (`entete__message`).
- **Enregistrer** : calcule `Nb_etiquettes + saisie` sur les valeurs chargées (rafraîchies après chaque enregistrement) et écrit
  (un seul `applyUserActions`). Puis rechargement de Semis (met à jour les pastilles « N à imprimer »).
  Si l'écriture échoue : message d'échec sous la liste « À ajouter », saisies conservées à l'écran.
- **Erreur d'enregistrement** : reste affichée jusqu'au prochain clic (`effacerAuClic`, commun).
- Messages dans le bloc `TEXTES` en haut du JS (chargement, échec, rechargement échoué, succès).

## Choix techniques
- Zones Vue : `#appEntete`, `#appRecherche`, `#appAjouts`, `#appSelection` ; un seul `etat`.
- Données dans `recordsParId.semis` (Map) ; listes affichées copiées dans `etat` par `afficherSelection()`.
  Un seul `Vue.watch` (recherche + 3 filtres + case clôturées) : pas de `watch` en chaîne.
- Chaque info d'une carte est un `<span>` avec son « · » final ; pastille verte « 🌱 Plante mère » comme dans a_gerer.
- Orange = saisie en cours (À ajouter) ; gris gras = information de Grist importante (à imprimer, en attente) ; rouge = alerte.
- CSS local : marge de `#appRecherche` et `#etapeIntermediaire`, largeur du champ « Nb » (`.champ--nb`, avec `champ--compact` du commun).
  Pas de `scroll-margin-top` : `aller()` (commun) tient compte de la hauteur de l'en-tête.
- `.carte__contenu` (commun) est en colonne avec `gap: 6px` : le bloc à droite (✕, champ Nb) est centré par `.carte`.

## Décisions du 23/11 (maintenant dans le mémo, valables pour tous les outils)
- Pas de sauvegarde des saisies dans `sessionStorage` : un rechargement du widget perd les saisies non enregistrées.
- Pas de relecture avant écriture. Risque connu : si `Nb_etiquettes` ou `Etiq_en_attente` change dans Grist (impression marquée, achat-repro)
  pendant que ce widget reste ouvert, il écrit « ancienne valeur + saisie ». Accepté car les outils ne sont pas utilisés en même temps.
  En cas de doute : recharger le widget (Ctrl+F5) avant de saisir.
- Pas de `beforeunload` : sans effet dans l'iframe de Grist.

## Points de vigilance
- Chaque zone Vue a son propre `return` : toute fonction utilisée dans le HTML (`pluriel`, `saisieInvalide`…) doit y figurer.
- Dans `#appAjouts` la ligne Semis s'appelle `b.s` (boucle `b`), dans `#appSelection` elle s'appelle `s`.
- Ne jamais lancer « Mettre en forme le document » sur le HTML (peut couper une chaîne dans un `{{ }}`, et le retour à la ligne
  ajoute une espace visible, par ex. dans le titre « À étiqueter (… »). Le titre doit rester sur une seule ligne.
- Dans Grist, une cellule en cours d'édition n'est pas écrite : valider (Entrée) avant de tester.
- La ligne vide du bas de la table Semis crée une vraie ligne dès qu'on y saisit quelque chose.
- Le `Nb_etiquettes` d'une ligne est additionné : saisir 2 sur une ligne qui en a déjà 3 donne 5.
- Si la ligne a été supprimée dans Grist depuis l'ouverture, l'enregistrement échoue (message « Échec… »), rien n'est écrit.
- Colonne renommée dans Grist : la valeur est lue `undefined` et le `|| 0` le masque ; l'écriture de `Nb_etiquettes` donnerait `KeyError`.
  Même effet pour `Cloture` : si elle était renommée, la case « Masquer les clôturées » ne masquerait plus rien, sans erreur.
- Lignes mères : à la mort totale, À gérer décoche `Plante_mere` (la ligne sort de cette liste). achat-repro peut supprimer une ligne
  `Plantes = 0` sans `Date_s` comme ligne de transit : la ligne est alors inutile, risque accepté.

## CSS du commun non utilisé par cet outil
(établi le 21/11/2026, à revérifier : le commun et le HTML ont changé depuis)

**Mise en page** : `.ligne--entre`, `.ligne--sur-champ`, `.zone-transparente`, `.groupe`, `.page`, `.reserve`, `h3` (balise)
**Champ, case** : `.champ--flexible`, `.champ--bouton`, `.champ--deroulant`, `.case__saisie:disabled`
**Menu déroulant (bloc entier)** : `.menu`, `.menu__liste`, `.menu__item`, `.menu__item--choisi`, `.menu__item--vide`
**Pastille** : `.pastille--lieu`, `.pastille--info`, `.pastille--sousabri`, `.pastille--pleineterre`, `.pastille--etape`
**Carte** : `.carte--colonne`, `.carte--sousabri`, `.carte--pleineterre`, `.carte--sousabri-pleineterre`
**Encart** : `.encart--alerte`, `.encart--info`
**Texte** : `.texte--titre`, `.texte--morte`, `.texte--plantemere`
**Bouton** : `.btn--actif`, `.btn--danger`, `.btn--collant`
**Confirmation (bloc entier)** : `.confirmation`, `.confirmation__boite`, `.confirmation__boutons`
**Variables de couleur** : `--erreur-clair`, `--erreur-moyen`, `--sousabri-*`, `--pleineterre-*`, `--ici-clair`, `--ici-moyen`

**Utilisé ici (pour mémoire)**
`entete` (+ `__message`), `statut` (+ `--non-sauvegarde`), `ligne` (+ `--pleine`), `grille`, `champ` (+ `--compact`), `case` (+ `__saisie`, `__texte`),
`liste-carte`, `carte` (+ `--etape`, `--cliquable`, `--plantemere`, `__contenu`, `__type`, `__action`), `pastille` (+ `--categorie`, `--plantemere`),
`texte` (+ `--discret`, `--gras`, `--ici`, `--etape`, `--erreur`, `--succes`), `encart` (+ `--succes`),
`btn` (+ `--etape`, `--suppr`, `--enregistrer`, `--grand`).

## Reste à faire / à décider
- [x] `achat-repro`, `saisonsPourLigne` : « or. » pour une mère sans année (fait, borne `NB_SAISONS_MAX`).
- [x] Widget d'impression : bouton désactivé, `try/catch`, alerte colonnes, `.infos .label` (fait dans `etiquettes.js` / `etiquettes.css`).
- [x] `aller()`, `estLigneMere()`, `entierOuNull`, `effacerAuClic`, `champ--compact` : passés dans le commun.
- [x] Refonte du 24/11 : nettoyage, retrait de `sessionStorage` et de la relecture, message de saisie invalide.
- [x] Mémo, « Points ouverts » : mentions de Sélection pour étiquettes retirées.
- [x] Étiquettes à la récolte (depuis l'outil millésime) : discussion séparée.
- [x] Commun : `.btn--enregistrer` n'a plus de `margin-top` (vérifié le 28/11 : plus d'écrasement de `.btn--grand`).
- [x] Cases « Semis » et « Masquer les clôturées » (28/11).
- [x] Mise en prod : commun d'abord (`scriptcommun.js`, `styles_communs.css`), puis cet outil ; Ctrl+F5 ; ouvrir aussi les autres outils.
- [ ] Facultatif : alerte « colonnes manquantes » (`COLONNES_NECESSAIRES` + `colonnesAbsentes(tab, …)` après `fetchTable`, message dans l'en-tête).
- [ ] Facultatif, commun : `.grille` n'a pas `align-items: start` (vérifié le 28/11) : les cartes d'une même rangée s'étirent à la hauteur
  de la plus grande. À ajouter dans le commun seulement si les autres outils le veulent aussi.