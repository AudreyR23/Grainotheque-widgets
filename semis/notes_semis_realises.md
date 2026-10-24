# Granothèque Grist : widget « Semis réalisés »

> Dernière mise à jour : 24/10/2026
> Statut : **dev validé** (étapes 1 à 8, lecture des choix depuis Grist, correctif défilement mobile, bascule godets / pleine terre, plante mère, sachet vidé). **Prod et tests tablette en cours.**

## 1. Rôle

Saisir rapidement les semis d'une journée dans la table **Semis** à partir d'un formulaire, sans passer par la grille Grist.

- Usage : PC, mobile et tablette, pas d'impression.
- Un seul « Annuler » (Ctrl+Z) dans Grist annule tout l'enregistrement d'un lot (semis + mise à jour des stocks).

## 2. Fichiers et installation

| Élément | Dev | Prod |
|---|---|---|
| HTML | `semis_realises.html` (dossier `semis/` du dépôt) | à créer sans le suffixe dev |
| JS | script du widget (`../script/...`) | idem |
| CSS | feuille de styles (`../styles/...`) | idem |

- Dans Grist : widget **Personnalisé**, accès **« Accès complet au document »** (`requiredAccess: 'full'`).
- Le widget peut être lié à la table Semis ou non : il lit tout via `grist.docApi`.
- Dev servi en local (Live Server, port 5500) ; **Live Server ne recharge qu'à l'enregistrement du fichier**.
- Prod : retirer le badge `DEV`, changer le `<title>`, pointer vers les fichiers prod, créer un nouveau widget avec l'URL prod.

## 3. Données

### Lues
| Table | Colonnes utilisées |
|---|---|
| `Varietes` | `Nom`, `Variete` (formules), `Type`, `Duree_germ` |
| `Millesimes` | `NomVariete` (réf.), `Millesime` (date), `Origine` (ChoiceList), `Nb_saisons_manuel`, `Plante_mere`, `Annee_plantation` |
| `Semis` | `NomVariete`, `Millesime`, `Date_s`, `Nb_godets`, `Nb_graines`, `Ou` (encart « déjà semé ») |
| `_grist_Tables`, `_grist_Tables_column` | tables système : choix des colonnes `Semis.Type` et `Semis.Ou` |

### Écrites
**Table `Semis`** (via `BulkAddRecord`) : `NomVariete`, `Millesime`, `Date_s`, `Nb_godets`, `Nb_graines`, `Type`, `Ou`.

**Table `Millesimes`** (via `UpdateRecord`, uniquement si « Sachet vidé » est coché) : `Qtte_graines` = vide, `Sachets` = vide. Même `applyUserActions` que les semis : un seul Ctrl+Z.

**Jamais envoyées** : `Positions`, `A_produire`, `Nb_etiquettes`, `Graines_exterieures`, `Germes`, `Plantes`, `Oups`, `Date_p`, `Don_p`, `Date_creation`, `Date_modif` (les `_default` Grist se remplissent seuls, vérifié).

## 4. Fonctionnalités

1. **Bascule Godets / Pleine terre** (deux gros boutons) :
   - *Godets* : champs « Nb de godets » + « Graines par godet », `Où` masqué et non envoyé ;
   - *Pleine terre* : `Nb_godets` = 1 automatique, un seul champ « Nb de graines », `Où` **visible et obligatoire**.
   - Le mode est conservé d'un ajout à l'autre ; changer de mode vide les `Où` choisis.
2. **Recherche de variété** : filtre en tapant sur `Nom` + `Variete`, insensible aux accents et à la casse, plusieurs mots dans n'importe quel ordre, 40 résultats maximum.
3. **Encart d'info variété** : Type et durée de germination.
4. **Millésime filtré** sur la variété choisie : présélection du plus récent ; ordre : datés (récent d'abord) puis « or. (originale) » en dernier ; libellé : année · origine · nb de saisons.
5. **Encart « déjà semé »** : semis de la variété pour **l'année de la date saisie** (5 maximum, du plus récent au plus ancien) ; ligne « 🌱 Plante mère en place (plantée en …) » si un millésime de la variété a `Plante_mere` ; alerte orange si la variété est déjà dans la liste à enregistrer.
6. **Fiche** : date (aujourd'hui par défaut), godets / graines, Type (menu), Où (multi-sélection avec recherche et pastilles, pleine terre uniquement), case **« Sachet vidé »**.
7. **Validation** : variété, millésime, date, godets > 0 (mode godets) et graines > 0 obligatoires ; `Où` obligatoire en pleine terre.
8. **Liste de brouillons** : « Ajouter à la liste » ; ✕ pour retirer ; affichage « pleine terre · n graines » ou « n godets × m graines », et « sachet vidé » le cas échéant ; statut « ● Non sauvegardé (n) » / « ✓ À jour ».
9. **Enregistrer tout** : un seul `applyUserActions` (`BulkAddRecord` + `UpdateRecord` éventuels), bouton désactivé pendant l'écriture, brouillons conservés en cas d'échec, rechargement de `Semis` après succès.
10. **Avertissement** `beforeunload` s'il reste des brouillons.
11. **Choix `Type` et `Ou` lus depuis Grist** (liste en dur en secours).

## 5. Comportements de saisie

- Après « Ajouter » :
  - **conservés** : mode, date, godets, graines, Type ;
  - **vidés** : variété, millésime, encarts, `Où`, case « Sachet vidé » (décochée) ;
  - le focus revient sur la recherche de variété.
- Au choix d'une variété : le Type se cale sur `Varietes.Type` s'il existe dans les choix de `Semis.Type`, sinon `Arom.Méd 🌿` (ou le premier choix).
- Changer la date met à jour l'encart « déjà semé ».
- La pleine terre se reconnaît dans Semis par `Nb_godets = 1` (aucune colonne dédiée).

## 6. Règles métier

- **« or. »** (`Nb_saisons_manuel === 'or.'`) = semence originale : **proposée**, placée en dernier.
- Millésimes **sans date et hors « or. »** (62 lignes, toutes vides) : **ignorés**. À nettoyer dans Grist si souhaité.
- Variété sans millésime utilisable : menu grisé « Aucun millésime disponible ».
- Dans `Semis.Millesime`, on écrit l'**id de la ligne de `Millesimes`**, pas l'année.
- **Sachet vidé** : il faut vider `Qtte_graines` **et** `Sachets`, car la formule `Epuise` exige les deux vides ou à 0. Un millésime épuisé **reste proposé** dans la liste (pas de filtre sur le stock).

## 7. Choix techniques

- **Conventions** : variables en français, état global en haut du fichier, `modifie` + `majStatut()`, `recordsParId` (Map).
- **Lecture** : `grist.docApi.fetchTable(...)` (~550 variétés / ~960 millésimes : aucun souci de performance), transformée par `tableEnLignes()`.
- **Écriture** : `grist.docApi.applyUserActions([...])`.
- **Listes déroulantes maison** (`ul`/`li`) pour la recherche.
- **Sélection dans les listes qui défilent : `click`, pas `pointerdown`.** Sur tactile, `pointerdown` se déclenche dès que le doigt se pose et sélectionnait au lieu de laisser défiler. Pour que le `blur` du champ ne ferme pas la liste avant le `click`, on ajoute `mousedown` + `preventDefault()` sur la liste. CSS : `touch-action: pan-y; overscroll-behavior: contain` sur `.liste-choix`.
- **Choix Type / Où** : lecture de `widgetOptions.choices` dans `_grist_Tables_column`. `TYPES` et `LIEUX` sont des `let` (réassignés).

### Formats Grist à retenir

| Type | Lecture (`fetchTable`) | Écriture |
|---|---|---|
| Reference | id de ligne (nombre) | id de ligne |
| Date | secondes depuis 1970 (UTC) | `Date.UTC(a, m-1, j) / 1000` (**minuit UTC**, sinon décalage d'un jour) |
| ChoiceList | `['L', 'a', 'b']` | `['L', 'a', 'b']`, ou `null` si vide |

## 8. Référence des fonctions

Ordre du fichier JS. `async` = renvoie une promesse.

### Utilitaires
| Fonction | Rôle |
|---|---|
| `tableEnLignes(tableau)` | Résultat de `fetchTable` (`{colonne: [valeurs]}`) → lignes `[{id, ...}]` |
| `listeChoix(valeur)` | ChoiceList `['L','a','b']` → `['a','b']` |
| `anneeDepuisDate(secondes)` | Date Grist → année, ou `null` |
| `normaliser(texte)` | Minuscules, sans accents, espaces simplifiés |
| `dateDuJour()` | Date du jour `YYYY-MM-DD` |
| `dateEnSecondes(iso)` | `YYYY-MM-DD` → secondes à minuit UTC |

### Statut
| Fonction | Rôle |
|---|---|
| `majStatut()` | Calcule `modifie` (il reste des brouillons) et met à jour le statut |

### Chargement
| Fonction | Rôle |
|---|---|
| `chargerDonnees()` `async` | Lit `Varietes` et `Millesimes` |
| `chargerSemis()` `async` | Lit `Semis` (au démarrage et après chaque enregistrement) |
| `chargerChoix()` `async` | Lit les choix de `Semis.Type` / `Semis.Ou` ; repli sur la liste en dur |
| `afficherControle()` | Comptes de contrôle et `console.log` (à retirer avant prod stable) |

### Sélecteur de variété
| Fonction | Rôle |
|---|---|
| `libelleVariete(v)` | « Nom — Variété » |
| `afficherResultats()` | Filtre les variétés (tous les mots, 40 max) |
| `choisirVariete(id)` | Fixe `varieteChoisieId`, encart, puis `remplirMillesimes`, `appliquerTypeVariete`, `afficherDerniersSemis` |
| `initialiserSelecteurVariete()` | Événements `input`, `focus`, `mousedown` (bloqué), `click` sur la liste |

### Sélecteur de millésime
| Fonction | Rôle |
|---|---|
| `millesimesDeVariete(varieteId)` | Millésimes retenus, triés |
| `libelleMillesime(m)` | « année · origine · n saison(s) » ou « or. (originale) » |
| `remplirMillesimes(varieteId)` | Remplit le menu, présélectionne le premier, met à jour `millesimeChoisiId` |
| `initialiserSelecteurMillesime()` | Événement `change` |

### Reste de la fiche
| Fonction | Rôle |
|---|---|
| `remplirTypes()` | Menu Type depuis `TYPES` |
| `appliquerTypeVariete(varieteId)` | Cale le Type sur celui de la variété |
| `afficherPastilles()` | Lieux choisis en pastilles |
| `afficherResultatsOu()` | Filtre `LIEUX` (hors déjà choisis) |
| `initialiserOu()` | `input`, `focus`, `blur` du champ ; `mousedown` bloqué + `click` sur la liste ; `click` sur les pastilles |
| `appliquerMode(mode)` | Bascule godets / pleine terre : affichage des blocs, libellé des graines, vide les `Où` |
| `initialiserBascule()` | Événement `click` sur `#basculeMode`, mode initial « godets » |
| `initialiserFiche()` | Date du jour, menu Type, `initialiserOu()`, écouteur de la date, `initialiserBascule()` |

### Brouillons
| Fonction | Rôle |
|---|---|
| `afficherErreur(texte)` | Affiche ou masque `#erreurFiche` |
| `lireFiche()` | Renvoie un brouillon (`mode`, `godets` = 1 en pleine terre, `ou` vide en godets, `sachetVide`) |
| `validerFiche(f)` | Message d'erreur ou `''` |
| `ajouterBrouillon()` | Valide, ajoute, réinitialise partiellement la fiche (dont la case sachet vidé) |
| `afficherBrouillons()` | Redessine la liste, le compteur et le bouton « Enregistrer tout » |
| `initialiserBrouillons()` | « Ajouter », « Enregistrer tout », ✕ (`click`) |

### Enregistrement
| Fonction | Rôle |
|---|---|
| `afficherSucces(texte)` / `afficherErreurEnregistrement(texte)` | Messages |
| `enregistrerTout()` `async` | `BulkAddRecord` sur `Semis` + `UpdateRecord` sur `Millesimes` (sachets vidés, dédoublonnés par `Set`), un seul `applyUserActions` ; verrou `enregistrementEnCours` |

### Derniers semis
| Fonction | Rôle |
|---|---|
| `dateAffichee(secondes)` | Date Grist → `jj/mm/aaaa` (UTC) |
| `afficherDerniersSemis()` | Encart : plante mère, semis de l'année (5 max), alerte brouillon |

### Hors fonctions
- `beforeunload` : avertit s'il reste des brouillons.
- `grist.ready({ requiredAccess: 'full' })`.
- Démarrage : `chargerDonnees → chargerSemis → chargerChoix → afficherControle + initialiserSelecteurVariete + initialiserSelecteurMillesime + initialiserFiche + initialiserBrouillons + majStatut`, `.catch` affichant l'erreur dans `#message`.

### Variables globales
| Variable | Contenu |
|---|---|
| `modifie` | `true` s'il reste des brouillons |
| `varieteChoisieId`, `millesimeChoisiId` | Sélections courantes (id) ou `null` |
| `ouChoisis` | Lieux sélectionnés |
| `brouillons`, `prochainIdBrouillon` | Lignes en attente, compteur |
| `enregistrementEnCours` | Verrou anti double enregistrement |
| `modeSemis` | `'godets'` ou `'pleine_terre'` |
| `sourceChoix` | Origine des listes Type / Où |
| `TYPES`, `LIEUX` | Choix (`let`) |
| `TYPE_PAR_DEFAUT`, `MAX_RESULTATS` | Constantes |
| `recordsParId` | `{varietes, millesimes, semis}` (trois `Map`) |

### Identifiants HTML utilisés par le JS
`statut`, `message`, `basculeMode`, `rechercheVariete`, `listeVarietes`, `infoVariete`, `derniersSemis`, `selectMillesime`, `dateSemis`, `blocGodets`, `nbGodets`, `labelGraines`, `nbGraines`, `selectType`, `blocOu`, `pastillesOu`, `rechercheOu`, `listeOu`, `caseSachetVide`, `erreurFiche`, `btnAjouter`, `messageSucces`, `titreBrouillons`, `listeBrouillons`, `erreurEnregistrement`, `btnEnregistrer`.

## 9. Reste à faire

### Prioritaire
- [ ] **Poursuivre les tests tablette** : clavier et liste de la recherche de variété, taille des pastilles et boutons, clavier numérique, sélecteur de date, hauteur de la fiche (bouton fixe en bas ?). Le défilement de la liste `Où` sur mobile est validé.

### Nettoyage avant prod stable
- [ ] Retirer `afficherControle()`, le `<p id="message">` et les `console.log` de contrôle.
- [ ] Vérifier qu'aucun autre outil n'utilise `Graines_exterieures`, puis supprimer la colonne si inutile.

### Améliorations possibles
- [ ] Masquer ou griser les millésimes épuisés dans la liste (aujourd'hui toujours proposés).
- [ ] Formule `Info_germination` : `if not rec.Jours_ecoules` masque le cas `0` ; remplacer par `if rec.Jours_ecoules == "": return ""` pour afficher « En attente » dès le jour J (vérifier d'abord les autres outils).
- [ ] `Type` : le widget lit `Semis.Type` ; si `Varietes.Type` contient une valeur absente, repli sur le type par défaut.
- [ ] Trier les lieux par ordre alphabétique (`.sort((a, b) => a.localeCompare(b, 'fr'))` sur `LIEUX`).
- [ ] Nettoyer les 62 lignes vides de `Millesimes`.

## 10. Limites connues

- Les nouveaux choix Type / Où ne sont vus qu'au **rechargement** du widget.
- Choix réglés **par vue** (paramètres séparés) : absents des métadonnées, repli sur la liste en dur (à garder à jour en secours).
- `beforeunload` ne se déclenche pas forcément quand on change de page dans Grist : se fier au statut rouge.
- Pas de mise à jour en direct si les données changent ailleurs ; `Semis` est rechargée après chaque enregistrement, pas `Millesimes` (un sachet vidé reste proposé jusqu'au rechargement).
- Pleine terre non distinguée par une colonne dédiée : `Nb_godets = 1` peut aussi être un vrai semis d'un godet.

## 11. Rappels de dépannage

- **Page vide, seule la mise en forme s'affiche** : erreur de syntaxe JS → console (F12), la ligne rouge donne le numéro de ligne (virgule manquante, caractère parasite).
- **`getElementById(...) is null`** : élément absent du HTML, ou fichier **non enregistré**.
- **`invalid assignment to const`** : variable en `const` réassignée (`TYPES`, `LIEUX` doivent être `let`).
- **Date décalée d'un jour dans Grist** : toujours écrire minuit **UTC**.
- **Liste qui sélectionne au lieu de défiler (mobile)** : utiliser `click`, pas `pointerdown`.
- **Rechargement forcé** : Ctrl+Maj+R.
- **Grist refuse `null` sur `Qtte_graines`** : remplacer par `0` (la formule `Epuise` accepte les deux).