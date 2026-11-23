JS : gestion_commun.js, nouveau fichier

Contient tableEnLignes, listeChoix, normaliser, anneeDepuisDate, dateAffichee, et typeInverse (à confirmer).
Règle : seulement des fonctions qui n’utilisent que leurs paramètres. Les outils les appellent sans les redéfinir.
Chargement : une balise <script> classique, avant le JS de l’outil et après Vue et grist-plugin-api.js.
Mises en garde : modifier le commun touche tous les outils, donc tester les trois. En prod, mettre à jour le commun avant les outils.