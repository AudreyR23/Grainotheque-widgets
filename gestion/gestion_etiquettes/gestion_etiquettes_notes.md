# Granothèque Grist : outil « Sélection pour étiquettes » (gestion_etiquettes)

## Rôle
Choisir, parmi les lignes de Semis déjà plantées ou plantes mères, combien d'étiquettes imprimer.
Il n'imprime rien : il écrit seulement `Semis.Nb_etiquettes`. Migré en Vue, CSS commun BEM.
Accès Grist : `full`. Versions dev (branche `Vue`) et prod (`main`).

## Fichiers
- `gestion_etiquettes.html`, `gestion_etiquettes.js`, `gestion_etiquettes.css`
- Commun : `../../script/scriptcommun.js`, `../../styles/styles_communs.css`
- Fonctions communes utilisées : `tableEnLignes`, `listeChoix`, `normaliser`, `correspondRecherche`, `libelle`,
  ``, `dateAffichee`, `creerMessageTemporaire`, `pluriel`.

## Circuit des étiquettes (3 outils)
1. **Cet outil** : `Nb_etiquettes += saisie` (refusé si la ligne a changé dans Grist).
2. **Widget d'impression** : une étiquette par unité de `Nb_etiquettes` ; « Marquer comme imprimées » fait
   `Etiq_en_attente += Nb_etiquettes` puis `Nb_etiquettes = 0`. Il ne supprime rien.
3. **achat-repro** (« Issu de mes étiquettes ») : vide `Etiq_en_attente` à la création du millésime et supprime
   la ligne si c'est une ligne de transit.

## Données (table Semis, lue par `fetchTable`)
Lues : `Nom`, `Variete`, `Type`, `Annee_graine`, `Plantes`, `Date_p`, `Ou`, `Nb_etiquettes`, `Etiq_en_attente`,
`Plante_mere`, `Annee_plantation_mil`, `Nb_godets`, `Nb_graines`, `Millesime`.
Écrite : `Nb_etiquettes` uniquement (un seul `BulkUpdateRecord`).

## Quelles cartes apparaissent (« À étiqueter »)
- Plante mère : seulement sa ligne « mère » (`estLigneMere` : millésime plante mère, sans godets ni graines,
  créée par achat-repro). Année de plantation facultative (« année de plantation inconnue »).
- Autres : lignes avec `Plantes > 0`.
- Tri par nom ; recherche texte ; filtres « Plantes mères » et « Déjà des étiquettes ».
- Une plante mère sans année s'imprime avec « …… saison(s) » (règle du widget d'impression).

## Fonctionnement
- **Saisie** : champ « Nb » par carte, entiers > 0 seulement. `etat.saisies` (idSemis → nombre) et `etat.brut` (texte tapé).
- **À ajouter** : récapitulatif trié par nom ; clic sur une carte = défilement jusqu'à sa carte (recherche et filtres
  remis à zéro si elle est masquée) ; ✕ retire la saisie (`@click.stop`). Alerte si la ligne a déjà des étiquettes à imprimer ou en attente.
- **En-tête collé** : statut (Chargement / À jour / Non sauvegardé (n) / Erreur), boutons « À ajouter » et « À étiqueter », message de succès.
- **Enregistrer** : relit Semis, compare `Nb_etiquettes` et `Etiq_en_attente` des lignes saisies avec l'affichage ;
  si l'une a changé ou disparu, refus complet (rien n'est écrit) et l'écran reprend les valeurs actuelles.
- **Saisies conservées** au rechargement (`sessionStorage`, clé `gestion_etiquettes_saisies`), purgées si la ligne n'existe plus.
- Messages dans le bloc `TEXTES` en haut du JS.

## Choix techniques
- Zones Vue : `#appEntete`, `#appRecherche`, `#appAjouts`, `#appSelection` ; un seul `etat`.
- Données dans `recordsParId.semis` (Map) ; listes affichées copiées dans `etat` par `afficherSelection()`.
- Chaque info d'une carte est un `<span>` avec son « · » final ; pastille verte « 🌱 Plante mère » comme dans a_gerer.
- Orange = saisie en cours (À ajouter) ; gris gras = information de Grist importante (à imprimer, en attente) ; rouge = alerte.
- CSS local : `.champ--nb`, marge de `#etapeIntermediaire`, `scroll-margin-top` (l'en-tête collé ne cache pas la cible),
  `align-items: start` sur les grilles (cartes de taille indépendante).
- `.carte__contenu` (commun) est en colonne avec `gap: 6px` : le bloc à droite (✕, champ Nb) est centré par `.carte`.

## Points de vigilance
- Chaque zone Vue a son propre `return` : toute fonction utilisée dans le HTML (`pluriel`, ``…) doit y figurer.
- Dans `#appAjouts` la ligne Semis s'appelle `b.s` (boucle `b`), dans `#appSelection` elle s'appelle `s`.
- Ne jamais lancer « Mettre en forme le document » sur le HTML (coupe les chaînes).
- Dans Grist, une cellule en cours d'édition n'est pas écrite : valider avant de tester la vérification.
- La ligne vide du bas de la table Semis crée une vraie ligne dès qu'on y saisit quelque chose.
- Le « Nb_etiquettes » total d'une ligne est additionné : saisir 2 sur une ligne qui en a déjà 3 donne 5.
- Le message « Quitter la page ? » ne s'affiche pas dans une iframe Grist (comme a_gerer) ; les saisies sont de toute façon conservées.

## CSS du commun non utilisé par cet outil
(à jour au 21/11/2026 ; à revérifier si le HTML change)

**Mise en page**
- `.ligne--entre`, `.ligne--sur-champ`
- `.zone-transparente`
- `h3` (balise)

**Champ, case**
- `.champ--flexible`, `.champ--bouton`
- `.case__saisie:disabled` (état désactivé)

**Menu déroulant (bloc entier)**
- `.menu`, `.menu__liste`, `.menu__item`, `.menu__item--choisi`, `.menu__item--vide`

**Pastille**
- `.pastille--lieu`, `.pastille--info`, `.pastille--sousabri`, `.pastille--pleineterre`, `.pastille--etape`

**Carte**
- `.carte--colonne`, `.carte--sousabri`, `.carte--pleineterre`

**Texte**
- `.texte--titre`, `.texte--morte`, `.texte--plantemere` (la pastille verte suffit désormais)

**Bouton**
- `.btn--actif` (le sélecteur est groupé avec `.btn--etape`, qui est utilisé), `.btn--danger`, `.btn--collant`

**Confirmation (bloc entier)**
- `.confirmation`, `.confirmation__boite`, `.confirmation__boutons`

**Variables de couleur non utilisées**
- `--erreur-clair`, `--erreur-moyen`
- `--sousabri-clair`, `--sousabri-moyen`, `--sousabri-fonce` (`--sousabri-moyen` sert seulement au `:focus-visible` des boutons)
- `--pleineterre-clair`, `--pleineterre-moyen`, `--pleineterre-fonce`
- `--ici-clair`, `--ici-moyen` (seul `--ici-fonce` est utilisé, par `.texte--ici`)

**Utilisé ici (pour mémoire)**
`entete`, `statut` (+ `--non-sauvegarde`), `ligne` (+ `--pleine`), `grille`, `champ`, `case` (+ `__saisie`, `__texte`), `liste-carte`,
`carte` (+ `--etape`, `--cliquable`, `--plantemere`, `__contenu`, `__type`, `__action`), `pastille` (+ `--categorie`, `--plantemere`),
`texte` (+ `--discret`, `--gras`, `--ici`, `--etape`, `--erreur`, `--succes`, `--note`), `encart` (+ `--succes`),
`btn` (+ `--etape`, `--suppr`, `--enregistrer`, `--grand`).

## Reste à faire / à décider
- [ ] `achat-repro`, `saisonsPourLigne` : renvoyer « or. » pour une mère sans année (règle alignée sur l'étiquette) ; borne 1–8 à décider.
- [ ] Widget d'impression : alerte si `Etiq_en_attente` n'est pas visible dans la vue, bouton désactivé pendant l'écriture,
      `try/catch`, vérifier `.infos .label` / `.infos .h3` dans le CSS.
- [ ] Étiquettes à la récolte (depuis l'outil millésime) : discussion séparée.
- [ ] Commun : `align-items: start` sur `.grille` si souhaité partout ; `.btn--enregistrer` écrase `.btn--grand` (margin-top).
- [ ] Lignes mères avec `Plantes = 0` et sans `Date_s` : seraient supprimées par achat-repro comme lignes de transit (risque faible).