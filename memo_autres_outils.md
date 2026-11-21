# Mémo : conventions de mes outils Grist (à ne pas réexpliquer)

## Contexte
- Widgets Grist en HTML/CSS/JS hébergés sur GitHub (branche de dev `Vue`, branche en ligne `main`).
- Je travaille en français et je suis débutante en Vue : explique brièvement les notions nouvelles.
- Je ne suis pas développeuse : donne des modifications précises (fichier, endroit exact, fonction complète à remplacer), avec un test après chaque étape.
- Une discussion par outil. Les changements du commun (`scriptcommun.js`, CSS commun) se traitent à part.

## Fichiers et chargement
- `outil.html`, `outil.js`, `outil.css` + commun : `../../script/scriptcommun.js` et `../../styles/styles_communs_bem.css`.
- Les outils pas encore migrés utilisent encore l'ancien `styles_commun.css`.
- Scripts en fin de `<body>`, dans cet ordre : plugin Grist, Vue 3.4.38 (unpkg), `scriptcommun.js`, `outil.js`.
- `grist.ready({ requiredAccess: 'full' })`.

## Vue (sans compilation)
- Une zone `<div id="appXxx">` par bloc, montée par `Vue.createApp({ setup() { return {...} } }).mount('#appXxx')`. Vue reconstruit la zone : un écouteur JS posé dessus est perdu.
- Un seul état réactif `etat = Vue.reactive({...})`, en haut du fichier.
- Toute fonction ou valeur appelée par le HTML doit figurer dans le `return` du `setup` de la zone. Un oubli donne `Property "xxx" was accessed during render…` et la zone disparaît. Ne mettre dans le `return` que ce que la zone utilise.
- Une expression invalide dans le HTML (ex. `:class="menu__item {…}"`) fait afficher les `{{ }}` bruts sur toute la zone.
- Vue ne suit pas les `Map` : les données restent dans des `Map` (`recordsParId`), et les listes affichées sont copiées dans `etat` par des fonctions `recalculer…()`.
- Un `Vue.watch` recalcule les listes quand un filtre change.
- `@click` (pas `pointerdown`) dans les listes qui défilent. `@mousedown.prevent` sur un menu déroulant garde le focus dans le champ.
- Bouton dont le choix est en cours : `:class="{ 'btn--etape': condition }"`, la condition venant d'une fonction du JS (ex. `toutPlanteDe(s)`).
- `v-else-if` / `v-else` doivent suivre directement la balise qui porte le `v-if`.
- Pas de `createElement`, `innerHTML` ni `getElementById` pour écrire dans l'interface.
- Ne jamais lancer « Mettre en forme le document » sur un fichier HTML : le formateur
  coupe les lignes longues, y compris au milieu d'un texte entre apostrophes dans un
  {{ }} ou un :class. Une chaîne coupée sur deux lignes fait planter toute la zone
  (« string literal contains an unescaped line break »).
- Vue compile le HTML au .mount() : une erreur dans le HTML est signalée à la ligne
  .mount(...) du JS, pas dans le HTML. Lire le texte de l'erreur, pas seulement la ligne.
- Si le formatage a été lancé : Ctrl+Z, ou comparer avec la version Git, puis recoller
  sur une seule ligne les textes coupés.

## Principe : le JS calcule, le HTML met en forme
- Le JS renvoie des valeurs ou des codes (`casOu(s)` → `'reste' | 'manquant' | 'aucun'`, `cas: 'morte'`), jamais des phrases ni des classes de style.
- Textes, `v-if` et classes sont dans le HTML.
- Exceptions assumées : messages d'erreur et de succès construits au moment d'une décision. Ils sont tous regroupés dans un bloc `TEXTES` en haut de `outil.js` (une entrée `(noms) => …` pour une phrase qui contient des noms ou un nombre). Achat-repro les a dans un fichier à part, `achatrepro_textes.js` : à harmoniser après comparaison des outils.
- Zone Vue contenant un bouton `sticky` : `class="zone-transparente"` (`display: contents`).

## Fonctions communes (`scriptcommun.js`)
- N'utilisent que leurs paramètres (jamais `etat`, `recordsParId`…). Seule exception : `lireChoixColonnes`, qui appelle `grist`.
- Ne jamais redéfinir une fonction commune dans un outil : la copie locale la masque sans erreur.
- Disponibles : `tableEnLignes`, `listeChoix`, `enListeChoix`, `normaliser`, `anneeDepuisDate`, `dateAffichee`, `dateDuJour`, `dateEnSecondes`, `typeInverse`, `libelle`, `lieuxFiltres`, `correspondRecherche`, `choixColonne`, `lireChoixColonnes`, `creerMessageTemporaire`, `pluriel`, `evolution`.
- `pluriel(n, singulier, formePluriel)` : 0 et 1 au singulier. Nombre d'abord : « 3 germés ».
- `evolution(avant, apres, singulier, formePluriel)` : affichage « avant → après unité » (accord sur après) dans En cours. Le JS calcule avant et après, le HTML n'additionne rien.

## Données Grist
- ChoiceList : `['L', 'a', 'b']` (`listeChoix()` pour lire, `enListeChoix()` pour écrire).
- Dates : secondes UTC à minuit.
- Colonnes écrites par un outil : colonnes de **données**, jamais des colonnes formule.
- Les ids de tables différentes se recoupent : ne jamais les mélanger dans un même objet.
- Quantités saisies = ajouts aux valeurs chargées (germés, plantés, oups, dons).
- Nombres saisis : entiers seulement (`Number.isInteger`), sinon la saisie est ignorée.
- Avant d'enregistrer : recharger la table, comparer les lignes concernées, refuser si l'une a changé.
- Un seul `applyUserActions` par enregistrement.
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
- Orange = ce que tu es en train de saisir : liseré de la carte (`carte--etape`), bouton choisi (`btn--etape`), et dans En cours l'**essentiel de l'étape** (germés, plantés, statut et plants d'une plante mère) en `texte--etape`. Le reste de la saisie (oups, dons, en attente) reste gris.
- Gris (`texte--discret`) = information. Gris gras (`texte--discret texte--gras`) = information de Grist importante à repérer.
- Rouge = attention. Vert-jaune = plante mère. Violet = lieu. Vert / marron = sous abri / pleine terre.

## Nommage CSS (BEM)
- Bloc : `carte`, `btn`, `champ`, `menu`, `pastille`, `case`, `ligne`, `texte`, `encart`, `statut`. Élément : `bloc__element`. Variante : `bloc--variante`.
- Une variante s'ajoute à la classe de base : `class="btn btn--etape"`, jamais seule.
- Un seul niveau de classe (pas de `.carte .titre`) : toutes les règles ont le même poids, c'est l'ordre dans le fichier qui décide.
- Cases à cocher : `class="case__saisie"` sur chaque `<input type="checkbox">` (jamais un sélecteur sur la balise `input` seule, qui toucherait tous les champs).
- Menu : `menu` > `menu__liste` > `menu__item` (+ `menu__item--choisi`, `menu__item--vide`). `menu` est en `position: relative`, `menu__liste` en `absolute` juste dessous.
- Un sélecteur `h3 {}` cible la balise, `.h3 {}` cible la classe.
- Une règle CSS invalide casse la suivante : point en trop, commentaire sans `*/`, `border-color: 1px solid …`.
- Les classes de mise en page n'ont pas d'espacement externe : l'espacement vient de `gap` sur le parent.
- Une classe va dans le commun si au moins deux outils l'utilisent à l'identique ; une règle qui cite un id reste dans l'outil.
- Avant de créer une variante, chercher dans le commun si elle existe déjà (ex. `champ--bouton` : texte à gauche et curseur main).
- Classes ajoutées : `grille`, `ligne--sur-champ`, `btn--collant`.
- `var(--erreur)` n'existe plus : utiliser `--erreur-clair`, `--erreur-moyen` ou `--erreur-fonce`.

## Méthode de travail
- Une modification à la fois, puis un test et la console (F12, filtre vidé).
- Ctrl+Maj+F sur le nom qu'on vient de coller : un compte inattendu trahit un doublon.
- Ctrl+F5 après un changement du CSS ou du JS commun ; ouvrir tous les outils qui en dépendent.
- Un commit avant chaque série de changements.
- Dans la console, les « n cachés » sont des messages filtrés, pas un résultat.
- Ordre en prod : commun d'abord, puis outils.
- Vue du code de Grist (menu de gauche) : toutes les formules sur une page, pratique pour chercher qui lit une colonne.

## À traiter dans la discussion du commun
- `styles_communs_bem.css` : `.btn--enregistrer` (`margin-top: 8px`) écrase `.btn--grand` (`margin-top: 14px`), plus bas dans le fichier. Garder l'un des deux.