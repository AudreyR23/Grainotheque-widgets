# Granothèque Grist : outil « À semer » (récapitulatif)

> Document de référence pour reprendre l'outil plus tard.
> État : fonctionnel, testé (octobre 2026).

## 1. Rôle

Rappeler les variétés à semer **au mois choisi** (mois en cours par défaut) quand elles n'ont pas encore été semées dans leur période de semis. Un bouton « Semer » envoie la variété à l'outil **semis_realises** pour pré-remplir la saisie.

Usage : PC et tablette, lecture seule (aucune écriture dans les tables par À semer). Consultable sur téléphone via la vue Grist.

## 2. Fichiers et installation

| Élément | Détail |
|---|---|
| Widget | `a_semer.html`, `a_semer.js` (hébergé sous le nom `main_a_semer.js`), `a_semer.css` |
| Hébergement | GitHub Pages (`audreyr23.github.io/Grainotheque-widgets/...`) |
| Widget À semer, dans Grist | Données : **Varietes**. « Sélectionner par » : vide. Accès : **full** |
| Widget semis_realises, dans Grist | Données : **Semis** (comme à l'origine). « Sélectionner par » : vide |
| Placement | Les deux widgets doivent être **sur la même page** Grist |

Accès `full` : nécessaire car le widget lit plusieurs tables avec `grist.docApi.fetchTable`, même sans rien écrire.

## 3. Données lues

| Table | Colonnes utilisées |
|---|---|
| **Varietes** | `Nom`, `Variete`, `Type`, `Semis_sous_abris`, `Semis_pleine_terre` (ChoiceList de mois), `Annees_sans_test` |
| **Millesimes** | `NomVariete`, `Millesime` (date), `Epuise`, `Germination_affichee`, `Sachets`, `Qtte_graines` |
| **Semis** | `NomVariete`, `Date_s` |

Mois attendus dans les ChoiceList : `Jan, Fév, Mar, Avr, Mai, Jui, Juil, Aou, Sep, Oct, Nov, Déc` (comparaison sans accents ni majuscules).

Colonne **plus utilisée** mais toujours lue : `Deja_seme_cette_annee` (remplacée par le calcul sur la période de semis). Elle peut rester dans la table.

## 4. Fonctionnalités

### Liste « à semer »

Une variété s'affiche si :

1. le mois choisi est dans `Semis_sous_abris` ou `Semis_pleine_terre` ;
2. elle n'a pas de semis dans sa **période de semis** en cours (voir 5) ;
3. elle a au moins un millésime utilisable (voir 6).

Chaque carte montre : nom, badges **Sous abri** / **Pleine terre**, millésime utilisé, germination, ancienneté du dernier test, période de semis (ex. « semis Nov → Fév »), bouton **Semer**.

### Filtres et tri

- **Mois** : liste Jan → Déc.
- **Afficher aussi les déjà semées** : les ajoute en grisé, avec badge « Déjà semée » et/ou « … au jardin ».
- **Tri** : nom, germination (meilleure d'abord), plus longtemps sans test (« jamais testé » en tête).
- **Actualiser** : recharge les données Grist (à utiliser après un semis enregistré).

### Plants au jardin

Une ligne de Millesimes dont `Sachets` ressemble à `nombre + p / rhi / c / b` (ex. `1P.`, `2rhi`, `3c.`, `1b.`) compte comme matériel vivant déjà présent :

| Code | Badge |
|---|---|
| `p` | Plant au jardin |
| `rhi` | Rhizome au jardin |
| `c` | Caïeux au jardin |
| `b` | Bulbe au jardin |

La variété est alors considérée « déjà semée » (masquée par défaut), et la ligne n'est pas proposée comme sachet de graines, sauf si elle a aussi une `Qtte_graines`. Si aucune graine n'existe, la carte affiche « pas de graines ».

### Sachet « Mél »

Sachet contenant plusieurs millésimes. Traité comme un millésime normal (la colonne `Millesime` contient une date). Si c'est la ligne choisie, la carte affiche « sachet mélangé (plusieurs millésimes) ».

### Bouton « Semer » → semis_realises

Envoie l'id de la variété à l'outil semis_realises, qui la sélectionne dans sa fiche avec le millésime le plus récent et ses derniers semis. Ne crée aucun semis lui-même.

## 5. Période de semis (anti-doublon sur deux années)

Fonction `fenetreDeSemis(liste, mois, annee)` :

- Regroupe les mois de `Semis_sous_abris` + `Semis_pleine_terre` en une **fenêtre continue** qui contient le mois choisi (ex. Nov → Fév, à cheval sur deux années).
- Une variété est « déjà semée » s'il existe un `Date_s` dans cette fenêtre (début inclus, fin exclue).
- Avantage : une variété semée en décembre ne réapparaît pas en janvier, et une variété semée en janvier réapparaît bien en novembre.

## 6. Choix du millésime à utiliser

Fonction `millesimeAUtiliser(varieteId)` :

1. Candidats : millésimes **non épuisés** (`Epuise` faux), sauf les lignes plant sans graines.
2. Le **plus récent** parmi ceux qui ont une date.
3. Sinon, celui avec le **meilleur taux** de `Germination_affichee`.
4. Sinon, aucun : la variété est masquée (sauf si plant au jardin).

La germination est affichée en % (si la valeur est ≤ 1, elle est multipliée par 100).

## 7. Choix techniques

- **Conventions** : variables en français, état global en haut du fichier, `recordsParId` (Maps), événements `pointer*` (PC et tablette).
- **`modifie` / `majStatut()`** : non utilisés, l'outil n'écrit rien.
- **Chargement** : `fetchTable` sur Varietes, Millesimes, Semis (tout en mémoire, recalcul à chaque affichage). Pas d'abonnement automatique : les données ne sont rafraîchies que par « Actualiser ».
- **Communication entre widgets** : `BroadcastChannel('granotheque-semer')`.
  - Le lien « Sélectionner par » de Grist n'a pas été retenu : Grist ne propose pas un widget personnalisé comme source de lien. L'essai par `setCursorPos` ne fonctionnait pas.
  - `BroadcastChannel` marche entre widgets de **même origine** (même site GitHub Pages) et **déjà chargés** (même page).
  - Avantage : pas de sélection automatique d'une variété au chargement, et ça marche aussi si on reclique sur la même variété.
- **Rendu** : DOM créé avec `createElement` et `textContent` (pas d'`innerHTML` avec des données).

### Côté semis_realises (modifications faites)

```js
let donneesChargees = false;           // passe à true en fin d'initialisation

function varieteDemandee(id) {
  if (!id || !donneesChargees) return;
  if (recordsParId.varietes.has(id)) choisirVariete(id);
}

const canal = new BroadcastChannel('granotheque-semer');
canal.onmessage = e => varieteDemandee(e.data && e.data.varieteId);
```

### Côté À semer (envoi)

```js
const canal = new BroadcastChannel('granotheque-semer');

document.getElementById('liste').addEventListener('pointerdown', e => {
  const btn = e.target.closest('.btn-semer');
  if (!btn) return;
  canal.postMessage({ varieteId: Number(btn.dataset.id) });
});
```

## 8. Limites connues

1. **Sous abri / Pleine terre regroupés** : un semis sous abri en mars compte aussi pour la fenêtre pleine terre si les mois se suivent. À séparer si une variété disparaît alors que tu voulais la semer aussi dans l'autre mode.
2. **Mois choisi = année en cours** : « Jan » regarde janvier de l'année en cours, donc la saison commencée en novembre de l'an dernier, pas janvier prochain.
3. **Plant sans graines** : la variété est masquée de la liste « à semer », même si elle pourrait être multipliée ou replantée.
4. **Rafraîchissement manuel** : après un semis enregistré dans semis_realises, il faut cliquer sur « Actualiser » dans À semer.
5. **Reconnaissance des plants** : repose sur l'écriture exacte de `Sachets` (nombre + `p` / `rhi` / `c` / `b`). Une autre écriture n'est pas reconnue. Dans `typeDePlant`, `\d*` accepte aussi « b » ou « c » seuls ; `\d+` serait plus strict si les valeurs ont toujours un nombre.
6. **Mobile** : deux widgets sur une page sont serrés sur téléphone, et le bouton « Semer » n'a pas été testé sur téléphone.

## 9. Reste à faire / idées (rien d'obligatoire)

- [ ] **Export `.ics`** : bouton qui télécharge un événement par variété à semer (instantané, non mis à jour).
- [ ] **Rappel automatique** : script externe (API Grist, GitHub Actions) qui envoie la liste chaque mois (mail ou liste de tâches). Chantier à part.
- [ ] **Séparer Sous abri / Pleine terre** dans le calcul « déjà semée » (limite 1).
- [ ] **Choisir une année** en plus du mois (limite 2).
- [ ] **Auto-actualisation** après un semis enregistré (au lieu du bouton).
- [ ] **Badge « À produire »** : écarté pour l'instant (colonne `En_production` de Varietes).
- [ ] **Colonne `En_production`** : à décocher à la main quand le nouveau sachet existe (pas automatique).

## 10. Nettoyage possible

- Dans **semis_realises** :
  - `varietePendante` est déclarée mais n'est plus utilisée (ainsi que le `if (varietePendante) ...` en fin d'initialisation).
  - `afficherControle` contient une ligne en double (« ignorés (sans date, hors « or. ») »).
  - Les `console.log` de diagnostic peuvent être retirés.
- Dans **À semer** : retirer `dejaSemeCetteAnnee` du chargement des variétés si elle ne sert plus.

## 11. Pièges rencontrés (pour ne pas les refaire)

- Un widget lié à **Semis** reçoit un id de ligne de Semis avec `grist.onRecord`, pas un id de variété : d'où l'abandon de ce mécanisme.
- Une accolade ou une flèche mal recopiée (`.catch(err =` suivi d'un saut de ligne) bloque tout le fichier JS : la console affiche une erreur rouge et plus rien ne s'exécute.
- Après chaque modification : pousser sur GitHub, puis recharger la page Grist avec **Ctrl+F5** (cache).
- Dans les notations que tu m'as données, « x » voulait dire « un nombre » ; c'est pourquoi la regex vérifie `p`, `rhi`, `c`, `b` après un nombre.

## 12. Checklist de test après modification

1. Recharger (Ctrl+F5) : la console ne montre aucune erreur.
2. Mois en cours : la liste n'est pas vide, une variété déjà semée est absente.
3. Case « déjà semées » cochée : elles apparaissent grisées avec le bon badge.
4. Variété avec plant (`1P.`, `2rhi`, `3c.`, `1b.`) : absente de la liste normale, présente grisée avec case cochée.
5. Les trois tris fonctionnent sans erreur.
6. « Semer » : la variété arrive dans semis_realises avec son millésime et ses derniers semis.
7. Après un semis enregistré et « Actualiser » : la variété disparaît de la liste normale.