# Mémo : conventions de mes outils Grist (à ne pas réexpliquer)

## Contexte
- Widgets Grist en HTML/CSS/JS hébergés sur GitHub (branche de dev `Vue`, branche en ligne `main`).
- Je travaille en français et je suis débutante en Vue : explique brièvement les notions nouvelles.
- Je ne suis pas développeuse : donne des modifications précises (fichier, endroit exact, fonction complète à remplacer), avec un test après chaque étape.
- Une discussion par outil. Les changements du commun (`scriptcommun.js`, CSS commun) se traitent à part.

## Fichiers et chargement
- `outil.html`, `outil.js`, `outil.css` + commun : `../../script/scriptcommun.js` et `../../styles/styles_communs.css`.
- Les outils pas encore migrés utilisent encore l'ancien `styles_commun.css`.
- Scripts en fin de `<body>`, dans cet ordre : plugin Grist, Vue 3.4.38 (unpkg), `scriptcommun.js`, (`outil_textes.js` s'il existe), `outil.js`.
- `grist.ready({ requiredAccess: 'full' })`.

## Vue (sans compilation)
- Une zone `<div id="appXxx">` par bloc, montée par `Vue.createApp({ setup() { return {...} } }).mount('#appXxx')`. Vue reconstruit la zone : un écouteur JS posé dessus est perdu.
- Exception : **Achat-repro** n'a qu'un seul point de montage (`#app`) et des **composants** (`app.component('nom', {...})`) dont les gabarits sont des `<template id="tpl-nom">` placés **hors** de `#app`. Règles des gabarits : pas de balise de composant auto-fermante (`<choix-multiple></choix-multiple>`), attributs en minuscules et en kebab-case (`champ-id`, `sur-ajout`, `@update:model-value`). Un gabarit ne voit que les props, `data`, `computed` et `methods` de son composant (pas `etat`) : une valeur globale comme `MOIS` se déclare dans `data()`.
- Un seul état réactif `etat = Vue.reactive({...})`, en haut du fichier.
- Toute fonction ou valeur appelée par le HTML doit figurer dans le `return` du `setup` de la zone. Un oubli donne `Property "xxx" was accessed during render…` et la zone disparaît. Ne mettre dans le `return` que ce que la zone utilise.
- Une expression invalide dans le HTML (ex. `:class="menu__item {…}"`) fait afficher les `{{ }}` bruts sur toute la zone.
- Vue ne suit pas les `Map` : les données restent dans des `Map` (`recordsParId`), et les listes affichées sont copiées dans `etat` par des fonctions `recalculer…()`.
- Un `Vue.watch` recalcule les listes quand un filtre change. Les `watch` peuvent s'enchaîner (un `watch` qui modifie l'état en déclenche un autre) : vérifier avant d'en ajouter.
- `@click` (pas `pointerdown`) dans les listes qui défilent. `@mousedown.prevent` sur un menu déroulant garde le focus dans le champ. Pour fermer un menu par un clic ailleurs, utiliser un écouteur `click` sur `document` (Safari ne donne pas le focus aux boutons).
- Bouton dont le choix est en cours : `:class="{ 'btn--etape': condition }"`, la condition venant d'une fonction du JS (ex. `toutPlanteDe(s)`).
- `v-else-if` / `v-else` doivent suivre directement la balise qui porte le `v-if`.
- Pas de `createElement`, `innerHTML` ni `getElementById` pour écrire dans l'interface (donner le focus à un champ avec `getElementById(...).focus()` dans un `Vue.nextTick` est toléré).
- Ne jamais lancer « Mettre en forme le document » sur un fichier **HTML** : le formateur
  coupe les lignes longues, y compris au milieu d'un texte entre apostrophes dans un
  {{ }} ou un :class. Une chaîne coupée sur deux lignes fait planter toute la zone
  (« string literal contains an unescaped line break »). Sur un fichier **JS**, c'est sans danger.
- Vue compile le HTML au .mount() : une erreur dans le HTML est signalée à la ligne
  .mount(...) du JS, pas dans le HTML. Lire le texte de l'erreur, pas seulement la ligne.
- Si le formatage a été lancé : Ctrl+Z, ou comparer avec la version Git, puis recoller
  sur une seule ligne les textes coupés.

## Principe : le JS calcule, le HTML met en forme
- Le JS renvoie des valeurs ou des codes (`casOu(s)` → `'reste' | 'manquant' | 'aucun'`, `cas: 'morte'`), jamais des phrases ni des classes de style.
- Textes, `v-if` et classes sont dans le HTML. Ce qui peut se déclarer y reste : bandeaux d'enchaînement (le JS ne garde que `{ type, nom }`), encarts de doublon, avertissements, « Don : N sachets » (le JS calcule seulement `donSachets`).
- Exceptions assumées : messages d'erreur et de succès construits au moment d'une décision. Ils sont tous regroupés dans un bloc `TEXTES` en haut de `outil.js` (une entrée `(noms) => …` pour une phrase qui contient des noms ou un nombre). Achat-repro les a dans un fichier à part, `achatrepro_textes.js`, chargé avant `achatrepro.js` : à harmoniser après comparaison des outils.
- Les pluriels passent par `pluriel` : jamais « (s) » écrit à la main.
- **Messages** : un succès disparaît après 4 s ; une **erreur reste affichée jusqu'au prochain clic**. Un écouteur `click` sur `document` en **phase de capture** (`addEventListener('click', f, true)`) efface l'ancienne erreur avant que le bouton « Créer » revalide : elle réapparaît donc s'il reste un problème. Sans la phase de capture, l'erreur serait effacée aussitôt qu'affichée.
- Zone Vue contenant un bouton `sticky` : `class="zone-transparente"` (`display: contents`).

## Fonctions communes (`scriptcommun.js`)
- N'utilisent que leurs paramètres (jamais `etat`, `recordsParId`…). Seule exception : `lireChoixColonnes`, qui appelle `grist`.
- Ne jamais redéfinir une fonction commune dans un outil : la copie locale la masque sans erreur.
- Disponibles : `tableEnLignes`, `listeChoix`, `enListeChoix`, `normaliser`, `anneeDepuisDate`, `dateAffichee`, `dateDuJour`, `dateEnSecondes`, `typeInverse`, `libelle`, `lieuxFiltres`, `correspondRecherche`, `choixColonne`, `lireChoixColonnes`, `creerMessageTemporaire`, `pluriel`, `evolution`.
- `pluriel(n, singulier, formePluriel)` : 0 et 1 au singulier. Nombre d'abord : « 3 germés ».
- `evolution(avant, apres, singulier, formePluriel)` : affichage « avant → après unité » (accord sur après) dans En cours. Le JS calcule avant et après, le HTML n'additionne rien.
- Dates écrites dans Grist : `dateEnSecondes('AAAA-MM-JJ')`, jamais `Date.UTC` recopié dans un outil.

## Données Grist
- ChoiceList : `['L', 'a', 'b']` (`listeChoix()` pour lire, `enListeChoix()` pour écrire).
- Dates : secondes UTC à minuit.
- Colonnes écrites par un outil : colonnes de **données**, jamais des colonnes formule. Une colonne vide créée dans Grist est parfois une colonne de formule : la convertir en colonne de données.
- Une colonne écrite par un outil doit exister dans **toutes** les tables visées : sinon `KeyError 'Nom_colonne'` (cas d'une colonne renommée, ex. `Sachets` → `Nb_sachets`).
- Les ids de tables différentes se recoupent : ne jamais les mélanger dans un même objet.
- Quantités saisies = ajouts aux valeurs chargées (germés, plantés, oups, dons).
- Nombres saisis : **entiers seulement** (`Number.isInteger` ou `entierOuNull`). Si la saisie n'est pas un entier, **un message d'erreur s'affiche** et rien n'est enregistré. Un `<input type="number">` renvoie une valeur vide pour `abc`, donc ne peut pas signaler l'erreur : utiliser un champ texte (`type="text" inputmode="numeric"`) avec un contrôle dans le JS.
- Avant d'enregistrer : recharger la table, comparer les lignes concernées, refuser si l'une a changé.
- **Un seul `applyUserActions` par enregistrement**, sauf quand une action a besoin d'un id créé par une autre (ex. la ligne `Semis` d'une plante mère a besoin de l'id du millésime) : alors **deux envois au maximum**, toutes les **lectures avant** la première écriture, et si le second envoi échoue, annuler le premier (`RemoveRecord` de la ligne créée) en prévenant si l'annulation échoue aussi.
- Ajouter un choix à une colonne Choice / ChoiceList depuis un outil : relire les `widgetOptions` de la colonne (`_grist_Tables_column`), ajouter la valeur dans `choices`, puis `['ModifyColumn', table, colonne, { widgetOptions: JSON.stringify(options) }]`. Les couleurs et autres réglages sont conservés. Ne jamais réécrire les réglages à partir de zéro. Comparer sans casse ni accents pour éviter les doublons.
- `Millesimes.Nb_sachets` est numérique (1 pour un sachet, vide pour épuisé) : pas de lettres.
- Plante mère : une ligne `Millesimes` + une seule ligne `Semis` sans godets ni graines (`Ou`, `Plantes`). `Millesimes.Nb_plants` fait foi ; `Semis.Plantes` de cette ligne le suit (lu par le plan et les étiquettes) ; la formule `Millesimes.Plantes` renvoie `Nb_plants` pour une plante mère.

## Saisies conservées au rechargement
- Toutes les saisies non enregistrées vivent dans des objets de `etat` (`saisies`, `saisiesMeres`).
- Un `Vue.watch` profond les copie dans `sessionStorage` ; au démarrage : restaurer, puis supprimer celles dont la carte n'existe plus.
```js
const CLE_SAISIES = "outil_saisies";
function sauvegarderSaisies() {
  try {
    const vide = !Object.keys(etat.saisies).length && !Object.keys(etat.saisiesMeres).length;
    if (vide) sessionStorage.removeItem(CLE_SAISIES);
    else sessionStorage.setItem(CLE_SAISIES, JSON.stringify({ saisies: etat.saisies, meres: etat.saisiesMeres }));
  } catch (err) { console.warn(err); }
}
function restaurerSaisies() {
  try {
    const d = JSON.parse(sessionStorage.getItem(CLE_SAISIES) || "{}");
    for (const [id, s] of Object.entries(d.saisies || {})) etat.saisies[id] = { ...saisieVide(), ...s };
    for (const [id, s] of Object.entries(d.meres || {})) etat.saisiesMeres[id] = { statut: s.statut, morts: s.morts || [], ou: s.ou || [] };
  } catch (err) { console.warn(err); }
}
Vue.watch(() => [etat.saisies, etat.saisiesMeres], sauvegarderSaisies, { deep: true });
// au démarrage : restaurerSaisies(); purgerSaisiesOrphelines(); recalculerTout();
```
- Restaurer tous les champs de la saisie (ex. à gérer : `ajuste`, `plants` en plus pour les plantes mères).
- Contenu perdu à la fermeture de l'onglet : voulu. Changer la clé si le format change (inutile en base de test ouverte dans un seul onglet).

## Couleurs
- Neutre = sans info. Bleu = info à jour.
- Orange = ce que tu es en train de saisir : liseré de la carte (`carte--etape`), bouton choisi (`btn--etape`), **pastille choisie (`pastille--etape`)**, et dans En cours l'**essentiel de l'étape** (germés, plantés, statut et plants d'une plante mère) en `texte--etape`. Le reste de la saisie (oups, dons, en attente) reste gris.
- Gris (`texte--discret`) = information. Gris gras (`texte--discret texte--gras`) = information de Grist importante à repérer.
- Rouge = attention. Vert-jaune = plante mère. Violet = lieu (`pastille--lieu`). Vert / marron = sous abri / pleine terre.

## Nommage CSS (BEM)
- Bloc : `carte`, `btn`, `champ`, `menu`, `pastille`, `case`, `ligne`, `texte`, `encart`, `statut`. Élément : `bloc__element`. Variante : `bloc--variante`.
- Une variante s'ajoute à la classe de base : `class="btn btn--etape"`, jamais seule.
- Un seul niveau de classe (pas de `.carte .titre`) : toutes les règles ont le même poids, c'est l'ordre dans le fichier qui décide.
- **Règle locale qui s'appuie sur une classe du commun** : le CSS de l'outil est chargé après le commun, donc à poids égal sa règle gagne. Pour qu'elle ne masque pas la classe du commun, la limiter avec `:not(...)` (exemple : `.pastille--choix:not(.pastille--etape)`). **Après le renommage d'une classe du commun**, relire les règles locales qui la citent.
- Cases à cocher : `class="case__saisie"` sur chaque `<input type="checkbox">` (jamais un sélecteur sur la balise `input` seule, qui toucherait tous les champs).
- Menu : `menu` > `menu__liste` > `menu__item` (+ `menu__item--choisi`, `menu__item--vide`). `menu` est en `position: relative`, `menu__liste` en `absolute` juste dessous.
- Un sélecteur `h3 {}` cible la balise, `.h3 {}` cible la classe.
- Une règle CSS invalide casse la suivante : point en trop, commentaire sans `*/`, `border-color: 1px solid …`.
- Les classes de mise en page n'ont pas d'espacement externe : l'espacement vient de `gap` sur le parent.
- Éléments de hauteurs différentes sur une même ligne (boutons avec ou sans `margin-top`) : aligner la ligne par le bas (`align-items: flex-end`, classe `ligne--bas`) plutôt que de toucher au `margin-top` du bouton.
- Une classe va dans le commun si au moins deux outils l'utilisent à l'identique ; une règle qui cite un id reste dans l'outil.
- Avant de créer une variante, chercher dans le commun si elle existe déjà. Exemple : `champ--bouton` (texte à gauche, curseur main) fournit la base, et la classe locale `champ--deroulant` n'ajoute que la mise en ligne et la flèche (`class="champ champ--bouton champ--deroulant"`).
- Classes ajoutées au commun : `entete`, `grille`, `ligne--sur-champ`, `btn--collant`.
- `var(--erreur)` n'existe plus : utiliser `--erreur-clair`, `--erreur-moyen` ou `--erreur-fonce`.

## Méthode de travail
- Une modification à la fois, puis un test et la console (F12, filtre vidé).
- Après un copier-coller, **relire le bloc autour** : un `return` grignoté, un `=` à la place d'un `<=`, un bloc collé au mauvais endroit ou un `id` en double ont causé la plupart des erreurs.
- Ctrl+Maj+F sur le nom qu'on vient de coller : un compte inattendu trahit un doublon. Exclure `node_modules` de la recherche.
- Ctrl+F5 après un changement du CSS ou du JS commun ; ouvrir tous les outils qui en dépendent.
- Après un déplacement de fichiers ou de dossiers : vérifier l'URL du widget dans Grist, les chemins relatifs du HTML, puis recharger de force. Une erreur qui cite un ancien nom (`KeyError 'Sachets'`) vient souvent d'une ancienne copie encore exécutée.
- Un commit avant chaque série de changements.
- Dans la console, les « n cachés » sont des messages filtrés, pas un résultat.
- Messages de la console qui ne sont pas des erreurs du code : « Erreur de sécurité … file:/// » (serveur local Live Server, absent en prod), « accès partitionné à un cookie ou au stockage » (information de Firefox pour un widget affiché dans Grist), messages RPC de Grist. En cas de doute, regarder la version en ligne.
- Ordre en prod : commun d'abord, puis outils.
- Vue du code de Grist (menu de gauche) : toutes les formules sur une page, pratique pour chercher qui lit une colonne.

## À traiter dans la discussion du commun
- `styles_communs.css` : `.btn--enregistrer` (`margin-top: 8px`) écrase `.btn--grand` (`margin-top: 14px`), plus bas dans le fichier. Garder l'un des deux.
- Rapprocher `champ--bouton` (commun) et `champ--deroulant` (Achat-repro) si un autre outil a besoin de la flèche.

## Outils d'impression
- Lecture par `grist.onRecords(f, { includeColumns: 'normal' })` : reçoit toutes les colonnes, même masquées
  dans la vue (testé). L'ordre et le filtre d'impression sont ceux de la vue Grist. Garder une alerte
  « colonnes manquantes » (liste `COLONNES_NECESSAIRES`) comme filet de sécurité.
- Dates reçues par `onRecords` : objet `Date` → `getTime() / 1000` avant `anneeDepuisDate`
  (`dateEnSecondesGrist`, dans etiquettes.js, candidat au commun). Ne pas utiliser `keepEncoded: true` :
  les dates arrivent codées `['d', secondes]` et `anneeDepuisDate` renvoie null.
- Après un `applyUserActions`, `onRecords` renvoie lui-même les lignes à jour : pas de rechargement à faire.
- Le `body` du commun change l'impression (police system-ui, `padding: 12px`, fond) : la feuille remet sa
  police, sa taille et sa couleur, et à l'impression `body { padding: 0; background: white; }`, sinon la
  feuille est décalée et déborde de l'A4.
- Feuilles plus larges que le widget : elles défilent dans leur zone (`overflow-x: auto`) pour que l'en-tête
  collé garde toute la largeur. À l'impression, cette zone repasse en `overflow: visible`, sinon Firefox
  n'imprime que la première feuille.
- En-tête et fenêtre de confirmation masqués dans `@media print`.
- Test de chaque modification : PDF en A4 paysage, comparé à la version précédente (nombre de pages,
  positions, pas de page blanche finale).
- styles_communs_pourimpression.css est chargé entre le commun BEM et le CSS de l'outil. Il contient .feuille (padding 15mm 10mm 10mm 10mm, que l'outil peut remplacer), .zone-feuilles sur la zone Vue des feuilles, et @media print. Les lignes insécables restent dans l'outil.