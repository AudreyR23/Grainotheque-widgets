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