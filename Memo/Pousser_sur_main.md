# Mettre un outil en ligne sur main (depuis la branche de dev « Vue »)

## 0. Se placer à la racine du dépôt
cd ~/Documents/Grist_potager/Grainotheque-widgets
git branch --show-current          # doit afficher : Vue

## 1. Valider et pousser le travail sur Vue
git status
git add -A                          # (branche de dev : on peut tout ajouter)
git commit -m "Description"
git push

## 2. Vérifier les chemins des fichiers de l'outil
git ls-tree -r Vue --name-only | grep nom_outil

## 3. Copier seulement ces fichiers sur main
git checkout main
git pull
git checkout Vue -- dossier/outil/outil.html dossier/outil/outil.js dossier/outil/outil.css
# + si modifiés pour cet outil : script/scriptcommun.js  styles/styles_communs_bem.css
git status                          # contrôler la liste (fichiers en vert)

## 4. Contrôler un fichier partagé avant validation
git --no-pager diff --staged script/scriptcommun.js
# « new file » ou lignes + seulement : sans risque. Une ligne - : s'arrêter.

## 5. Valider, pousser, revenir
git commit -m "Outil : mise en ligne"
git push
git checkout Vue

## 6. Tester
# Attendre 1 à 2 min, ouvrir l'URL du .html dans le navigateur du téléphone (cache vidé),
# puis dans Grist. Ouvrir un autre outil pour vérifier qu'il marche toujours.

## En cas de blocage
# « Vos modifications locales seraient écrasées » : valider d'abord sur Vue (git add -A, commit, push).
# « ne correspond à aucun fichier connu » : on n'est pas à la racine (cd ci-dessus), ou chemin faux.
# Pager qui reste affiché (un « : » en bas) : appuyer sur q.