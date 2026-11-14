# Granothèque : outil « À gérer » (`a_gerer`)

Ancien nom : `semis_gestion`. Écrit d'après les fichiers collés (JS, HTML, `styles_commun.css`, `scriptcommun.js`). Le `a_gerer.css` collé était coupé : voir section 13.

## 1. Rôle

Widget Grist qui remplace la vue Grist « à gérer ». Il sert à :
1. noter la germination des semis réalisés (germes ou NG) ;
2. noter les plantations (plantés, oups, dons) et leur emplacement (Où) ;
3. contrôler les plantes mères (« Encore là » ou « Morte », par lieu).

PC et tablette, pas d'impression. Lit et écrit dans `Semis` et `Millesimes`.

## 2. Fichiers

| Fichier | Rôle |
|---|---|
| `a_gerer.html` | Structure, 5 zones Vue |
| `a_gerer.css` | Styles propres à l'outil |
| `a_gerer.js` | Données, calculs, enregistrement |
| `../../styles/styles_commun.css` | Variables, cartes, champs, boutons, textes |
| `../../script/scriptcommun.js` | Fonctions communes |

Ordre des `<script>` en fin de `<body>` : `grist-plugin-api.js`, Vue 3.4.38 (unpkg), `scriptcommun.js`, `a_gerer.js`. Accès : `requiredAccess: 'full'`.

## 3. Données

**`Semis` lues :** `Nom`, `Variete`, `Date_s`, `Nb_godets`, `Nb_graines`, `Graines_semees`, `Plantes`, `Oups`, `Don_p`, `Reste_a_planter`, `Plante_mere`, `Ou`, `Millesime`, `Date_p`, `Germes`, `Germination_duree`, `Info_germination`.
**`Millesimes` lues :** `Nom`, `Variete`, `Plante_mere`, `Annee_plantation`, `Statut_mere`, `Controle_mere`.
**Métadonnées :** choix de `Semis.Ou`, via `lireChoixColonnes`.
**Écrites :** `Semis` : `Germes`, `Plantes`, `Date_p`, `Ou`, `Oups`, `Don_p`. `Millesimes` : `Statut_mere`, `Controle_mere`, `Plante_mere`.

**Colonnes Grist à avoir créées en colonnes de données :** `Millesimes.Statut_mere` (Choix : `Vivante`, `Morte`) et `Millesimes.Controle_mere` (Date). `Lieux_morts` et `Annuelle` ne servent plus : à supprimer.

**Plantes mères :** une ligne `Millesimes` (`Plante_mere` cochée) et une ligne `Semis` par plante, sans godets ni graines, avec `Date_s`, `Plantes`, `Ou` (plusieurs lieux possibles).
- `estLigneMere(s)` : `planteMere && millesimeId > 0 && godets === 0 && graines === 0`.
- `sansQuantite(s)` : `millesimeId > 0 && godets === 0 && graines === 0`. Sert à masquer ces lignes dans « À vérifier », même pour une plante devenue « Morte ».

## 4. Fonctionnalités

**Bandeau collé :** titre, statut, boutons « À vérifier (n) » / « À planter (n) » (défilement), succès (5 s), erreur générale.
**Recherche et tri :** nom ou variété, accents ignorés, plusieurs mots ; titres « (3 sur 12) » ; tri habituel ou par nom ; une saisie sur une carte masquée est conservée.

**« À vérifier »**
- Semis avec `Date_s`, sans `Germes`, hors `sansQuantite`, durée dépassée (`Info_germination` est un nombre).
- Case « Inclure les semis sans durée de germination (12 derniers mois) », cochée par défaut ; ils passent après les semis en retard.
- Carte : champ « Germes », bouton « NG » (1er clic 0, 2e clic annule), alerte rouge si germes > semées.
- Récapitulatif « En cours » (clic = défiler, ✕ = annuler) ; erreurs d'enregistrement dessous.

**Contrôle des plantes mères** (dans « À vérifier », case décochée par défaut)
- Par défaut : plantées avant l'année en cours et pas contrôlées cette année. Case « Inclure aussi celles plantées ou contrôlées cette année » pour tout revoir.
- Carte : « 🌱 Plante mère plantée en … · dernier contrôle … / jamais contrôlée », puis « 📍 lieux » (réunion des `Ou` des lignes `Semis` de la plante) ou « emplacement inconnu ».
- Boutons « Encore là » / « Morte » sur la même ligne que les lieux (`.ligne-mere`, retour à la ligne si besoin). Un second clic annule.
- « Morte », plante à plusieurs lieux : « Morte à : » puis une pastille par lieu. **Tous violets au départ ; tu coches ceux où elle est morte** (blanc à bordure rouge).
- Effet à l'enregistrement (`effetMere`) :
  - « Encore là » : `Statut_mere = Vivante`, `Controle_mere = aujourd'hui`.
  - « Morte », un seul lieu ou lieu inconnu : `Plante_mere` décochée, `Statut_mere = Morte`, lieu retiré de `Ou`, `Plantes = 0`.
  - plusieurs lieux, tous cochés : idem.
  - plusieurs lieux, certains cochés : `Plante_mere` reste cochée, `Statut_mere = Vivante`, seuls ces lieux sont retirés de `Ou`, `Plantes` inchangé.
  - plusieurs lieux, aucun coché : **enregistrement refusé** (« Coche les lieux où la plante est morte »).

**« À planter »**
- `Germes > 0`, `Reste_a_planter > 0`, hors plantes mères ; du plus ancien au plus récent.
- Carte : « Plantés », « Oups », « Don », « Tout », sélecteur « Où » (pastilles ✕, liste filtrable, un seul menu ouvert, fermé après chaque choix).
- Date de plantation commune ; alerte rouge si plantés + oups + don > reste.
- `Ou` vide dans Grist et « Plantés » > 0 : message rouge sur la carte et refus à l'enregistrement. `Ou` rempli : facultatif, message violet « 📍 Les plants resteront à : … ». Les nouveaux lieux s'ajoutent sans doublon.

**Enregistrement**
- Un seul bouton « Enregistrer tout », collé en bas, visible s'il y a des saisies.
- Contrôles avant écriture : date de plantation, `Ou` des cartes sans lieu, lieux morts cochés.
- Puis rechargement de `Semis` et comparaison (`Germes`, `Plantes`, `Oups`, `Don_p`, `Ou`) : si une ligne a changé dans Grist, rien n'est enregistré et l'erreur nomme les lignes sous la section concernée.
- Un seul `applyUserActions`. Quantités **ajoutées** aux valeurs chargées. `Date_p` écrasée (pas besoin de garder l'ancienne).
- Les erreurs apparaissent sous le récapitulatif de la section, la page défile jusque-là, le bandeau dit « Rien n'est enregistré : voir … ».
- Échec d'envoi : saisies conservées. Rechargement en échec après succès : message distinct.

## 5. Choix techniques

- **Vue** : zones `#appEntete` (le `<header>`), `#appRecherche`, `#appVerifier`, `#appPlanter`, `#appEnregistrer`. Un seul objet `etat`. Toute fonction appelée par le HTML doit être dans le `return` du `setup`.
- **Saisies** : `etat.saisies[idSemis] = { germes, plantes, oups, don, ou }` ; `etat.saisiesMeres[idMillesime] = { statut, morts }`. Les ids de `Semis` et `Millesimes` se recoupent : ne jamais les mélanger.
- Statut, liseré orange, alertes, récapitulatifs se **déduisent** des données ; rien n'est posé à la main sur le DOM.
- `Map` non suivies par Vue : listes copiées dans `etat` par `recalculerVerifier`, `recalculerPlanter`, `recalculerMeres`.
- `Vue.watch` : (1) recherche / tri / cases → recalcul des trois listes ; (2) `etat.saisies` (deep) → `sessionStorage` (clé `a_gerer_saisies`, restauration puis `purgerSaisiesOrphelines`). `saisiesMeres` n'est pas sauvegardé.
- `#appEnregistrer { display: contents; }` pour que le bouton sticky reste collé.
- ChoiceList Grist : `['L', 'a', 'b']`. Dates : secondes UTC à minuit.
- `afficherSucces` = `creerMessageTemporaire` (commun).

## 6. Fonctions de `a_gerer.js`

- **Sauvegarde :** `sauvegarderSaisies`, `restaurerSaisies`, `purgerSaisiesOrphelines`.
- **Saisies :** `saisieVide`, `saisieDe`, `majSaisie`, `aPlantation`, `saisiesGermes`, `saisiesPlantation`, `nombreSaisies`, `texteStatut`, `retirerSaisie`.
- **Récapitulatifs :** `recapGermes`, `recapPlantation`, `recapMeres`.
- **Défilement / erreurs :** `aller`, `allerCarte`, `effacerErreurs`, `refuser`.
- **Chargement :** `chargerSemis`, `chargerMillesimes`, `chargerChoix`.
- **Plantes mères :** `meresAControler`, `estLigneMere`, `sansQuantite`, `lieuxParMillesime`, `recalculerMeres`, `detailMere`, `ouMere`, `statutMere`, `choisirStatutMere`, `lieuMort`, `basculerLieuMort`, `effetMere`, `retirerMere`.
- **À vérifier :** `semisAVerifier`, `recalculerVerifier`, `titreVerifier`, `detailVerifier`, `mentionVerifier`, `aGermes`, `valeurGermes`, `surGermes`, `basculerNG`, `alerteGermes`.
- **Recherche / tri :** `rechercheNormalisee`, `filtrerParRecherche`, `trierListe`.
- **À planter :** `semisAPlanter`, `CHAMPS_PLANTER`, `recalculerPlanter`, `titrePlanter`, `detailPlanter`, `aPlantationDe`, `valeurQuantite`, `surQuantite`, `toutPlanter`, `alertePlanter`.
- **Où :** `ouDe`, `placeholderOu`, `lieuxProposes`, `ouvrirOu`, `fermerOu`, `surRechercheOu`, `ajouterLieu`, `retirerLieu`, `infoOu`.
- **Enregistrement :** `lignesModifiees`, `afficherSucces`, `enregistrerTout`.

## 7. Commun

**`scriptcommun.js` :** `tableEnLignes`, `listeChoix`, `normaliser`, `anneeDepuisDate`, `dateAffichee`, `dateDuJour`, `dateEnSecondes`, `typeInverse`, `libelle` (tiret simple « - »), `lieuxFiltres`, `correspondRecherche`, `choixColonne`, `lireChoixColonnes` (appelle `grist` : plugin chargé avant), `creerMessageTemporaire`.

**`styles_commun.css` (état collé) :**
- Sections : variables, base (`label` 0.9rem, `h2` 1.1rem, `h3` 1rem), champs, case à cocher, liste déroulante, pastilles, cadres, cartes, boutons, textes, mise en page.
- Pastilles : conteneur `.pastille-orga` ; pastille `.pastille-look.choix` avec `.ici` (violet) ou `.info` (bleu).
- Textes : `.info`, `.info-titre`, `.texte-etape`, `.texte-ici`, `.texte-plantemere`, `.message` (0.75rem), `.succes`, `.erreur`.
- Renommé par rapport à l'ancien : `.pastille` → `.pastille-look.choix`, `.pastilles` → `.pastille-orga`, `.cadre-info-titre` → `.info-titre`.
- Encore présents, à vérifier avant suppression : `.etape-intermediaire`, `.liste-etape-intermediaires`, `.confirmation*`, `.btn-annuler`, `.btn-valider`.
- Une règle `.h3` de test (font-size 2rem) n'y figure plus.

**`semis_realises.js` :** `dateDuJour`, `dateEnSecondes` retirées ; `lieuxProposes`, `afficherResultats`, `chargerChoix` réécrites avec le commun ; liste de secours des types et lieux supprimée ; `afficherSucces` via `creerMessageTemporaire`.
**`gestion_etiquettes.js` :** `afficherSucces` via `creerMessageTemporaire`.

## 8. Limites connues

- Les lignes `Semis` sans godets ni graines rattachées à un millésime sont masquées dans « À vérifier » (`sansQuantite`), même si ce sont de vrais semis incomplets.
- Si une plante mère a plusieurs lignes `Semis` de plante mère, « Morte » modifie `Ou` et met `Plantes` à 0 sur chacune. Non vérifié sur tes données (voir section 9).
- Quantités = ajouts calculés sur les valeurs chargées ; la détection de modification ne couvre que `Semis`, pas `Millesimes`.
- Pas de correction d'une valeur déjà enregistrée, pas d'annulation d'un « Morte » (corriger dans Grist), pas d'écoute des changements faits ailleurs (recharger).
- Si `Graines_semees` vaut 0 : pas d'alerte « trop de germes ».
- Lecture des emplacements en échec : `LIEUX` vide, cartes sans `Ou` bloquées.
- Choix sur les plantes mères perdus au rechargement.
- Plante mère sans `Ou` sur sa ligne `Semis` : « emplacement inconnu ».
- Plante replantée après un « Morte » : recocher `Plante_mere`, vider `Statut_mere` et `Controle_mere` dans Grist.
- Une annuelle morte à l'automne reste plante mère jusqu'au contrôle du printemps.
- Sans « ✝ », seule la couleur distingue un lieu mort.
- Une seule `Date_p` par semis.

## 9. Reste à faire

**À appliquer maintenant :** les 4 modifications de la section 2 du message précédent (pastilles inversées, récap, refus sans lieu coché, CSS `.morte` / `.texte-morte`).

**Diagnostic console (facultatif, à refaire correctement) :** taper dans la ligne « » (pas dans le filtre) : nombre de lignes `estLigneMere` (attendu proche de 117), nombre de plantes mères avec plusieurs lignes `Semis` (attendu proche de 0). Si doublons : les corriger à la main dans Grist.

**Après le push de la branche :** tester sur tablette (menu « Où » et défilement, clavier numérique, bouton collé avec le clavier ouvert, champs en vertical/horizontal, bandeau, pastilles de lieux morts). Vérifier que `sessionStorage` marche dans le widget (F5 avec une saisie).

**`achat-repro` (autre discussion ; ne charge pas encore `scriptcommun.js`)** — prompt :
> Contexte : `a_gerer` gère les plantes mères avec une ligne `Millesimes` (`Plante_mere` cochée) et une ligne `Semis` sans godets ni graines, une par plante mère. Il lit `Ou` de cette ligne pour savoir où est la plante, et la contrôle au printemps suivant.
> 1. Brancher `scriptcommun.js` dans le HTML, puis retirer la copie locale de `normaliser`.
> 2. Quand « Plante mère » est cochée, ajouter : **emplacement(s)** (choix multiple, mêmes choix que `Semis.Ou`, via `lireChoixColonnes('Semis', ['Ou'])`, obligatoire) et **nombre de plants** (entier ≥ 1, obligatoire).
> 3. Dans `creerMillesime`, étape « Plante mère » : la ligne `Semis` reçoit `Ou: ['L', ...emplacements]` et `Plantes: <nombre>` à la place de `1`. Pas de `Nb_godets` ni `Nb_graines`. `Nb_etiquettes: 0` inchangé.
> 4. Ne pas écrire `Controle_mere` ni `Statut_mere` : la plante doit être proposée au contrôle l'année suivante.

**Cas 3 (semis maison qui devient plante mère, ex. menthe) :** piste = case « Garder comme plante mère » sur la carte de « À planter », créant à l'enregistrement un millésime (origine AR, année de plantation = année en cours, `Plante_mere` cochée) et une ligne `Semis` de plante mère (lieu, nombre gardés). Laisser `Plantes` de la ligne d'origine inchangé (la réduire ferait réapparaître la carte dans « À planter »). Conséquence : la plante apparaît deux fois dans « Sélection pour étiquettes ».

**`semis_realises` (autre discussion) :** adapter les classes renommées : `cadre-info-titre` → `info-titre`, `pastille` → `pastille-look choix ici`, `pastilles` → `pastille-orga`. Une case « Plante mère » n'y est probablement pas à la bonne place (voir cas 3).

**Étiquettes à la récolte :** `Nb_etiquettes` se remplit à la récolte, avec l'outil millésime. Questions : lien entre le millésime récolté et le semis d'origine, sens du nombre d'étiquettes (un pour soi, le reste au don), lignes pour les plantes mères.

**CSS / commun :** finir le nettoyage de `styles_commun.css` (rechercher `etape-intermediaire`, `cadre-etape`, `semis-retard`, `confirmation`, `btn-annuler`, `btn-valider` dans tous les outils ; supprimer les blocs à 0 résultat) ; remplacer `#1565c0` et `#3f7d4e` par des variables ; chercher dans « À semer » et « Sélection pour étiquettes » les doublons (`function dateDuJour`, `dateEnSecondes`, `lieuxFiltres`, `correspondRecherche`, `choixColonne`, `libelle`, `mots.every`, `LIEUX.filter`). Ordre en prod : commun puis outils ; ouvrir les quatre outils après chaque changement du commun. BEM sur tous les outils en même temps.

**Améliorations possibles :** sauvegarder `saisiesMeres` ; bouton « Corriger » (remplacer plutôt qu'ajouter) ; compteur sous le titre.

## 10. Journal

1. Trois étapes (À vérifier, À planter, un seul « Enregistrer tout »), tests après chacune.
2. Alertes, recherche, bouton collé, « Où » obligatoire si `Ou` vide, fenêtre de confirmation puis message sur la carte.
3. Harmonisation avec le commun, retrait des copies locales.
4. Conversion Vue en 5 morceaux.
5. Nettoyage du code.
6. Détection d'une ligne modifiée, sauvegarde des saisies, message de succès temporaire, « 0 » conservé, date de dernière plantation, tri.
7. « À vérifier » : semis sans durée inclus (12 mois, case), lignes sans quantité masquées.
8. Bandeau collé, récapitulatifs « En cours », erreurs sous les sections.
9. Plantes mères : `Statut_mere`, `Controle_mere`, contrôle de printemps, lieux, mort partielle, une ligne `Semis` par plante.
10. Corrections CSS du commun, refonte des noms de classes de pastilles, phrase « retrouvées » supprimée.
11. Pastilles de lieux : départ en violet, tu coches les lieux morts ; refus d'enregistrer sans lieu coché.

## 11. Pièges rencontrés

- **« n cachés » dans la console = nombre de messages filtrés, pas un résultat.** Taper les commandes sur la ligne « » ; vider le filtre.
- **Remplacer tout sur un mot** touche les noms de variables (`const etape-intermediaire` = soustraction).
- **Copie locale d'une fonction commune** : elle masque le commun sans erreur.
- **Fonction oubliée dans le `return` du `setup`** : `Property "xxx" was accessed during render…`.
- **Map non suivie par Vue** : copier la liste dans `etat`.
- **Écouteur JS posé dans une zone Vue** : perdu au redessin.
- **CSS** : `.statut.` (point en trop), commentaire sans `/* */`, `'10'px`, ligne vide après un sélecteur à virgule invalident la règle suivante. `h3 { }` cible la balise, `.h3 { }` la classe.
- **`:class="{ x: cond }"`** ajoute `x` quand `cond` est vraie ; ne pas inverser classe fixe et conditionnelle. En cas d'égalité de poids, la règle écrite en dernier gagne.
- **Classe renommée dans le commun** : les outils qui l'utilisent perdent leur style sans erreur.
- **`Statut_mere` / `Controle_mere` en colonnes formule** : écriture refusée ; les convertir en données. `Lieux_morts` créée en `Choice` au lieu de `ChoiceList` (colonne abandonnée).
- **Ids de `Semis` et `Millesimes` qui se recoupent.**
- **Bouton sticky dans une zone Vue** : `display: contents`.
- **Deux `<div class="saisie">` imbriqués** : les pastilles se plaçaient à côté des boutons.
- **Chemins** `../../styles/`, `../../script/` ; Ctrl+F5 après un changement du commun.

## 12. Checklist de test

1. Statut « Chargement… » puis « ✓ À jour » ; titres et boutons du bandeau justes ; bandeau collé, défilement sans passer dessous.
2. Germes : liseré orange, `Non sauvegardé (1)`, ligne « En cours », bouton collé. NG : 1er clic 0, 2e annule. Trop de germes : message rouge.
3. Recherche : deux mots, accents ignorés, « (n sur N) » ; saisie sur carte masquée conservée ; clic sur sa ligne de récap vide la recherche et défile.
4. « À vérifier » sans ligne de plante mère. Case « sans durée » : décocher les retire.
5. « À planter » : « Tout », « 0 » conservé, dépassement en rouge, date de plantation.
6. Où : menu filtrable, fermé après choix, rouvert au toucher, un seul ouvert. `Ou` vide + « Plantés » : rouge sur la carte, refus avec défilement. `Ou` rempli : violet.
7. Plantes mères : « Encore là » → `Vivante` + `Controle_mere`, carte disparaît. « Morte » un lieu → `Plante_mere` décochée, `Ou` vidé, `Plantes = 0`. Plusieurs lieux : tous violets au départ ; un lieu coché → seul celui-ci retiré, `Plante_mere` cochée ; aucun coché → refus.
8. Case « Inclure aussi celles plantées ou contrôlées cette année » : les contrôlées reviennent.
9. Modifier `Oups` dans Grist pendant une saisie sur la même ligne, puis enregistrer : rien d'enregistré, erreur sous la section.
10. Germes + plantation + plante mère ensemble : un seul envoi, succès 5 s, récaps vidés.
11. F5 avec saisies : le navigateur prévient, les saisies reviennent (si `sessionStorage` autorisé).
12. Ouvrir les quatre outils après toute modification du commun.

## 13. Ce que je n'ai pas pu vérifier

- `semis_realises`, `gestion_etiquettes`, « À semer », `achat-repro` dans leur état final.
- `sessionStorage` dans le widget, tous les tests tablette, le rendu des pastilles « mortes » après la correction.