# Granothèque Grist : widget « Etiquettes sur sachets »

## Rôle
Générer des étiquettes à coller sur les sachets avant leur ajout dans la granothèque.
Usage : impression A4 paysage (PC / tablette). Accès Grist : `full` (update + destroy).

## Fichiers
- HTML : `etiquettes.html` (boutons Imprimer / Marquer comme imprimées, compteur `#info-count`, conteneur `#pages`)
- JS : `../script/main_etiquettes.js`
- CSS : `../styles/main.css` (partagé avec les autres outils : tableau, épingles, étiquettes)
- Versions dev et prod (hébergées sur GitHub)

## Données (table Semis)
Colonnes lues : `Nb_etiquettes`, `Nom`, `Variete`, `Date_s`, `Nb_saisons_mil`,
`Origine_or`, `Origine_millesime`, `Plante_mere`, `Annee_plantation_mil`,
`Nb_graines`, `Nb_godets`, `Germes`, `Plantes`, `Etiq_en_attente`.
Colonne écrite : `Nb_etiquettes`, `Etiq_en_attente` (colonne de données, pas une formule).

## Fonctionnalités
1. **Affichage** : `grist.onRecords` construit une étiquette par unité de `Nb_etiquettes`
   (une ligne avec Nb_etiquettes = 3 donne 3 étiquettes identiques).
2. **Mise en page** : 5 étiquettes par ligne, 4 lignes par page (20 par page).
   Étiquettes en trapèze, 1 sur 2 inversée (rotation 180° du contenu) pour imbriquer les formes.
3. **Contenu d'une étiquette** : nom, variété, Récolte (année en cours), Origine, Semis ou Plantation, nombre de saisons.
   - Origine : `origine_or` si saisons = 0, sinon `origine_millesime`. « Monjardin » est remplacé par « AR ».
   - Semé : `origine → AR`, saisons = Nb_saisons_mil + 1.
   - Non semé : origine seule, saisons = « or. » (affiché « …… saison(s) »).
   - Plante mère avec année de plantation : libellé « Plantation », saisons = année en cours − année de plantation + 1.
   - Étiquette vierge (sans Nom ni Variete) : champs vides, « …… saison(s) » à compléter à la main.
4. **Bouton « Marquer comme imprimées »** (`marquerImprimees()`), pour chaque ligne avec Nb_etiquettes > 0
   (y compris les lignes sans variété) :
   - `Etiq_en_attente += Nb_etiquettes` (vide traité comme 0), puis `Nb_etiquettes = 0`
     (un seul `table.update`) ;
   - confirmation préalable avec un compteur de lignes ;
   - **aucune suppression** : le widget ne détruit plus de lignes. Les lignes de transit **et** les lignes
     sans variété sont gérées/supprimées par l'autre outil (`achatrepro`).

## Choix techniques
- Rendu 100 % côté client en template strings ; SVG avec `preserveAspectRatio="none"` pour les formes.
- Imbrication des étiquettes inversées par marges négatives (±17,25 mm sur 69 mm).
- Impression via `@media print` (A4 paysage, marge 0, saut de page après chaque `.page-etiquettes`).
- `lignes` (variable globale) conserve les enregistrements courants pour `marquerImprimees()`.

## Dépendances
- `achatrepro` lit `Etiq_en_attente` puis la **vide** (valeur vide, pas 0). Si cet outil change, vérifier que les étiquettes
  en attente ne s'accumulent pas. Il supprime également les lignes vierges.

## Points de vigilance
- Imprimer ne modifie rien : il faut cliquer sur « Marquer comme imprimées » après impression.
- Pas de protection contre le double clic : un second clic avant le rafraîchissement de `lignes` pourrait
  additionner deux fois.
- Le widget n'affiche pas `Etiq_en_attente`.
- **Toutes les colonnes lues ou écrites doivent être visibles dans le panneau « Données » du widget**
  (mapping / colonnes de la vue). Une colonne absente est lue comme `undefined` : pour `Etiq_en_attente`,
  le `|| 0` masque le problème et la valeur est **écrasée** au lieu d'être additionnée, sans message d'erreur.
  Si l'addition ne fonctionne pas, vérifier d'abord cela.


## Reste à faire / pistes
- [ ] Désactiver le bouton pendant l'écriture (anti double clic).
- [ ] Afficher `Etiq_en_attente` dans le widget (information ou compteur).
- [ ] Nettoyer le CSS : blocs `@media print` commentés (commentaires qui s'enchaînent) et `padding: auto` invalide en impression.
- [ ] Gérer les erreurs d'écriture (`try/catch` autour de `update` / `destroy` avec message à l'utilisateur).
- [ ] Vérifier le comportement avec un gros volume de lignes (volume actuel inconnu).