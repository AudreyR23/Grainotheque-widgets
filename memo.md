# Mémo : notions à comprendre (à cocher)

> Les points marqués 🆕 viennent de la discussion sur l'outil « À semer ».
> Les points marqués 🔁 sont des notions qui ont demandé plusieurs explications : à relire jusqu'à ce que ce soit clair.

## HTML / CSS : structure et apparence

- [ ] **Quand créer un div** : un div pour chaque style différent ou chaque « contenant ». Un seul style sur un seul bloc de texte : une classe suffit, pas de div en plus.
- [ ] **Cadre + contenu = deux éléments imbriqués** : le cadre porte `cadre-info-a-jour`, le texte dedans porte `cadre-info-a-jour-titre`. Le texte est ajouté au cadre avec `cadre.appendChild(info)`.
- [ ] **Où modifier quoi** : l'apparence (couleur, taille, marge) se règle dans le CSS. Le contenu et la structure (quoi afficher, dans quoi) se règlent dans le JS, là où l'élément est créé.
- [ ] **Élément unique ou répété** : un élément unique et toujours présent s'écrit dans le HTML et le JS le remplit. Un élément répété pour chaque ligne est créé par le JS (`createElement`).
- [ ] **`className = '...'` écrase** toutes les classes déjà présentes. `classList.add('...')` en ajoute une sans enlever les autres.
- [ ] **Deux classes sur un élément** (`class="champ champ-etiquettes"`) : les deux styles s'appliquent. La règle `.champ.champ-etiquettes` (collée) vise un élément qui a les deux classes et est plus prioritaire que `.champ` seul.
- [ ] **Sélecteur avec espace** (`.semis-texte .cadre-info-a-jour`) : vise le cadre seulement quand il est à l'intérieur de `.semis-texte`.
- [ ] **Les variables CSS** (`var(--orange-clair)`) : définies une fois dans `:root` de `gestion_commun.css`, utilisables partout. Changer la valeur à un endroit change toute l'appli.
- [ ] **Ordre des feuilles de style** : le commun d'abord, le spécifique ensuite, qui peut ainsi corriger le commun.
- [ ] **`display: flex`** : place les enfants côte à côte (texte à gauche, champ à droite). `align-items: center` les centre verticalement, `justify-content: space-between` les écarte.
- [ ] **`inline-block`** : un bloc qui prend seulement la largeur de son contenu (cadre bleu), au lieu de s'étirer sur toute la ligne.
- [ ] **`position: sticky; bottom: 0`** : l'élément reste collé en bas de l'écran pendant le défilement (barre flottante).
- [ ] **L'attribut `hidden` et le CSS** : un `display` écrit dans une règle peut l'emporter sur `hidden`. La règle `[hidden] { display: none !important; }` force `hidden` à fonctionner.
- [ ] **Les boutons ne « héritent » pas** : il n'existe pas de « hérite de `.btn` » en CSS. On cumule les classes dans le HTML : `btn` (socle) + une variante (`btn-ajouter`, `btn-enregistrer`) + une taille (`btn-large`). Oublier `btn` fait perdre police, padding, arrondi.
- [ ] **Écrire les classes dans le HTML, pas la syntaxe CSS** : `class="sousabri actif"` est correct, `class="bascule button.sousabri"` ne l'est pas (`button.sousabri` est du CSS). Un élément n'a **qu'un seul** attribut `class` : le second est ignoré.
- [ ] **Espace ou pas d'espace dans un sélecteur** : `.btn:active` (le bouton lui-même, pressé) ≠ `.btn :active` (un enfant du bouton). Un espace de trop et la règle ne s'applique jamais. Même chose pour `.a.b` (deux classes sur le même élément) ≠ `.a .b` (b à l'intérieur de a).
- [ ] **Précision et ordre des règles** : quand deux règles touchent la même propriété, la plus précise gagne (id > classe > élément ; plus de classes = plus précis), puis, à précision égale, la dernière écrite. Exemples vus : `#fiche label.case` bat `#fiche label` qui bat `.case` ; `.bascule button` bat `.btn-large`.
- [ ] **Inspecteur (F12, onglet Éléments / Styles)** : une règle barrée est celle qui a perdu. C'est le moyen de savoir pourquoi un style ne s'applique pas, au lieu de deviner.
- [ ] **`position: absolute` a besoin d'un repère** : une liste en `absolute` se cale sur le plus proche ancêtre qui a une `position`. Sans `.champ-liste { position: relative }`, elle se cale sur la page et dépasse du champ. Avec `relative` (au lieu d'`absolute`), la liste pousse le contenu au lieu de flotter.
- [ ] **Retraits par défaut du navigateur** : une `ul` a un retrait à gauche (`padding`) et des puces, un `button` a sa propre police et son padding. Il faut les neutraliser explicitement (`padding: 0`, `list-style: none`, `font: inherit`).
- [ ] **`font: inherit` avant `font-size`** : `font` est un raccourci qui remet tout à l'héritage ; ce qui est écrit **après** le surcharge, ce qui est écrit avant est écrasé.
- [ ] **Les éléments de formulaire suivent le thème du système** : sans fond et couleur explicites, un `<input>` devient sombre si le système est en mode sombre. Toujours définir `background` et `color` dans `.champ` (et `color-scheme: light` en renfort).
- [ ] **Un `<select>` natif ne se stylise pas** : sa liste ouverte est dessinée par le système. Pour un aspect identique partout, on le remplace par un bouton + une liste maison (`habillerSelect`).
- [ ] **Le contour de focus orange n'était pas le tien** : c'est le défaut du navigateur. Pour le contrôler, on le définit (`.champ:focus { outline: ... }`). Ne pas le supprimer (`outline: none`) : au clavier on ne verrait plus le champ actif.
- [ ] **Centrer une croix dans un petit bouton** : `display: flex` + `align-items` + `justify-content: center`, `padding: 0`, `line-height: 1`. Le padding par défaut décale le contenu.
- [ ] **`flex: none`** : empêche un élément de se compresser dans une rangée flex (la croix garde sa taille même si le texte est long). `align-self: flex-start` place un seul élément en haut sans toucher aux autres.
- [ ] **Zones tactiles** : un doigt a besoin d'environ 44 px (30 px minimum raisonnable). Un bouton de 20 px est difficile à toucher sur tablette.
- [ ] **Commun ou outil ? la bonne question** : « deux outils s'en servent-ils, **à l'identique** ? » Oui, commun. « Proche mais pas identique » : choisir d'abord une seule apparence, puis la mettre dans le commun. Une règle qui cite un id de l'outil (`#fiche`, `#basculeMode`) reste dans le CSS de l'outil.
- [ ] **Règle morte** : avant de supprimer une classe CSS, la chercher dans **tous** les fichiers (Ctrl+Maj+F dans VS Code) : HTML, JS (`className`, `classList`) et autres outils. Aucun résultat = suppression sans risque.
- [ ] **Nommer pour soi** : un nom de classe n'est pas imposé (`champ-recherche` est devenu `champ-liste`). Si on renomme, on le fait aux trois endroits (CSS, HTML, JS) en même temps, avec « remplacer dans tous les fichiers ».
- [ ] **Doublons de variables** : deux familles qui décrivent le même rôle (`--bleu-*` et `--recap-*`) créent de la confusion. En garder une seule.
- [ ] **Contrastes** : texte clair sur fond clair (ou l'inverse) se lit mal en plein soleil sur tablette. À contrôler sur l'appareil réel.

### 🆕 Ajouts HTML / CSS

- [ ] 🆕 **Le même nom partout, lettre pour lettre** : le CSS, le HTML et le JS doivent écrire exactement le même nom de classe. Cas vus : `.badge.sous-abri` dans le CSS alors que le JS donnait seulement `badge` (« Sous abri » n'avait aucune couleur) ; `semis-plantemere` dans le JS et `badge-plantemere` dans le CSS. Une règle CSS pour une classe que personne n'applique ne fait rien, sans aucune erreur. Test : chercher le nom dans les trois fichiers (Ctrl+Maj+F).
- [ ] 🆕 **Collision de noms entre outils** : `.badge` désignait une carte dans À étiqueter et une petite pastille dans À semer. Dans le commun, deux outils ne peuvent pas donner deux sens au même nom. Solution adoptée : des noms distincts et précis (`carte`, `carte-texte`, `pastille-cat`).
- [ ] 🆕 **Une règle globale touche tous les outils** : `label { font-weight: bold; display: block; ... }` dans le commun s'applique à chaque label. Pour la corriger dans un seul endroit, on utilise une règle plus précise (`#filtres label { ... }`, id > élément).
- [ ] 🆕 **Une variante d'un composant** : `class="champ champ-filtre"` (socle + variante), comme pour `btn btn-enregistrer`. `.champ-filtre` l'emporte sur `.champ` car les deux ont la même précision et la feuille de l'outil est chargée **après** le commun.
- [ ] 🆕 **Classe calculée par le JS** : au lieu d'écrire plusieurs cas, on calcule le nom : `const categorie = sousAbris && pleineTerre ? 'sousabri-pleineterre' : sousAbris ? 'sousabri' : 'pleineterre'`, puis `className = 'carte ' + categorie`. La couleur vit dans le CSS, le choix dans le JS.
- [ ] 🆕 **Préférer flex à `position: absolute` pour un bouton dans une carte** : en absolute, il est « posé » sur la carte et peut recouvrir le texte. Avec `display: flex` sur la carte et `align-items: center`, le bouton est centré et le texte se met à côté, sans chevauchement.
- [ ] 🆕 **`opacity` estompe tout l'élément** : sur `.deja-semee { opacity: .6 }`, le bouton, le texte et le liseré deviennent plus pâles ensemble. C'est voulu ici, mais ça ne permet pas d'estomper une partie seulement.
- [ ] 🆕 🔁 **Le liseré en deux couleurs** : une bordure CSS n'a qu'une couleur. On la rend transparente et on dessine à la place un fond en dégradé net : `linear-gradient(to bottom, vert 50%, marron 50%)`. Les deux couleurs s'arrêtent et reprennent au même endroit, donc pas de fondu. `left / 5px 100% no-repeat` limite ce fond à une bande de 5 px à gauche. On peut mettre plusieurs fonds séparés par une virgule : le premier est devant, le dernier (ici le blanc) derrière.
- [ ] 🆕 **Les teintes `-clair / -moyen / -fonce`** : `-moyen` pour un liseré ou un aplat, `-fonce` pour du texte (plus lisible), `-clair` pour un fond de pastille. Choisir la teinte selon l'usage.
- [ ] 🆕 **Un commentaire doit rester vrai** : après une modification, les commentaires (`// Ligne colorée : ...`) peuvent décrire l'ancien comportement. Relire les commentaires à chaque changement.

## JavaScript : fonctionnement

- [ ] **`textContent`** : met du texte brut dans un élément, sans risque. On évite `innerHTML` pour du texte venant des données.
- [ ] **`createElement` puis `append` / `appendChild`** : on fabrique l'élément, on règle sa classe et son texte, puis on l'accroche dans son parent.
- [ ] **Redessiner la liste ou seulement une partie** : redessiner tout un champ en cours de frappe lui fait perdre le focus. C'est pourquoi on ne redessine que la section « En cours » à chaque saisie.
- [ ] **Écouteur sur le parent** (`liste.addEventListener('input', ...)` avec `e.target.closest(...)`) : un seul écouteur sur la liste gère toutes les lignes, y compris celles créées après.
- [ ] **`recordsParId` (Map)** : dictionnaire qui retrouve une ligne par son id, sans parcourir toute la liste.
- [ ] **`brouillons` : écran seulement** : la liste des saisies non enregistrées. Rien n'est écrit dans Grist avant le clic sur Enregistrer. La ✕ ne touche que cette liste.
- [ ] **Relire avant d'écrire** : `enregistrerTout` recharge Semis avant de calculer `Nb_etiquettes + saisie`, pour partir de la valeur réelle (l'impression a pu la remettre à 0).
- [ ] **`async` / `await` / `.then`** : la lecture et l'écriture dans Grist prennent du temps. `await` attend la fin avant de continuer.
- [ ] **`IntersectionObserver`** : surveille si la section « En cours » est visible à l'écran. Il sert à cacher ou montrer le bouton orange flottant.
- [ ] **Où coller un morceau de code** : les fonctions utilitaires vont dans `// ===== Utilitaires =====` (ex. `dateAffichee`). Un doublon d'un même nom de fonction cause des comportements étranges.
- [ ] **`click` et non `pointerdown` pour les listes qui défilent** : `pointerdown` se déclenche dès que le doigt se pose, donc on sélectionne en voulant défiler. `click` n'est envoyé que pour un vrai toucher.
- [ ] **`mousedown` + `preventDefault()` sur une liste** : garde le focus dans le champ, donc le `blur` ne ferme pas la liste avant que le `click` n'arrive.
- [ ] **`id` = lien avec le JS, `class` = apparence** : le JS retrouve les éléments par leur `id` (`getElementById`). Renommer une classe ne casse rien ; renommer un `id` casse le démarrage (`is null`). Avant de renommer un id, le chercher dans le JS.
- [ ] **`getElementById(...) is null`** : l'élément n'existe pas dans le HTML, son id est différent, ou le fichier n'a pas été **enregistré**. Vérifier dans cet ordre.
- [ ] **Une erreur en début de chaîne bloque tout ce qui suit** : si `afficherControle()` plante dans le `.then(...)`, les initialisations suivantes ne sont jamais exécutées (bouton sans écouteur). Le symptôme est « le bouton ne répond plus », la cause est ailleurs.
- [ ] **Fonction morte** : une fonction qui n'est plus appelée (et qui référence un élément supprimé du HTML) doit être supprimée, sinon elle plantera au jour où on l'appellera.
- [ ] **Un seul `class` / `className` écrasant** : `div.className = '.cadre-info'` (avec un point) ne s'applique pas. Dans le JS, on écrit le nom de classe **sans point**.
- [ ] **Ordre des opérations dans un `.then`** : appeler les `initialiser…()` seulement après le chargement des données, sinon les listes sont vides.
- [ ] **`classList.toggle('actif', condition)`** : ajoute ou retire une classe selon une condition. Pratique pour un bouton actif / inactif.
- [ ] **Valeur vide ≠ 0** : envoyer `null` explicitement pour qu'une colonne reste vide. Sans cela, Grist met 0, et la formule `Info_germination` conclut « NG » (non germé) alors que rien n'a été traité.
- [ ] **Commentaires et `console.log` de contrôle** : à retirer avant la prod.

### 🆕 Ajouts JavaScript

- [ ] 🆕 **Un collage doit rester lisible** : une instruction par ligne et une indentation cohérente. Dans le fichier, `.filter(...);  if (candidats.length === 0) return null;` sur une seule ligne, ou une accolade fermante suivie du début d'un bloc, cachent les erreurs. Ça marche, mais on ne voit plus la structure.
- [ ] 🆕 **« Remplace la fonction » = de `function` jusqu'à son accolade fermante** : la remplacer en entier, sans laisser l'ancien corps derrière. Compter les accolades ouvrantes et fermantes pour savoir où elle se termine.
- [ ] 🆕 **Vider avant de recharger** : une fonction qui recharge les données (`Actualiser`) doit d'abord vider tout ce qu'elle remplit (`.clear()` sur chaque Map). Sinon une valeur de la première lecture reste en mémoire (cas du `varietesAvecPlant.clear()` oublié au départ).
- [ ] 🆕 **`Map` ou `Set`** : un `Set` retient « présent / absent » ; une `Map` retient une valeur associée à une clé (id → `'Plant'`). Passer de l'un à l'autre change `.add` en `.set(clé, valeur)` et `.has` en `.get(clé)`.
- [ ] 🆕 🔁 **`?.` et `??`** : `a.mil?.germination ?? -1` signifie « la germination de `mil`, mais si `mil` n'existe pas ou si la valeur est vide, utiliser -1 ». Sans `?.`, une variété sans graines fait planter le tri.
- [ ] 🆕 **Déstructuration dans une boucle** : `for (const { v, mil, plant } of lignes)` extrait directement les champs de chaque objet de `lignes`. Si un champ n'a pas été mis dans l'objet au moment du `push`, il vaudra `undefined` ici.
- [ ] 🆕 🔁 **Les expressions régulières** : `^\d+(p|rhi|c|b)\.?$` se lit « du début (`^`) à la fin (`$`) : un ou plusieurs chiffres (`\d+`), puis `p` ou `rhi` ou `c` ou `b`, puis un point facultatif (`\.?`) ». `\d*` accepte zéro chiffre, `\d+` en exige au moins un. Tester une regex sur des exemples réels de ta colonne avant de la valider.
- [ ] 🆕 🔁 **Dates : secondes, UTC, mois qui commence à 0** : Grist stocke les dates en secondes ; JavaScript compte les mois de 0 (janvier) à 11 (décembre), d'où `getMonth() + 1`. `Date.UTC(année, mois - 1, 1) / 1000` redonne des secondes. Une période se compare en « début inclus, fin exclue » (`d >= debut && d < fin`), la fin étant le 1er jour du mois suivant.
- [ ] 🆕 **Comparer des valeurs de type différent** : une colonne formule peut renvoyer un nombre **ou** un texte (`Annees_sans_test` donne `2` ou « Jamais testé »). On teste le type avant de calculer : `typeof a === 'number'`. Pour un booléen Grist, `=== true` évite de confondre `true`, `null` et `0`.
- [ ] 🆕 **Une fonction de tri** renvoie un nombre : négatif (a avant b), zéro (égaux), positif (a après b). `(gb - ga) || parNom` signifie « trier par germination décroissante, et si égalité, par nom ».
- [ ] 🆕 **Trier du texte français** : `localeCompare(b, 'fr')` respecte les accents (É après E, pas à la fin de l'alphabet).
- [ ] 🆕 **`BroadcastChannel`** : deux widgets de la même origine, ouverts en même temps, s'envoient des messages (`canal.postMessage({...})`, `canal.onmessage = ...`). Il ne marche que si les deux sont chargés (même page) et sur le même site.
- [ ] 🆕 **`pointerdown` sur un bouton dans une liste qui défile** : le bouton « Semer » réagit dès que le doigt se pose, donc aussi quand on commence à faire défiler. Même règle que plus haut : préférer `click`. À tester sur tablette.
- [ ] 🆕 **Une valeur « magique » dans une colonne** : `Sachets` contient des codes (`1P.`, `2rhi`, `Mél`) que le code interprète. Si tu inventes un nouveau code, il n'est reconnu par aucun outil tant que `typeDePlant` n'est pas mis à jour. Garder la liste des codes documentée.
- [ ] 🆕 **Variable déclarée mais jamais lue** : `dejaSemeCetteAnnee` est chargée mais n'est plus utilisée. À retirer au prochain ménage pour ne pas laisser croire qu'elle compte.

## Grist

- [ ] **`fetchTable` vs `onRecords`** : `fetchTable` lit toute la table à la demande et donne les colonnes formules sans mapping. Les autres outils fonctionnent ainsi, donc celui-ci aussi.
- [ ] **`requiredAccess: 'full'`** : obligatoire pour écrire. Grist n'a pas de droit « écriture sur une seule table ».
- [ ] **Colonne ChoiceList** : Grist la stocke `['L', 'a', 'b']`. `listeChoix()` retire le `'L'`. À l'écriture, on remet `['L', ...]`.
- [ ] **Dates** : Grist stocke une date en secondes depuis 1970. `dateAffichee()` convertit en JJ/MM/AAAA pour l'écran.
- [ ] **Colonnes formules sur Semis** (`Plante_mere`, `Annee_plantation_mil`, `Nom`…) : elles arrivent déjà calculées dans `fetchTable`, aucune autre table à lire.
- [ ] **Référence = id de ligne** : dans `Semis.Millesime`, on écrit l'**id** de la ligne de `Millesimes`, pas l'année. Deux colonnes peuvent porter le même nom dans deux tables (`Millesimes.Millesime` est une date, `Semis.Millesime` est une référence).
- [ ] **Une action = un seul Ctrl+Z** : regrouper plusieurs écritures dans un seul `applyUserActions([...])` permet de tout annuler d'un coup, y compris le stock (`UpdateRecord` sur `Millesimes`).
- [ ] **Les choix d'une colonne sont lisibles** : `_grist_Tables` et `_grist_Tables_column` (`widgetOptions.choices`) donnent les valeurs Type / Où, sans les écrire en dur. Ce sont des tables système, rien à créer. Choix réglés « par vue » : absents.
- [ ] **Formules à surveiller côté outil** : ce que le widget écrit déclenche les formules (`Epuise` exige `Qtte_graines` **et** `Sachets` vides ; `Info_germination` distingue vide et 0 ; `if not rec.Jours_ecoules` masque le jour même). Avant d'écrire une valeur, se demander quelle formule la lit.

### 🆕 Ajouts Grist

- [ ] 🆕 🔁 **« Données » d'un widget = la table dont il reçoit les lignes** : `grist.onRecord` donne l'id d'une ligne **de cette table**. Un widget lié à Semis reçoit un id de Semis, pas un id de variété. C'est la cause du blocage de « Semer ».
- [ ] 🆕 🔁 **« Sélectionner par » ne propose pas tous les widgets** : dans ton cas, seuls les tableaux Grist apparaissaient, pas un widget personnalisé. Quand le lien n'est pas possible, on passe par un `BroadcastChannel` entre les deux widgets.
- [ ] 🆕 **`setCursorPos` déplace le curseur de son propre widget** : il ne fait pas bouger les autres widgets, sauf s'ils sont liés à lui.
- [ ] 🆕 **Grist envoie une première ligne au chargement** : un widget lié à une table reçoit automatiquement la 1re ligne (Agastache) sans que personne ait cliqué. Il faut l'ignorer si on ne veut pas de pré-remplissage au démarrage.
- [ ] 🆕 **`fetchTable` sur plusieurs tables : accès `full` même en lecture** : ne pas croire qu'un outil « en lecture seule » peut avoir un accès réduit.
- [ ] 🆕 **Ce que Grist calcule déjà peut ne pas suffire** : `Deja_seme_cette_annee` raisonne par année civile, donc un semis de novembre à février est mal vu. Quand une règle métier est plus fine que la formule, on la recalcule dans le widget (fenêtre de semis).
- [ ] 🆕 **Les libellés de mois sont des textes** : les choix `Jui` / `Juil` sont comparés sans accents ni majuscules (`normaliser`). Si tu en renomme un dans Grist, le widget ne le reconnaît plus.

## Méthode de travail et pièges

- [ ] **Le cache** : après modification, Grist peut garder l'ancien JS/CSS. Faire Ctrl + Maj + R, ou mettre `?v=2`, `?v=3`… dans les URL des fichiers (surtout sur tablette).
- [ ] **Dev puis prod** : on teste en dev, puis on recopie en prod. La prod n'est jamais le lieu des essais.
- [ ] **Un test après chaque étape** : si quelque chose casse, on sait quelle modification en est la cause.
- [ ] **Console du navigateur (F12)** : voir les erreurs rouges et les `console.log`. Premier réflexe quand « rien ne se passe ».
- [ ] **Faire une copie avant un gros nettoyage** (`.bak`) pour pouvoir revenir en arrière.
- [ ] **Enregistrer le fichier avant de tester** : deux fois, un bloc ajouté « ne marchait pas » parce que le fichier n'était pas sauvegardé (point rond sur l'onglet dans VS Code). Avec Live Server, rien ne se recharge sans enregistrement.
- [ ] **Enregistrer les trois fichiers** (HTML, JS, CSS) à chaque étape qui touche les trois.
- [ ] **Appliquer une consigne en entier** : plusieurs bugs venaient d'une consigne appliquée à moitié (`const` laissé en `const` alors qu'il devait être `let`, ligne « ignorés » ajoutée au lieu de remplacée, bloc HTML non collé, `btn` oublié). Cocher chaque point de la consigne un par un.
- [ ] **Remplacer ≠ ajouter** : quand la consigne dit « remplace », l'ancienne version doit disparaître. Les doublons (`estOriginal` deux fois, règle CSS en double) créent des comportements imprévisibles.
- [ ] **Relire la ponctuation après un collage** : une virgule manquante (entre deux propriétés d'objet), un caractère parasite (`;q`), une accolade non fermée bloquent **tout** le fichier. La ligne rouge de la console donne le numéro de ligne.
- [ ] **Ne pas coller un fichier entier dans un autre** : fusionner deux CSS en bloc crée des conflits. Trier d'abord (commun / outil), puis déplacer règle par règle.
- [ ] **Après un ménage ou un renommage, re-tester tout** : le nettoyage du CSS (`.btn-principal` renommé, `#blocOu` supprimé) peut casser silencieusement un autre écran ou un autre outil.
- [ ] **Décrire le symptôme précisément** : « ça ne marche plus » est trop vague. Utile : ce qu'on voit, ce qu'on attendait, la première ligne rouge de la console, et la capture d'écran.
- [ ] **Tester sur le vrai appareil** : le tactile (défilement des listes, taille des boutons, clavier numérique, contrastes) ne se vérifie pas sur PC. Prévoir une passe de test sur tablette avant de considérer l'outil fini.
- [ ] **Faire le ménage au bon moment** : d'abord que ça marche, ensuite on nettoie (règles mortes, `console.log`, fonctions non appelées), en un passage séparé avec un test à la fin.

### 🆕 Ajouts méthode

- [ ] 🆕 **Toujours savoir dans quel fichier va chaque consigne** : plusieurs fois, un bloc a été cherché dans le mauvais fichier (JS de À semer au lieu de celui de semis_realises). Si une consigne ne dit pas le fichier, ou cite un bloc introuvable, **demander** avant de chercher. Écrire le nom du fichier en tête de chaque modification qu'on colle.
- [ ] 🆕 **Quand une consigne en corrige une autre, seule la dernière compte** : si on te donne un correctif d'un correctif, ne rejoue pas les deux. Demande quelle version appliquer, ou colle ton fichier complet pour que je le vérifie : ce réflexe a permis de repérer les trois blocs oubliés.
- [ ] 🆕 **Donner la valeur exacte, pas une notation** : quand tu m'as écrit « xrhi », « xc. », « xb. », le « x » voulait dire « un nombre », mais je l'ai lu comme une lettre à reconnaître. Copier-coller 2 ou 3 valeurs réelles de la colonne (`2rhi`, `1P.`, `3c.`) évite ce malentendu.
- [ ] 🆕 **Vérifier la configuration Grist avant le code** : le bouton « Semer » semblait cassé alors que le code était bon. La cause était la table de « Données » du widget. Avant de modifier le code, regarder le panneau de droite du widget (Données, Sélectionner par).
- [ ] 🆕 **Lire un journal de console** : les lignes `RPC_RESULT_OK` signifient que Grist a accepté l'ordre ; nos propres `console.log` (« Clic Semer », « semis_realises reçoit ») montrent où le message s'arrête ; une ligne rouge est une erreur à copier avec son numéro de ligne.
- [ ] 🆕 **Envoyer des messages complets** : un message coupé net (« … Semis_realisés : ») oblige à deviner. Relire le message avant de l'envoyer, et ajouter fichier, ligne de console et capture si besoin.
- [ ] 🆕 **Tester avec des données de cas limites** : une variété avec plant (`1P.`), rhizome, sachet « Mél », fenêtre de semis à cheval sur deux années, sans graines. Les tests sur le cas courant ne révèlent pas ces situations.
- [ ] 🆕 **Tenir un récapitulatif à jour** : le fichier `a_semer_recapitulatif.md` doit changer à chaque opération (fichiers, règles, limites, reste à faire). Il sert de référence quand on reprend l'outil dans six mois.
- [ ] 🆕 **Retirer les logs de diagnostic après avoir trouvé la cause** : les `console.log('Clic Semer…')` et ceux de `semis_realises reçoit` n'ont plus de raison d'être une fois que ça marche.
- [ ] 🆕 **Une fonctionnalité qui en implique une autre** : le bouton « Semer » ne sert que si l'outil semis_realises sait recevoir. Avant de donner un outil pour terminé, vérifier la chaîne complète (clic, message, pré-remplissage, enregistrement, actualisation).

## Notions que tu as demandé à revoir (à relire jusqu'à ce que ce soit clair)

- [ ] **`box-shadow`** : `décalage-horizontal décalage-vertical flou couleur`. `none` pour l'enlever.
- [ ] **`flex`** (raccourci : grandir, rétrécir, base) et `flex: none`.
- [ ] **`margin` (extérieur) ≠ `padding` (intérieur)** : la marge est hors de la bordure, le padding est entre la bordure et le texte. Raccourci à 4 valeurs : haut, droite, bas, gauche ; à 2 valeurs : haut-bas, gauche-droite.
- [ ] **`rem`, `px`, `vh`** : `rem` = taille de base du navigateur (16 px en général), `px` = pixel fixe, `vh` = 1 % de la hauteur de l'écran.
- [ ] **`:hover`, `:active`, `:focus`, `:disabled`** : états d'un élément (survolé, pressé, avec le curseur, désactivé). Sur tablette, `:hover` n'existe quasiment pas.
- [ ] **La cascade** : plusieurs classes sur un élément = somme de leurs règles ; chaque propriété n'est écrite qu'une fois, dans la règle qui l'introduit, sauf pour la modifier.
- [ ] **Variables de couleur par famille** (`--orange-clair / -moyen / -fonce`) : un schéma constant (`--categorie-role`) permet de savoir d'avance quelles variables existent.
- [ ] 🆕 **« Données » et « Sélectionner par » d'un widget Grist** : la première dit quelle table le widget reçoit ; la seconde le lie à un autre widget. Ce sont deux réglages distincts.
- [ ] 🆕 **Le liseré en dégradé net** : `linear-gradient(to bottom, A 50%, B 50%)` (voir plus haut).
- [ ] 🆕 **Les regex** (`^\d+(p|rhi|c|b)\.?$`) et `\d*` ≠ `\d+`.
- [ ] 🆕 **`?.` et `??`** (accès sûr et valeur par défaut).
- [ ] 🆕 **Les dates en secondes, `Date.UTC`, mois à partir de 0, intervalle début inclus / fin exclue.**