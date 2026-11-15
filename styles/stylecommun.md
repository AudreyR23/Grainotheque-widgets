CSS

Ajouté : .carte-type (type de la variété, petit et gris, après le nom). À confirmer.
Ajouté à ta logique de couleurs : vert foncé et marron = mode de semis (sous abri / pleine terre).
Notes à corriger : tes notes Étiquettes parlent de --ou-* et .texte-ou, mais le CSS contient --ici-* et .texte-ici. Mets à jour les notes avec les noms du CSS.
Ménage possible :
.erreur a deux marges (margin: 10px 0 0 puis margin-top: 4px), la seconde l’emporte sur la première.
.semis-retard est dans la section carte. Cherche où il sert avant de le garder.
.cadre-etape est marqué « à revoir ».
.btn-annuler et .btn-valider utilisent des couleurs en dur au lieu des variables.

  - `.erreur` a deux marges (`margin: 10px 0 0` puis `margin-top: 4px`), la seconde l`emporte ;
  - `.semis-retard` est dans la section carte : chercher où elle sert avant de la garder ;
  - `.cadre-etape` est marqué « à revoir » ;
  - `.btn-annuler` et `.btn-valider` utilisent des couleurs en dur au lieu des variables ;
  - supprimer les commentaires de code mort s`il en reste.

  /* ===== Signification code =====
- `padding:` Espace intérieur entre texte et bordure
- `position:` 
  - `relative` La liste reste dans le flux de la page : elle occupe sa place et pousse vers le bas ce qui la suit.
- `z-index:` Ordre d’empilement : une valeur haute passe devant les éléments voisins. Utile surtout avec absolute.
- `margin:` Marge extérieur
- `padding:` Supprime le retrait par défaut de la ul / Marge intérieur
- `gap:` Ecart entre éléments
    - `x px y px` x écart vertical y écart horizontal

- `flex:` 
  - `1` S`étire pour prendre toute la place
- `list-style:` 
  - `none` Supprime les puces de la liste
- `max-height` 
  - `50vh` Hauteur maximale : 50 % de la hauteur de l’écran
- `overflow-y` 
  - `auto` Si le contenu dépasse la hauteur max, une barre de défilement verticale apparaît.
- `font-size:` Taille du texte
- `border:` 
  - `1px solid` Bordure fine pleine
- `border-radius:` 
  - `en px` Coins arrondis.
- `box-shadow:`   
  - `0 4px 10px rgba(0, 0, 0, .15)` Ombre portée légère : effet de liste « posée au-dessus ».
- `touch-action:`
  - `pan-y`   Au doigt, seul le glissement vertical est autorisé sur la liste
- `overscroll-behavior:`
 - `contain` Quand on arrive en bout de liste, le défilement ne se transmet pas à la page derrière.
- `webkit-overflow-scrolling:` 
  - `touch` Défilement fluide avec inertie sur d’anciens iOS
- `cursor:` 
  - `pointer` La main au survol
- `touch-action:` 
  - `manipulation` Au doigt, pas de zoom par double-tap, le toucher répond tout de suite
- `align-items:` 
  - `center` Centre verticalement le bouton
  - `stretch` étirés afin que la taille de la boîte de marge sur l'axe en bloc est la même que celle de la ligne sur laquelle l'élément se trouve, tout en respectant les contraintes de hauteur et de largeur.
- `justify-content:` comment le navigateur répartit l'espace entre et autour des éléments de contenu le long de l'axe principal d'un conteneur flexible
  - `space-between` Les éléments ont espacés équitablement selon l'axe principal. L'espace utilisé entre chaque élément est le même. Le premier élément est aligné sur le bord du conteneur et le dernier élément est aussi aligné sur le bord de l'élément.
  - `center` Les éléments sont regroupés au centre du conteneur selon l'axe principal.
- `border-left:`
  - `5px solid` Liseré de couleur à gauche
- `align-self:` 
  - `flex-start` Change l’alignement d’un seul élément, sans toucher aux autres.
- `flex-direction:`  définit la façon dont les éléments flexibles sont placés dans le conteneur flexible
  - `row` : en ligne
  - `column` : en ligne
- `flex-wrap:` définir si les éléments flexibles enfants du conteneur flexible peuvent passer sur plusieurs lignes flexibles
    - `wrap` Les éléments flexibles peuvent passer à la ligne sur plusieurs lignes.


- `display:`
  - `block` L'élément génère une boîte de bloc, créant des retours à la ligne avant et après l'élément dans le flux normal.
  - `inline-block`L'élément génère une ou plusieurs boîtes en incise (inline en anglais) qui ne créent pas de retour à la ligne avant ou après elles-mêmes. En flux normal, l'élément suivant est sur la même ligne s'il y a de la place.
  -  `flex` L'élément se comporte comme un élément de niveau bloc et dispose son contenu selon le modèle de boîtes flexibles (pas clair)   

  */