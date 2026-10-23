# Granothèque Grist : widget « Semis réalisés »

> Dernière mise à jour : 23/10/2026
> Statut : **dev validé** (étapes 1 à 8 + lecture des choix depuis Grist). **Prod et tests tablette à faire.**

## 1. Rôle

Saisir rapidement les semis d'une journée dans la table **Semis** à partir d'un formulaire, sans passer par la grille Grist.

- Usage : PC et tablette, pas d'impression.
- Un seul « Annuler » (Ctrl+Z) dans Grist annule tout l'enregistrement d'un lot.

## 2. Fichiers et installation

| Élément | Dev | Prod |
|---|---|---|
| HTML | `semis_realises.html` (dossier `semis/` du dépôt) | à créer sans le suffixe dev |
| JS | script du widget (`../script/...`) | idem |
| CSS | feuille de styles (`../styles/...`) | idem |

- Dans Grist : widget **Personnalisé**, accès **« Accès complet au document »** (`requiredAccess: 'full'`).
- Le widget peut être lié à la table Semis ou non : il lit tout via `grist.docApi`, le lien n'a pas d'incidence.
- Dev servi en local (Live Server, port 5500) ; **Live Server ne recharge qu'à l'enregistrement du fichier**.
- Prod : retirer le badge `DEV`, changer le `<title>`, pointer vers les fichiers prod, créer un nouveau widget avec l'URL prod.

## 3. Données

### Lues
| Table | Colonnes utilisées |
|---|---|
| `Varietes` | `Nom`, `Variete` (formules), `Type`, `Duree_germ` |
| `Millesimes` | `NomVariete` (réf.), `Millesime` (date), `Origine` (ChoiceList), `Nb_saisons_manuel` |
| `Semis` | `NomVariete`, `Millesime`, `Date_s`, `Nb_godets`, `Nb_graines`, `Ou` (pour l'encart « déjà semé ») |
| `_grist_Tables`, `_grist_Tables_column` | tables système : choix des colonnes `Semis.Type` et `Semis.Ou` |

### Écrites (table `Semis`, via `BulkAddRecord`)
`NomVariete`, `Millesime`, `Date_s`, `Nb_godets`, `Nb_graines`, `Type`, `Ou`.

**Jamais envoyées** (laissées vides ou gérées par Grist) : `Positions`, `A_produire`, `Nb_etiquettes`, `Graines_exterieures`, `Germes`, `Plantes`, `Oups`, `Date_p`, `Don_p`, `Date_creation`, `Date_modif` (les `_default` Grist se remplissent seuls, vérifié).

## 4. Fonctionnalités

1. **Recherche de variété** : filtre en tapant sur `Nom` + `Variete`, insensible aux accents et à la casse, plusieurs mots dans n'importe quel ordre, 40 résultats maximum affichés.
2. **Encart d'info variété** : Type et durée de germination.
3. **Millésime filtré** sur la variété choisie :
   - présélection du plus récent ;
   - ordre : millésimes datés (récent d'abord), puis « or. (originale) » en dernier ;
   - libellé : année · origine · nb de saisons.
4. **Encart « déjà semé »** : semis de la variété pour **l'année de la date saisie** (5 maximum, du plus récent au plus ancien), plus alerte orange si la variété est déjà dans la liste à enregistrer.
5. **Fiche** : date (aujourd'hui par défaut), nb de godets, nb de graines, Type (menu), Où (multi-sélection avec recherche et pastilles).
6. **Validation** : variété, millésime, date, godets > 0 et graines > 0 obligatoires. `Ou` facultatif.
7. **Liste de brouillons** : « Ajouter à la liste » ; suppression d'une ligne avec ✕ ; statut « ● Non sauvegardé (n) » / « ✓ À jour ».
8. **Enregistrer tout** : un seul `BulkAddRecord`, bouton désactivé pendant l'écriture, brouillons conservés en cas d'échec, rechargement de `Semis` après succès.
9. **Avertissement** `beforeunload` s'il reste des brouillons (protège contre F5 et fermeture d'onglet).
10. **Choix `Type` et `Ou` lus depuis Grist** (liste en dur en secours).

## 5. Comportements de saisie

- Après « Ajouter » :
  - **conservés** : date, godets, graines, Type ;
  - **vidés** : variété, millésime, encarts, `Ou` ;
  - le focus revient sur la recherche de variété.
- Au choix d'une variété : le Type se cale sur celui de la variété (`Varietes.Type`) s'il existe dans les choix de `Semis.Type`, sinon `Arom.Méd 🌿` (ou le premier choix).
- Changer la date met à jour l'encart « déjà semé » (année de la date saisie).

## 6. Règles métier

- **« or. »** (`Nb_saisons_manuel === 'or.'`) = semence originale, jamais produite au potager : **proposée**, placée en dernier.
- Millésimes **sans date et hors « or. »** (62 lignes, toutes vides : pas de graines, pas de sachets) : **ignorés**. À nettoyer dans Grist si souhaité, sans effet sur l'outil.
- Variété sans aucun millésime utilisable : menu grisé « Aucun millésime disponible ».
- Dans `Semis.Millesime`, on écrit l'**id de la ligne de `Millesimes`**, pas l'année.

## 7. Choix techniques

- **Conventions** : variables en français, état global en haut du fichier, `modifie` + `majStatut()`, `recordsParId` (Map) pour retrouver les lignes, événements `pointerdown` (PC + tablette) pour les listes.
- **Lecture** : `grist.docApi.fetchTable(...)` (toute la table, ~550 variétés / ~960 millésimes : aucun souci de performance), transformée par `tableEnLignes()`.
- **Écriture** : `grist.docApi.applyUserActions([['BulkAddRecord', 'Semis', ids, colonnes]])`.
- **Listes déroulantes maison** (`ul`/`li`) plutôt que `select`/`datalist` pour la recherche, avec `pointerdown` + `preventDefault()` pour éviter que le `blur` du champ ferme la liste avant la sélection.
- **Choix Type / Où** : lecture de `widgetOptions.choices` dans `_grist_Tables_column` (colonnes de `Semis`). Fonctionne grâce à l'accès complet.

### Formats Grist à retenir (pièges rencontrés)

| Type | Lecture (`fetchTable`) | Écriture |
|---|---|---|
| Reference | id de ligne (nombre) | id de ligne |
| Date | secondes depuis 1970 (UTC) | `Date.UTC(a, m-1, j) / 1000` (**minuit UTC**, sinon décalage d'un jour) |
| ChoiceList | `['L', 'a', 'b']` | `['L', 'a', 'b']`, ou `null` si vide |

## 8. Structure du JS (ordre du fichier)

1. État global et constantes (`TYPES`, `LIEUX`, `recordsParId`, `sourceChoix`)
2. Utilitaires (`tableEnLignes`, `listeChoix`, `anneeDepuisDate`, `normaliser`, `dateDuJour`, `dateEnSecondes`)
3. `majStatut`
4. Chargement (`chargerDonnees`, `afficherControle`)
5. Sélecteur de variété
6. Sélecteur de millésime
7. Reste de la fiche (Type, Où, `initialiserFiche`)
8. Brouillons (`ajouterBrouillon`, `afficherBrouillons`, …)
9. Enregistrement (`enregistrerTout`)
10. Derniers semis (`chargerSemis`, `afficherDerniersSemis`)
11. Choix Type / Où (`chargerChoix`)
12. `beforeunload`
13. Initialisation : `grist.ready` puis `chargerDonnees → chargerSemis → chargerChoix → initialisations`

## 8 bis. Référence des fonctions

Les fonctions suivent l'ordre du fichier JS. `async` = renvoie une promesse.

### Utilitaires
| Fonction | Rôle |
|---|---|
| `tableEnLignes(tableau)` | Transforme le résultat de `fetchTable` (`{colonne: [valeurs]}`) en tableau de lignes `[{id, ...}]` |
| `listeChoix(valeur)` | ChoiceList Grist `['L','a','b']` → `['a','b']` (vide si invalide) |
| `anneeDepuisDate(secondes)` | Date Grist (secondes UTC) → année, ou `null` |
| `normaliser(texte)` | Minuscules, sans accents, espaces simplifiés (pour la recherche) |
| `dateDuJour()` | Date du jour au format `YYYY-MM-DD` (pour `<input type="date">`) |
| `dateEnSecondes(iso)` | `YYYY-MM-DD` → secondes à minuit UTC (format d'écriture Grist) |

### Statut
| Fonction | Rôle |
|---|---|
| `majStatut()` | Calcule `modifie` (= il reste des brouillons) et met à jour le texte et la couleur du statut |

### Chargement
| Fonction | Rôle |
|---|---|
| `chargerDonnees()` `async` | Lit `Varietes` et `Millesimes`, remplit `recordsParId.varietes` et `.millesimes` |
| `chargerSemis()` `async` | Lit `Semis`, remplit `recordsParId.semis` (appelée au démarrage et après chaque enregistrement) |
| `chargerChoix()` `async` | Lit les choix de `Semis.Type` et `Semis.Ou` dans les tables système ; met à jour `TYPES`, `LIEUX`, `sourceChoix` ; repli sur la liste en dur en cas d'erreur |
| `afficherControle()` | Affiche les comptes de contrôle et les `console.log` (à retirer avant prod stable) |

### Sélecteur de variété
| Fonction | Rôle |
|---|---|
| `libelleVariete(v)` | « Nom — Variété » (ou « Nom » seul) |
| `afficherResultats()` | Filtre les variétés selon la saisie (tous les mots, 40 max) et remplit `#listeVarietes` |
| `choisirVariete(id)` | Fixe `varieteChoisieId`, affiche l'encart Type/germination, puis appelle `remplirMillesimes`, `appliquerTypeVariete`, `afficherDerniersSemis` |
| `initialiserSelecteurVariete()` | Branche les événements : `input` (annule la sélection), `focus`, `pointerdown` sur la liste |

### Sélecteur de millésime
| Fonction | Rôle |
|---|---|
| `millesimesDeVariete(varieteId)` | Millésimes retenus (datés ou « or. »), triés : récent d'abord, « or. » en dernier |
| `libelleMillesime(m)` | « année · origine · n saison(s) » ou « or. (originale) » |
| `remplirMillesimes(varieteId)` | Remplit le menu, présélectionne le premier, grise le menu si rien (ou si `null`) ; met à jour `millesimeChoisiId` |
| `initialiserSelecteurMillesime()` | Branche l'événement `change` et initialise le menu grisé |

### Reste de la fiche
| Fonction | Rôle |
|---|---|
| `remplirTypes()` | Remplit le menu Type depuis `TYPES`, présélectionne le type par défaut |
| `appliquerTypeVariete(varieteId)` | Cale le Type sur celui de la variété s'il existe dans `TYPES`, sinon type par défaut |
| `afficherPastilles()` | Affiche les lieux choisis (`ouChoisis`) sous forme de pastilles |
| `afficherResultatsOu()` | Filtre `LIEUX` (hors déjà choisis) selon la saisie et remplit `#listeOu` |
| `initialiserOu()` | Branche `input`, `focus`, `blur` du champ, `pointerdown` sur la liste et sur les pastilles |
| `initialiserFiche()` | Date du jour, menu Type, `initialiserOu()`, écouteur `change` de la date |

### Brouillons
| Fonction | Rôle |
|---|---|
| `afficherErreur(texte)` | Affiche ou masque `#erreurFiche` |
| `lireFiche()` | Lit les champs et renvoie un objet brouillon (sans `idBrouillon`) |
| `validerFiche(f)` | Renvoie un message d'erreur, ou `''` si la fiche est valide |
| `ajouterBrouillon()` | Valide, ajoute à `brouillons`, réinitialise partiellement la fiche, remet le focus sur la recherche |
| `afficherBrouillons()` | Redessine la liste, le titre avec compteur et le bouton « Enregistrer tout » |
| `initialiserBrouillons()` | Branche « Ajouter », « Enregistrer tout » et la suppression ✕ (`pointerdown`) |

### Enregistrement
| Fonction | Rôle |
|---|---|
| `afficherSucces(texte)` | Affiche ou masque `#messageSucces` |
| `afficherErreurEnregistrement(texte)` | Affiche ou masque `#erreurEnregistrement` |
| `enregistrerTout()` `async` | `BulkAddRecord` dans `Semis`, vide les brouillons en cas de succès, conserve en cas d'échec, recharge `Semis`, protège contre le double clic (`enregistrementEnCours`) |

### Derniers semis
| Fonction | Rôle |
|---|---|
| `dateAffichee(secondes)` | Date Grist → `jj/mm/aaaa` (fuseau UTC) |
| `afficherDerniersSemis()` | Encart « déjà semé » de l'année de la date saisie (5 max) + alerte si déjà dans les brouillons |

### Hors fonctions (en fin de fichier)
- `window.addEventListener('beforeunload', ...)` : avertit s'il reste des brouillons.
- `grist.ready({ requiredAccess: 'full' })`.
- Chaîne de démarrage : `chargerDonnees → chargerSemis → chargerChoix → afficherControle + initialiserSelecteurVariete + initialiserSelecteurMillesime + initialiserFiche + initialiserBrouillons + majStatut`, avec un `.catch` qui affiche l'erreur dans `#message`.

### Variables globales
| Variable | Contenu |
|---|---|
| `modifie` | `true` s'il reste des brouillons |
| `varieteChoisieId`, `millesimeChoisiId` | Sélections courantes (id de ligne) ou `null` |
| `ouChoisis` | Lieux sélectionnés (tableau de textes) |
| `brouillons`, `prochainIdBrouillon` | Lignes en attente, compteur d'identifiants |
| `enregistrementEnCours` | Verrou anti double enregistrement |
| `sourceChoix` | Texte indiquant l'origine des listes Type / Où |
| `TYPES`, `LIEUX` | Choix (liste en dur au départ, remplacée par la lecture Grist) |
| `TYPE_PAR_DEFAUT`, `MAX_RESULTATS` | Constantes |
| `recordsParId` | `{varietes, millesimes, semis}`, trois `Map` indexées par id de ligne |

### Identifiants HTML utilisés par le JS
`statut`, `message`, `rechercheVariete`, `listeVarietes`, `infoVariete`, `derniersSemis`, `selectMillesime`, `dateSemis`, `nbGodets`, `nbGraines`, `selectType`, `pastillesOu`, `rechercheOu`, `listeOu`, `erreurFiche`, `btnAjouter`, `messageSucces`, `titreBrouillons`, `listeBrouillons`, `erreurEnregistrement`, `btnEnregistrer`.

## 9. Reste à faire

### Prioritaire
- [ ] **Passage en prod** (voir §2).
- [ ] **Tests tablette** (jamais faits) :
  - clavier et liste de résultats de la recherche de variété ;
  - liste `Où` (risque lié au `blur`), taille des pastilles à retirer ;
  - clavier numérique sur godets/graines, sélecteur de date natif ;
  - taille des boutons ✕, « Ajouter », « Enregistrer tout » ;
  - hauteur de la fiche (défilement jusqu'à « Ajouter » ? bouton fixe en bas ?).

### Nettoyage avant prod stable
- [ ] Retirer `afficherControle()`, le `<p id="message">` et les `console.log` de contrôle.
- [ ] Vérifier qu'aucun autre outil n'utilise `Graines_exterieures`, puis supprimer la colonne si inutile.

### Améliorations possibles
- [ ] Formule `Info_germination` : `if not rec.Jours_ecoules` masque le cas `0` (semis du jour). Remplacer par `if rec.Jours_ecoules == "": return ""` pour afficher « En attente » dès le jour J (vérifier d'abord les autres outils et filtres).
- [ ] `Type` : le widget lit `Semis.Type`. Si `Varietes.Type` contient une valeur absente de `Semis.Type`, repli sur le type par défaut.
- [ ] Trier les lieux par ordre alphabétique (`.sort((a, b) => a.localeCompare(b, 'fr'))` sur `LIEUX`) si l'ordre Grist ne convient pas.
- [ ] Nettoyer les 62 lignes vides de `Millesimes`.

## 10. Limites connues

- Les nouveaux choix Type / Où ne sont vus qu'au **rechargement** du widget.
- Si les choix d'une colonne sont réglés **par vue** (paramètres séparés), ils ne sont pas dans les métadonnées : repli sur la liste en dur (à garder à jour dans le JS en secours).
- `beforeunload` ne se déclenche pas forcément quand on change simplement de page dans Grist : se fier au statut rouge « Non sauvegardé ».
- Le widget ne se met pas à jour en direct si les données changent ailleurs (rechargement nécessaire). `Semis` est rechargée après chaque enregistrement.

## 11. Rappels de dépannage

- **Page vide, seule la mise en forme s'affiche** : erreur de syntaxe JS → console (F12), la ligne rouge donne le numéro de ligne.
- **`getElementById(...) is null`** : élément absent du HTML, ou fichier **non enregistré** dans l'éditeur.
- **`invalid assignment to const`** : variable déclarée en `const` mais réassignée (ici `TYPES`, `LIEUX` doivent être `let`).
- **Date décalée d'un jour dans Grist** : problème de fuseau → toujours écrire minuit **UTC**.
- **Rechargement forcé** : Ctrl+Maj+R.