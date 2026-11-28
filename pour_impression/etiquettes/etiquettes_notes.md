# Granothèque Grist : widget « Étiquettes sur sachets » (etiquettes)

## Rôle
Imprimer les étiquettes à coller sur les sachets, puis les marquer comme imprimées.
Usage : impression A4 paysage (PC / tablette). Migré en Vue, CSS commun BEM.
Accès Grist : `full`. Versions dev (branche `Vue`) et prod (`main`).

## Fichiers
- `etiquettes.html`, `etiquettes.js`, `etiquettes.css`
- Commun : `../../script/scriptcommun.js`, `../../styles/styles_communs.css`,
  `../../styles/styles_communs_pourimpression.css` (chargé entre le commun et `etiquettes.css`).
- Fonctions communes utilisées : `anneeDepuisDate`, `pluriel`, `entierOuNull`, `colonnesAbsentes`, `facteurZoom`,
  `creerMessageTemporaire`, `effacerAuClic`.

## Circuit des étiquettes (3 outils)
1. **gestion_etiquettes** : `Nb_etiquettes += saisie`.
2. **Cet outil** : une étiquette par unité de `Nb_etiquettes` ; « Marquer comme imprimées » fait
   `Etiq_en_attente += Nb_etiquettes` puis `Nb_etiquettes = 0`. Il ne supprime rien.
3. **achat-repro** (« Issu de mes étiquettes ») : vide `Etiq_en_attente` à la création du millésime et supprime
   la ligne si c'est une ligne de transit (et les lignes vierges).

## Données (table Semis)
- Lecture : `grist.onRecords(afficherLignes, { includeColumns: 'normal' })` : lignes de la vue du widget
  (ses filtres, son tri = ordre d'impression), **toutes les colonnes, même masquées dans la vue**.
- Lues : `Nom`, `Variete`, `Date_s`, `Nb_etiquettes`, `Etiq_en_attente`, `Nb_saisons_mil`, `Origine_or`,
  `Origine_millesime`, `Plante_mere`, `Annee_plantation_mil` (liste `COLONNES_NECESSAIRES`).
- Écrites : `Nb_etiquettes` (0) et `Etiq_en_attente` (colonnes de données), un seul `BulkUpdateRecord`,
  avec les valeurs affichées (pas de relecture avant écriture, décision du 23/11).

## Règles de l'étiquette
- **Récolte** : année du champ « Récolte » de l'en-tête, la même pour toute l'impression. Préremplie : année
  précédente en janvier et février (fin de saison), sinon année en cours.
- **Origine** : si le millésime **semé** est « or. » (`Nb_saisons_mil = 0`), origine de ce millésime
  (`Origine_millesime`) ; sinon origine du millésime « or. » de la variété (`Origine_or`).
  « Monjardin » (première occurrence) s'affiche « AR ».

  | Ce qui est semé | `Nb_saisons_mil` | Origine prise | Étiquette |
  |---|---|---|---|
  | Sachet Kokopelli acheté (« or. ») | 0 | Kok (ce millésime) | Kok → AR, 1 saison |
  | Mes graines de l'année suivante (millésime 1) | 1 | Kok (millésime « or. ») | Kok → AR, 2 saisons |

- **Vierge** (`!Nom && !Variete`) : origine vide, « …… saison(s) » ; l'année de semis s'affiche si la ligne a une `Date_s` (cas théorique).
- **Plante mère** (prioritaire) : « Plantation », origine → AR ; avec année : saisons = **année de récolte** − année de plantation + 1 ;
  sans année (ou année de récolte invalide) : « …… saison(s) ».
- **Semé** (`Date_s`) : « Semis » + année de `Date_s`, origine → AR, saisons = `Nb_saisons_mil + 1`.
- **Non semé** : origine seule, « …… saison(s) ».
- « origine → AR » devient « AR » seul si l'origine est vide ou déjà AR.
- Saisons : `pluriel` (« 1 saison », « 3 saisons ») ; « …… saison(s) » reste écrit tel quel (complété à la main).
- **Pas de borne** sur l'étiquette. achat-repro (`saisonsPourLigne`) borne entre 1 et `NB_SAISONS_MAX` (20) :
  divergence seulement au-delà de 20 saisons (accepté ; une plantation future est impossible).

## Cas particuliers (mode d'emploi)
- **Variété découverte dans un sachet mélangé** (ex. Tournesol White dans « Tournesol mélange ») : créer la variété si besoin,
  puis ajouter une ligne `Semis` avec `NomVariete` = la variété découverte, `Millesime` = le millésime du mélange semé,
  `Date_s` = date du semis du mélange, `Nb_etiquettes`. Ni godets, ni graines, ni germés, ni plantés (déjà comptés sur la ligne
  du mélange). Étiquette complète (origine du mélange → AR, saisons du mélange + 1) ; achat-repro la reconnaît comme vrai semis.
  À vérifier : À gérer et Semis réalisés pourraient l'afficher comme un semis en cours.
- **Ressemis spontané** (ex. soucis semés en 2025, ressemés seuls en 2026) : la génération spontanée n'a pas de millésime,
  il manque une saison.
  - Graines récoltées l'année du premier semis (millésime 2025 existant) : rattacher la nouvelle ligne à **ce** millésime,
    `Date_s` = une date de l'année de levée. Saisons justes.
  - Rien récolté entre-temps : rattacher au millésime d'origine, corriger le nombre de saisons au stylo sur l'étiquette et
    dans le menu « Nb saisons » d'achat-repro avant de créer le millésime.

## Fonctionnement
- **En-tête collé** (masqué à l'impression) : statut (Chargement / Enregistrement… / À jour), champ « Récolte »,
  boutons Imprimer et Marquer, aperçu « N étiquettes · M lignes de Semis · P feuilles » (ou « Aucune étiquette à imprimer »),
  « N places libres sur la dernière feuille » (gris gras), « 🖨️ Imprimé à HH:MM » ou « Pas encore imprimé ».
- **Année de récolte** : champ texte (`inputmode="numeric"`) validé par `entierOuNull` (4 chiffres). Invalide :
  message rouge, Imprimer grisé. Changée : toutes les étiquettes se recalculent (`watch` sur `etat.saisieRecolte`).
  Non conservée au rechargement.
- **Alerte colonnes** : `colonnesAbsentes(lignes[0], COLONNES_NECESSAIRES)`. Avec `includeColumns`, une colonne ne manque
  que si elle a été renommée ou supprimée : message rouge, Imprimer et Marquer grisés.
- **Imprimer** : `window.print()`, ne modifie rien. Fermer la fenêtre d'impression (même en annulant : le navigateur ne le
  dit pas) note l'heure (`noterImpression`, appelée après `print()` et par `afterprint` pour Safari).
- **Marquer comme imprimées** : grisé tant que rien n'a été imprimé → fenêtre de confirmation (« à faire seulement après
  avoir imprimé ») → écriture. Bouton désactivé pendant l'écriture. Après l'écriture, « Imprimé à » est remis à zéro et
  Grist renvoie lui-même les lignes (`onRecords`) : rien à recharger.
- Messages : `TEXTES` en haut du JS (échec, succès). Succès 4 s ; erreur jusqu'au prochain clic (`effacerAuClic`).
  Tous les messages de l'en-tête portent `entete__message`.

## Choix techniques
- Zones Vue : `#appEntete`, `#appFeuilles`, `#appConfirmation` ; un seul `etat`.
- Lignes à imprimer : `recordsParId.aImprimer` (Map id → `{ id, nbEtiquettes, enAttente }`).
  Dernières lignes reçues : `lignesRecues` (recalcul quand l'année de récolte change).
- `etat.feuilles` : feuilles → rangées (5) → étiquettes ; 20 par feuille. Trois `v-for` imbriqués dans le HTML.
- Le JS renvoie des codes : `libelleDate: 'semis' | 'plantation'`, `saisons: nombre | null`, `versAR` ; le HTML écrit les textes.
- 2e et 4e étiquettes d'une rangée retournées (`estInversee(i)`) : `etiquette--inversee` (marges −17,25 mm),
  `etiquette__contenu--retourne` (rotation 180°). Leur SVG ne dessine que les deux traits horizontaux : les côtés en biais
  sont ceux des voisines normales. Retournée et dernière de sa rangée (`estDerniere(i, rangee)`) : elle dessine son côté
  droit (`x1=517.5 y1=0 x2=690 y2=470`).
- Aperçu réduit à l'écran : `ResizeObserver` sur `#appFeuilles` → `etat.zoom = facteurZoom(largeur)` →
  `:style="{ '--zoom-ecran': etat.zoom }"` sur chaque `.feuille`.

## CSS
- Commun impression (`styles_communs_pourimpression.css`) : `.feuille` (A4 paysage, police remise, `zoom`), `.zone-feuilles`,
  `.tronque` (nom de l'étiquette), `@media print` (en-tête et confirmation masqués, `body` sans padding, saut de page,
  `zoom: 1`).
- `etiquettes.css` : `.feuille { padding: 10mm }` (remplace celui du commun impression), étiquette : `rangee`, `etiquette`
  (+ `--inversee`, `__cadre`, `__forme`, `__contenu` (+ `--retourne`), `__nom`, `__variete`, `__espace` (+ `--petit`),
  `__infos`, `__info`, `__libelle`, `__valeur`, `__saisons`) aux dimensions de l'ancien main.css, et `.champ--annee`
  (largeur du champ « Récolte », avec `champ champ--compact`).
- Utilisé du commun : `entete`, `entete__message`, `statut`, `ligne` (+ `--pleine`), `champ` (+ `--compact`),
  `btn` (+ `--enregistrer`), `texte` (+ `--discret`, `--gras`, `--erreur`, `--succes`, `--note`), `encart` (+ `--succes`),
  `confirmation` (+ `__boite`, `__boutons`), balises `h1`, `h2`.

## Points de vigilance
- Impression : tester un PDF A4 paysage après toute modification du CSS (local, commun ou commun impression).
- Ne jamais lancer « Mettre en forme le document » sur le HTML.
- Limites connues (assumées) : « Imprimé à » ne surveille pas les changements faits après l'impression ; une impression
  annulée compte comme faite. La confirmation rappelle de ne marquer qu'après avoir imprimé.
- Un plant acheté sans `Date_s` (non plante mère) donne « origine seule, …… saison(s) » : règle partagée avec achat-repro.

## Reste à faire
- [x] Mise en prod : commun d'abord s'il a changé, puis les 3 fichiers sur `main` ; vérifier l'URL du widget dans Grist,
      Ctrl+F5, test d'impression.
- [x] Après la mise en prod : supprimer l'ancien widget (`main_etiquettes.js`, ancien `etiquettes.html`) et `main.css`
      (vérifier d'abord par Ctrl+Maj+F qu'aucun outil ne le charge encore).
- [x] **achat-repro** (`saisonsPourLigne`) : compter les saisons d'une plante mère jusqu'à l'**année de récolte** (même
      préremplissage : année précédente en janvier-février), pas l'année en cours. Sinon, en janvier-février, le millésime
      créé a une saison de plus que l'étiquette.
- [x] Mémo gestion_etiquettes : cocher les points « Widget d'impression » et `saisonsPourLigne` (mère sans année = « or. », pas de borne sur l'étiquette).

## Pistes (non décidées)
- **Semis spontanés** : colonne de données `Semis.Saisons_spontanees` (nombre de générations ressemées seules, vide = 0),
  ajoutée au calcul des saisons dans l'étiquette (`Nb_saisons_mil + 1 + Saisons_spontanees`) et dans achat-repro
  (`saisonsPourLigne`). Touche la table Semis, cet outil, achat-repro (et peut-être la sélection). À faire si le cas devient fréquent.