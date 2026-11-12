# pour récap#
Peux-tu me rédiger un récapitulatif de l'outil (fonctionnalités, choix techniques, ce qui reste à faire). Il me servira de référence si je reprends cet outil plus tard. Je veux du code en markdown.


# Granothèque Grist : harmoniser l'outil « NOM_DE_L_OUTIL »
 
## Contexte (identique pour tous mes outils)
J'ai un document Grist « granothèque ». Mes outils sont des widgets personnalisés HTML/JS/CSS hébergés sur GitHub (dev et prod). Je travaille en français. Je suis à l'aise pour modifier le code si tu m'indiques l'endroit exact, avec un test après chaque étape. Je suis débutante en Vue : explique brièvement les notions nouvelles.
 
Conventions : variables en français, état global en haut du fichier, `recordsParId` (Map), chargement par `grist.docApi.fetchTable`, `requiredAccess: 'full'`. `modifie` + `majStatut()` seulement si l'outil écrit dans Grist (sinon inutile).
 
## Ce qui est déjà en place sur mes autres outils (« Sélection pour étiquettes », « À semer »)
 
### Vue 3
- Vue 3.4.38 chargé par jsdelivr, en fin de `<body>`, dans cet ordre : Vue, `grist-plugin-api.js`, `gestion_commun.js`, le JS de l'outil.
- Une zone `<div id="appXxx">` contient tout ce qui est interactif. Vue reconstruit cette zone : un écouteur JS posé sur un de ses éléments est perdu.
- Le HTML décrit l'affichage (`v-for`, `v-if`, `v-show`, `v-model`, `:class`, `@click`, `{{ }}`). Le JS garde les données (`etat`, `Vue.reactive`), les calculs et les fonctions de texte.
- Plus de `createElement`, `className` ni `innerHTML` dans le JS. `class` et `:class` s'additionnent.
- Toute fonction appelée par le HTML doit figurer dans le `return` du `setup`, y compris celles qui viennent du JS commun.
- `Vue.watch(() => [filtres...], recalculer)` recalcule la liste quand un filtre change.
- Boutons dans une liste qui défile : `@click`, pas `pointerdown` (sinon un début de défilement déclenche l'action).
### CSS commun : `gestion_commun.css`
- Variables de couleurs par famille (`--famille-clair / -moyen / -fonce`).
- Cartes `.carte*` (`carte-titre`, `carte-detail`, `carte-mention`, `carte-type`, `carte-action`, liserés `.carte.sousabri` etc.), cadres d'info `.cadre-info*`, pastilles `.pastille-cat`, étape intermédiaire orange, confirmation, boutons (`btn` + variante + taille), champs, cases `.case`.
- Règle : une classe est dans le commun si au moins deux outils s'en servent à l'identique. Une règle qui cite un id de l'outil reste dans son CSS.
- Convention BEM (`bloc__element`, `bloc--variante`) : décidée comme amélioration future, **pas appliquée** pour l'instant. Ne renomme pas l'existant.
### JS commun : `gestion_commun.js`
Fonctions : `tableEnLignes`, `listeChoix`, `normaliser`, `anneeDepuisDate`, `dateAffichee`, `typeInverse` (emoji d'abord).
- Règle : uniquement des fonctions qui n'utilisent **que leurs paramètres** (jamais `etat`, `modifie`, `recordsParId`).
- Ne jamais redéfinir une fonction commune dans un outil : la copie locale masque le commun, et un `const` du même nom bloque tout le fichier.
- Modifier le commun touche tous les outils : je teste les autres ensuite. En prod, je mets à jour le commun avant les outils.
### Logique de couleurs
Neutre = sans info. Bleu = info à jour en base. Orange = en cours / pas encore enregistré. Rouge = attention, erreur. Vert-jaune = plante mère. Violet = localisation (📍). Vert foncé / marron = mode de semis (sous abri / pleine terre).
 
### Communication entre outils
`BroadcastChannel('granotheque-...')` : marche entre widgets de même origine et chargés sur la même page. Le lien « Sélectionner par » de Grist ne propose pas un widget personnalisé comme source. « Données » d'un widget = la table dont il reçoit les lignes.
 
## Fichiers que je te joins
- [ ] HTML, JS et CSS de l'outil
- [ ] `gestion_commun.css` **et** `gestion_commun.js` (à jour)
- [ ] le fichier récapitulatif de l'outil, s'il existe
- [ ] si l'outil communique avec un autre : le JS de l'autre outil
## Ce que j'attends
 
### Avant de coder
1. Dis-moi ce que tu comprends de l'outil, ce qui ne colle pas avec les conventions ci-dessus, et pose-moi tes questions. Repère en particulier :
   - les fonctions qui existent déjà dans `gestion_commun.js` et qui sont recopiées dans l'outil ;
   - les classes CSS qui existent déjà dans le commun sous un autre nom ;
   - les noms de classes ou d'id qui diffèrent entre le HTML, le JS et le CSS ;
   - les fonctions presque identiques dans un autre outil (candidates au commun, à aligner d'abord).
2. Propose un plan en étapes courtes, dans cet ordre :
   - (a) CSS : cartes et couleurs harmonisées avec le commun ;
   - (b) brancher le JS commun : retirer de l'outil les fonctions en double ;
   - (c) conversion Vue morceau par morceau (titre, filtres, liste, actions) ;
   - (d) nettoyage des styles et du JS inutilisés ;
   - (e) améliorations.
### Pendant le travail
3. Un seul changement à la fois, avec un test après chaque étape. Ne modifie rien qui fonctionne déjà sans me le dire.
4. Pour chaque modification, écris :
   - le **fichier** concerné, en tête ;
   - l'**endroit exact** (après quelle ligne, ou quelle fonction remplacer en entier) ;
   - pour une fonction à remplacer : la fonction **complète**, de `function` jusqu'à son accolade fermante ;
   - quelle fonction ajouter au `return` du `setup`, si le HTML l'appelle ;
   - une liste de noms à chercher avec Ctrl+Maj+F avant et après (une forme précise quand le mot est courant : `.type`, `type:`) ;
   - le test, avec ce que je dois voir et ce que signifie chaque erreur possible.
5. Si une consigne en corrige une précédente, dis-moi laquelle appliquer. Ne me fais pas rejouer les deux.
6. Quand tu me donnes des exemples de valeurs ou de formats, utilise des valeurs réelles et dis-moi si tu interprètes une notation (par exemple « x » pour « un nombre »). Je ferai de même.
7. Ne reconstruis pas un fichier que tu n'as pas vu : demande-le-moi. Après plusieurs corrections, je te colle mon fichier complet pour vérification.
8. Avant de supprimer un nom, vérifie qu'il n'est utilisé nulle part dans les fichiers que tu as vus, et demande-moi les autres.
9. Avant de déplacer une fonction dans le commun, vérifie qu'elle n'utilise que ses paramètres et qu'elle est identique dans chaque outil.
### À la fin
10. Un récapitulatif en markdown, à jour (rôle, fichiers, données lues, fonctionnalités, choix techniques, limites, reste à faire, journal, pièges, checklist de test), et la liste de ce que tu n'as pas pu vérifier. Sépare ce qui change pour cet outil de ce qui change pour le commun.
## Particularités de cet outil
(À compléter : rôle, tables et colonnes concernées, ce qui me plaît, ce que je veux changer, outils avec lesquels il communique, s'il écrit dans Grist.)
 




# pour nouvel outil

# Granothèque Grist : outil « A semer"

## Contexte (identique pour tous mes outils) J'ai un document Grist « granothèque ». Mes outils sont des widgets personnalisés en HTML/JS/CSS hébergés sur GitHub (fichiers séparés : ../script/xxx.js et ../styles/xxx.css). Je travaille en français. Je suis à l'aise pour modifier le code si on m'indique l'endroit exact, avec un test après chaque étape. 
Conventions adoptées : noms de variables en français, état global en haut du fichier, modifie + majStatut() pour « non sauvegardé », recordsParId (Map) pour retrouver les lignes, événements pointer* pour PC et tablette. 
## Outil - Rôle : Me simplifier la vie en me rappelant les variétés à semer en ce moment si je n'en est pas semé. Peut-être avoir la possibilité de l'intégrer à un calendrier ou une liste de tâche consultable sur téléphone ? 
Rien n'est encore créé- Accès demandé dans grist.ready : à définir
- Usage : PC et tablette, pas d'impression , volume de données : inconnu
## Tables et colonnes - Code Python de la ou des tables :

## Ce que j'attends de toi
Avant de proposer du code, dis-moi les possibilités ou ce dont tu as besoin. Ensuite guide-moi étape par étape, avec un test après chaque étape.

# pour outil existant :

# Granothèque Grist : outil « [NOM DE L'OUTIL] »

## Contexte (identique pour tous mes outils)
J'ai un document Grist « granothèque ». Mes outils sont des widgets personnalisés en HTML/JS/CSS hébergés sur GitHub (fichiers séparés : ../script/xxx.js et ../styles/xxx.css). J'ai une version dev et une version prod.
Je travaille en français. Je suis à l'aise pour modifier le code si on m'indique l'endroit exact, avec un test après chaque étape.
Conventions adoptées : noms de variables en français, état global en haut du fichier, `modifie` + `majStatut()` pour « non sauvegardé », `recordsParId` (Map) pour retrouver les lignes, événements `pointer*` pour PC et tablette.

## Outil
- Rôle : [1 ou 2 phrases]
- Version concernée : [dev / prod]
- Accès demandé dans grist.ready : [full / read table...]
- Usage : [PC / tablette / les deux], impression : [oui / non], volume de données : [ex. 200 lignes]

## Tables et colonnes
- Code Python de la ou des tables : [coller ici]
- Colonnes lues : [...]
- Colonnes écrites : [...]
- Vérifié : ces colonnes sont visibles dans la section du widget.

## Code
- HTML : [coller]
- JS : [coller]
- CSS : [coller]

## Demande
- Ce qui ne marche pas : [symptôme précis + message de la console F12]
  ou
- Ce que je veux ajouter : [description]

## Ce que j'attends de toi
Avant de proposer du code, dis-moi les possibilités ou ce dont tu as besoin. Ensuite guide-moi étape par étape, avec un test après chaque étape.