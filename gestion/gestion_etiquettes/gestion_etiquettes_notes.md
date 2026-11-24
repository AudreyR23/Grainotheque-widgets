# Granothèque Grist : outil « Sélection pour étiquettes » (gestion_etiquettes)

## Rôle
Choisir, parmi les lignes de Semis déjà plantées ou plantes mères, combien d'étiquettes imprimer.
Il n'imprime rien : il écrit seulement `Semis.Nb_etiquettes`. Migré en Vue, CSS commun BEM.
Accès Grist : `full`. Versions dev (branche `Vue`) et prod (`main`).
Refonte du 24/11/2026 : protections retirées (voir « Exceptions au mémo »), outil allégé.

## Fichiers
- `gestion_etiquettes.html`, `gestion_etiquettes.js`, `gestion_etiquettes.css`
- Commun : `../../script/scriptcommun.js`, `../../styles/styles_communs.css`
- Fonctions communes utilisées : `tableEnLignes`, `listeChoix`, `normaliser`, `correspondRecherche`, `libelle`,
  `dateAffichee`, `creerMessageTemporaire`, `pluriel`, `entierOuNull`, `aller`, `estLigneMere`, `effacerAuClic`.
- Le type (`Semis.Type`) est affiché tel quel (plus de `typeInverse`).

## Circuit des étiquettes (3 outils)
1. **Cet outil** : `Nb_etiquettes += saisie`.
2. **Widget d'impression** : une étiquette par unité de `Nb_etiquettes` ; « Marquer comme imprimées » fait
   `Etiq_en_attente += Nb_etiquettes` puis `Nb_etiquettes = 0`. Il ne supprime rien.
3. **achat-repro** (« Issu de mes étiquettes ») : vide `Etiq_en_attente` à la création du millésime et supprime
   la ligne si c'est une ligne de transit.
- On fait une chose à la fois : soit on édite les étiquettes (outil 1 puis 2), soit on ajoute dans la base (outil 3).
- Fusion avec le widget d'impression : non recommandée. Le widget d'impression doit rester une page propre, triée par la vue Grist,
  et la sélection se fait souvent à un autre moment.

## Données (table Semis, lue par `fetchTable`)
Lues : `Nom`, `Variete`, `Type`, `Annee_graine`, `Plantes`, `Date_p`, `Ou`, `Nb_etiquettes`, `Etiq_en_attente`,
`Plante_mere`, `Annee_plantation_mil`, `Nb_godets`, `Nb_graines`, `Millesime`.
Écrite : `Nb_etiquettes` uniquement (un seul `BulkUpdateRecord`).

## Quelles cartes apparaissent (« À étiqueter »)
- Plante mère : seulement sa ligne « mère » (`estLigneMere`, dans le commun : millésime plante mère, sans godets ni graines,
  créée par achat-repro). Année de plantation facultative (« année de plantation inconnue »).
- Autres : lignes avec `Plantes > 0`.
- Tri par nom ; recherche texte ; filtres « Plantes mères » et « Déjà des étiquettes ».
- Une plante mère sans année s'imprime avec « …… saison(s) » (règle du widget d'impression et d'achat-repro).

## Fonctionnement
- **Saisie** : champ « Nb » par carte (`type="text"` + `inputmode="numeric"`), entiers > 0 seulement (`entierOuNull`).
  `etat.saisies` (idSemis → nombre) et `etat.brut` (texte tapé). Un texte invalide (« abc », « 2,5 », « 0 », « -1 ») est ignoré
  et la carte affiche « ⚠ Nombre entier supérieur à 0 attendu » (`saisieInvalide`).
  `type="number"` n'est pas utilisé : il renvoie une chaîne vide pour un texte invalide, donc impossible de signaler l'erreur.
- **À ajouter** : récapitulatif trié par nom ; clic sur une carte = défilement jusqu'à sa carte (recherche et filtres
  remis à zéro si elle est masquée) ; ✕ retire la saisie (`@click.stop`). Alerte si la ligne a déjà des étiquettes à imprimer ou en attente.
- **En-tête collé** : statut (Chargement / À jour / Non sauvegardé (n) / Erreur), boutons « À ajouter » et « À étiqueter », message de succès.
- **Enregistrer** : calcule `Nb_etiquettes + saisie` sur les valeurs chargées à l'ouverture et écrit (un seul `applyUserActions`).
  Aucune relecture avant écriture. Puis rechargement de Semis (met à jour les pastilles « N à imprimer »).
  Si l'écriture échoue : message d'échec, saisies conservées à l'écran.
- **Erreur** : reste affichée jusqu'au prochain clic (`effacerAuClic`, commun).
- Messages dans le bloc `TEXTES` en haut du JS (chargement, échec, rechargement échoué, succès).

## Choix techniques
- Zones Vue : `#appEntete`, `#appRecherche`, `#appAjouts`, `#appSelection` ; un seul `etat`.
- Données dans `recordsParId.semis` (Map) ; listes affichées copiées dans `etat` par `afficherSelection()`.
- Chaque info d'une carte est un `<span>` avec son « · » final ; pastille verte « 🌱 Plante mère » comme dans a_gerer.
- Orange = saisie en cours (À ajouter) ; gris gras = information de Grist importante (à imprimer, en attente) ; rouge = alerte.
- CSS local : marge de `#appRecherche` et `#etapeIntermediaire`, largeur du champ « Nb » (`.champ--nb`, avec `champ--compact` du commun).
- `.carte__contenu` (commun) est en colonne avec `gap: 6px` : le bloc à droite (✕, champ Nb) est centré par `.carte`.

## Exceptions au mémo des conventions (cet outil seulement)
- **Pas de sauvegarde des saisies dans `sessionStorage`** (le mémo la demande pour les autres outils) : retirée le 24/11.
  Un rechargement du widget perd les saisies non enregistrées. Voulu : l'outil est court, les saisies sont rapides à refaire.
- **Pas de relecture avant écriture** (le mémo demande « recharger, comparer, refuser ») : retirée le 24/11.
  Risque connu : si `Nb_etiquettes` ou `Etiq_en_attente` change dans Grist (impression marquée, achat-repro) pendant que ce widget
  reste ouvert, il écrit « ancienne valeur + saisie ». Accepté car les outils ne sont pas utilisés en même temps.
  En cas de doute : recharger le widget (Ctrl+F5) avant de saisir.
- **Pas de `beforeunload`** : sans effet dans l'iframe de Grist.

## Points de vigilance
- Chaque zone Vue a son propre `return` : toute fonction utilisée dans le HTML (`pluriel`, `saisieInvalide`…) doit y figurer.
- Dans `#appAjouts` la ligne Semis s'appelle `b.s` (boucle `b`), dans `#appSelection` elle s'appelle `s`.
- Ne jamais lancer « Mettre en forme le document » sur le HTML (coupe les chaînes).
- Dans Grist, une cellule en cours d'édition n'est pas écrite : valider (Entrée) avant de tester.
- La ligne vide du bas de la table Semis crée une vraie ligne dès qu'on y saisit quelque chose.
- Le `Nb_etiquettes` d'une ligne est additionné : saisir 2 sur une ligne qui en a déjà 3 donne 5.
- Si la ligne a été supprimée dans Grist depuis l'ouverture, l'enregistrement échoue (message « Échec… »), rien n'est écrit.
- Lignes mères avec `Plantes = 0` et sans `Date_s` : achat-repro peut les supprimer comme lignes de transit (À gérer met `Plantes = 0`
  à la mort totale). La ligne est alors inutile : risque accepté.
- Si on retire un jour une classe du commun, vérifier ce fichier (liste ci-dessous à revalider : commun modifié le 24/11).

## CSS du commun non utilisé par cet outil
(établi le 21/11/2026, à revérifier : le commun et le HTML ont changé depuis)

**Mise en page** : `.ligne--entre`, `.ligne--sur-champ`, `.zone-transparente`, `h3` (balise)
**Champ, case** : `.champ--flexible`, `.champ--bouton`, `.case__saisie:disabled`
**Menu déroulant (bloc entier)** : `.menu`, `.menu__liste`, `.menu__item`, `.menu__item--choisi`, `.menu__item--vide`
**Pastille** : `.pastille--lieu`, `.pastille--info`, `.pastille--sousabri`, `.pastille--pleineterre`, `.pastille--etape`
**Carte** : `.carte--colonne`, `.carte--sousabri`, `.carte--pleineterre`
**Texte** : `.texte--titre`, `.texte--morte`, `.texte--plantemere`
**Bouton** : `.btn--actif`, `.btn--danger`, `.btn--collant`
**Confirmation (bloc entier)** : `.confirmation`, `.confirmation__boite`, `.confirmation__boutons`
**Variables de couleur** : `--erreur-clair`, `--erreur-moyen`, `--sousabri-*`, `--pleineterre-*`, `--ici-clair`, `--ici-moyen`

**Utilisé ici (pour mémoire)**
`entete` (+ `__message`), `statut` (+ `--non-sauvegarde`), `ligne` (+ `--pleine`), `grille`, `champ` (+ `--compact`), `case` (+ `__saisie`, `__texte`),
`liste-carte`, `carte` (+ `--etape`, `--cliquable`, `--plantemere`, `__contenu`, `__type`, `__action`), `pastille` (+ `--categorie`, `--plantemere`),
`texte` (+ `--discret`, `--gras`, `--ici`, `--etape`, `--erreur`, `--succes`, `--note`), `encart` (+ `--succes`),
`btn` (+ `--etape`, `--suppr`, `--enregistrer`, `--grand`).

## Reste à faire / à décider
- [x] `achat-repro`, `saisonsPourLigne` : « or. » pour une mère sans année (fait, borne `NB_SAISONS_MAX`).
- [x] Widget d'impression : bouton désactivé, `try/catch`, alerte colonnes, `.infos .label` (fait dans `etiquettes.js` / `etiquettes.css`).
- [x] `aller()`, `estLigneMere()`, `entierOuNull`, `effacerAuClic`, `champ--compact` : passés dans le commun.
- [x] Refonte du 24/11 : nettoyage, retrait de `sessionStorage` et de la relecture, message de saisie invalide.
- [ ] Étiquettes à la récolte (depuis l'outil millésime) : discussion séparée.
- [ ] Commun : `align-items: start` sur `.grille` (cartes de taille indépendante) si souhaité ; `.btn--enregistrer` écrase `.btn--grand` (margin-top).
      Le bloc commenté a été retiré de `gestion_etiquettes.css`.
- [ ] Mise en prod : commun d'abord (`scriptcommun.js`, `styles_communs.css`), puis cet outil ; Ctrl+F5 ; ouvrir aussi les autres outils.