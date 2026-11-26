# Mémo : conventions de mes outils Grist (à ne pas réexpliquer)

## Contexte
- Widgets Grist en HTML/CSS/JS hébergés sur GitHub (branche de dev `Vue`, branche en ligne `main`).
- Je travaille en français et je suis débutante en Vue : explique brièvement les notions nouvelles.
- Je ne suis pas développeuse : donne des modifications précises (fichier, endroit exact, fonction complète à remplacer), avec un test après chaque étape.
- **Une seule mécanique à comprendre** : tous les outils sont écrits de la même façon (zones Vue, pas de composants). Pas de « bonne pratique » qui ajoute une seconde mécanique.
- Une discussion par outil. Les changements du commun (`scriptcommun.js`, CSS communs) se traitent à part.
- Outils : À gérer, Sélection pour étiquettes, Semis réalisés, Achat-repro (saisie) ; Étiquettes, Cahier, Calendrier, Numéros (impression) ; Numérotation. Boîte à dons et Plan : pas encore migrés.
- Pas de Ferrari : écrire tout de suite quand l'action est petite et réversible (Ctrl+Z dans Grist) ; ne vérifier que ce qui arrive vraiment ; laisser à Grist ce qu'il sait faire (corriger une cellule, annuler, filtrer).

## Fichiers et chargement
- `outil.html`, `outil.js`, `outil.css` + commun : `../../script/scriptcommun.js` et `../../styles/styles_communs.css`.
- Outils d'impression : `../../styles/styles_communs_pourimpression.css` en plus, chargé **entre** le commun et le CSS de l'outil.
- Les outils pas encore migrés utilisent encore l'ancien `styles_commun.css`.
- Scripts en fin de `<body>`, dans cet ordre : plugin Grist, Vue 3.4.38 (unpkg), `scriptcommun.js`, `outil.js`.
- Les textes (`TEXTES`) sont dans `outil.js`, jamais dans un fichier à part.
- `grist.ready({ requiredAccess: 'full' })`.

## Vue (sans compilation)
- Une zone `<div id="appXxx">` par bloc, montée par `Vue.createApp({ setup() { return {...} } }).mount('#appXxx')`. Vue reconstruit la zone : un écouteur JS posé dessus est perdu. Un `v-show` ou un `v-if` sur le bloc se met **dans** la zone (sur un `<section>` à l'intérieur du `<div id="appXxx">`), pas sur l'élément monté. L'en-tête peut être sa propre zone : `<header id="appEntete" class="entete">`.
- **Pas de composants** (`app.component`, `<template id="tpl-…">`) : un bloc qui se répète s'écrit en entier dans le HTML, avec des fonctions du JS. Achat-repro en avait ; il a été migré le 26/11.
- Un seul état réactif `etat = Vue.reactive({...})`, en haut du fichier, **partagé par toutes les zones** de l'outil (c'est ce qui permet l'enchaînement d'un panneau à l'autre).
- Toute fonction ou valeur appelée par le HTML doit figurer dans le `return` du `setup` de **sa** zone. Un oubli (ou un nom qui n'existe plus) donne `Property "xxx" was accessed during render…` ou `xxx is not defined`, et la zone disparaît. Ne mettre dans le `return` que ce que la zone utilise.
- Une expression invalide dans le HTML (ex. `:class="menu__item {…}"`) fait afficher les `{{ }}` bruts sur toute la zone.
- Vue ne suit pas les `Map` : les données restent dans des `Map` (`recordsParId`), et les listes affichées sont copiées dans `etat` par des fonctions `recalculer…()`.
- Un `Vue.watch` recalcule les listes quand un filtre change. Les `watch` peuvent s'enchaîner (un `watch` qui modifie l'état en déclenche un autre) : vérifier avant d'en ajouter.
- `@click` (pas `pointerdown`) dans les listes qui défilent. `@mousedown.prevent` sur un menu déroulant garde le focus dans le champ. Pour fermer un menu par un clic ailleurs, utiliser un écouteur `click` sur `document` (Safari ne donne pas le focus aux boutons).
- Bouton dont le choix est en cours (et onglet ouvert) : `:class="{ 'btn--etape': condition }"`, la condition venant d'une fonction du JS (ex. `toutPlanteDe(s)`).
- `v-else-if` / `v-else` doivent suivre directement la balise qui porte le `v-if`.
- Pas de `createElement`, `innerHTML` ni `getElementById` pour écrire dans l'interface (donner le focus à un champ avec `getElementById(...).focus()` dans un `Vue.nextTick` est toléré : `donnerLeFocus(id)` d'Achat-repro).
- Ne jamais lancer « Mettre en forme le document » sur un fichier **HTML** : le formateur coupe les lignes longues, y compris au milieu d'un texte entre apostrophes dans un `{{ }}` ou un `:class`. Une chaîne coupée sur deux lignes fait planter toute la zone (« string literal contains an unescaped line break »). Sur un fichier **JS**, c'est sans danger. Si c'est arrivé : Ctrl+Z, ou comparer avec la version Git, puis recoller sur une seule ligne les textes coupés.
- Vue compile le HTML au `.mount()` : une erreur dans le HTML est signalée à la ligne `.mount(...)` du JS, pas dans le HTML. Lire le texte de l'erreur, pas seulement la ligne.

### Menus et choix écrits à la main (modèle : Achat-repro)
- **Menu à choix unique** : `<div class="menu">` > bouton `champ champ--bouton champ--deroulant` + `<ul class="menu__liste" v-show="etat.menuOuvert === 'nom'" @mousedown.prevent>`. `etat.menuOuvert` contient le nom du menu ouvert (un seul à la fois). Fonctions : `basculerMenu(nom)`, `choisir(objet, cle, valeur)` (écrit le choix et ferme), `libelleDe(options, valeur)` (libellé d'une option `{ valeur, libelle }`). Un écouteur `click` sur `document` ferme le menu ouvert si le clic est hors d'un `.menu`.
- **Champ avec recherche** : `<input type="search">` dans un `menu`, texte tapé dans `etat.recherches[nom]`, fonctions `ouvrirRecherche`, `saisirRecherche`, `fermerRecherche`, `choisirRecherche`. Liste filtrée par `chercher(options, saisie)` (40 résultats au plus, `LIMITE_RECHERCHE`) ou `lieuxFiltres` (choix multiple), dans une valeur calculée (`Vue.computed`).
- **Pastilles** (choix multiple) : `v-for` sur la liste des choix, `:class="{ 'pastille--etape': liste.includes(c) }"`, `@click="basculerDans(liste, c)"` (ajoute ou retire sur place). Pour une liste avec recherche : pastilles choisies (`ligne--sur-champ`, retrait par clic) + champ + `ajouterDans(nom, liste, valeur)`.
- **Ajout d'un choix** : `etat.ajout = { cible, texte, enCours }` (un seul petit champ ouvert à la fois), `ouvrirAjout`, `annulerAjout`, `validerAjout`.
- Les choix vides de Grist sont ignorés **au chargement** (`sansVides(liste)`), pas dans le HTML.

## Principe : le JS calcule, le HTML met en forme
- Le JS renvoie des valeurs ou des codes (`casOu(s)` → `'reste' | 'manquant' | 'aucun'`, `cas: 'morte'`), jamais des phrases ni des classes de style.
- Textes, `v-if` et classes sont dans le HTML. Ce qui peut se déclarer y reste : bandeaux d'enchaînement (le JS ne garde que `{ type, nom }`), encarts de doublon, avertissements, « Don : N sachets » (le JS calcule seulement `donSachets`).
- Exceptions assumées : messages d'erreur et de succès construits au moment d'une décision. Ils sont tous regroupés dans un bloc `TEXTES` en haut de `outil.js` (une entrée `(noms) => …` pour une phrase qui contient des noms ou un nombre).
- Les pluriels passent par `pluriel` : jamais « (s) » écrit à la main.

## Messages
- **Succès** : `const afficherSucces = creerMessageTemporaire(texte => { etat.succes = texte; });` → disparaît après 4 s (valeur par défaut, ne pas la répéter).
- **Erreur** : reste affichée jusqu'au prochain clic, dans **tous** les outils : `effacerAuClic(() => { etat.erreur = ''; });` (À gérer : `effacerAuClic(effacerErreurs)`). L'écouteur est en phase de capture : l'ancienne erreur est effacée avant que le bouton cliqué revalide, elle réapparaît donc s'il reste un problème.
- **Erreur de chargement** : `TEXTES.erreurChargement(detail)` rangé dans `etat.message`, affiché **dans l'en-tête** : `<p v-if="etat.message" class="texte texte--erreur texte--gras entete__message">`. Reste affichée jusqu'au prochain chargement réussi.
- Tout message placé dans l'en-tête porte `entete__message` (seul sur sa ligne, sans marge).
- Zone Vue contenant un bouton `sticky` : `class="zone-transparente"` (`display: contents`).

## Fonctions communes (`scriptcommun.js`)
- N'utilisent que leurs paramètres (jamais `etat`, `recordsParId`…). Exceptions : `lireChoixColonnes` appelle `grist` ; `aller` et `effacerAuClic` utilisent `document` ; `numeroMois` lit `LISTE_MOIS`.
- Ne jamais redéfinir une fonction commune dans un outil : la copie locale la masque sans erreur. Avant d'écrire une fonction utilitaire, chercher ici.
- Ne jamais déclarer dans un outil une `const` ou un `let` qui existe dans le commun (ex. `LISTE_MOIS`) : contrairement à une fonction, le doublon donne « Identifier … has already been declared » et **tout** le fichier de l'outil s'arrête. Une constante propre à une fonction commune se déclare **dans** la fonction (ex. la largeur de feuille dans `facteurZoom`).
- **Données Grist** : `tableEnLignes`, `listeChoix`, `enListeChoix`, `colonneGrist(tabTables, tabColonnes, tableId, colId)` (ligne de la colonne dans les métadonnées, ou null), `choixColonne`, `lireChoixColonnes(tableId, [colIds])`, `colonnesAbsentes(colonnes, liste)`, `estLigneMere(s)` (`s` = ligne Semis préparée par l'outil avec `planteMere`, `millesimeId`, `godets`, `graines`), `indexerVarietes`(lignes)( -> { parId, parNom, doublons }) et `varieteReferencee`(index, reference)(id ou texte « Nom↵Variété » de onRecords).
- **Dates** : `anneeDepuisDate(valeur)` (secondes de `fetchTable` **ou** objet `Date` de `onRecords`), `dateAffichee(secondes)`, `dateDuJour()` ('AAAA-MM-JJ'), `dateEnSecondes('AAAA-MM-JJ')`. Dates écrites dans Grist : toujours `dateEnSecondes`, jamais `Date.UTC` recopié dans un outil.
- **Mois** : `LISTE_MOIS` (12 objets `{ num, court, long, initiale, valeurs }` ; `valeurs[0]` = valeur des listes de choix Grist, ex. 'Jui', 'Aou') et `numeroMois(valeur)` ('Mar' ou 'Mars' → 3, inconnu → null). Jamais de liste de mois locale.
- **Textes** : `normaliser`, `correspondRecherche(texteNormalise, saisieNormalisee)`, `lieuxFiltres(lieux, choisis, saisie)`, `libelle(v)` (« Nom - Variété », tiret court), `pluriel(n, singulier, formePluriel)` (0 et 1 au singulier, nombre d'abord : « 3 germés »), `evolution(avant, apres, singulier, formePluriel)` (« avant → après unité », accord sur après ; le JS calcule avant et après, le HTML n'additionne rien).
- **Nombres saisis** : `entierOuNull(valeur)` ('12' → 12 ; vide ou non entier → null).
- **Interface** : `creerMessageTemporaire(definir, duree = 4000)`, `effacerAuClic(effacer)`, `aller(id)` (défile jusqu'à l'élément, juste sous l'en-tête collé, quelle que soit sa hauteur du moment : pas de `scroll-margin-top` dans les CSS).
- **Impression** : `facteurZoom(largeur)` (réduction d'une feuille A4 paysage à l'écran ; chaque outil garde `etat.zoom = facteurZoom(...)` dans son `ResizeObserver`).

## Données Grist
- ChoiceList : `['L', 'a', 'b']` (`listeChoix()` pour lire, `enListeChoix()` pour écrire).
- Dates : secondes UTC à minuit.
- `Type` : l'emoji est en tête dans Grist (« 🌿 Arom.Méd »), affiché tel quel, sans conversion. Choix saisis dans `Especes` et `Varietes` (mêmes textes dans les deux) ; `Semis.Type` et `Millesimes.Type` sont des formules `$NomVariete.Type`, jamais écrites par un outil.
- Colonnes écrites par un outil : colonnes de **données**, jamais des colonnes formule. Une colonne vide créée dans Grist est parfois une colonne de formule : la convertir en colonne de données.
- Une colonne écrite par un outil doit exister dans **toutes** les tables visées : sinon `KeyError 'Nom_colonne'` (cas d'une colonne renommée, ex. `Sachets` → `Nb_sachets`).
- **Colonne renommée et seulement lue** : aucune erreur, la valeur vaut `undefined` et la fonction s'éteint en silence. Après un renommage, chercher l'ancien nom dans tous les outils. Les outils qui le peuvent vérifient leurs colonnes : liste `COLONNES_NECESSAIRES` + `etat.colonnesManquantes = colonnesAbsentes(...)` + alerte dans l'en-tête.
- Les ids de tables différentes se recoupent : ne jamais les mélanger dans un même objet.
- Quantités saisies = ajouts aux valeurs chargées (germés, plantés, oups, dons).
- Nombres saisis : **entiers seulement** (`entierOuNull`). Si la saisie n'est pas un entier, **un message d'erreur s'affiche** et rien n'est enregistré. Un `<input type="number">` renvoie une valeur vide pour `abc`, donc ne peut pas signaler l'erreur : préférer un champ texte (`type="text" inputmode="numeric"`) avec un contrôle dans le JS.
- Pas de relecture avant écriture (décision du 23/11) : les quantités s'ajoutent aux valeurs chargées, rafraîchies après chaque enregistrement.
- **Un seul `applyUserActions` par enregistrement**, sauf quand une action a besoin d'un id créé par une autre (ex. la ligne `Semis` d'une plante mère a besoin de l'id du millésime) : alors **deux envois au maximum**, toutes les **lectures avant** la première écriture. Pas d'annulation automatique si le second échoue (décision du 23/11) : le message d'erreur dit quoi vérifier. Achat-repro applique cette règle depuis le 25/11.
- Ajouter un choix à une colonne Choice / ChoiceList (Achat-repro, `ajouterChoixColonne`) : relire les réglages de la colonne avec `colonneGrist`, ajouter la valeur dans `choices`, puis `['ModifyColumn', table, colonne, { widgetOptions: JSON.stringify(options) }]`. `ModifyColumn` remplace **tous** les réglages : toujours renvoyer ceux qu'on a lus, jamais seulement la liste. Comparer sans casse ni accents pour éviter les doublons.
- `Millesimes.Nb_sachets` est numérique (1 pour un sachet, vide pour épuisé) : pas de lettres.
- Plante mère : une ligne `Millesimes` + une seule ligne `Semis` sans godets ni graines (`Ou`, `Plantes`), reconnue par `estLigneMere(s)`. `Millesimes.Nb_plants` fait foi ; `Semis.Plantes` de cette ligne le suit (lu par le plan et les étiquettes) ; la formule `Millesimes.Plantes` renvoie `Nb_plants` pour une plante mère.
- Plante mère = plant au jardin : `Type_plant` (pieds, rhizome, caïeux, bulbe). Jamais `Epuise` (formule) : l'exclure du choix d'un sachet sauf si elle a des graines (`Qtte_graines` ou `Nb_sachets`). À la mort totale, À gérer décoche `Plante_mere`.
- Sachet mélangé : case `Millesimes.Melange` (sens actuel : plusieurs millésimes d'une même variété, pas un mélange de variétés ; un vrai mélange = une variété « Espèce - Mélange », voir les notes d'Achat-repro).
- « À reproduire » : colonne de données `Varietes.A_reproduire` ; `Semis.A_produire` est une formule qui la lit.

## Saisies non enregistrées
- Elles vivent dans des objets de `etat` (`saisies`, `saisiesMeres`) et sont perdues au rechargement : voulu (décision du 23/11, plus de `sessionStorage`).
- Pas de `beforeunload` : le message « Quitter la page ? » ne s'affiche pas dans une iframe Grist.

## Couleurs
- Neutre = sans info. Bleu = info à jour (`encart--succes`, `encart--info`, `pastille--info`).
- Orange = ce que tu es en train de saisir : liseré de la carte (`carte--etape`), bouton choisi et onglet ouvert (`btn--etape`), pastille choisie (`pastille--etape`), et dans En cours l'**essentiel de l'étape** (germés, plantés, statut et plants d'une plante mère) en `texte--etape`. Le reste de la saisie (oups, dons, en attente) reste gris.
- Gris (`texte--discret`) = information. Gris gras (`texte--discret texte--gras`) = information de Grist importante à repérer.
- Rouge = attention, erreurs comprises (`texte--erreur` ; `texte--morte` est le même rouge, gardé pour la lisibilité d'À gérer). Vert-jaune = plante mère. Violet = lieu (`pastille--lieu`). Vert / marron = sous abri / pleine terre (les deux : `carte--sousabri-pleineterre`).
- Variables : `--erreur-clair`, `--erreur-moyen`, `--erreur-fonce` (`var(--erreur)` n'existe plus) ; noirs : `--noir-intense`, `--noir`, `--noir-clair`.

## Nommage CSS (BEM)
- Blocs : `carte`, `btn`, `champ`, `menu`, `pastille`, `case`, `ligne`, `groupe`, `texte`, `encart`, `statut`, `entete`. Élément : `bloc__element`. Variante : `bloc--variante`.
- Une variante s'ajoute à la classe de base : `class="btn btn--etape"`, jamais seule.
- Un seul niveau de classe (pas de `.carte .titre`) : toutes les règles ont le même poids, c'est l'ordre dans le fichier qui décide.
- **Règle locale qui s'appuie sur une classe du commun** : le CSS de l'outil est chargé après le commun, donc à poids égal sa règle gagne. Pour qu'elle ne masque pas la classe du commun, la limiter avec `:not(...)` (exemple : `.pastille--choix:not(.pastille--etape)`). **Après le renommage d'une classe du commun**, relire les règles locales qui la citent.
- Cases à cocher : `class="case__saisie"` sur chaque `<input type="checkbox">` (jamais un sélecteur sur la balise `input` seule, qui toucherait tous les champs).
- Menu : `menu` > `menu__liste` > `menu__item` (+ `menu__item--choisi`, `menu__item--vide`). `menu` est en `position: relative`, `menu__liste` en `absolute` juste dessous. Bouton qui ouvre un menu : `class="champ champ--bouton champ--deroulant"` (flèche ▾). Exception : le tri d'À gérer, dont le texte de réserve casserait la mise en ligne.
- Un sélecteur `h3 {}` cible la balise, `.h3 {}` cible la classe.
- Une règle CSS invalide casse la suivante : point en trop, commentaire sans `*/`, `border-color: 1px solid …`.
- Les classes de mise en page n'ont pas d'espacement externe : l'espacement vient de `gap` sur le parent. Exception assumée : Achat-repro ajoute localement `.groupe { margin-bottom: 10px; }` (ses groupes ne sont pas dans un parent avec `gap`).
- Une classe va dans le commun si au moins deux outils l'utilisent à l'identique ; une règle qui cite un id reste dans l'outil.
- Avant de créer une variante, chercher dans le commun si elle existe déjà, et s'appuyer dessus : l'outil n'ajoute que ce qui diffère (ex. `class="champ champ--compact champ--nb"`, où `champ--nb` ne fixe que la largeur).
- Dans `carte__contenu` (colonne, `gap: 6px`), deux éléments à garder sur une même ligne (nom + type) se regroupent dans un `<div>`.

### Classes du commun à connaître
- Mise en page : `entete` (bandeau collé), `entete__message` (message seul sur sa ligne), `ligne` (+ `--entre`, `--pleine`, `--sur-champ`), `grille` (2 colonnes, 1 sur écran étroit), `groupe` (libellé + champ empilés, `gap: 4px`), `zone-transparente`.
- Champs : `champ` (+ `--flexible`, `--bouton`, `--deroulant`, `--compact` = padding réduit) ; `.champ:disabled` grisé.
- Boutons : `btn` (+ `--grand`, `--etape`, `--enregistrer`, `--collant`, `--suppr`).
- Cartes : `liste-carte`, `carte` (+ `--colonne`, `--etape`, `--cliquable`, `--plantemere`, `--sousabri`, `--pleineterre`, `--sousabri-pleineterre`), `carte__contenu`, `carte__type`, `carte__action`.
- Encarts : `encart` (+ `--succes`, `--alerte`, `--info`). Pastilles : `pastille` (+ `--lieu`, `--info`, `--categorie`, `--sousabri`, `--pleineterre`, `--plantemere`, `--etape`). Textes : `texte` (+ `--titre`, `--discret`, `--gras`, `--ici`, `--etape`, `--erreur`, `--morte`, `--succes`, `--plantemere`, `--note`). Statut : `statut`, `statut--non-sauvegarde`. Confirmation : `confirmation`, `confirmation__boite`, `confirmation__boutons`.

## Outils d'impression
- Lecture par `grist.onRecords(f, { includeColumns: 'normal' })` : reçoit toutes les colonnes, même masquées dans la vue (testé). L'ordre et le filtre d'impression sont ceux de la vue Grist. Garder une alerte « colonnes manquantes » (liste `COLONNES_NECESSAIRES` + `colonnesAbsentes(lignes[0], …)`) comme filet de sécurité. Les outils qui lisent par `fetchTable` passent la table entière : `colonnesAbsentes(table, …)`.
- Dates reçues par `onRecords` : objet `Date`, accepté directement par `anneeDepuisDate`. Ne pas utiliser `keepEncoded: true` : les dates arrivent codées `['d', secondes]` et `anneeDepuisDate` renvoie null.
- Après un `applyUserActions`, `onRecords` renvoie lui-même les lignes à jour : pas de rechargement à faire.
- `styles_communs_pourimpression.css` (étiquettes, cahier, numéros, calendrier) contient `.feuille` (A4 paysage, padding 15mm 10mm 10mm 10mm que l'outil peut remplacer, police remise, `zoom: var(--zoom-ecran)`), `.zone-feuilles`, `.tronque`, `.tableau` et `@media print`. Les lignes insécables (`.insecable`) se posent dans le HTML de l'outil.
- Aperçu à l'écran : `new ResizeObserver(e => { etat.zoom = facteurZoom(e[0].contentRect.width); }).observe(zone)` et `:style="{ '--zoom-ecran': etat.zoom }"` sur chaque `.feuille`.
- Le `body` du commun change l'impression : le CSS d'impression remet `body { padding: 0; background: white; }`, sinon la feuille est décalée et déborde de l'A4.
- Feuilles plus larges que le widget : elles défilent dans `.zone-feuilles` (`overflow-x: auto`) pour que l'en-tête collé garde toute la largeur. À l'impression, cette zone repasse en `overflow: visible`, sinon Firefox n'imprime que la première feuille.
- En-tête, fenêtre de confirmation et `.ecran-seulement` masqués dans `@media print`.
- Test de chaque modification : PDF en A4 paysage, comparé à la version précédente (nombre de pages, positions, pas de page blanche finale).
- onRecords livre les listes de choix sans le 'L' : ne pas leur appliquer listeChoix (réservé à fetchTable)

## Méthode de travail
- Une modification à la fois, puis un test et la console (F12, filtre vidé).
- **Partir du fichier réel** : avant de proposer un remplacement, relire le fichier de l'outil (les copies du projet peuvent dater d'avant les dernières étapes : les redéposer) et reprendre ses noms exacts. Un nom recopié de mémoire (ex. une ancienne constante) fait échouer le remplacement.
- Après un copier-coller, **relire le bloc autour** : un `return` grignoté, un `=` à la place d'un `<=`, un bloc collé au mauvais endroit (ou dans la mauvaise fonction : une fonction qui s'appelle elle-même donne « too much recursion »), une ligne supprimée au lieu d'être remplacée, ou un `id` en double ont causé la plupart des erreurs.
- Retirer une fonction = retirer aussi tous ses appels, ses `watch` et sa place dans les `return` : Ctrl+Maj+F sur son nom doit donner 0 résultat ensuite.
- Ctrl+Maj+F sur le nom qu'on vient de coller ou de supprimer : un compte inattendu trahit un doublon ou un reste. Exclure `node_modules` de la recherche.
- Renommage global (`modele` → `espece`) : Remplacer dans les fichiers de l'outil, **casse respectée**, du plus long au plus court (`MODELE`, `Modele`, `modele`), puis Ctrl+Maj+F sur l'ancien nom.
- Ctrl+F5 après un changement du CSS ou du JS commun ; ouvrir tous les outils qui en dépendent.
- Après un déplacement de fichiers ou de dossiers : vérifier l'URL du widget dans Grist, les chemins relatifs du HTML, puis recharger de force. Une erreur qui cite un ancien nom (`KeyError 'Sachets'`) vient souvent d'une ancienne copie encore exécutée.
- Un commit avant chaque série de changements.
- Dans la console, les « n cachés » sont des messages filtrés, pas un résultat.
- Messages de la console qui ne sont pas des erreurs du code : « Erreur de sécurité … file:/// » (serveur local Live Server, absent en prod), « accès partitionné à un cookie ou au stockage » (information de Firefox pour un widget affiché dans Grist), messages RPC de Grist. En cas de doute, regarder la version en ligne.
- Ordre en prod : commun d'abord, puis outils.
- Vue du code de Grist (menu de gauche) : toutes les formules sur une page, pratique pour chercher qui lit une colonne.
- Après une série de changements, redéposer dans le projet Claude les fichiers modifiés (HTML et CSS compris) : sinon les vérifications portent sur d'anciennes copies.

## Points ouverts
- Boîte à dons : passer à `LISTE_MOIS` lors de sa refonte.
- Achat-repro : `ajouterChoixColonne`, `existeDeja`, `sansVides`, `basculerDans` et `chercher` pourraient rejoindre le commun si un autre outil en a besoin (discussion à part). Les menus de À gérer (`ouvertOu`, `lieuxProposes`) et ceux d'Achat-repro (`etat.menuOuvert`, `etat.recherches`) font la même chose avec deux écritures : à rapprocher si un outil est repris.
- Sachets de mélange : piste « une variété Espèce - Mélange » à discuter à part (touche tous les outils), avec le renommage éventuel de `Millesimes.Melange`.