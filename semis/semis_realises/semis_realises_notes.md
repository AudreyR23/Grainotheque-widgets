# Granothèque Grist : widget « Semis réalisés » (avec la section « À semer »)

> Dernière mise à jour : 25/11/2026
> Statut : **dev validé** (nettoyage de l'audit, « À reproduire » sur Varietes, fusion d'À semer). **Prod et tests tablette à faire.**
> Remplace aussi les notes d'**À semer** (`a_semer_notes.md`), outil fusionné ici.
> Outils de référence pour le style et les conventions : **À gérer**, **Achat-repro**.

## 1. Rôle

- **Rappel « À semer »** : les variétés à semer au mois choisi, pas encore semées dans leur période de semis. « Semer » remplit la fiche.
- **Saisie des semis** d'une journée dans la table **Semis** via un formulaire, sans passer par la grille Grist. Chaque semis devient une carte « À enregistrer » ; un seul bouton « Enregistrer » écrit tout le lot en **un seul `applyUserActions`** (un Ctrl+Z dans Grist annule tout : semis, sachets vidés, « À reproduire »).
- Usage : PC, mobile, tablette. Pas d'impression.

## 2. Fichiers

| Fichier | Rôle |
|---|---|
| `semis_realises.html` | 4 zones Vue : `#appEntete`, `#appASemer`, `#appFiche`, `#appEtapes` |
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
| `Millesimes` | `NomVariete`, `Millesime`, `Origine`, `Nb_saisons_manuel`, `Plante_mere`, `Annee_plantation`, `Type_plant`, `Qtte_graines`, `Nb_sachets`, `Melange`, `Epuise` et `Germination_affichee` (formules) |
| `Semis` | `NomVariete`, `Millesime`, `Date_s`, `Nb_godets`, `Nb_graines`, `Ou` |
| `_grist_Tables`, `_grist_Tables_column` | choix de `Semis.Ou` (`lireChoixColonnes`) |

- Colonnes de `Varietes` vérifiées au chargement : `COLONNES_VARIETES` + `colonnesAbsentes` → message rouge dans l'en-tête si l'une manque (une colonne renommée ne donne sinon aucune erreur).
- Mois attendus dans les ChoiceList : valeurs de `LISTE_MOIS` (`Jan`, `Fév`… `Jui`, `Juil`, `Aou`… ou noms longs), lues par `numeroMois`.

### Écrites (un seul `applyUserActions`)
- **`Semis`** (`BulkAddRecord`) : `NomVariete`, `Millesime`, `Date_s`, `Nb_godets`, `Nb_graines`, `Ou` (`enListeChoix` ou `null`), `Germes` (= `null` explicite, sinon Grist met 0 et `Info_germination` conclut « NG »).
- **`Millesimes`** (`UpdateRecord`, si « Sachet vidé ») : `Qtte_graines` et `Nb_sachets` à `null` (la formule `Epuise` exige les deux vides).
- **`Varietes`** (`UpdateRecord`, si la case « À reproduire » a changé) : `A_reproduire` (`true` ou `false`), une écriture par variété.
- **Jamais envoyées** : `Type` et `A_produire` (formules `$NomVariete.Type` et `$NomVariete.A_reproduire`), `Positions`, `Nb_etiquettes`, `Graines_exterieures`, `Plantes`, `Oups`, `Date_p`, `Don_p`, `Date_creation`, `Date_modif`.
- Pas de relecture avant écriture : on n'ajoute que des lignes, « Sachet vidé » écrase le stock, « À reproduire » écrit la valeur de la case (décision du 23/11/2026).

### Liens avec les autres outils
- **À gérer** relit les semis créés : `Germes` vide → « À vérifier ».
- **Achat-repro** décoche `Varietes.A_reproduire` à chaque création d'un millésime de la variété ; il écrit aussi `Nb_sachets`.
- **Plan** lit `Semis.A_produire` (formule `$NomVariete.A_reproduire`) : rien à changer de son côté.
- Pleine terre reconnaissable dans `Semis` par `Nb_godets = 1` ; plante mère (À gérer, Achat-repro) par godets = 0 et graines = 0.
- Plus de `BroadcastChannel` : l'ancien widget À semer est intégré (section « À semer »).

## 4. Fonctionnalités

### Section « À semer » (en haut, `#appASemer`)
Une variété s'affiche si :
1. le mois choisi est dans `Semis_sous_abris` ou `Semis_pleine_terre` ;
2. elle n'a pas de semis dans sa **période de semis** (voir 7) ;
3. elle n'a pas de **plante mère au jardin** ;
4. elle a un millésime utilisable (voir 7) ou une plante mère.

Les conditions 2 et 3 font une variété « déjà semée » : masquée par défaut, estompée (`carte--deja-semee`) si « Afficher aussi les déjà semées » est cochée.

- **Titre** : « À semer en novembre (6) » ; avec Sous abri / Pleine terre coché : « (2 sur 6) ». Le nombre ne compte que les variétés non estompées. Bouton **Masquer / Afficher** à droite (replie filtres et cartes ; le titre reste).
- **Filtres** : Mois (mois en cours par défaut), Afficher aussi les déjà semées, Sous abri, Pleine terre (cumulables), Tri.
- **Tri** : nom ; % de germination (meilleur d'abord) ; test (plus longtemps sans semis d'abord, « jamais testé » en tête — voir la question ouverte en 10).
- **Carte** : liseré vert / marron / moitié-moitié (`carte--sousabri`, `--pleineterre`, `--sousabri-pleineterre`, commun) ; nom + type ; pastilles Sous abri / Pleine terre ; pastille orange **« Dans ta liste »** si la variété est déjà dans les cartes à enregistrer ; ligne grise : millésime (ou « Sachet mélangé (plusieurs variétés) », « Millésime sans date », « Pas de graines »), germination en %, ancienneté du test ; période de semis (« Semis Nov → Fév ») ; pastille bleue « Déjà semée » et/ou « 🌱 pieds au jardin ».
- **Semer** : absent sur « Pas de graines ». Remplit la fiche (`choisirVariete`), choisit le mode s'il n'y en a qu'un possible, fait défiler jusqu'à la fiche (`aller('appFiche')`). Le bouton de la variété en cours est orange (`btn--etape`).
- **Liste vide** : « Rien à semer en … ».
- **Mise à jour automatique** après « Enregistrer » : une variété semée disparaît (ou s'estompe).

### Fiche (`#appFiche`)
1. **Bascule Sous abri / Pleine terre** : sous abri = godets + graines par godet ; pleine terre = `Nb_godets` = 1, un seul champ graines, `Où` visible et obligatoire. Changer de mode vide `Où` et l'erreur de saisie.
2. **Recherche de variété** : sans accents ni casse, plusieurs mots, 40 résultats max.
3. **Encart bleu** : type et durée de germination ; « Déjà semé en AAAA (n) » / « Pas encore semé en AAAA » (année de la date saisie) ; plante mère en place ; 5 derniers semis max + « … et n autres » ; alerte rouge si la variété est déjà dans les cartes.
4. **Millésime** : datés (récent d'abord, présélectionné), « or. (originale) » en dernier. Ni épuisés, ni plantes mères. Bouton grisé sans variété ou sans millésime.
5. **Où** : pastilles violettes (✕ pour retirer), liste qui se ferme après un choix et se rouvre au toucher.
6. **Nombres** : champs texte (`inputmode="numeric"`), entiers ≥ 1 seulement (`entierOuNull`), sinon message d'erreur.
7. **Cases** : « Sachet vidé » ; « À reproduire » **recopie `Varietes.A_reproduire` au choix de la variété** : la décocher sur une variété cochée la décoche dans Grist.
8. Plus de menu Type (le type est une formule ; il reste affiché dans l'encart).

Après « Ajouter » : conservés = mode, date, godets, graines ; vidés = variété, millésime, Où, cases ; curseur dans Variété.

### Cartes « À enregistrer » (`#appEtapes`)
Liseré orange, pastille de mode, détail (millésime, date, quantités, lieux, « sachet vidé », « à reproduire » / « ne plus reproduire » si la case a changé), ✕ pour retirer. Chaque carte garde une copie du millésime (`b.millesime`) pour son affichage. **Perdues au rechargement** (voulu, plus de `sessionStorage`).

### Enregistrer
Boutons « Ajouter » et « Enregistrer » grisés pendant l'écriture ; cartes conservées en cas d'échec ; puis rechargement de `Varietes`, `Millesimes`, `Semis`, mise à jour de la fiche (`rafraichirFiche`) et de la section À semer (`afficherASemer`).

### Messages
- Succès dans l'en-tête, 4 s.
- Erreurs de saisie (`erreurFiche`, sous la fiche) et d'enregistrement (`erreur`, en-tête) : affichées jusqu'au prochain clic (`effacerAuClic`, phase de capture).
- Erreurs de chargement et colonnes manquantes (`message`) : dans l'en-tête, jusqu'au prochain chargement.

## 5. Choix techniques

- **4 zones Vue**, toutes sur le même `etat` : `#appEntete` (titre, statut, messages), `#appASemer` (section À semer), `#appFiche` (formulaire, erreur de saisie, Ajouter), `#appEtapes` (cartes, Enregistrer).
- **État** : un seul `etat` ; la section À semer a son sous-objet `etat.aSemer` (`lignes`, `mois`, `afficherDejaSemees`, `tri`, `nbTotal`, `nbRetenues`, `filtreActif`, `filtreSousAbri`, `filtrePleineTerre`, `ouvert`). Liste à enregistrer : `etat.aEnregistrer`.
- **Noms** : `ajouterALaListe`, `retirerDeLaListe`, `nomDeCarte`, `prochainIdCarte`, `nombreAEnregistrer` (anciens noms en « étape intermédiaire » supprimés).
- **Données** : `recordsParId.varietes / millesimes / semis` (Map, non suivies par Vue), chargées une seule fois pour la fiche et la section.
- **Le JS calcule, le HTML met en forme** : chaque ligne À semer contient `{ v, mil, sousAbris, pleineTerre, dejaSemee, semisFait, plant, typePlant, fenetre, germination }` ; `categorie(l)` renvoie un code que le HTML transforme en `carte--…`. Carte à enregistrer : `reproduire` vaut `true`, `false` ou `null` (rien à écrire).
- **watch** : `etat.date` → `afficherDerniersSemis` ; filtres de `etat.aSemer` → `afficherASemer`.
- **Bouton Semer** : `btn--etape` **ou** `btn--enregistrer`, jamais les deux (`btn--enregistrer` est après `btn--etape` dans le commun et l'emporterait).
- **Fermeture du menu Millésime** : écouteur `click` sur `document` avec `closest('#menuMillesime')`. Cet `id` doit rester.
- **Libellé du millésime** (« 2024 · Kokopelli · 2 saisons ») : fabriqué par `libelleMillesime(m)` pour le bouton, la liste et la carte (un seul endroit à modifier). Fonction du JS et non `<template>` partagé, car la carte est dans une autre zone Vue (même principe que `libelle(v)` du commun).

## 6. CSS local (`semis_realises.css`)

| Classe | Rôle |
|---|---|
| `.fiche` | Formulaire en colonne, `gap: 12px` |
| `.fiche__label` | Taille des libellés (`groupe` du commun ne la règle pas) |
| `.bascule`, `.bascule__btn` (+ `--sousabri`, `--pleineterre`, `--sousabri-actif`, `--pleineterre-actif`) | Bascule Sous abri / Pleine terre |
| `.filtres`, `.filtres__groupe` | Filtres de la section À semer (complètent `.ligne`) |
| `.champ--filtre` | Menu réduit à son contenu (`width: auto` ; `champ--compact` du commun garde `width: 100%`) |
| `.carte--deja-semee` | Carte estompée (opacité 0.6) |

## 7. Règles métier

- « or. » = semence originale : proposée, en dernier.
- Millésimes sans date et hors « or. » : ignorés dans la fiche. Épuisés et plantes mères : non proposés.
- Sachet vidé : vider `Qtte_graines` **et** `Nb_sachets`.
- `Melange` = sachet qui mélange **plusieurs variétés** (ancien code « Mél » de la colonne `Sachets`).
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
- Ancien JS en cache : Ctrl+F5.

## 9. Limites connues

- Nouveaux choix `Où` vus au rechargement du widget.
- Formulaire en cours et cartes non enregistrées perdus au rechargement (voulu).
- Pas d'écoute des changements faits ailleurs dans Grist (hors rechargement après enregistrement).
- Section À semer : Sous abri / Pleine terre regroupés dans le calcul « déjà semée » ; le mois choisi regarde l'année en cours.
- Plante mère sans graines : variété masquée de la liste normale.
- Texte de la pastille « au jardin » = valeur brute de `Type_plant`.
- Contrastes non traités (texte clair sur `--sousabri-moyen` / `--pleineterre-moyen`).
- Non testé sur tablette réelle.

## 10. Reste à faire

- [ ] **Mise en prod** (dans la foulée, en même temps qu'Achat-repro) :
  - [x] `Semis.A_produire` : « effacer et transformer en formule » → `$NomVariete.A_reproduire` (vérifier avant que les cases cochées entre-temps dans la version en ligne sont reportées dans `Varietes.A_reproduire`).
  - [x] `Varietes.En_production` : formule `$A_reproduire`, ou suppression si rien ne la lit (vue du code de Grist).
  - [x] Formule `Info_germination` : première ligne `if rec.Jours_ecoules == "": return ""` (sinon un semis du jour, 0 jour écoulé, donne une case vide au lieu de « En attente »).
  - [ ] `Graines_exterieures` : vérifier qu'aucune formule ni vue ne la lit, puis supprimer la colonne.
  - [ ] `Varietes.A_semer_bientot` : même calcul que la section À semer ; supprimer si aucune vue ne l'utilise.
  - [x] Retirer le widget À semer de la page Grist, puis le dossier `a_semer` du dépôt et du projet (avec `a_semer_notes.md`).
- [x] Tests tablette (zones tactiles, défilement des listes, clavier numérique, section repliée).
- [x] **Tri « Test » : à réfléchir.** Il trie sur `Varietes.Annees_sans_test` (années depuis le dernier semis **de la variété**), pas sur le sachet affiché : un sachet neuf d'une variété semée l'an dernier affiche « testé il y a 1 an ». Sans semis, la formule prend `Annee_germination_ref` d'un millésime pris au hasard (`lookupOne`). Forumle mise à jour. [Option : lire `Millesimes.Annees_sans_test` du millésime affiché.]
- [ ] **Sachets de mélange de variétés** (chantier Grist, hors de cet outil). **Décision du 25/11/2026** : un mélange devient **une variété à part entière** (ex. « Tournesol - Mélange ») qui porte le sachet ; les variétés du mélange restent dans `Varietes` et reçoivent leurs millésimes de récolte quand elles sont reconnues. Rien à changer dans cet outil. Reste à faire dans Grist : regrouper les lignes existantes (une par variété pour un seul sachet) sur la variété mélange, sans oublier les `Semis` qui pointent vers elles ;
- [ ] décider du sort de la case `Millesimes.Melange` (redondante avec le nom de la variété : la retirer de cet outil, d'Achat-repro et du mémo, puis supprimer la colonne).
- [ ] Discussion du commun : `.groupe` a un `margin-bottom: 10px` (contraire à « pas d'espacement externe ») qui s'ajoute au `gap` de `.fiche`.

## 11. Checklist de test

1. Démarrage : « Chargement… » puis « ✓ À jour », date du jour, section À semer du mois en cours, Millésime grisé, aucune erreur Vue.
2. Section : filtres, « (x sur n) », 3 tris, Masquer / Afficher, « Rien à semer en … » sur un mois vide, pas de Semer sur « Pas de graines ».
3. Semer : défilement jusqu'à la fiche, fiche remplie, mode choisi si un seul possible, case « À reproduire » = état de la variété, bouton orange.
4. Recherche, choix : encart bleu, millésime présélectionné (ni épuisé ni plante mère).
5. Pleine terre : `Où` apparaît, godets disparaît ; sans `Où` : erreur. Nombres : `abc`, `2,5`, `0`, `-1`, vide refusés.
6. Erreur de saisie affichée jusqu'au prochain clic ; un second « Ajouter » fautif la réaffiche.
7. Ajouter : carte, « Dans ta liste » dans la section, statut « Non sauvegardé (n) » ; ✕ retire ; F5 : cartes perdues.
8. Enregistrer : succès 4 s ; dans Grist `Millesime`, `Date_s` (pas décalée), `Ou`, `Germes` vide, stock vidé si « Sachet vidé », `Varietes.A_reproduire` changé seulement si la case a changé ; la variété quitte la section ; un Ctrl+Z annule tout.
9. Colonne `A_reproduire` renommée : message « Colonnes introuvables dans Varietes » dans l'en-tête.

## 12. Journal

- 23/11/2026 : migration Vue et conventions (Semis réalisés et À semer, voir les anciennes notes).
- 25/11/2026 :
  - nettoyage de l'audit : retrait de `sessionStorage` et du menu Type, renommages (`aEnregistrer`, `ajouterALaListe`…), `.fiche__groupe` supprimée ;
  - « À reproduire » écrit dans `Varietes.A_reproduire` (case préremplie, écrite si changée) ; `Semis.A_produire` n'est plus écrit ;
  - fusion d'À semer : section en haut, repliable, « Semer » remplit la fiche, plus de `BroadcastChannel` ni de `varietePendante`, mise à jour automatique après Enregistrer, `fenetreDeSemis` par `dateEnSecondes`, Semer masqué sans graines, message de liste vide, pastille « Dans ta liste » ;
  - erreurs de saisie effacées au clic ; erreurs de chargement et d'enregistrement dans l'en-tête (`entete__message`) ;
  - vérification des colonnes de `Varietes` (`COLONNES_VARIETES`) ;
  - libellé du millésime regroupé dans `libelleMillesime` (au lieu de 3 copies dans le HTML) ;
  - décision sur les mélanges de variétés : une variété « … - Mélange » (chantier Grist, voir 10).