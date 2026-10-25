# Outil Achat-repro (Granothèque Grist)

Dernière mise à jour : 25 octobre 2026. Version concernée : **dev** (pas encore copiée en prod).
Outil lié : **Étiquettes sur sachets** (`main_etiquettes.js`), adapté en dev aussi.

## 1. Rôle

Ajouter rapidement des sachets de graines et des plantes mères vivaces dans la table `Millesimes`. L'entrée la plus utilisée est l'onglet **Millésime**. Les onglets **Variété** et **Espèce** servent à créer ce qui manque en amont, avec enchaînement automatique.

Depuis le 25/10/2026, l'onglet Millésime sait aussi **reprendre les sachets étiquetés** (étiquettes déjà imprimées, sachets pas encore ajoutés dans `Millesimes`).

Usage : PC et tablette. Pas d'impression depuis cet outil.

## 2. Fichiers et données

| Fichier | Rôle |
|---|---|
| `Achat_repro.html` | Structure : 3 panneaux, bandeaux, formulaires |
| `../script/main_achatrepro.js` | Toute la logique |
| `../styles/achatrepro.css` | Styles + bloc tactile |

Accès demandé : `grist.ready({ requiredAccess: 'full' })`.
Tables utilisées : `Modele`, `Varietes`, `Millesimes`, `Semis` (lecture + écriture + suppression de lignes), plus les métadonnées `_grist_Tables` et `_grist_Tables_column`.

**Colonnes ajoutées dans `Semis` (à créer dans Grist, sans formule) :**

| Colonne | Type | Rôle |
|---|---|---|
| `Etiq_en_attente` | Numérique | Nombre de sachets imprimés, pas encore ajoutés dans `Millesimes` |
| `Note_attente` | Texte | Libellé libre pour repérer une ligne sans variété (ex. « menthe du voisin »). Saisie à la main dans Semis |

## 3. Fonctionnalités

### Onglet Millésime
- Choix de la variété (le Type se charge tout seul, champ en lecture seule).
- Année du millésime **préremplie avec l'année en cours**, modifiable.
- **Origine** obligatoire : 6 étiquettes cliquables (les 6 premiers choix de la colonne `Origine` dans Grist) + un menu « Autres origines… » (une seule origine rare).
- Cases **Sachet** (cochée par défaut) et **Plante mère**, exclusives l'une de l'autre.
  - Sachet : champ *Quantité de graines* visible et obligatoire. `Sachets` = `1`.
  - Plante mère : champ *Année de plantation* visible et obligatoire. `Sachets` = `1p.`. Une ligne est aussi créée dans `Semis`.
- Nb saisons (`or.` par défaut).
- Contrôle : au moins Sachet ou Plante mère doit être coché.

### Décochage automatique de « À produire »
À la création d'un millésime, toutes les lignes `Semis` de la **même variété** dont `A_produire` est coché sont décochées (le besoin de produire est satisfait).

- S'applique à **tous les types de millésime** (achat, don, récolte perso, plante mère…). Pas de filtre par origine (cas C non demandé).
- Conséquence : `Varietes.En_production` repasse à faux si plus aucune ligne Semis de la variété n'est cochée.
- Message : `· "À produire" décoché sur N semis` (uniquement si N > 0).
- Ne s'exécute **que si la création du millésime a réussi**.
- La ligne Semis d'une plante mère est créée **après** le décochage, donc jamais concernée.

### « Issu de mes étiquettes » (ajouté le 25/10/2026)

**Principe.** Tu récoltes, tu remplis `Nb_etiquettes` dans Semis, tu imprimes, tu colles les étiquettes sur les sachets, **puis** tu ajoutes les sachets comme millésimes (un pour toi, le reste en `Don`). La case « Issu de mes étiquettes » (décochée = fonctionnement habituel pour les achats et réceptions) liste les lignes Semis dont `Etiq_en_attente` > 0.

**Trois types de lignes en attente :**

| Type de ligne | Reconnaissance | Variété | Origine préremplie | Nb saisons préparé |
|---|---|---|---|---|
| Plante mère | millésime lié avec `Plante_mere` | verrouillée | `Monjardin` | année en cours − année de plantation + 1 |
| Vrai semis | `Date_s` renseignée | verrouillée | `Monjardin` | saisons du millésime source + 1 |
| Récupération hors sachet, variété connue | pas de `Date_s`, variété renseignée | verrouillée | origine du millésime « or. » de la variété | `or.` |
| **Graines à identifier** | **pas de variété** | **libre** | **aucune (à choisir)** | `or.` |

Le nouveau millésime créé est toujours un **sachet** (jamais une nouvelle plante mère). Nb saisons est borné entre 1 et 8.

**Sachets réels.** Champ prérempli avec le nombre d'étiquettes imprimées, à corriger si tu en as imprimé trop. `Don` = sachets réels − 1 (la colonne `Don` compte des **sachets**). Si sachets réels = 1, `Don` n'est pas écrit. Tu saisis toujours la quantité de graines de **ton** sachet (champ obligatoire).

**Graines à identifier (ligne sans variété).** Libellé : `Graines à identifier (note) · N étiquette(s)`. Menu Variété libre, deux boutons :
- **➕ Créer la variété** → panneau Variété. `Note_attente` préremplit le Nom (modifiable).
- **➕ Créer l'espèce** → panneau Espèce. `Note_attente` préremplit le Nom (modifiable), puis la chaîne continue Espèce → Variété → Millésime.

Pendant ce trajet (`parcoursLigne = true`) l'enchaînement est **forcé**, même si « Enchaîner automatiquement » est décoché. À l'arrivée dans Millésime : variété présélectionnée, année en cours, `Nb saisons` = `or.`, sachets réels prérempli. Il ne reste que l'origine et la quantité.

**Nettoyage à la création du millésime** (ligne Semis choisie) :
1. `Etiq_en_attente` est vidé.
2. La ligne est **supprimée** seulement si c'est une ligne de transit : ni `Date_s`, ni `Nb_graines`, ni `Nb_godets`, ni `Germes`, ni `Plantes`, et `Nb_etiquettes` ≤ 0.
3. Un vrai semis ou la ligne d'une plante mère n'est **jamais supprimé**, seulement vidé de `Etiq_en_attente`.

La case reste cochée après une création pour enchaîner plusieurs lignes ; la liste est rechargée.

### Détection de doublons (3 onglets)
Bandeau orange **en direct** + **confirmation** (« Créer quand même » / « Annuler ») au clic sur Créer.

| Onglet | Critère de doublon |
|---|---|
| Millésime | variété + année + origine + type de ligne (sachet ou plante mère) |
| Variété | Nom + Variété, sans casse, sans accents, espaces normalisés |
| Espèce | Nom, même normalisation |

Règle voulue : deux sachets = deux lignes (pas de fusion des quantités).

### Enchaînement automatique (case « Enchaîner automatiquement »)
Espèce → Variété : modèle présélectionné et champs remplis, Nom et Type repris, curseur dans « Variété ».
Variété → Millésime : variété présélectionnée, Type repris, année en cours, curseur sur l'origine.
(Forcé pendant un parcours « Graines à identifier ».)

### Tablette
Bloc `@media (pointer: coarse)` : cibles d'environ 44 px, police de 16 px (évite le zoom iPad), listes multiples plus hautes. `@media (max-width: 600px)` : formulaire sur une colonne. Le PC garde son affichage d'origine.

## 4. Choix techniques

- **Données** : `modeles` et `varietes` chargés au démarrage (`init`). `Millesimes` et `Semis` sont relus par `fetchTable` à chaque besoin (doublons, décochage, étiquettes en attente), donc toujours à jour.
- **Choix des listes** : lus dans les métadonnées Grist (`widgetOptions.choices`). Réordonner les choix dans Grist change l'affichage sans toucher au code (c'est ainsi qu'on choisit les 6 origines favorites).
- **Format ChoiceList** : Grist attend `["L", ...valeurs]`. `getMultiSelect`, `getPills` et `getOrigines` ajoutent toujours le `"L"`. `cleOrigine()` le retire pour comparer.
- **Dates** : `Millesime` et `Date_s` en secondes depuis epoch, au 1er janvier en UTC. Comparaison avec `getUTCFullYear()`.
- **Bandeau plutôt que `confirm()`** : les fenêtres natives peuvent être bloquées dans l'iframe d'un widget Grist.
- **Détection en échec** : un échec de lecture (`fetchTable`) affiche un message rouge et **bloque** la création.
- **Anti-course** : `verifierDoublonEnDirect` utilise un compteur `verifEnCours`.
- **`normaliser()`** : NFD + suppression des accents + minuscules + espaces réduits.
- **Valeurs de `Sachets`** : `VALEUR_SACHET = '1'` ; `'1p.'` écrit en dur pour les plantes mère.
- **Affichage conditionnel** : classe CSS `.cache` (`display:none !important`).
- **Favoris d'origine** : `NB_FAVORIS = 6` dans `init()`.
- **Origine de production** : constante `ORIGINE_PRODUCTION = 'Monjardin'` (choix stocké dans `Origine`, affiché « AR » sur l'étiquette par `.replace('Monjardin', 'AR')`).

### Contrat entre les deux outils (achatrepro ↔ étiquettes)

```text
Colonnes Semis : Etiq_en_attente (Numérique), Note_attente (Texte).

Outil d'étiquettes, « Marquer comme imprimées », pour chaque ligne avec Nb_etiquettes > 0 :
  - Etiq_en_attente = Etiq_en_attente + Nb_etiquettes (addition si déjà > 0) ;
  - Nb_etiquettes = 0 ;
  - AUCUNE suppression, y compris pour les lignes sans variété.

Achatrepro, à la création du millésime :
  - vide Etiq_en_attente de la ligne choisie ;
  - supprime la ligne si c'est une ligne de transit
    (sans Date_s, Nb_graines, Nb_godets, Germes, Plantes, et Nb_etiquettes <= 0).
```

Si tu modifies l'un des deux outils, vérifie ce contrat : c'est lui qui évite de perdre des étiquettes imprimées.

### Ordre des opérations dans `creerMillesime(forcer)`
1. Contrôles de saisie (variété, année, origine, sachet / plante mère, quantité, année de plantation).
2. Contrôles « étiquettes » : ligne choisie si la case est cochée, `Sachets réels` ≥ 1.
3. Détection de doublon (sauf si `forcer`).
4. **1)** Création du millésime (`AddRecord`, avec `Don` si sachets réels > 1). Erreur : message rouge + `return`.
5. **1b)** Décochage de `A_produire`. Erreur : message rouge + `return`.
6. **1c)** Nettoyage de la ligne d'étiquettes en attente. Erreur : message rouge + `return`.
7. **2)** Si plante mère : création de la ligne dans `Semis`.
8. Message de succès (`nbDecoches`, Don) + `resetMillesime()` + rechargement de la liste si mode étiquettes.

### Code : décochage de « À produire »

Fonction, placée après `trouverDoublonsMillesime` :

```js
/* Renvoie les ids des lignes Semis de cette variété dont "A produire" est coché */
async function trouverSemisAProduire(varId) {
  const data = await grist.docApi.fetchTable('Semis');
  const ids = [];
  data.id.forEach((id, i) => {
    if (data.NomVariete[i] === varId && data.A_produire[i]) ids.push(id);
  });
  return ids;
}
```

Bloc dans `creerMillesime()`, après la création du millésime :

```js
  /* 1b) Décocher "A produire" sur les Semis de cette variété */
  let nbDecoches = 0;
  try {
    const idsADecocher = await trouverSemisAProduire(varId);
    if (idsADecocher.length) {
      await grist.docApi.applyUserActions([
        ['BulkUpdateRecord', 'Semis', idsADecocher,
          { A_produire: idsADecocher.map(() => false) }]
      ]);
      nbDecoches = idsADecocher.length;
    }
  } catch (e) {
    showMsg('msg-millesime',
      '⚠️ Millésime créé, mais le décochage de "A produire" a échoué : ' + e.message, 'err');
    return;
  }
```

### Code : HTML des étiquettes en attente (`Achat_repro.html`, panneau Millésime)

Juste après `<div class="chain-banner" id="chain-banner-millesime"></div>` :

```html
  <div class="form-group form-group-check">
    <label><input type="checkbox" id="m-issu-etiquettes" onchange="majModeEtiquettes()"> Issu de mes étiquettes</label>
  </div>
  <div class="form-group cache" id="bloc-attente">
    <label>Étiquettes imprimées en attente</label>
    <select id="m-attente" onchange="chargerLigneAttente()">
      <option value="">— Choisir une ligne —</option>
    </select>
  </div>
  <div class="cache" id="bloc-sans-variete" style="margin-bottom:10px">
    <div style="font-size:12px;color:var(--gris-texte);margin-bottom:6px">
      Variété déjà dans la liste : choisis-la dans le menu « Variété » ci-dessous. Sinon :
    </div>
    <div class="btn-row" style="margin-top:0">
      <button type="button" class="btn btn-secondary" onclick="allerCreerVariete()">➕ Créer la variété</button>
      <button type="button" class="btn btn-secondary" onclick="allerCreerEspece()">➕ Créer l'espèce</button>
    </div>
  </div>
```

Juste **avant** le `<div class="form-row">` qui contient `m-plante-mere` :

```html
  <div class="form-group cache" id="bloc-sachets-reels">
    <label>Sachets réels (le tien + dons)</label>
    <input type="number" id="m-sachets-reels" min="1" step="1" inputmode="numeric" oninput="majInfoDon()">
    <div id="info-don" style="font-size:12px;margin-top:4px;color:var(--vert);font-weight:600"></div>
  </div>
```

### Code : JS des étiquettes en attente (`main_achatrepro.js`)

Bloc placé après `trouverSemisAProduire` :

```js
/* =============================================
   ÉTIQUETTES EN ATTENTE (Semis.Etiq_en_attente)
   ============================================= */
const ORIGINE_PRODUCTION = 'Monjardin';   // choix de la colonne Origine affiché "AR" sur l'étiquette

let semisEnAttente = [];          // lignes Semis avec Etiq_en_attente > 0
let ligneAttenteChoisie = null;   // ligne choisie dans la liste
let parcoursLigne = false;        // true pendant le trajet ligne sans variété → espèce → variété → millésime

async function chargerSemisEnAttente() {
  const [semis, mils] = await Promise.all([
    grist.docApi.fetchTable('Semis'),
    grist.docApi.fetchTable('Millesimes')
  ]);

  const milParId = new Map();
  const originesOr = new Map();   // variété -> origines de son millésime "or."
  mils.id.forEach((id, i) => {
    milParId.set(id, {
      saisons: mils.Nb_saisons_manuel[i] || '',
      planteMere: !!mils.Plante_mere[i],
      anneePlantation: mils.Annee_plantation[i] || null
    });
    if (mils.Nb_saisons_manuel[i] === 'or.' && !originesOr.has(mils.NomVariete[i])) {
      originesOr.set(mils.NomVariete[i], cleOrigine(mils.Origine[i]).split('|').filter(Boolean));
    }
  });

  semisEnAttente = [];
  semis.id.forEach((id, i) => {
    const nb = semis.Etiq_en_attente[i];
    if (!(nb > 0)) return;
    semisEnAttente.push({
      id,
      varId: semis.NomVariete[i],
      nb,
      note: ((semis.Note_attente || [])[i] || '').trim(),
      seme: !!semis.Date_s[i],
      mil: milParId.get(semis.Millesime[i]) || null,
      originesOr: originesOr.get(semis.NomVariete[i]) || []
    });
  });
}

function libelleAttente(l) {
  if (!l.varId) {
    return 'Graines à identifier' + (l.note ? ' (' + l.note + ')' : '') +
           ' · ' + l.nb + ' étiquette(s)';
  }
  const v = varietes.find(x => x.id === l.varId);
  const nom = v ? v.Nom + (v.Variete ? ' — ' + v.Variete : '') : '(variété inconnue)';
  const type = (l.mil && l.mil.planteMere) ? 'plante mère'
             : (l.seme ? 'semis' : 'récupération hors sachet');
  return nom + ' · ' + type + ' · ' + l.nb + ' étiquette(s)';
}

function remplirListeAttente() {
  const sel = document.getElementById('m-attente');
  sel.innerHTML = '<option value="">— Choisir une ligne —</option>';
  [...semisEnAttente]
    .sort((a, b) => libelleAttente(a).localeCompare(libelleAttente(b), 'fr'))
    .forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.id;
      opt.textContent = libelleAttente(l);
      sel.appendChild(opt);
    });
}

/* Annule la ligne choisie : le formulaire redevient libre */
function annulerLigneAttente() {
  ligneAttenteChoisie = null;
  parcoursLigne = false;
  document.getElementById('m-variete').disabled = false;
  document.getElementById('m-attente').value = '';
  document.getElementById('bloc-sans-variete').classList.add('cache');
  majChampsMillesime();
}

/* Case "Issu de mes étiquettes" */
async function majModeEtiquettes() {
  const actif = document.getElementById('m-issu-etiquettes').checked;
  document.getElementById('bloc-attente').classList.toggle('cache', !actif);
  if (!actif) { annulerLigneAttente(); return; }
  try {
    await chargerSemisEnAttente();
    remplirListeAttente();
    if (!semisEnAttente.length) {
      showMsg('msg-millesime', 'Aucune étiquette en attente dans Semis.', 'err');
    }
  } catch (e) {
    showMsg('msg-millesime', '❌ Lecture des étiquettes en attente impossible : ' + e.message, 'err');
  }
}

/* Origines → étiquettes favorites + menu "autres" */
function appliquerOrigines(liste) {
  const favs = [...document.querySelectorAll('#m-origine-fav input')].map(i => i.value);
  setPills('m-origine-fav', liste.filter(o => favs.includes(o)));
  const autres = liste.filter(o => !favs.includes(o));
  document.getElementById('m-origine-autre').value = autres[0] || '';
}

/* Nb de saisons du nouveau millésime, même règle que l'étiquette */
function saisonsPourLigne(l) {
  let n;
  if (l.mil && l.mil.planteMere && l.mil.anneePlantation) {
    n = new Date().getFullYear() - l.mil.anneePlantation + 1;
  } else if (!l.seme) {
    return 'or.';
  } else {
    n = parseInt(l.mil ? l.mil.saisons : '');
    n = isNaN(n) ? 1 : n + 1;
  }
  return String(Math.min(Math.max(n, 1), 8));
}

function majInfoDon() {
  const n = parseInt(document.getElementById('m-sachets-reels').value);
  document.getElementById('info-don').textContent = n >= 1 ? 'Don : ' + (n - 1) + ' sachet(s)' : '';
}

/* Préremplissage d'une ligne sans variété (ligneAttenteChoisie doit déjà être définie) */
function preremplirLigneSansVariete(l) {
  document.getElementById('m-millesime').value = new Date().getFullYear();
  document.getElementById('m-nb-saisons').value = 'or.';
  appliquerOrigines([]);   /* l'origine n'est pas devinable : tu la choisis */
  document.getElementById('m-sachet-check').checked = true;
  document.getElementById('m-plante-mere').checked = false;
  majChampsMillesime('sachet');
  document.getElementById('m-sachets-reels').value = l.nb;
  majInfoDon();
  verifierDoublonEnDirect();
}

function chargerLigneAttente() {
  const id = parseInt(document.getElementById('m-attente').value);
  const l = semisEnAttente.find(x => x.id === id);
  if (!l) { annulerLigneAttente(); return; }

  const selV = document.getElementById('m-variete');
  const blocSans = document.getElementById('bloc-sans-variete');
  parcoursLigne = false;

  /* Ligne sans variété : le menu reste libre, boutons de création visibles */
  if (!l.varId) {
    ligneAttenteChoisie = l;
    selV.disabled = false;
    selV.value = '';
    chargerTypeMillesime();
    preremplirLigneSansVariete(l);
    blocSans.classList.remove('cache');
    showMsg('msg-millesime', 'Choisis la variété dans le menu, ou crée-la avec les boutons.', 'ok');
    return;
  }

  /* Ligne avec variété */
  blocSans.classList.add('cache');
  selV.value = l.varId;
  if (selV.value !== String(l.varId)) {
    showMsg('msg-millesime', 'Variété introuvable dans la liste (recharge le widget).', 'err');
    return;
  }
  ligneAttenteChoisie = l;
  selV.disabled = true;
  chargerTypeMillesime();

  document.getElementById('m-millesime').value = new Date().getFullYear();
  document.getElementById('m-nb-saisons').value = saisonsPourLigne(l);

  const produit = (l.mil && l.mil.planteMere) || l.seme;
  appliquerOrigines(produit ? [ORIGINE_PRODUCTION] : l.originesOr);

  document.getElementById('m-sachet-check').checked = true;
  document.getElementById('m-plante-mere').checked = false;
  majChampsMillesime('sachet');

  document.getElementById('m-sachets-reels').value = l.nb;
  majInfoDon();
  verifierDoublonEnDirect();

  if (getOrigines().length < 2) {
    showMsg('msg-millesime', "Origine non reconnue : choisis-la à la main.", 'err');
  }
  document.getElementById('m-qtte').focus();
}

/* Ligne sans variété → panneau Variété (la note préremplit le Nom, modifiable) */
function allerCreerVariete() {
  if (!ligneAttenteChoisie