# Granothèque Grist : widget « Semis réalisés »

> Dernière mise à jour : 23/11/2026
> Statut : **dev validé** (migration Vue terminée, CSS commun BEM). **Prod et tests tablette à faire.**
> Outils de référence pour le style et les conventions : **À gérer**, **Achat-repro**.

## 1. Rôle

Saisir rapidement les semis d'une journée dans la table **Semis** via un formulaire, sans passer par la grille Grist.

- Usage : PC, mobile, tablette. Pas d'impression.
- Chaque semis devient une carte « À enregistrer » ; un seul bouton « Enregistrer » écrit tout le lot en **un seul `applyUserActions`** (un Ctrl+Z dans Grist annule le lot : semis + sachets vidés).

## 2. Fichiers

| Fichier | Rôle |
|---|---|
| `semis_realises.html` | 3 zones Vue : `#appEntete`, `#appFiche`, `#appEtapes` |
| `semis_realises.js` | Logique ; messages dans le bloc `TEXTES` en haut du fichier |
| `semis_realises.css` | Uniquement ce qui n'est pas dans le commun |
| `../../styles/styles_communs_bem.css` | Socle CSS partagé (BEM) |
| `../../script/scriptcommun.js` | Fonctions communes |

- Scripts en fin de `<body>` : plugin Grist, Vue 3.4.38 (unpkg), `scriptcommun.js`, `semis_realises.js`.
- Grist : widget personnalisé, accès **complet** (`grist.ready({ requiredAccess: 'full' })`).
- Fonctions du commun utilisées : `tableEnLignes`, `listeChoix`, `enListeChoix`, `normaliser`, `anneeDepuisDate`, `dateAffichee`, `dateDuJour`, `dateEnSecondes`, `typeInverse`, `libelle`, `lieuxFiltres`, `correspondRecherche`, `lireChoixColonnes`, `creerMessageTemporaire`, `pluriel`.

## 3. Données

### Lues (`fetchTable`)
| Table | Colonnes |
|---|---|
| `Varietes` | `Nom`, `Variete`, `Type`, `Duree_germ` |
| `Millesimes` | `NomVariete`, `Millesime`, `Origine`, `Nb_saisons_manuel`, `Plante_mere`, `Annee_plantation`, `Epuise` (formule, lue seulement) |
| `Semis` | `NomVariete`, `Millesime`, `Date_s`, `Nb_godets`, `Nb_graines`, `Ou` |
| `_grist_Tables`, `_grist_Tables_column` | choix de `Semis.Type` et `Semis.Ou` (`lireChoixColonnes`) |

### Écrites
- **`Semis`** (`BulkAddRecord`) : `NomVariete`, `Millesime`, `Date_s`, `Nb_godets`, `Nb_graines`, `Type`, `Ou` (`enListeChoix` ou `null`), `Germes` (= `null` explicite, sinon Grist met 0 et `Info_germination` conclut « NG »), `A_produire`.
- **`Millesimes`** (`UpdateRecord`, si « Sachet vidé ») : `Qtte_graines` et `Nb_sachets` à `null`, dans le même `applyUserActions` (la formule `Epuise` exige les deux vides).
- **Jamais envoyées** : `Positions`, `Nb_etiquettes`, `Graines_exterieures`, `Plantes`, `Oups`, `Date_p`, `Don_p`, `Date_creation`, `Date_modif`.
- Pas de relecture/comparaison avant écriture : on n'ajoute que des lignes, et « Sachet vidé » écrase le stock (décision du 23/11/2026).

### Liens avec les autres outils
- **À semer → Semis réalisés** : `BroadcastChannel('granotheque-semer')`, message `{ varieteId }` (bouton « Semer » d'À semer). Une variété reçue pendant le chargement est gardée dans `varietePendante` et appliquée à la fin du chargement.
- **À gérer** relit les semis créés : `Germes` vide → « À vérifier ».
- **Achat-repro** décoche `A_produire` à la création d'un millésime de la même variété ; il écrit aussi `Nb_sachets`.
- Pleine terre reconnaissable dans `Semis` par `Nb_godets = 1` ; plante mère (À gérer, Achat-repro) par godets = 0 et graines = 0 : pas de confusion.

## 4. Fonctionnalités

1. **Bascule Sous abri / Pleine terre** : sous abri = godets + graines par godet ; pleine terre = `Nb_godets` = 1, un seul champ graines, `Où` visible et obligatoire. Changer de mode vide `Où` et l'erreur de saisie.
2. **Recherche de variété** : sans accents ni casse, plusieurs mots, 40 résultats max.
3. **Encart bleu** : type (emoji d'abord) et durée de germination ; « Déjà semé en AAAA (n) » / « Pas encore semé en AAAA » (année de la date saisie) ; plante mère en place ; 5 derniers semis max + « … et n autres » ; alerte rouge si la variété est déjà dans les cartes.
4. **Millésime** : datés (récent d'abord, présélectionné), « or. (originale) » en dernier. **Ni épuisés (`Epuise`), ni millésimes de plantes mères.** Bouton grisé sans variété ou sans millésime disponible.
5. **Type** : choix lus dans Grist, se cale sur le Type de la variété (défaut : `Arom.Méd 🌿`).
6. **Où** : pastilles violettes (✕ pour retirer), liste qui se ferme après un choix et se rouvre au toucher.
7. **Nombres** : champs texte (`inputmode="numeric"`), entiers ≥ 1 seulement (`entierOuNull`), sinon message d'erreur.
8. **Cases** : « Sachet vidé » et « À reproduire ».
9. **Cartes « À enregistrer »** : liseré orange, pastille de mode, détail (millésime, date, quantités, type, lieux, cases), ✕ pour retirer. Chaque carte garde une copie du millésime (`b.millesime`) pour son affichage.
10. **Enregistrer** : bouton grisé (et « Ajouter » aussi) pendant l'écriture ; cartes conservées en cas d'échec ; puis rechargement de `Varietes`, `Millesimes`, `Semis` et mise à jour de la fiche en cours (`rafraichirFiche`) : un sachet vidé disparaît aussitôt de la liste.
11. **Cartes conservées au rechargement** (F5) via `sessionStorage` ; perdues à la fermeture de l'onglet (voulu). Plus de confirmation `beforeunload`.
12. **Messages** : succès dans le bandeau, 4 s ; erreurs (saisie, enregistrement) affichées jusqu'au prochain clic ; erreurs de chargement (`etat.message`) permanentes.

Après « Ajouter » : conservés = mode, date, godets, graines, type ; vidés = variété, millésime, Où, cases ; curseur dans Variété.

## 5. Choix techniques

- **3 zones Vue** : `#appEntete` (titre, statut, succès), `#appFiche` (tout le formulaire, erreur de saisie, bouton Ajouter), `#appEtapes` (message de chargement, cartes, erreur d'enregistrement, Enregistrer). Plus rien hors Vue ; seul `getElementById('rechercheVariete').focus()` dans un `Vue.nextTick`.
- **Un seul état `etat`** : `varieteId`, `millesimeId`, `charge`, `erreurFiche`, `erreur`, `succes`, `message`, `etapesIntermediaires`… Statut calculé dans le HTML par `nombreEtapes()`.
- **Le JS calcule, le HTML met en forme** : `etat.encart` et `etat.millesimes` ne contiennent que des valeurs (`annee`, `nbSemis`, `original`, `saisons`…) ; phrases, libellé du millésime et pluriels dans le HTML. Le libellé du millésime est écrit **3 fois** dans le HTML (bouton, liste, carte) : changer les trois ensemble.
- **`TEXTES`** : messages d'erreur et de succès (contrôles de saisie, chargement, enregistrement).
- **Données** : `recordsParId.varietes / millesimes / semis` (Map, non suivies par Vue).
- **Fermeture des menus** Millésime/Type : écouteur `click` sur `document` avec `closest('#menuMillesime')` / `closest('#menuType')`. Ces deux `id` doivent rester.
- **Effacement des erreurs** : écouteur `click` sur `document` en **phase de capture**.
- **`sessionStorage`** : clé `semis_realises_saisies`, `Vue.watch` profond sur `etat.etapesIntermediaires` ; au démarrage `restaurerSaisies()` écarte les cartes dont la variété ou le millésime n'existe plus et reprend la numérotation des cartes.
- `Vue.watch(() => etat.date, afficherDerniersSemis)`.
- **CSS local** : `entete__message`, `fiche`, `fiche__groupe`, `fiche__label`, `bascule`, `bascule__btn` (+ `--sousabri`, `--pleineterre`, `--sousabri-actif`, `--pleineterre-actif`), `encart--info`, `.champ:disabled`. Godets/graines en `grille` (commun) en mode sous abri seulement.

## 6. Formats Grist

| Type | Lecture | Écriture |
|---|---|---|
| Reference | id de ligne | id de ligne (`Semis.Millesime` = id de `Millesimes`) |
| Date | secondes depuis 1970 (UTC) | `dateEnSecondes('AAAA-MM-JJ')` |
| ChoiceList | `listeChoix()` | `enListeChoix()` ou `null` |
| Numeric vide | `null` | `null` explicite |

## 7. Règles métier

- « or. » = semence originale : proposée, en dernier.
- Millésimes sans date et hors « or. » : ignorés. Épuisés et plantes mères : non proposés.
- Sachet vidé : vider `Qtte_graines` **et** `Nb_sachets`.

## 8. Pièges rencontrés

- Commentaire `//` en fin de ligne qui « mange » la propriété suivante placée sur la même ligne.
- `v-show` sur la racine d'une zone Vue ignoré : directives dans la zone.
- Espace avant `:disabled` / `:active` (`.btn :active` ne s'applique à rien).
- Ancien JS en cache : Ctrl+Maj+R / Ctrl+F5.
- Fonction commune recopiée localement : elle masque le commun.
- Notes anciennes en décalage avec le code (`Sachets` au lieu de `Nb_sachets`, fonctions orphelines déjà supprimées) : vérifier le code avant de suivre les notes.

## 9. Limites connues

- Nouveaux choix Type / Où vus au rechargement du widget.
- Formulaire en cours (pas encore ajouté) non conservé au rechargement.
- Une carte restaurée garde son millésime même s'il est devenu épuisé entre-temps.
- Pas d'écoute des changements faits ailleurs dans Grist (hors rechargement après enregistrement).
- Contrastes non traités (texte clair sur `--sousabri-moyen` / `--pleineterre-moyen`).
- Non testé sur tablette réelle.

## 10. Reste à faire

- [ ] Prod + tests tablette (zones tactiles, défilement des listes, clavier numérique).
- [ ] Ajustements visuels : grille godets/graines sur mobile (pas d'écart vertical sous 600 px), flèche des menus (`champ--deroulant` d'Achat-repro), bouton Enregistrer collant (`btn--collant` + `zone-transparente`) ?
- [ ] `Graines_exterieures` : vérifier l'usage puis supprimer la colonne.
- [ ] Formule `Info_germination` : `if rec.Jours_ecoules == "": return ""`.
- [ ] **Discussion du commun** : `entierOuNull` (identique dans Achat-repro), `.encart--info`, `.champ:disabled`, `.entete__message` (aussi dans À gérer ?), conflit `.btn--enregistrer` / `.btn--grand` sur `margin-top`.

## 11. Checklist de test

1. Démarrage : « Chargement… » puis « ✓ À jour », date du jour, Millésime grisé, Type « 🌿 Arom.Méd ».
2. Recherche, choix : encart bleu, millésime présélectionné (ni épuisé ni plante mère), Type calé.
3. Pleine terre : `Où` apparaît, godets disparaît ; sans `Où` : erreur. Nombres : `abc`, `2,5`, `0`, `-1`, vide refusés.
4. Erreur affichée jusqu'au prochain clic ; un second « Ajouter » fautif la réaffiche.
5. Ajouter, ✕, statut « Non sauvegardé (n) » ; F5 : cartes restaurées, sans confirmation.
6. Enregistrer : succès 4 s dans le bandeau ; dans Grist `Type`, `Millesime`, `Date_s` (pas décalée), `Ou`, `A_produire`, `Germes` vide, stock vidé si « Sachet vidé » ; le millésime vidé disparaît de la liste ; un Ctrl+Z annule tout.
7. « À semer » → « Semer » : la variété arrive.