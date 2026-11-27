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
git ls-tree -r Vue --name-only | grep gestion | tr '\n' ' '
git ls-tree -r Vue --name-only | grep pour_impression | tr '\n' ' '
git ls-tree -r Vue --name-only | grep semis | tr '\n' ' '

gestion/achatrepro/achatrepro.css gestion/achatrepro/achatrepro.html gestion/achatrepro/achatrepro.js gestion/achatrepro/achatrepro_notes.md gestion/boite_a_dons/boite_a_dons.css gestion/boite_a_dons/boite_a_dons.html gestion/boite_a_dons/boite_a_dons.js gestion/boite_a_dons/boite_a_dons_notes.md gestion/boite_a_dons/dons.json gestion/boite_a_dons/generateur_dons/generateur_dons.css gestion/boite_a_dons/generateur_dons/generateur_dons.html gestion/boite_a_dons/generateur_dons/generateur_dons.js gestion/gestion_etiquettes/gestion_etiquettes.css gestion/gestion_etiquettes/gestion_etiquettes.html gestion/gestion_etiquettes/gestion_etiquettes.js gestion/gestion_etiquettes/gestion_etiquettes_notes.md gestion/numerotation/numerotation.html gestion/numerotation/numerotation.js gestion/numerotation/numerotation_notes.md pour_impression/cahier/cahier.css pour_impression/cahier/cahier.html pour_impression/cahier/cahier.js pour_impression/cahier/cahier_notes.md pour_impression/calendrier/calendrier.css pour_impression/calendrier/calendrier.html pour_impression/calendrier/calendrier.js pour_impression/calendrier/calendrier_notes.md pour_impression/etiquettes/etiquettes.css pour_impression/etiquettes/etiquettes.html pour_impression/etiquettes/etiquettes.js pour_impression/etiquettes/etiquettes_notes.md pour_impression/numero/numero.css pour_impression/numero/numero.html pour_impression/numero/numero.js pour_impression/numero/numero_notes.md semis/a_gerer/a_gerer.css semis/a_gerer/a_gerer.html semis/a_gerer/a_gerer.js semis/a_gerer/a_gerer.md semis/plan/plan.css semis/plan/plan.html semis/plan/plan.js semis/plan/plan_notes.md semis/semis_realises/semis_realises.css semis/semis_realises/semis_realises.html semis/semis_realises/semis_realises.js semis/semis_realises/semis_realises_notes.md script/scriptcommun.js  styles/styles_communs.css
## 3. Copier seulement ces fichiers sur main
git checkout main
git pull
git checkout Vue -- gestion/achatrepro/achatrepro.css gestion/achatrepro/achatrepro.html gestion/achatrepro/achatrepro.js gestion/achatrepro/achatrepro_notes.md gestion/boite_a_dons/boite_a_dons.css gestion/boite_a_dons/boite_a_dons.html gestion/boite_a_dons/boite_a_dons.js gestion/boite_a_dons/boite_a_dons_notes.md gestion/boite_a_dons/dons.json gestion/boite_a_dons/generateur_dons/generateur_dons.css gestion/boite_a_dons/generateur_dons/generateur_dons.html gestion/boite_a_dons/generateur_dons/generateur_dons.js gestion/gestion_etiquettes/gestion_etiquettes.css gestion/gestion_etiquettes/gestion_etiquettes.html gestion/gestion_etiquettes/gestion_etiquettes.js gestion/gestion_etiquettes/gestion_etiquettes_notes.md gestion/numerotation/numerotation.html gestion/numerotation/numerotation.js gestion/numerotation/numerotation_notes.md pour_impression/cahier/cahier.css pour_impression/cahier/cahier.html pour_impression/cahier/cahier.js pour_impression/cahier/cahier_notes.md pour_impression/calendrier/calendrier.css pour_impression/calendrier/calendrier.html pour_impression/calendrier/calendrier.js pour_impression/calendrier/calendrier_notes.md pour_impression/etiquettes/etiquettes.css pour_impression/etiquettes/etiquettes.html pour_impression/etiquettes/etiquettes.js pour_impression/etiquettes/etiquettes_notes.md pour_impression/numero/numero.css pour_impression/numero/numero.html pour_impression/numero/numero.js pour_impression/numero/numero_notes.md semis/a_gerer/a_gerer.css semis/a_gerer/a_gerer.html semis/a_gerer/a_gerer.js semis/a_gerer/a_gerer.md semis/plan/plan.css semis/plan/plan.html semis/plan/plan.js semis/plan/plan_notes.md semis/semis_realises/semis_realises.css semis/semis_realises/semis_realises.html semis/semis_realises/semis_realises.js semis/semis_realises/semis_realises_notes.md script/scriptcommun.js  styles/styles_communs.css
# + si modifiés pour cet outil : script/scriptcommun.js  styles/styles_communs.css
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