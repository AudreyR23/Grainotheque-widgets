# Granothèque Grist : widget « Étiquettes sur sachets » (etiquettes)

## Rôle
Imprimer les étiquettes à coller sur les sachets, puis les marquer comme imprimées.
Usage : impression A4 paysage (PC / tablette). Migré en Vue, CSS commun BEM.
Accès Grist : `full`. Versions dev (branche `Vue`) et prod (`main`).

## Fichiers
- `etiquettes.html`, `etiquettes.js`, `etiquettes.css`
- Commun : `../../script/scriptcommun.js`, `../../styles/styles_communs_bem.css`
- Fonctions communes utilisées : `anneeDepuisDate`, `pluriel`, `libelle`, `tableEnLignes`, `creerMessageTemporaire`.
- N'utilise plus `main.css` (toujours utilisé par le tableau et les épingles).

## Circuit des étiquettes (3 outils)
1. **gestion_etiquettes** : `Nb_etiquettes += saisie` (refusé si la ligne a changé dans Grist).
2. **Cet outil** : une étiquette par unité de `Nb_etiquettes` ; « Marquer comme imprimées » fait
   `Etiq_en_attente += Nb_etiquettes` puis `Nb_etiquettes = 0`. Il ne supprime rien.
3. **achat-repro** (« Issu de mes étiquettes ») : vide `Etiq_en_attente` à la création du millésime et supprime
   la ligne si c'est une ligne de transit (et les lignes vierges).

## Données (table Semis)
- Affichage : `grist.onRecords(afficherLignes, { includeColumns: 'normal' })` : lignes de la vue du widget
  (ses filtres, son tri = ordre d'impression), **toutes les colonnes, même masquées dans la vue**.
- Lues : `Nom`, `Variete`, `Date_s`, `Nb_etiquettes`, `Etiq_en_attente`, `Nb_saisons_mil`, `Origine_or`,
  `Origine_millesime`, `Plante_mere`, `Annee_plantation_mil` (liste `COLONNES_NECESSAIRES`).
- Écrites : `Nb_etiquettes` (0) et `Etiq_en_attente` (colonnes de données), un seul `BulkUpdateRecord`.
- Avant d'écrire : `fetchTable('Semis')` relit la table ; l'addition se fait sur les valeurs relues.

## Règles de l'étiquette (identiques à l'ancien widget)
- **Origine** : si le millésime **semé** est « or. » (`Nb_saisons_mil = 0`), origine de ce millésime
  (`Origine_millesime`) ; sinon origine du millésime « or. » de la variété (`Origine_or`).
  « Monjardin » (première occurrence) s'affiche « AR ».

  | Ce qui est semé | `Nb_saisons_mil` | Origine prise | Étiquette |
  |---|---|---|---|
  | Sachet Kokopelli acheté (« or. ») | 0 | Kok (ce millésime) | Kok → AR, 1 saison |
  | Mes graines de l'année suivante (millésime 1) | 1 | Kok (millésime « or. ») | Kok → AR, 2 saisons |

- **Vierge** (`!Nom && !Variete`) : origine vide, « …… saison(s) » ; l'année de semis s'affiche si la ligne a une `Date_s` (cas théorique).
- **Plante mère** (prioritaire) : « Plantation », origine → AR ; avec année : saisons = année en cours − année de plantation + 1 ;
  sans année : date vide, « …… saison(s) ».
- **Semé** (`Date_s`) : « Semis » + année de `Date_s`, origine → AR, saisons = `Nb_saisons_mil + 1`.
- **Non semé** : origine seule, « …… saison(s) ».
- « origine → AR » devient « AR » seul si l'origine est vide ou déjà AR.
- Saisons : `pluriel` (« 1 saison », « 3 saisons ») ; « …… saison(s) » reste écrit tel quel (complété à la main).
- **Pas de borne** sur l'étiquette. achat-repro (`saisonsPourLigne`) borne entre 1 et `NB_SAISONS_MAX` (20) :
  les deux ne divergent qu'au-delà de 20 saisons ou pour une année de plantation future (étiquette : 0 ou négatif). Accepté.
- Récolte : année en cours (`new Date().getFullYear()`, s'adapte seule).

## Fonctionnement
- **En-tête collé** (masqué à l'impression) : statut (Chargement / Enregistrement… / À jour), boutons Imprimer et
  Marquer, aperçu « N étiquettes · M lignes de Semis · P feuilles » ou « Aucune étiquette à imprimer ».
- **Alerte colonnes** : si une colonne de `COLONNES_NECESSAIRES` manque dans les lignes reçues, message rouge et
  Imprimer / Marquer grisés. Avec `includeColumns: 'normal'` elle ne devrait jamais s'afficher (filet de sécurité).
- **Imprimer** : `window.print()`, ne modifie rien.
- **Marquer comme imprimées** : fenêtre de confirmation (classes `confirmation` du commun) → relecture de Semis →
  refus complet si `Nb_etiquettes` ou `Etiq_en_attente` d'une ligne a changé ou si elle a disparu → sinon écriture.
  Bouton désactivé pendant l'écriture. Après l'écriture, Grist renvoie lui-même les lignes (`onRecords`) : rien à recharger.
- Messages dans le bloc `TEXTES` en haut du JS. Succès : 4 s. Erreur : jusqu'au prochain clic (écouteur `click` en capture).

## Choix techniques
- Zones Vue : `#appEntete`, `#appFeuilles`, `#appConfirmation` ; un seul `etat`.
- Lignes à imprimer telles qu'affichées : `recordsParId.aImprimer` (Map id → `{ id, nom, variete, nbEtiquettes, enAttente }`).
- `etat.feuilles` : feuilles → rangées (5) → étiquettes ; 20 par feuille. Trois `v-for` imbriqués dans le HTML.
- Le JS renvoie des codes : `libelleDate: 'semis' | 'plantation'`, `saisons: nombre | null`, `versAR` ; le HTML écrit les textes.
- 2e et 4e étiquettes d'une rangée retournées (`estInversee(i)`) : `etiquette--inversee` (marges −17,25 mm),
  `etiquette__contenu--retourne` (rotation 180°), SVG à deux traits au lieu du trapèze.
- Dates : `onRecords` donne un objet `Date` ; `dateEnSecondesGrist` le convertit pour `anneeDepuisDate`.
  Ne pas utiliser `keepEncoded: true` (les dates arrivent codées `['d', secondes]`).

## CSS (`etiquettes.css`)
- Section « candidat au commun impression » : `.feuille` (A4 paysage, police Arial 9px #222 remise car le commun change
  le `body`), `@media print` (`@page` A4 paysage marge 0, `body` sans padding, `.entete` et `.confirmation` masqués,
  saut de page après chaque feuille). À déplacer dans `styles_communs_impression_bem.css` quand le tableau ou les épingles seront migrés.
  Le `padding: 10mm` de `.feuille` est propre aux étiquettes (tableau / épingles : 15mm 10mm 10mm 10mm).
- Étiquette : `rangee`, `etiquette` (+ `--inversee`, `__cadre`, `__forme`, `__contenu` (+ `--retourne`), `__nom`, `__variete`,
  `__espace` (+ `--petit`), `__infos`, `__info`, `__libelle`, `__valeur`, `__saisons`). Dimensions identiques à l'ancien main.css.
- `.confirmation__boutons { align-items: end }` : aligne Annuler et Confirmer (`.btn--enregistrer` a un margin-top).
- Nettoyé par rapport à main.css : blocs `@media print` commentés, `padding: auto` invalide, `.infos .label` (jamais utilisé).
- Utilisé du commun : `entete`, `statut`, `ligne` (+ `--pleine`), `btn` (+ `--enregistrer`), `texte` (+ `--discret`, `--gras`,
  `--erreur`, `--succes`, `--note`), `encart` (+ `--succes`), `confirmation` (+ `__boite`, `__boutons`), balises `h1`, `h2`.
- #appFeuilles { overflow-x: auto } à l'écran (l'en-tête collé garde la largeur visible), overflow: visible à l'impression (sinon Firefox n'imprime qu'une feuille). 
- Aperçu réduit à l'écran : zoom: var(--zoom-ecran, 1) sur .feuille, facteur calculé par ajusterZoom (ResizeObserver sur #appFeuilles, jamais au-delà de 1) ; zoom: 1 à l'impression. 

## Points de vigilance
- Impression : tester l'aperçu en A4 paysage après toute modification du CSS (local ou commun : le `body` du commun compte).
- Ne jamais lancer « Mettre en forme le document » sur le HTML.
- Limite connue : l'affichage suit Grist en direct. Si des étiquettes sont ajoutées entre l'impression et « Marquer »,
  elles sont marquées comme imprimées sans l'avoir été (la vérification compare avec l'affichage). Risque faible.
- Un plant acheté sans `Date_s` (non plante mère) donne « origine seule, …… saison(s) » : règle partagée avec achat-repro.

## Reste à faire
- [ ] Mise en prod : copier les 3 fichiers sur `main`, changer l'URL du widget dans Grist, Ctrl+F5, test d'impression.
      Aucun changement du commun.
- [ ] Après la mise en prod : supprimer l'ancien widget (`main_etiquettes.js`, ancien `etiquettes.html`). La section
      « étiquettes » de `main.css` ne sert plus qu'à lui : à retirer lors de la migration du tableau / des épingles.
- [ ] Mémo gestion_etiquettes : cocher les points « Widget d'impression » et `saisonsPourLigne` (mère sans année = « or. », pas de borne sur l'étiquette).