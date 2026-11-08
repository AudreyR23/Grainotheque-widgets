# Granothèque Grist : widget « Semis réalisés »

> Dernière mise à jour : 08/11/2026
> Statut : **dev validé** (fonctionnel + habillage CSS harmonisé). **Prod et tests tablette à faire.**

## 1. Rôle

Saisir rapidement les semis d'une journée dans la table **Semis** via un formulaire, sans passer par la grille Grist.

- Usage : PC, mobile, tablette. Pas d'impression.
- Un seul Ctrl+Z dans Grist annule un lot complet (semis + mises à jour de stock).

## 2. Fichiers

| Fichier | Rôle |
|---|---|
| `semis_realises.html` | page du widget |
| `../script/semis_realises.js` | logique |
| `../styles/gestion_commun.css` | socle partagé entre outils (chargé **en premier**) |
| `../styles/semis_realises.css` | règles propres à Semis (chargé **ensuite**) |

- Grist : widget **Personnalisé**, accès **complet** (`requiredAccess: 'full'`).
- Live Server ne recharge qu'à l'**enregistrement** du fichier. Rechargement forcé : Ctrl+Maj+R.
- Prod : copie des fichiers sans suffixe dev, nouveau widget avec l'URL prod.

## 3. Données

### Lues
| Table | Colonnes |
|---|---|
| `Varietes` | `Nom`, `Variete` (formules), `Type`, `Duree_germ` |
| `Millesimes` | `NomVariete` (réf.), `Millesime` (date), `Origine`, `Nb_saisons_manuel`, `Plante_mere`, `Annee_plantation` |
| `Semis` | `NomVariete`, `Millesime`, `Date_s`, `Nb_godets`, `Nb_graines`, `Ou` |
| `_grist_Tables`, `_grist_Tables_column` | choix de `Semis.Type` et `Semis.Ou` (`widgetOptions.choices`) |

### Écrites
- **`Semis`** (`BulkAddRecord`) : `NomVariete`, `Millesime`, `Date_s`, `Nb_godets`, `Nb_graines`, `Type`, `Ou`, `Germes` (= `null` explicite, sinon Grist met 0 et `Info_germination` conclut « NG »), `A_produire`.
- **`Millesimes`** (`UpdateRecord`, si « Sachet vidé ») : `Qtte_graines` et `Sachets` vidés. Même `applyUserActions` que les semis.
- **Jamais envoyées** : `Positions`, `Nb_etiquettes`, `Graines_exterieures`, `Plantes`, `Oups`, `Date_p`, `Don_p`, `Date_creation`, `Date_modif` (défauts Grist).

## 4. Fonctionnalités

1. **Bascule Sous abri / Pleine terre** : sous abri = godets + graines par godet, `Où` masqué ; pleine terre = `Nb_godets` = 1, un champ graines, `Où` obligatoire. Mode conservé d'un ajout à l'autre ; changer de mode vide `Où`.
2. **Recherche de variété** (sans accents ni casse, plusieurs mots, 40 résultats max).
3. **Encart variété** : Type et durée de germination.
4. **Millésime** filtré : datés (récent d'abord, présélectionné), « or. (originale) » en dernier.
5. **Encart « déjà semé »** (année de la date saisie, 5 max), « 🌱 Plante mère en place », alerte si déjà dans les brouillons.
6. **Fiche** : date, godets, graines, Type, Où (pastilles), cases « Sachet vidé » et « À reproduire ».
7. **Validation** : variété, millésime, date, godets > 0, graines > 0 ; `Où` obligatoire en pleine terre.
8. **Brouillons** : ajout, suppression ✕, statut « ● Non sauvegardé (n) » / « ✓ À jour ».
9. **Enregistrer tout** : un seul `applyUserActions`, boutons désactivés pendant l'écriture, brouillons conservés en cas d'échec, rechargement de `Semis`.
10. **`beforeunload`** si brouillons non enregistrés.
11. **Réception d'une variété** depuis l'outil « À semer » via `BroadcastChannel('granotheque-semer')` (mise en attente si les données ne sont pas chargées).
12. **Selects habillés** : Millésime et Type sont des `<select>` masqués (`hidden`) + bouton `.champ.champ-select` + liste `.liste-choix` (`habillerSelect` / `rafraichirSelect`).

Après « Ajouter » : conservés = mode, date, godets, graines, type ; vidés = variété, millésime, encarts, Où, cases ; focus sur la recherche.

## 5. Règles métier

- « or. » = semence originale : proposée, en dernier.
- Millésimes sans date et hors « or. » (62 lignes vides) : ignorés.
- `Semis.Millesime` reçoit l'**id** de la ligne de `Millesimes`, pas l'année.
- Sachet vidé : vider `Qtte_graines` **et** `Sachets` (la formule `Epuise` exige les deux vides ou à 0).
- Pleine terre reconnaissable dans Semis par `Nb_godets = 1` (pas de colonne dédiée).

## 6. Formats Grist

| Type | Lecture | Écriture |
|---|---|---|
| Reference | id de ligne | id de ligne |
| Date | secondes depuis 1970 (UTC) | `Date.UTC(a, m-1, j) / 1000` (minuit UTC, sinon décalage d'un jour) |
| ChoiceList | `['L','a','b']` | `['L','a','b']` ou `null` |
| Numeric vide | `null` | `null` explicite (sinon 0) |

## 7. Architecture CSS (à reproduire dans les autres outils)

### Principe
- **Commun** : ce que deux outils ou plus partagent, **à l'identique**. Si deux versions « proches » existent, en choisir une d'abord.
- **Outil** : règles qui citent des id ou classes propres à l'outil.
- Chargement : commun d'abord, outil ensuite.
- Une variable CSS n'est qu'une valeur : la mettre dans le commun n'impose rien à un outil qui ne la lit pas.
- Les boutons n'« héritent » pas : on cumule les classes dans le HTML (`btn` + variante + taille).

### Palette (`:root`)
| Famille | Variables | Usage |
|---|---|---|
| Neutres | `--label`, `--arriere-plan`, `--gris`, `--gris-fonce` | texte, fond, bordures |
| Succès / récap | `--bleu-clair/-moyen/-fonce` | message de succès, encart « à jour », bouton Enregistrer |
| Brouillon / étape intermédiaire | `--orange-clair/-moyen/-fonce` | brouillons, pastilles, bouton Ajouter, sélection de liste, focus, coche |
| Sous abri | `--sousabri-clair/-moyen/-fonce` | bascule (visible aussi dans d'autres outils) |
| Pleine terre | `--pleineterre-clair/-moyen/-fonce` | bascule (idem) |
| États | `--erreur`, `--a-jour`, `--plantemere` | statut, alertes |

### Composants communs
| Composant | Classes | Remarque |
|---|---|---|
| Champ | `.champ` | input et bouton de select ; fond et couleur explicites ; focus orange |
| Bouton-champ à flèche | `.champ.champ-select` | **deux** classes ; `.champ-select` n'ajoute que flex et ▾ |
| Conteneur de liste | `.champ-liste` | `position: relative` : repère de la liste absolue, **obligatoire** autour de chaque input + liste |
| Liste | `.liste-choix` (+ `li`, `.selection`, `.vide`) | identique pour Variété, Où, Millésime, Type |
| Boutons | `.btn` (socle) + `.btn-ajouter` (orange) ou `.btn-enregistrer` (bleu) + `.btn-large` | toujours `btn` + variante ; `.btn:disabled` gère le grisé |
| Croix | `.btn-suppr` | 30 px, `align-self: flex-start` |
| Case à cocher | `.case` | dessinée en CSS (indépendante du thème système) |
| Messages | `.erreur`, `.succes`, `.info` | |
| Brouillons | `.liste-brouillons`, `.brouillon`, `.brouillon-detail` | orange |
| Encart « à jour » | `.cadre-info-a-jour` + `-titre/-ligne/-plantemere/-alerte` | bleu |
| Pastilles | `.pastilles`, `.pastille` | orange |
| Grille | `.deux-colonnes`, `.une-colonne` | |
| Masquage | `[hidden] { display: none !important }` | indispensable |

### Propre à Semis (`semis_realises.css`)
- `#fiche label { margin-top: 12px }` : même écart au-dessus de tous les labels, y compris en deux colonnes.
- `#basculeMode + label { margin-top: 0 }` : « Variété » collé à la bascule.
- `#fiche label.case { margin-top: 14px }` : plus précis que `#fiche label`, sinon la marge des cases serait écrasée.
- `.bascule` + boutons `.sousabri` / `.pleineterre` / `.actif`. Les boutons portent `btn btn-large` ; `.bascule button { margin-top: 0 }` annule la marge de `btn-large`.

## 8. Vigilances

**CSS**
- Espace avant `:active` / `:disabled` : `.btn :active` ≠ `.btn:active` (l'espace cible un enfant, la règle ne s'applique jamais).
- `.champ-liste { position: relative }` indispensable, sinon la liste dépasse du champ (elle se cale sur la page).
- `padding: 0` sur `.liste-choix` : sinon retrait par défaut de la `ul`.
- Fond et couleur explicites dans `.champ` : sinon les `<input>` suivent le thème sombre du système (`color-scheme: light` en renfort).
- `font: inherit` avant `font-size` : `font` remet tout à l'héritage.
- Classe `btn` oubliée dans le HTML : le bouton perd police, padding, arrondi.
- Le contour orange au focus est le défaut du navigateur, désormais défini par `.champ:focus`.
- Un `<select>` natif ne se stylise pas (liste dessinée par le système) : d'où `habillerSelect`.
- Précision CSS : `#fiche label.case` > `#fiche label` > `.case` ; `.bascule button` > `.btn-large`. À précision égale, la dernière règle écrite gagne.
- Tout renommage de classe : Ctrl+Maj+F dans **tous** les fichiers (HTML, JS qui pose des classes via `className` / `classList`, autres outils).

**JS**
- Sélection dans les listes au **`click`** (jamais `pointerdown`) + `mousedown` bloqué pour garder le focus : sinon on sélectionne en défilant sur mobile.
- Les **id** HTML sont liés au JS (`btnAjouter`, `btnEnregistrer`, `basculeMode`, `selectMillesime`, `selectType`, `blocGodets`, `blocOu`, `labelGraines`, `derniersSemis`…). Renommer une classe ne casse rien ; renommer un id casse le démarrage (`is null`, message dans `#statut`).
- Erreur de syntaxe = page vide sauf mise en forme : console F12, la ligne rouge donne le numéro.
- Fichier non enregistré = changement invisible.
- La liste Variété ne se referme pas au clic ailleurs (à corriger si gênant).

## 9. Inutile à Semis dans le CSS commun

À garder seulement si un autre outil s'en sert (chercher la classe dans tous les fichiers).

| Élément | Remarque |
|---|---|
| `.saisie`, `.message`, `.compteurs`, `.cadre-info`, `.liste-semis` | non utilisés par Semis |
| `.confirmation*` (boîte, boutons) | non utilisés ; `.confirmation[hidden]` redondant avec `[hidden]` |
| `.btn:focus-visible` | morte : la classe `button` n'existe pas ; remplacer par `btn:focus-visible` |
| `.btn-annuler`, `.btn-valider` | doublons de `.btn` et d'un bouton bleu |
| `--blanc` | jamais lue |
| `--recap-clair/-moyen/-fonce/-moyen2` | jamais lues (l'encart utilise `--bleu-*`) |
| commentaires `/*.message.erreur…*/`, `/*.alerte…*/`, `/* ancien champ-liste*/` | à supprimer |

## 10. Reste à faire

- [ ] Passage en prod et tests tablette (clavier, taille ✕ à 30 px, défilement des listes, hauteur de la fiche, contrastes).
- [ ] Nettoyage JS : supprimer `afficherControle`, `sourceChoix`, les `console.log`.
- [ ] Nettoyage CSS : règles mortes (§9), unifier `--bleu-*` / `--recap-*`.
- [ ] Refermer la liste Variété au clic extérieur (option).
- [ ] `Graines_exterieures` : vérifier l'usage puis supprimer la colonne.
- [ ] Formule `Info_germination` : `if rec.Jours_ecoules == "": return ""` pour afficher « En attente » dès le jour J.
- [ ] Options : masquer les millésimes épuisés, trier `LIEUX`, nettoyer les 62 lignes vides de `Millesimes`, factoriser `habillerSelect` dans un futur `gestion_commun.js`.

## 11. Limites connues

- Nouveaux choix Type / Où vus au rechargement ; choix réglés « par vue » absents des métadonnées (repli sur la liste en dur du JS, à garder à jour).
- `beforeunload` peu fiable lors d'un changement de page dans Grist : se fier au statut rouge.
- `Millesimes` non rechargé après un sachet vidé (le millésime reste proposé jusqu'au rechargement).

## 12. Migrer un autre outil vers cet aspect

1. Charger `gestion_commun.css` avant le CSS de l'outil.
2. Champs : `class="champ"` ; entourer chaque input + liste d'une `div.champ-liste` ; listes en `ul.liste-choix`.
3. Boutons : `btn` + `btn-ajouter` (étape intermédiaire) ou `btn-enregistrer` (final) + `btn-large` si pleine largeur.
4. Brouillons en `.brouillon`, messages en `.erreur` / `.succes`, encarts en `.cadre-info-a-jour*`, cases en `.case`.
5. Si l'outil affiche sous abri / pleine terre : réutiliser les variables `--sousabri-*` et `--pleineterre-*`, et recopier les règles de bascule dans son CSS.
6. Supprimer les règles locales devenues doublons (chercher chaque classe avant suppression).
7. Select stylé : copier `habillerSelect` / `rafraichirSelect`.
8. Tester après chaque étape (Ctrl+Maj+R) et surveiller la console.