# Granothèque Grist : widget « Semis réalisés » (avec la section « À semer »)

> Dernière mise à jour : 27/11/2026
> Statut : **dev validé** (nettoyage de l'audit, « À reproduire » sur Varietes, fusion d'À semer, navigation dans l'en-tête, menus maison). **Prod à finir.**
> Remplace aussi les notes d'**À semer** (`a_semer_notes.md`), outil fusionné ici.
> Outils de référence pour le style et les conventions : **À gérer**, **Achat-repro**.

## 1. Rôle

- **Rappel « À semer »** : les variétés à semer au mois choisi, pas encore semées dans leur période de semis. « Semer » remplit la fiche.
- **Saisie des semis** d'une journée dans la table **Semis** via un formulaire, sans passer par la grille Grist. Chaque semis devient une carte « À enregistrer » ; un seul bouton « Enregistrer » écrit tout le lot en **un seul `applyUserActions`** (un Ctrl+Z dans Grist annule tout : semis, sachets vidés, « À reproduire »).
- Usage : PC, mobile, tablette. Pas d'impression.
- Titre de l'en-tête (`<h1>`) : « À semer » (voulu) ; la fiche porte le titre « Semis réalisés » (`<h2>`).

## 2. Fichiers

| Fichier | Rôle |
|---|---|
| `semis_realises.html` | 4 zones Vue, dans l'ordre de la page : `#appEntete`, `#appEnCours`, `#appASemer`, `#appFiche` |
| `semis_realises.js` | Logique ; messages dans le bloc `TEXTES` en haut du fichier |
| `semis_realises.css` | Uniquement ce qui n'est pas dans le commun |
| `../../styles/styles_communs.css` | Socle CSS partagé (BEM) |
| `../../script/scriptcommun.js` | Fonctions communes |

- Scripts en fin de `<body>` : plugin Grist, Vue 3.4.38 (unpkg), `scriptcommun.js`, `semis_realises.js`.
- Grist : widget personnalisé, accès **complet** (`grist.ready({ requiredAccess: 'full' })`).
- Fonctions du commun utilisées : `tableEnLignes`, `listeChoix`, `enListeChoix`, `normaliser`, `correspondRecherche`, `libelle`, `lieuxFiltres`, `lireChoixColonnes`, `colonnesAbsentes`, `anneeDepuisDate`, `dateAffichee`, `dateDuJour`, `dateEnSecondes`, `LISTE_MOIS`, `numeroMois`, `entierOuNull`, `pluriel`, `creerMessageTemporaire`, `effacerAuClic`, `aller`.

## 3. Données

### Lues (`fetchTable`)
| Table | Colonnes |
|---|---|
| `Varietes` | `Nom`, `Variete`, `Type`, `Duree_germ`, `A_reproduire`, `Semis_sous_abris`, `Semis_pleine_terre` (ChoiceList de mois), `Annees_sans_test` (formule) |
| `Millesimes` | `NomVariete`, `Millesime`, `Origine`, `Nb_saisons_manuel`, `Plante_mere`, `Annee_plantation`, `Qtte_graines`, `Nb_sachets`, `Epuise` et `Germination_affichee` (formules) |
| `Semis` | `NomVariete`, `Millesime`, `Date_s`, `Nb_godets`, `Nb_graines`, `Ou` |
| `_grist_Tables`, `_grist_Tables_column` | choix de `Semis.Ou` (`lireChoixColonnes`) |

- Colonnes de `Varietes` vérifiées au chargement : `COLONNES_VARIETES` + `colonnesAbsentes` → message rouge dans l'en-tête si l'une manque (une colonne renommée ne donne sinon aucune erreur).
- Mois attendus dans les ChoiceList : valeurs de `LISTE_MOIS` (`Jan`, `Fév`… `Jui`, `Juil`, `Aou`… ou noms longs), lues par `numeroMois`.
- **`Nb_saisons_manuel`** = nombre de saisons **saisi** ; **`Nb_saisons`** = formule affichée (calculée pour une plante mère, sinon recopie `Nb_saisons_manuel`). Ne pas renommer : Achat-repro écrit `Nb_saisons_manuel`, et le Cahier lit les deux (un échange des noms le fausserait sans erreur).
- `Type_plant` n'est plus lu : une plante mère s'affiche « 🌱 Plante mère », sans son type de plant.

### Écrites (un seul `applyUserActions`)
- **`Semis`** (`BulkAddRecord`) : `NomVariete`, `Millesime`, `Date_s`, **`Date_p`** (pleine terre seulement : = `Date_s`, planté le jour du semis ; sous abri : vide), `Nb_godets`, `Nb_graines`, `Ou` (`enListeChoix` ou `null`), `Germes` (= `null` explicite, sinon Grist met 0 et `Info_germination` conclut « NG »).
- **`Millesimes`** (`UpdateRecord`, si « Sachet vidé ») : `Qtte_graines` et `Nb_sachets` à `null` (la formule `Epuise` exige les deux vides).
- **`Varietes`** (`UpdateRecord`, si la case « À reproduire » a changé) : `A_reproduire` (`true` ou `false`), une écriture par variété.
- **Jamais envoyées** : `Type` et `A_produire` (formules `$NomVariete.Type` et `$NomVariete.A_reproduire`), `Positions`, `Nb_etiquettes`, `Plantes`, `Oups`, `Don_p`, `Date_creation`, `Date_modif`.
- Pas de relecture avant écriture : on n'ajoute que des lignes, « Sachet vidé » écrase le stock, « À reproduire » écrit la valeur de la case (décision du 23/11/2026).

### Liens avec les autres outils
- **À gérer** relit les semis créés : `Germes` vide → « À vérifier ».
- **Achat-repro** décoche `Varietes.A_reproduire` à chaque création d'un millésime de la variété ; il écrit aussi `Nb_sachets`.
- **Plan** lit `Semis.A_produire` (formule `$NomVariete.A_reproduire`) : rien à changer de son côté.
- **Numérotation** : « Sachet vidé » rend le millésime `Epuise` ; si c'était le dernier, la formule `Varietes.Disponible` passe à faux tout seule (la variété apparaît dans « Numéros réutilisables »). Une plante mère n'est jamais épuisée : sa variété reste disponible.
- Pleine terre reconnaissable dans `Semis` par `Date_p` = `Date_s` ; plante mère (À gérer, Achat-repro) par godets = 0 et graines = 0.
- Plus de `BroadcastChannel` : l'ancien widget À semer est intégré (section « À semer »).

## 4. Fonctionnalités

Ordre de la page (comme À gérer) : en-tête collé avec navigation, cartes **« À enregistrer »** et bouton Enregistrer (s'il y en a), section **« À semer »**, **fiche « Semis réalisés »**.

### En-tête (`#appEntete`)
- Titre « À semer », statut (Chargement… / ● Non sauvegardé (n) / ✓ À jour), messages (`entete__message`).
- **Navigation** (`<nav class="ligne ligne--pleine">`) : « En cours (n) » (orange `btn--etape`, seulement s'il y a des cartes) → `aller('appEnCours')` ; « Ce mois-ci (n) » (`etat.aSemer.nbTotal`) → `aller('appASemer')` ; « Semis réalisés » → `aller('appFiche')`.

### Cartes « À enregistrer » (en haut, `#appEnCours`)
Liseré orange, nom + type, pastille de mode, détail (millésime, date, quantités, lieux, « sachet vidé », « à reproduire » / « ne plus reproduire » si la case a changé), ✕ pour retirer. Chaque carte garde une copie de la variété (`b.variete`) et du millésime (`b.millesime`) pour son affichage. **Perdues au rechargement** (voulu, plus de `sessionStorage`). Section masquée quand la liste est vide.

**Enregistrer** : bouton bleu sous les cartes (dans la même section, non collé). Boutons « Ajouter » et « Enregistrer » grisés pendant l'écriture ; cartes conservées en cas d'échec ; puis rechargement de `Varietes`, `Millesimes`, `Semis`, mise à jour de la fiche (`rafraichirFiche`) et de la section À semer (`afficherASemer`).

### Section « À semer » (`#appASemer`)
Une variété s'affiche si :
1. le mois choisi est dans `Semis_sous_abris` ou `Semis_pleine_terre` ;
2. elle n'a pas de semis dans sa **période de semis** (voir 7) ;
3. elle n'a pas de **plante mère au jardin** ;
4. elle a un millésime utilisable (voir 7) ou une plante mère.

Les conditions 2 et 3 font une variété « déjà semée » : masquée par défaut, estompée (`carte--deja-semee`) si « Afficher aussi les déjà semées » est cochée.

- **Titre** : « À semer en novembre (6) » ; avec Sous abri / Pleine terre coché : « (2 sur 6) ». Le nombre ne compte que les variétés non estompées. Bouton **Masquer / Afficher** à droite, largeur fixe (`.reserve` du commun avec « Masquer », le plus long) ; replie filtres et cartes, le titre reste.
- **Filtres** : Mois (mois en cours par défaut), Afficher aussi les déjà semées, Sous abri, Pleine terre (cumulables), Trier par. **Mois et Trier par : menus maison** (bouton + liste, comme le tri d'À gérer), plus de `<select>` ; largeur fixe par `.reserve` (tous les mois pour Mois, « % de germination » pour le tri) ; pas de `champ--deroulant` (la réserve casserait la mise en ligne).
- **Tri** : nom ; % de germination (meilleur d'abord) ; test (plus longtemps sans test d'abord, « jamais testé » en tête — voir 10).
- **Carte** : liseré vert / marron / moitié-moitié (`carte--sousabri`, `--pleineterre`, `--sousabri-pleineterre`, commun) ; nom + type ; ligne de pastilles : Sous abri / Pleine terre, **« 🌱 Plante mère »** (`pastille--plantemere`) s'il y a une plante mère au jardin, **« Dans ta liste »** (orange) si la variété est déjà dans les cartes à enregistrer ; ligne grise : millésime (ou « Millésime sans date », « Pas de graines »), germination en %, ancienneté du test ; période de semis (« Semis Nov → Fév ») ; pastille bleue « Déjà semée » (`pastille--info texte--info`) si un semis existe dans la période.
- **Semer** : absent sur « Pas de graines ». Remplit la fiche (`choisirVariete`), choisit le mode s'il n'y en a qu'un possible, fait défiler jusqu'à la fiche (`aller('appFiche')`). Le bouton de la variété en cours est orange (`btn--etape`).
- **Liste vide** : « Rien à semer en … ».
- **Mise à jour automatique** après « Enregistrer » : une variété semée disparaît (ou s'estompe).

### Fiche « Semis réalisés » (`#appFiche`)
1. **Bascule Sous abri / Pleine terre** : sous abri = godets + graines par godet ; pleine terre = `Nb_godets` = 1, un seul champ graines, `Où` visible et obligatoire, `Date_p` = date du semis. Changer de mode vide `Où` et l'erreur de saisie.
2. **Recherche de variété** : sans accents ni casse, plusieurs mots, 40 résultats max.
3. **Encart bleu** :
   - type **en gras** · « Germination : n jours » / « non renseignée » (écriture normale) ;
   - « 🌱 Plante mère en place (plantée en …) » (pastille) ;
   - « Déjà semé en AAAA (n) » / « Pas encore semé en AAAA » : **année de la date saisie** ;
   - détail des **5 semis les plus récents** de cette année (du plus récent au plus ancien, en `texte--info`), puis « … et n autres » s'il y en a plus de 5 (le 5 est écrit deux fois dans `afficherDerniersSemis` : `slice(0, 5)` et `- 5`) ;
   - alerte rouge si la variété est déjà dans les cartes.
4. **Millésime** : datés (récent d'abord, présélectionné), « or. (originale) » en dernier. Ni épuisés, ni plantes mères. Bouton grisé sans variété ou sans millésime.
5. **Où** : pastilles violettes (✕ pour retirer), liste qui se ferme après un choix et se rouvre au toucher.
6. **Nombres** : champs texte (`inputmode="numeric"`), entiers ≥ 1 seulement (`entierOuNull`), sinon message d'erreur.
7. **Cases** : « Sachet vidé » ; « À reproduire » **recopie `Varietes.A_reproduire` au choix de la variété** : la décocher sur une variété cochée la décoche dans Grist.
8. Plus de menu Type (le type est une formule ; il reste affiché dans l'encart).
9. Bouton **« Ajouter à la liste »** orange (`btn--grand btn--etape`).

Après « Ajouter » : conservés = mode, date, godets, graines ; vidés = variété, millésime, Où, cases ; curseur dans Variété.

### Messages
- Succès dans l'en-tête, 4 s.
- Erreurs de saisie (`erreurFiche`, sous la fiche) et d'enregistrement (`erreur`, en-tête) : affichées jusqu'au prochain clic (`effacerAuClic`, phase de capture).
- Erreurs de chargement et colonnes manquantes (`message`) : dans l'en-tête, jusqu'au prochain chargement.

## 5. Choix techniques

- **4 zones Vue**, toutes sur le même `etat` : `#appEntete` (titre, statut, navigation, messages), `#appEnCours` (cartes à enregistrer + Enregistrer), `#appASemer` (section À semer), `#appFiche` (formulaire, erreur de saisie, Ajouter).
- **`return` de chaque zone = seulement ce que son HTML utilise** : `aller` est dans celui de `#appEntete` (navigation) ; `enregistrerTout` dans celui de `#appEnCours` (le bouton est dans cette zone). `semer()` appelle `aller` dans le JS : pas besoin de `return`.
- **`<main class="page">`** (`.page` du commun) : les blocs s'empilent avec le `gap` du commun.
- **État** : un seul `etat` ; la section À semer a son sous-objet `etat.aSemer` (`lignes`, `mois`, `afficherDejaSemees`, `tri`, `nbTotal`, `nbRetenues`, `filtreActif`, `filtreSousAbri`, `filtrePleineTerre`, `ouvert`, `listeTriOuverte`, `listeMoisOuverte`). Liste à enregistrer : `etat.aEnregistrer`.
- **Noms** : `ajouterALaListe`, `retirerDeLaListe`, `prochainIdCarte`, `nombreAEnregistrer` (anciens noms en « étape intermédiaire » supprimés) ; menus : `basculerMoisASemer` / `choisirMoisASemer`, `basculerTriASemer` / `choisirTriASemer`.
- **Données** : `recordsParId.varietes / millesimes / semis` (Map, non suivies par Vue), chargées une seule fois pour la fiche et la section.
- **`meresDe(varieteId)`** : millésimes « plante mère » d'une variété ; une seule fonction pour l'encart (années de plantation) et la section À semer (pastille « 🌱 Plante mère », variété « déjà semée »).
- **Le JS calcule, le HTML met en forme** : chaque ligne À semer contient `{ v, mil, sousAbris, pleineTerre, dejaSemee, semisFait, plant, fenetre, germination }` ; `categorie(l)` renvoie un code que le HTML transforme en `carte--…`. Carte à enregistrer : `reproduire` vaut `true`, `false` ou `null` (rien à écrire). Menus Mois / Tri : le JS ne garde que `mois` (1 à 12) et `tri` (`'nom'`, `'germination'`, `'test'`) ; les mots sont dans le HTML.
- **watch** : `etat.date` → `afficherDerniersSemis` ; `mois`, `afficherDejaSemees`, `tri`, `filtreSousAbri`, `filtrePleineTerre` de `etat.aSemer` → `afficherASemer`.
- **Bouton Semer** : `btn--etape` **ou** `btn--enregistrer`, jamais les deux (`btn--enregistrer` est après `btn--etape` dans le commun et l'emporterait).
- **Fermeture des menus** Millésime, Mois et Tri : un écouteur `click` sur `document` avec `closest('#menuMillesime')`, `closest('#menuMoisASemer')`, `closest('#menuTriASemer')`. Ces trois `id` doivent rester.
- **Libellé du millésime** (« 2024 · Kokopelli · 2 saisons ») : fabriqué par `libelleMillesime(m)` pour le bouton, la liste et la carte (un seul endroit à modifier). Fonction du JS et non `<template>` partagé, car la carte est dans une autre zone Vue (même principe que `libelle(v)` du commun).

## 6. CSS

### Local (`semis_realises.css`)
| Classe | Rôle |
|---|---|
| `.fiche` | Formulaire en colonne, `gap: 12px` |
| `.fiche__label` | Taille des libellés (`groupe` du commun ne la règle pas) |
| `.bascule`, `.bascule__btn` (+ `--sousabri`, `--pleineterre`, `--sousabri-actif`, `--pleineterre-actif`) | Bascule Sous abri / Pleine terre |
| `.filtres`, `.filtres__groupe` | Filtres de la section À semer (complètent `.ligne`) |
| `.carte--deja-semee` | Carte estompée (opacité 0.6) |

### Venues du commun le 26-27/11 (plus dans le CSS local)
`.page` (`<main>` en colonne, `gap`), `.reserve` (copie invisible du plus long texte : boutons Masquer / Afficher, Mois, Tri), `.menu--auto` (menu aussi large que son plus long texte), `.texte--info` (bleu, même couleur que `texte--succes`). `.champ--filtre` supprimée (plus de `<select>`).

## 7. Règles métier

- « or. » = semence originale : proposée, en dernier.
- Millésimes sans date et hors « or. » : ignorés dans la fiche. Épuisés et plantes mères : non proposés.
- Sachet vidé : vider `Qtte_graines` **et** `Nb_sachets`.
- Semis en pleine terre : `Date_p` = `Date_s` (planté le jour du semis).
- Mélange de variétés : une variété à part entière (ex. « Tournesol - Mélange »), avec ses propres millésimes. Plus de case `Melange`.
- **Période de semis** (`fenetreDeSemis`) : mois de `Semis_sous_abris` + `Semis_pleine_terre` regroupés en une fenêtre continue contenant le mois choisi (ex. Nov → Fév, à cheval sur deux années). « Déjà semée » s'il existe un `Date_s` dans la fenêtre (début inclus, fin exclue). Dates calculées par `dateEnSecondes`.
- **Millésime affiché sur une carte À semer** (`millesimeAUtiliser`) : non épuisé (plante mère seulement si elle a des graines) ; le plus récent daté, sinon le meilleur `Germination_affichee`, sinon aucun (carte masquée, sauf plante mère : « Pas de graines »).
- Germination en % : une valeur ≤ 1 est multipliée par 100.

## 8. Pièges rencontrés

- Commentaire `//` en fin de ligne qui « mange » la propriété suivante placée sur la même ligne.
- `v-show` sur la racine d'une zone Vue ignoré : directives dans la zone.
- `v-if="nomDeFonction"` est toujours vrai : tester la donnée, pas la fonction.
- Espace avant `:disabled` / `:active` (`.btn :active` ne s'applique à rien).
- Colonne renommée dans Grist : `fetchTable` ne signale rien, la valeur vaut `undefined`. D'où `COLONNES_VARIETES`.
- Deux variantes qui fixent la même propriété (`btn--etape` / `btn--enregistrer`) : c'est l'ordre du commun qui gagne.
- Remplacement d'un bout de HTML : une balise de l'ancien texte peut rester (`</template>` orphelin après `libelleMillesime(m)`, 25/11). Relire la ligne entière après le collage.
- **Fonction appelée par un bouton absente du `return` de sa zone** : le clic ne fait rien. Arrivé deux fois : `aller` (navigation de l'en-tête, il faut le `return` de `#appEntete`, pas seulement le commun) et `enregistrerTout` (bouton revenu dans `#appEnCours` sans la fonction dans son `return`, 27/11 : « on ne peut plus enregistrer »).
- `aller` sur une `zone-transparente` (`display: contents`) : pas de cadre, pas de défilement. D'où `#appEnCours` sans `zone-transparente`.
- Bouton `btn--collant` dans une section : il ne reste collé que dans cette section (le placer dans une `zone-transparente` enfant direct de `<main>`, comme À gérer). Non utilisé ici depuis le 27/11.
- Un `<label>` qui entoure un bouton et sa liste : un clic dans la liste est transmis au bouton, qui rouvre la liste. Le groupe est un `<div>`, seul le mot est un `<label for>`.
- Code mort après le retrait d'une colonne (`typePlant` encore calculé alors que `Type_plant` n'était plus lu) : Ctrl+Maj+F sur le nom du champ JS **et** de la colonne.
- Ancien JS en cache : Ctrl+F5.

## 9. Limites connues

- Nouveaux choix `Où` vus au rechargement du widget.
- Formulaire en cours et cartes non enregistrées perdus au rechargement (voulu).
- Pas d'écoute des changements faits ailleurs dans Grist (hors rechargement après enregistrement).
- Section À semer : Sous abri / Pleine terre regroupés dans le calcul « déjà semée » ; le mois choisi regarde l'année en cours.
- Plante mère sans graines : variété masquée de la liste normale.
- Contrastes non traités (texte clair sur `--sousabri-moyen` / `--pleineterre-moyen`).

## 10. Reste à faire

- [ ] **Mise en prod** (en même temps qu'Achat-repro ; commun d'abord : `.page`, `.reserve`, `.menu--auto`, `.texte--info`, `.groupe` sans marge) :
  - [x] `Semis.A_produire` : « effacer et transformer en formule » → `$NomVariete.A_reproduire`.
  - [x] `Varietes.En_production` : formule `$A_reproduire`, ou suppression si rien ne la lit.
  - [x] Formule `Info_germination` : première ligne `if rec.Jours_ecoules == "": return ""`.
  - [x] `Graines_exterieures` supprimée.
  - [x] `Varietes.A_semer_bientot` supprimée.
  - [x] Widget À semer retiré de la page Grist, dossier `a_semer` retiré du dépôt et du projet.
  - [ ] Pousser la version du 27/11 (navigation, menus maison, `meresDe`, `Date_p`).
  - [ ] Vérifier qu'aucun autre outil ne lit `a_semer` ni `Type_plant` pour l'affichage d'une plante mère (Étiquettes, À gérer, Achat-repro : à voir dans leurs discussions).
- [x] Tests tablette (zones tactiles, défilement des listes, clavier numérique, section repliée).
- [x] **Tri « Test »** : il trie sur `Varietes.Annees_sans_test` (années depuis le dernier semis **de la variété**), pas sur le sachet affiché. Formule mise à jour : sans semis, elle prend l'`Annee_germination_ref` la plus récente des millésimes. [Option : lire `Millesimes.Annees_sans_test` du millésime affiché.]
- [x] **Sachets de mélange de variétés** : une variété « … - Mélange » par mélange (décision du 25/11), lignes regroupées.
- [x] Case `Millesimes.Melange` supprimée (26/11).
- [x] Discussion du commun : `.groupe` sans `margin-bottom` ; `.reserve`, `.menu--auto`, `.page`, `.texte--info` passées au commun.

## 11. Checklist de test

1. Démarrage : « Chargement… » puis « ✓ À jour », date du jour, section À semer du mois en cours, Millésime grisé, aucune erreur Vue, pas de cartes ni de bouton Enregistrer, pas de bouton « En cours ».
2. Navigation : « Ce mois-ci (n) » et « Semis réalisés » descendent juste sous l'en-tête ; après un ajout, « En cours (n) » (orange) apparaît et remonte aux cartes.
3. Section : menus Mois et Trier par (ouverture, choix surligné, fermeture par un clic ailleurs, un seul menu ouvert à la fois, largeur fixe), « (x sur n) », 3 tris, Masquer / Afficher (largeur fixe), « Rien à semer en … » sur un mois vide, pas de Semer sur « Pas de graines », pastille « 🌱 Plante mère » sur une variété avec plante mère (cocher « déjà semées »).
4. Semer : défilement jusqu'à la fiche, fiche remplie, mode choisi si un seul possible, case « À reproduire » = état de la variété, bouton orange.
5. Recherche, choix : encart bleu (type en gras, germination normale, 5 semis les plus récents puis « … et n autres »), millésime présélectionné (ni épuisé ni plante mère).
6. Pleine terre : `Où` apparaît, godets disparaît ; sans `Où` : erreur. Nombres : `abc`, `2,5`, `0`, `-1`, vide refusés.
7. Erreur de saisie affichée jusqu'au prochain clic ; un second « Ajouter » fautif la réaffiche.
8. Ajouter : carte **en haut de la page** (nom + type), curseur revenu dans Variété, « Dans ta liste » dans la section, statut « Non sauvegardé (n) » ; ✕ retire ; F5 : cartes perdues.
9. Enregistrer (bouton sous les cartes) : succès 4 s ; cartes et bouton disparaissent ; dans Grist `Millesime`, `Date_s` (pas décalée), `Date_p` = `Date_s` en pleine terre et vide sous abri, `Ou`, `Germes` vide, stock vidé si « Sachet vidé » (et `Varietes.Disponible` à faux si c'était le dernier millésime), `Varietes.A_reproduire` changé seulement si la case a changé ; la variété quitte la section ; un Ctrl+Z annule tout.
10. Colonne `A_reproduire` renommée : message « Colonnes introuvables dans Varietes » dans l'en-tête.

## 12. Journal

- 23/11/2026 : migration Vue et conventions (Semis réalisés et À semer, voir les anciennes notes).
- 25/11/2026 :
  - nettoyage de l'audit : retrait de `sessionStorage` et du menu Type, renommages (`aEnregistrer`, `ajouterALaListe`…), `.fiche__groupe` supprimée ;
  - « À reproduire » écrit dans `Varietes.A_reproduire` (case préremplie, écrite si changée) ; `Semis.A_produire` n'est plus écrit ;
  - fusion d'À semer : section repliable, « Semer » remplit la fiche, plus de `BroadcastChannel` ni de `varietePendante`, mise à jour automatique après Enregistrer, `fenetreDeSemis` par `dateEnSecondes`, Semer masqué sans graines, message de liste vide, pastille « Dans ta liste » ;
  - erreurs de saisie effacées au clic ; erreurs de chargement et d'enregistrement dans l'en-tête (`entete__message`) ;
  - vérification des colonnes de `Varietes` (`COLONNES_VARIETES`) ;
  - libellé du millésime regroupé dans `libelleMillesime` (au lieu de 3 copies dans le HTML) ;
  - décision sur les mélanges de variétés : une variété « … - Mélange ».
- 26/11/2026 :
  - cartes « À enregistrer » en haut de la page (comme « En cours » d'À gérer), avant la section À semer ;
  - `</template>` orphelin retiré dans la liste des millésimes ;
  - formule `Varietes.Annees_sans_test` : `Annee_germination_ref` la plus récente au lieu de `lookupOne` ;
  - `Nb_saisons_manuel` gardé tel quel (voir 3) ;
  - colonne `Millesimes.Melange` supprimée : `estMelange` retiré du JS, texte « Sachet mélangé » retiré de la carte À semer ;
  - carte « À enregistrer » : copie de la variété (`b.variete`), nom par `libelle`, type réaffiché ; `nomDeCarte` supprimée ;
  - écart entre les blocs : `<main class="page">` ; bouton Masquer / Afficher à largeur fixe (`.reserve`).
- 27/11/2026 :
  - navigation dans l'en-tête (En cours, Ce mois-ci, Semis réalisés) ; `aller` dans le `return` de `#appEntete` seulement ; `#appEnCours` sans `zone-transparente` (pour qu'`aller` la trouve) ;
  - titre de l'en-tête « À semer » ; fiche titrée « Semis réalisés » (`<h2>`) ; « Ajouter à la liste » en orange ;
  - bouton Enregistrer remis sous les cartes dans `#appEnCours` (plus de zone `#appEnregistrer` ni de bouton collé) ; `enregistrerTout` remis dans le `return` de `#appEnCours` (enregistrement de nouveau possible) ;
  - Mois et Trier par : menus maison au lieu des `<select>` (`listeMoisOuverte`, `listeTriOuverte`, `basculer… / choisir…ASemer`) ; `.champ--filtre` supprimée ;
  - `.page`, `.reserve`, `.menu--auto`, `.texte--info` passées au commun ;
  - encart : type seul en gras, plante mère en pastille, lignes de semis en `texte--info` ;
  - plantes mères : « 🌱 Plante mère » partout, `Type_plant` plus lu ; `meresDe(varieteId)` partagée par l'encart et la section ; `typePlant` et la Map `plants` supprimés ;
  - pleine terre : `Date_p` = `Date_s` à l'enregistrement.