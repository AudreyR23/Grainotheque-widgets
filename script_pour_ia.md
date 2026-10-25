# pour récap#
Peux-tu me rédiger un récapitulatif de l'outil (fonctionnalités, choix techniques, ce qui reste à faire). Il me servira de référence si je reprends cet outil plus tard. Je veux du code en markdown.

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