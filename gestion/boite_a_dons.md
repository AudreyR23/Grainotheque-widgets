# Boîte à dons (Granothèque Grist)

Page publique consultable par lien, sans compte Grist, pour voir les graines données et indiquer lesquelles on veut. Elle est alimentée par un fichier `dons.json` généré depuis Grist.

## 1. Vue d'ensemble

```
Grist (table Millesimes, colonne Don)
   │  widget « générateur » : bouton Générer → Télécharger
   ▼
dons.json  ──(dépôt manuel sur GitHub)──►  GitHub Pages
                                              │
                                              ▼
                               boite_a_dons.html (page publique)
```

- La page publique **ne parle jamais à Grist**. Seul le contenu de `dons.json` est exposé.
- Le dépôt GitHub est public, donc `dons.json` l'est aussi.
- Aucune coordonnée personnelle (tél., mail) dans le code : les gens te contactent par le canal où ils te connaissent.

## 2. Fichiers

| Fichier | Rôle |
|---|---|
| `generateur_dons.html` | Widget Grist (accès complet au document) |
| `script/generateur_dons.js` | Lit `Varietes` et `Millesimes`, filtre `Don > 0`, produit le JSON |
| `styles/generateur_dons.css` | Style du widget |
| `boite_a_dons.html` | Page publique |
| `script/boite_a_dons.js` | Logique de la page |
| `styles/boite_a_dons.css` | Style de la page (thème sombre) |
| `dons.json` | Données publiées, placé à côté du HTML |

Chemins relatifs : `../script/…`, `../styles/…`, `./dons.json`. Les arborescences dev et prod doivent être identiques.

## 3. Format de `dons.json`

```json
{
  "genere_le": "2026-10-26T10:00:00.000Z",
  "varietes": [
    {
      "id": 12,
      "nom": "Agastache",
      "variete": "A fleurs blanches",
      "description": "…",
      "type": "Arom.Méd",
      "famille": ["Aromatique", "Mellifère"],
      "exposition": "…",
      "arrosage": "…",
      "nature_du_sol": [],
      "qualite_du_sol": [],
      "ou_cultiver": ["PT", "Pot"],
      "infos": [],
      "semis_sous_abris": ["Mar", "Avr"],
      "semis_pleine_terre": [],
      "recolte_floraison": ["Jui", "Juil"],
      "semis_profondeur": "0 cm",
      "duree_germ": 21,
      "temp_germ": "20-22°",
      "conservation": 5,
      "millesimes": [{ "sachets": 2 }]
    }
  ]
}
```

- Une entrée par **variété** ayant au moins un millésime avec `Don > 0`.
- Seul `millesimes[].sachets` sert à la page : le total de sachets est la somme de ces valeurs. Il faut donc garder le tableau `millesimes`.
- `conservation` est exporté mais non affiché.
- Le widget générateur retire le `"L"` que Grist place en tête des ChoiceList.

## 4. Fonctionnalités de la page publique

- **Cartes** : une par variété (nom, variété en italique, description, badge rouge « N sachets »). Les millésimes et origines ne sont pas affichés.
- **Fiche dépliable** (`<details>`, « Voir la fiche ») :
  - bloc *Culture* : type, famille, exposition, arrosage, où cultiver, nature et qualité du sol, infos ;
  - bloc *Semis & germination* : semis s/abri, semis PT, récolte, profondeur, durée de germination, température de germination.
- **Pastilles de type** : générées depuis le JSON, avec le nombre de variétés, plus « Tous ». Les nombres restent ceux de la liste complète.
- **Recherche texte** : sur nom, variété et description. Ignore accents et majuscules, plusieurs mots possibles (tous requis, ordre libre).
- **Filtre « À semer en »** : liste déroulante (tous les mois, janvier à décembre). Une variété reste si le mois figure dans `semis_sous_abris` ou `semis_pleine_terre`.
- **Les trois filtres se combinent** (type + mois + texte). Le sous-titre indique le nombre de résultats, les filtres actifs et la date de mise à jour.
- **Sélection « J'en veux »** : bouton qui devient `− n +`, limité au total de sachets disponible. Une barre fixe en bas affiche le résumé. La sélection est conservée quand les filtres changent.
- **Panneau « Ma sélection »** (`<dialog>`) : liste, champ prénom, message prérédigé mis à jour en direct, bouton « Copier le message », bouton « Partager » (menu natif du téléphone, affiché seulement si disponible), bouton « Fermer ».
- **Mémorisation** (`localStorage`, clé `boite_a_dons_selection`) : sélection et prénom. Au rechargement, les variétés absentes du JSON sont retirées et les quantités ramenées au maximum disponible. Si le stockage est indisponible (navigation privée), la page continue sans mémoriser.

## 5. Choix techniques

- **Page statique + JSON** plutôt qu'un document Grist partagé : confidentialité naturelle, rapide sur mobile, pas de compte.
- **Publication manuelle** (dépôt du JSON sur GitHub) plutôt qu'automatique : pas de jeton GitHub stocké dans un widget.
- **Pas de réservation** : une demande n'est qu'un message. `Don` ne change pas tout seul, tu le modifies à la main dans Grist puis tu republies.
- **Demande par message copié** : pas de serveur, pas de formulaire externe, aucune coordonnée dans le code.
- **Sécurité du rendu** : tout le texte est inséré via `textContent` (fonction `creer`), jamais en HTML brut.
- **`fetch('./dons.json?v=' + Date.now())`** : évite qu'un visiteur voie un ancien JSON après republication.
- **`click`** et non `pointer*` : suffisant pour de simples boutons, PC et tablette.
- **Pas de `modifie` / `majStatut()`** dans la page publique : il n'y a pas d'édition. `majStatut()` n'existe que dans le générateur, pour afficher l'état.
- **Variables d'état en haut du fichier** : `donnees`, `typeActif`, `selection` (Map id → nombre), `texteRecherche`, `moisChoisi`, `varietesParId` (Map), `CLE_STOCKAGE`.
- **Abréviations de mois** (reprises de la formule `A_semer_bientot`) : `Jan, Fév, Mar, Avr, Mai, Jui, Juil, Aou, Sep, Oct, Nov, Déc`. Ces valeurs doivent correspondre exactement à celles des listes de `Varietes`.
- **Pas de photos** : les attachements Grist ne sont pas accessibles sans compte.

## 6. Structure de `boite_a_dons.js`

| Section | Fonctions |
|---|---|
| Utilitaires | `creer`, `libelleSachets`, `totalSachets`, `normaliser` |
| Mémorisation | `sauvegarderSelection`, `restaurerSelection` |
| Sélection | `majBarre`, `changerQuantite`, `remplirSelecteur` |
| Rendu | `creerCarte`, `creerChamp`, `creerBloc`, `correspond`, `afficherListe` |
| Pastilles | `creerPastille`, `majPastilles`, `creerPastilles` |
| Panneau | `lignesSelection`, `construireMessage`, `ouvrirPanneau`, `copierMessage`, `partagerMessage`, `initialiserPanneau` |
| Filtres | `initialiserFiltres` |
| Démarrage | `demarrer` (ordre : charger le JSON → remplir `varietesParId` → `restaurerSelection` → pastilles → liste → panneau → filtres) |

**Ids HTML requis** (un manquant provoque « getElementById(...) is null ») :
`liste`, `sousTitre`, `pastilles`, `recherche`, `selectMois`, `barreSelection`, `resumeSelection`, `btnVoirSelection`, `panneau`, `listeSelection`, `prenom`, `message`, `btnCopier`, `btnPartager`, `btnFermer`, `retourCopie`.

## 7. Routine de publication

À chaque modification de `Don` dans Grist :

1. Widget générateur (prod) → **Générer**
2. **Télécharger dons.json** (sinon copier l'aperçu dans un fichier)
3. Remplacer `dons.json` dans le dossier prod du dépôt, commit, push
4. Attendre 1 à 2 minutes, recharger avec Ctrl+Maj+R

## 8. Dev / prod

- Même domaine `github.io` : dev et prod partagent le `localStorage`. En dev, utiliser une autre valeur de `CLE_STOCKAGE` (ex. `'boite_a_dons_selection_dev'`).
- Le widget Grist de publication doit pointer vers l'URL **prod** de `generateur_dons.html`, avec accès complet au document.
- Le lien à partager est celui de `boite_a_dons.html`, pas celui du dossier.

## 9. Confidentialité : points de vigilance

- `dons.json` est public. Il contient uniquement les variétés en don et les champs listés au §3.
- `annee` et `origine` ne sont plus utilisés par la page. **À vérifier dans `generateur_dons.js`** que les lignes `annee: …` et `origine: …` ont bien été retirées, car un champ présent dans le JSON reste visible même s'il ne s'affiche pas.
- Vérifier aussi que `dons.json` en ligne ne contient plus ces champs (régénérer et redéposer si besoin).

## 10. Limites connues

- Une demande n'est pas une réservation : deux personnes peuvent demander le même sachet.
- Les quantités se modifient depuis les cartes, pas depuis le panneau.
- Pas de bouton « Tout vider » (on revient à 0 avec les `−`).
- Les nombres sur les pastilles ne tiennent pas compte de la recherche ni du mois.
- Le filtre mois ne regarde que le mois choisi (pas le suivant).
- Aucune notification : tu ne sais pas qu'une demande est faite tant que la personne ne t'écrit pas.

## 11. Reste à faire / idées

- [ ] Vérifier la mise en prod complète (voir §7 et §8) : page ouverte en