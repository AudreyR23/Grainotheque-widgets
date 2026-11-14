CSS

Ajouté : .carte-type (type de la variété, petit et gris, après le nom). À confirmer.
Ajouté à ta logique de couleurs : vert foncé et marron = mode de semis (sous abri / pleine terre).
Notes à corriger : tes notes Étiquettes parlent de --ou-* et .texte-ou, mais le CSS contient --ici-* et .texte-ici. Mets à jour les notes avec les noms du CSS.
Ménage possible :
.erreur a deux marges (margin: 10px 0 0 puis margin-top: 4px), la seconde l’emporte sur la première.
.semis-retard est dans la section carte. Cherche où il sert avant de le garder.
.cadre-etape est marqué « à revoir ».
.btn-annuler et .btn-valider utilisent des couleurs en dur au lieu des variables.

  - `.erreur` a deux marges (`margin: 10px 0 0` puis `margin-top: 4px`), la seconde l'emporte ;
  - `.semis-retard` est dans la section carte : chercher où elle sert avant de la garder ;
  - `.cadre-etape` est marqué « à revoir » ;
  - `.btn-annuler` et `.btn-valider` utilisent des couleurs en dur au lieu des variables ;
  - supprimer les commentaires de code mort s'il en reste.

  /* ===== Signification code =====
'padding:' Espace intérieur entre texte et bordure
'position:' 
  'relative' La liste reste dans le flux de la page : elle occupe sa place et pousse vers le bas ce qui la suit.
'z-index:' Ordre d’empilement : une valeur haute passe devant les éléments voisins. Utile surtout avec absolute.
'margin:' Marge extérieur
'padding:' Supprime le retrait par défaut de la ul / Marge intérieur
'gap:' Ecart entre éléments
'flex:' 
  '1' S'étire pour prendre toute la place
'list-style:' 
  'none' Supprime les puces de la liste
'max-height' 
  '50vh' Hauteur maximale : 50 % de la hauteur de l’écran
'overflow-y' 
  'auto' Si le contenu dépasse la hauteur max, une barre de défilement verticale apparaît.
'font-size:' Taille du texte
'border:' 
  '1px solid' Bordure fine pleine
'border-radius:' 
  'en px' Coins arrondis.
'box-shadow:'   
  '0 4px 10px rgba(0, 0, 0, .15)' Ombre portée légère : effet de liste « posée au-dessus ».
'touch-action:'
  'pan-y'   Au doigt, seul le glissement vertical est autorisé sur la liste
'overscroll-behavior:'
 'contain' Quand on arrive en bout de liste, le défilement ne se transmet pas à la page derrière.
'webkit-overflow-scrolling:' 
  'touch' Défilement fluide avec inertie sur d’anciens iOS
'cursor:' 
  'pointer' La main au survol
'touch-action:' 
  'manipulation' Au doigt, pas de zoom par double-tap, le toucher répond tout de suite
'align-items:' 
  'center' Centre verticalement le bouton
'justify-content:'
  'space-between'
'border-left:'
  '5px solid' Liseré de couleur à gauche
'align-self:' 
  'flex-start' Change l’alignement d’un seul élément, sans toucher aux autres.
'display:'
  'block'
  'inline-block'   

  */