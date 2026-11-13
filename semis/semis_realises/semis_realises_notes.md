# Granothèque Grist : widget « Semis réalisés »

> Dernière mise à jour : 08/11/2026
> Statut : **dev validé** (harmonisé avec le commun, converti en Vue). **Prod et tests tablette à faire.**

## 1. Rôle

Saisir rapidement les semis d'une journée dans la table **Semis** via un formulaire, sans passer par la grille Grist.

- Usage : PC, mobile, tablette. Pas d'impression.
- Un seul Ctrl+Z dans Grist annule un lot complet (semis + mises à jour de stock).
- L'outil **écrit** dans Grist : `modifie` + `majStatut()` sont donc justifiés.

## 2. Fichiers

| Fichier | Rôle |
|---|---|
| `semis_realises.html` | page du widget (zones Vue `#appXxx`) |
| `semis_realises.js` | logique |
| `semis_realises.css` | règles propres à Semis |
| `../../styles/styles_commun.css` | socle CSS partagé |
| `../../script/scriptcommun.js` | JS partagé |

- Ordre des scripts en bas du `<body>` : `grist-plugin-api.js`, Vue 3.4.38 (unpkg), `scriptcommun.js`, `semis_realises.js`.
- Grist : widget Personnalisé, accès **complet**.
- Live Server ne recharge qu'à l'enregistrement. Rechargement forcé : Ctrl+Maj+R.
- Prod : mettre à jour le commun **avant** l'outil.

## 3. Données

### Lues (`fetchTable`)
| Table | Colonnes |
|---|---|
| `Varietes` | `Nom`, `Variete`, `Type`, `Duree_germ` |
| `Millesimes` | `NomVariete`, `Millesime`, `Origine`, `Nb_saisons_manuel`, `Plante_mere`, `Annee_plantation` |
| `Semis` | `NomVariete`, `Millesime`, `Date_s`, `Nb_godets`, `Nb_graines`, `Ou` |
| `_grist_Tables`, `_grist_Tables_column` | choix de `Semis.Type` et `Semis.Ou` (`widgetOptions.choices`) |

### Écrites
- **`Semis`** (`BulkAddRecord`) : `NomVariete`, `Millesime`, `Date_s`, `Nb_godets`, `Nb_graines`, `Type`, `Ou`, `Germes` (= `null`, sinon Grist met 0 et `Info_germination` conclut « NG »), `A_produire`.
- **`Millesimes`** (`UpdateRecord`, si « Sachet vidé ») : `Qtte_graines` et `Sachets` vidés, dans le même `applyUserActions`.
- **Jamais envoyées** : `Positions`, `Nb_etiquettes`, `Graines_exterieures`, `Plantes`, `Oups`, `Date_p`, `Don_p`, `Date_creation`, `Date_modif`.

## 4. Fonctionnalités

1. **Bascule Sous abri / Pleine terre** : sous abri = godets + graines par godet ; pleine terre = `Nb_godets` = 1, un champ graines, `Où` visible et obligatoire. Changer de mode vide `Où`.
2. **Recherche de variété** (sans accents ni casse, plusieurs mots, 40 résultats max, liste fermée au clic ailleurs).
3. **Encart bleu unique** : Type (emoji d'abord) et germination, « Déjà semé en AAAA », plante mère, lignes de semis (5 max), alerte rouge si déjà dans les étapes.
4. **Millésime** : datés (récent d'abord, présélectionné), « or. (originale) » en dernier ; bouton grisé tant qu'aucune variété n'est choisie.
5. **Type** : liste lue dans Grist, se cale sur le Type de la variété.
6. **Où** : pastilles violettes, liste qui se ferme après un choix et se rouvre au toucher.
7. **Cases** : « Sachet vidé » et « À reproduire ».
8. **Étapes intermédiaires** : cartes `.carte.etape` (liseré orange, pastille de mode), ✕ pour retirer.
9. **Enregistrer** : un seul `applyUserActions`, bouton grisé pendant l'écriture, étapes conservées en cas d'échec, bandeau de succès 5 s.
10. `beforeunload` si étapes non enregistrées.
11. **Réception d'une variété** depuis « À semer » (`BroadcastChannel('granotheque-semer')`), mise en attente pendant le chargement.

Après « Ajouter » : conservés = mode, date, godets, graines, type ; vidés = variété, millésime, Où, cases ; focus sur Variété.

## 5. Choix techniques

- **Vue par zones** : `#appBascule`, `#appVariete`, `#appMillesime`, `#appSaisie`, `#appType`, `#appOu`, `#appCases`, `#appEtapes`. Restent hors Vue : `#statut` (`majStatut`), `#erreurFiche` (`afficherErreur`), `#btnAjouter`.
- **Directives dans la zone, jamais sur la racine `id="app…"`** (`v-show` sur la racine est ignoré).
- `varieteChoisieId` et `millesimeChoisiId` restent en JS simple (`millesimeChoisiId` double `etat.millesimeId`, supprimable).
- Listes qui défilent : `@click` + `@mousedown.prevent` sur la `ul`, jamais `pointerdown`.
- Fermeture des menus Millésime/Type : un écouteur `click` sur `document`.
- `Vue.watch(() => etat.date, afficherDerniersSemis)`.
- Vocabulaire : « étape intermédiaire » partout (`etapesIntermediaires`, `ajouterEtapeIntermediaire`…).

## 6. Formats Grist

| Type | Lecture | Écriture |
|---|---|---|
| Reference | id de ligne | id de ligne (`Semis.Millesime` = id de `Millesimes`) |
| Date | secondes depuis 1970 (UTC) | `Date.UTC(a, m-1, j) / 1000` |
| ChoiceList | `['L','a','b']` | `['L','a','b']` ou `null` |
| Numeric vide | `null` | `null` explicite |

## 7. Règles métier

- « or. » = semence originale : proposée, en dernier.
- Millésimes sans date et hors « or. » (62 lignes vides) : ignorés.
- Sachet vidé : vider `Qtte_graines` **et** `Sachets` (la formule `Epuise` exige les deux).
- Pleine terre reconnaissable dans Semis par `Nb_godets = 1`.

## 8. Ce qui change pour cet outil

- CSS : cartes d'étapes en `.carte.etape`, pastilles `Où` violettes, encart `.cadre-info` unique, `#fiche label` / `#fiche label.case`, bascule.
- JS : copies locales supprimées (`tableEnLignes`, `listeChoix`, `anneeDepuisDate`, `normaliser`, `dateAffichee`, `libelleVariete`), `typeInverse` utilisée, `habillerSelect` supprimé, tout converti en Vue.

## 9. Ce qui change pour le commun

- **`styles_commun.css`** : `.carte.etape`, `.pastille` en violet « ici », `.champ:disabled`, `.btn-annuler` conservé. Retirés : `.cadre-etape`, `.saisie`, `.compteurs` (après recherche).
- **`scriptcommun.js`** : `libelle(v)` ajoutée (tiret court « - », identique dans les 3 outils). `dateDuJour` et `dateEnSecondes` restent locales (candidates quand « Semis à gérer » en aura besoin).
- À conserver tant que d'autres outils les utilisent : `.etape-intermediaire*`, `.liste-etape-intermediaires`, `.btn-valider`, `.message`.

## 10. Pièges rencontrés

- Commentaire `//` en fin de ligne qui « mange » la propriété suivante placée sur la même ligne (`millesimeDesactive`).
- `v-show` sur la racine d'une zone Vue ignoré.
- Espace avant `:disabled` / `:active` (`.btn :active` ne s'applique à rien).
- Ancien JS en cache : un bug « fantôme » disparaît après Ctrl+Maj+R.
- Consigne de recherche trop vague (`nbGodets` existe dans le JS Vue) : chercher la forme précise (`getElementById('nbGodets')`).
- Fonction commune recopiée localement : elle masque le commun.

## 11. Limites connues

- Nouveaux choix Type / Où vus au rechargement ; choix « par vue » absents (repli sur les listes en dur du JS).
- `beforeunload` peu fiable lors d'un changement de page dans Grist.
- `Millesimes` non rechargé après un sachet vidé.
- Pas de signal visible si `chargerChoix` échoue (console seulement).
- Contrastes non traités (texte clair sur `--bleu-moyen`, `--plantemere` sur bleu clair).

## 12. Reste à faire

- [ ] Supprimer `initialiserFiche`, `initialiserSelecteurMillesime` (orphelines), `millesimeChoisiId` (doublon).
- [ ] Prod + tests tablette (zones tactiles, défilement des listes, clavier).
- [ ] Signal d'échec de `chargerChoix`.
- [ ] `Graines_exterieures` : vérifier l'usage puis supprimer la colonne.
- [ ] Formule `Info_germination` : `if rec.Jours_ecoules == "": return ""`.
- [ ] Convention BEM (plus tard), `dateDuJour` / `dateEnSecondes` dans le commun.

## 13. Checklist de test

1. Démarrage : statut « ✓ À jour », date du jour, Millésime grisé, Type « 🌿 Arom.Méd ».
2. Recherche, choix, encart bleu, Millésime présélectionné, Type calé.
3. Pleine terre : `Où` apparaît, godets disparaît ; sans `Où` : erreur.
4. Ajouter, ✕, statut « Non sauvegardé (n) ».
5. Enregistrer : `Type`, `Millesime`, `Date_s` (pas décalée), `Ou`, `A_produire`, stock vidé si sachet vidé ; un Ctrl+Z annule tout.
6. « À semer » → « Semer » : la variété arrive.
7. F5 avec étapes en attente : confirmation du navigateur.

## 14. Non vérifié

- Rendu sur tablette réelle, arborescence de prod, comportement de `.etape-intermediaire*` dans « Étiquettes » après son renommage.