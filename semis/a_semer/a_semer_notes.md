# Granothèque Grist : outil « À semer » (notes v3)

> Dernière mise à jour : 23/11/2026
> Statut : **dev validé** (migration BEM + conventions terminée, tests OK). **Prod et tests tablette à faire.**
> Remplace le récapitulatif v2 (`a_semer_recapitulatif`). Outils de référence : **À gérer**, **Achat-repro**, **Semis réalisés**.

## 1. Rôle

Rappeler les variétés à semer **au mois choisi** (mois en cours par défaut) quand elles n'ont pas encore été semées dans leur période de semis. Le bouton « Semer » envoie la variété à **Semis réalisés**, qui pré-remplit sa fiche.

- Lecture seule : n'écrit rien dans Grist. Pas d'impression.
- Usage : PC et tablette ; consultable sur téléphone.

## 2. Fichiers et installation

| Fichier | Rôle |
|---|---|
| `a_semer.html` | 3 zones Vue : `#appEntete`, `#appFiltres`, `#appListe` |
| `a_semer.js` | Données, calculs ; messages dans le bloc `TEXTES` en haut du fichier |
| `a_semer.css` | Uniquement ce qui n'est pas dans le commun : `filtres`, `filtres__groupe`, `champ--filtre`, `carte--deja-semee`, `carte--sousabri-pleineterre` |
| `../../styles/styles_communs.css` | Commun BEM (l'ancien `styles_communs_bem.css`, renommé) |
| `../../script/scriptcommun.js` | Fonctions communes |

- Scripts en fin de `<body>` : plugin Grist, Vue 3.4.38 (unpkg), `scriptcommun.js`, `a_semer.js`.
- Grist : données **Varietes**, « Sélectionner par » vide, accès **full** (nécessaire pour `fetchTable`, même sans écrire).
- Semis réalisés doit être **sur la même page** Grist (voir 9).
- Fonctions du commun utilisées : `tableEnLignes`, `listeChoix`, `normaliser`, `anneeDepuisDate`, `typeInverse`, `libelle` (« Nom - Variété », tiret court), `pluriel`.

## 3. Données lues (`fetchTable`)

| Table | Colonnes |
|---|---|
| **Varietes** | `Nom`, `Variete`, `Type`, `Semis_sous_abris`, `Semis_pleine_terre` (ChoiceList de mois), `Annees_sans_test` |
| **Millesimes** | `NomVariete`, `Millesime` (date), `Epuise` (formule), `Germination_affichee` (formule), `Qtte_graines`, `Nb_sachets`, `Plante_mere`, `Type_plant`, `Melange` |
| **Semis** | `NomVariete`, `Date_s` |

- **Rien n'est écrit.**
- Mois attendus dans les ChoiceList : `Jan, Fév, Mar, Avr, Mai, Jui, Juil, Aou, Sep, Oct, Nov, Déc` (comparaison sans accents ni casse). Un libellé renommé dans Grist n'est plus reconnu.
- `Millesimes.Sachets` n'existe plus (renommée `Nb_sachets`, numérique) : l'ancienne détection des plants par code (`1P.`, `2rhi`…) et du « Mél » ne marchait plus en silence. Corrigé le 23/11/2026 (voir 4).
- `Varietes.Deja_seme_cette_annee` n'est pas lue.

## 4. Fonctionnalités

### Liste « à semer »
Une variété s'affiche si :
1. le mois choisi est dans `Semis_sous_abris` ou `Semis_pleine_terre` ;
2. elle n'a pas de semis dans sa **période de semis** (voir 5) ;
3. elle n'a pas de **plante mère au jardin** ;
4. elle a un millésime utilisable (voir 6) ou une plante mère.

Les conditions 2 et 3 font une variété « déjà semée » : masquée par défaut, estompée si « Afficher aussi les déjà semées » est cochée.

### Titre
« À semer en Nov (6) » ; avec une case Sous abri / Pleine terre cochée : « À semer en Nov (2 sur 6) ». Le nombre ne compte que les variétés **non** estompées.

### Carte
- Liseré : vert (`carte--sousabri`), marron (`carte--pleineterre`), moitié vert / moitié marron (`carte--sousabri-pleineterre`, local).
- Nom en gras + type en petit gris, emoji d'abord (`typeInverse`).
- Pastilles du commun « Sous abri » / « Pleine terre » (`pastille--categorie`).
- Ligne grise 1 : millésime (ou « Sachet mélangé (plusieurs millésimes) », « Millésime sans date », « Pas de graines »), germination en %, ancienneté du test (« testé il y a 2 ans », « testé cette année », « jamais testé »).
- Ligne grise 2 : période de semis (« Semis Nov → Fév »).
- Pastille bleue (`pastille--info`) : « Déjà semée » et/ou « 🌱 pieds au jardin » (texte de `Type_plant` tel qu'écrit dans Grist ; « plant » s'il est vide).
- Bouton « Semer » (`btn--enregistrer`) à droite.
- Carte déjà semée : `carte--deja-semee` (opacité 0.6).

### Filtres et tri
- **Mois** (Jan → Déc), **Afficher aussi les déjà semées**, **Sous abri**, **Pleine terre** (cumulables : les deux cochées = variétés qui se sèment dans les deux modes ce mois-ci).
- **Tri** : nom ; % de germination (meilleur d'abord) ; test (plus longtemps sans test d'abord, « jamais testé » en tête).
- **Actualiser** : recharge les trois tables ; grisé pendant le chargement.

### Plantes mères (plants au jardin)
- Plant au jardin = ligne Millesimes avec `Plante_mere` cochée. `Type_plant` : pieds, rhizome, caïeux, bulbe.
- À la mort totale, À gérer décoche `Plante_mere` : la variété n'a plus de plant au jardin.
- Une plante mère n'est jamais `Epuise` (formule) : elle est exclue du choix du millésime, sauf si elle a aussi des graines (`Qtte_graines` ou `Nb_sachets` > 0).

### Sachet mélangé
Case `Millesimes.Melange`. Traité comme un millésime normal ; s'il est choisi, la carte affiche « Sachet mélangé (plusieurs millésimes) ».

### Erreur de chargement
Message `TEXTES.erreurChargement` rangé dans `etat.message`, affiché au-dessus de la liste en `texte texte--note` (comme Semis réalisés). Effacé au début de chaque « Actualiser ».

## 5. Période de semis

`fenetreDeSemis(liste, mois, annee)` regroupe les mois de `Semis_sous_abris` + `Semis_pleine_terre` en une **fenêtre continue** contenant le mois choisi (ex. Nov → Fév, à cheval sur deux années). « Déjà semée » s'il existe un `Date_s` dans la fenêtre (début inclus, fin exclue : 1er jour du mois suivant). Une variété semée en décembre ne réapparaît pas en janvier ; semée en janvier, elle réapparaît en novembre.

## 6. Choix du millésime (`millesimeAUtiliser`)

1. Candidats : non épuisés, et pas une plante mère sauf si elle a des graines.
2. Le **plus récent** parmi ceux qui ont une date.
3. Sinon, le meilleur `Germination_affichee`.
4. Sinon aucun : variété masquée (sauf plante mère au jardin : carte « Pas de graines »).

Germination en % : si la valeur est ≤ 1, elle est multipliée par 100.

## 7. Architecture Vue

- **3 zones**, montées séparément, toutes sur le même `etat` :
  - `#appEntete` (`<header class="entete">`, collé en haut) : titre, Actualiser. `return { etat, MOIS, actualiser }`.
  - `#appFiltres` (`class="ligne filtres"`) : mois, cases (`case__saisie` + `case__texte`), tri. `return { etat, MOIS }`.
  - `#appListe` (`<main>`) : message d'erreur, cartes. `return { etat, MOIS, typeInverse, libelle, categorie, pluriel, semer }`.
- **État** : `lignes`, `mois`, `afficherDejaSemees`, `tri`, `nbTotal`, `nbRetenues`, `filtreActif`, `filtreSousAbri`, `filtrePleineTerre`, `chargement`, `message`.
- **Le JS calcule, le HTML met en forme** : chaque ligne contient `{ v, mil, sousAbris, pleineTerre, dejaSemee, semisFait, plant, typePlant, fenetre, germination, anneesSansTest }` ; `categorie(l)` renvoie un code (`sousabri`, `pleineterre`, `sousabri-pleineterre`) que le HTML transforme en `carte--…`. Phrases et pluriels (`pluriel(n, 'an')`) dans le HTML.
- **Flux** : `actualiser()` → `chargerDonnees()` → `afficher()` ; `Vue.watch` sur `[mois, afficherDejaSemees, tri, filtreSousAbri, filtrePleineTerre]` → `afficher()`.
- **Données** : `recordsParId.varietes`, `.millesimes`, `.semisParVariete` (id variété → dates), `.varietesAvecPlant` (id variété → `Type_plant` ou `''`). Map non suivies par Vue.
- `plant` (vrai/faux) et `typePlant` (texte) sont séparés : un `Type_plant` vide vaut « faux » en JS.

## 8. CSS local (`a_semer.css`)

| Classe | Rôle |
|---|---|
| `.filtres` | Complète `.ligne` du commun : écarts 16 px / 8 px, marge sous les filtres |
| `.filtres__groupe` | Libellé + liste (Mois, Tri) sur une ligne |
| `.champ--filtre` | Champ réduit à son contenu (annule `width: 100%`) |
| `.carte--deja-semee` | Carte estompée |
| `.carte--sousabri-pleineterre` | Liseré moitié vert / moitié marron (absent du commun) |

## 9. Communication avec Semis réalisés (contrat, ne pas casser)

`BroadcastChannel('granotheque-semer')`, message `{ varieteId }`. Envoi : `semer(id)` → `canal.postMessage({ varieteId: id })`. Réception dans Semis réalisés (`canal.onmessage`, `varietePendante` si la variété arrive pendant son chargement). Fonctionne entre widgets de même origine, chargés en même temps (même page Grist). « Sélectionner par » et `setCursorPos` ont été écartés.

## 10. Limites connues

1. Sous abri / Pleine terre regroupés dans le calcul « déjà semée ».
2. Mois choisi = année en cours (« Jan » regarde janvier de cette année).
3. Plante mère sans graines : variété masquée de la liste normale.
4. Rafraîchissement manuel après un semis enregistré (« Actualiser »).
5. Texte de la pastille « au jardin » = valeur brute de `Type_plant`.
6. Mobile : deux widgets serrés sur une page ; « Semer » pas testé sur tablette.
7. Liste vide : aucun message.
8. Bouton Semer visible même sur « Pas de graines » (Semis réalisés dira « Aucun millésime disponible »).
9. Germination : `g <= 1` suppose une fraction.
10. Bouton Semer un peu bas dans la carte : `margin-top: 8px` de `btn--enregistrer` (commun).

## 11. Reste à faire / idées

- [ ] Prod + tests tablette.
- [ ] Cacher Semer sans graines (`v-if="l.mil"`).
- [ ] Message de liste vide (« Aucune variété à semer en Nov »).
- [ ] Actualisation automatique après un enregistrement dans Semis réalisés (message sur le même canal).
- [ ] Retour visuel après « Semer ».
- [ ] Lire les libellés de mois depuis Grist.
- [ ] Séparer Sous abri / Pleine terre dans « déjà semée » ; choisir l'année.
- [ ] Export `.ics`, rappel automatique (chantiers à part).
- [ ] **Discussion du commun** : couleur des erreurs de chargement (`texte--note` gris ou `texte--erreur` rouge, dans tous les outils) ; `margin-top` de `btn--enregistrer` ; `carte--sousabri-pleineterre` (si Étiquettes l'utilise aussi).
- [ ] **Semis réalisés** : revoir le libellé « Nom - Variété » (tiret court) dans sa discussion.

## 12. Journal

1–16 : voir récapitulatif v2 (fichiers de base, filtres, BroadcastChannel, période de semis, plants par code `Sachets`, Mél, refonte visuelle, conversion Vue en une zone, JS commun).
17. (23/11/2026) Migration conventions :
    - commun BEM (`styles_communs.css`) ;
    - 3 zones Vue, entête collée ;
    - cartes en BEM, correction du `v-if="typeInverse"` toujours vrai ;
    - `texteDetail`, `textePeriode`, `texteInfos`, `texteGermination`, `texteTest` supprimées : valeurs dans le JS, phrases dans le HTML, `pluriel` ; titre depuis `nbTotal` / `nbRetenues` / `filtreActif` ;
    - filtres en BEM (`case__saisie`, `champ--filtre`), `a_semer.css` réécrit ;
    - bloc `TEXTES`, erreur de chargement visible ;
    - plants par `Plante_mere` / `Type_plant`, mélange par `Melange`, `Nb_sachets` ; suppression de `typeDePlant`.

## 13. Pièges rencontrés

- Colonne renommée dans Grist (`Sachets` → `Nb_sachets`) : un `fetchTable` ne signale rien, la valeur vaut `undefined` et la fonction s'éteint en silence. Après un renommage, chercher l'ancien nom dans **tous** les outils.
- `v-if="nomDeFonction"` est toujours vrai : tester la donnée, pas la fonction.
- Dans `carte__contenu` (colonne), deux éléments à mettre sur une même ligne doivent être regroupés dans un `<div>`.
- Une chaîne vide vaut « faux » : séparer « il y a un plant » (booléen) de « son type » (texte).
- Voir aussi les pièges du mémo des conventions (formatage du HTML, `return` du `setup`, cache).

## 14. Checklist de test

1. Ctrl+Maj+R : aucune erreur, aucun avertissement Vue.
2. Titre « À semer en Nov (n) », mois en cours sélectionné ; entête collée au défilement.
3. Changer de mois : titre et liste changent.
4. « Déjà semées » : cartes estompées, pastille bleue, titre inchangé.
5. Sous abri / Pleine terre : filtrage, « (x sur n) », retour à « (n) ».
6. Trois tris.
7. Liserés vert / marron / moitié-moitié ; pastilles ; type emoji d'abord.
8. Textes : « Millésime 2024 · germination 85 % · testé il y a 2 ans » (« 1 an »), « Semis Nov → Fév ».
9. Plante mère : absente de la liste normale ; estompée avec « 🌱 pieds au jardin » ; « Pas de graines » sans graines ; avec un sachet daté, c'est le sachet qui s'affiche.
10. `Melange` coché : « Sachet mélangé (plusieurs millésimes) ».
11. Erreur provoquée (`fetchTable('SemisX')`) : message au-dessus de la liste ; disparaît au prochain Actualiser réussi.
12. « Semer » : la variété arrive dans Semis réalisés.
13. Après un semis enregistré + Actualiser : la variété disparaît.