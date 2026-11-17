# À faire dans les autres outils (non traité par `a_gerer`)

## Commun
- [ ] `scriptcommun.js`, `dateAffichee` : ajouter `if (typeof secondes !== 'number') return '?';` ; tester les 4 outils.
- [ ] Nettoyer `styles_commun.css` (voir la liste « inutilisé » de la dernière revue) après avoir cherché chaque nom dans tous les outils.
- [ ] Rechercher dans tous les outils : `function dateDuJour`, `function dateEnSecondes`, `function lieuxFiltres`, `function correspondRecherche`, `function choixColonne`, `function libelle`, `mots.every`, `LIEUX.filter` (copies locales masquant le commun).
- [ ] Appliquer la convention BEM sur tous les outils en même temps.
- [ ] Tester sur tablette après le push de la branche : menus « Où », clavier numérique, bouton collé, bandeau collé.

## Changements du commun qui touchent les autres outils
- `.liste-choix` est passée en `position: relative` : vérifier les menus déroulants de `semis_realises` (variété, millésime, type, lieux). Si besoin, remettre `absolute` dans le commun ou isoler `a_gerer`.
- `.div-champ` n'a plus `display: flex`.
- `.btn` a `margin-right: 8px`, `.champ` a `margin-top: 4px`, `label` n'a plus de marge.
- Classes renommées ou supprimées : `.pastille` → `.pastille-look.choix.ici`, `.pastilles` → `.div-bloc-ou`, `.cadre-info-titre` → `.info-titre`, `.case input` → `input[type="checkbox"]`, `.btn-choix` supprimée, `.champ-select::after` commentée.

## `achat-repro` (ne charge pas encore `scriptcommun.js`)
> Contexte : `a_gerer` gère les plantes mères avec une ligne `Millesimes` (`Plante_mere` cochée) et une ligne `Semis` sans godets ni graines, une par plante mère. Il lit `Ou` de cette ligne pour savoir où est la plante, et la contrôle au printemps suivant.
> 1. Brancher `scriptcommun.js` et retirer la copie locale de `normaliser`.
> 2. Quand « Plante mère » est cochée, ajouter : **emplacement(s)** (choix multiple, mêmes choix que `Semis.Ou`, via `lireChoixColonnes('Semis', ['Ou'])`, obligatoire) et **nombre de plants** (entier ≥ 1, obligatoire).
> 3. Dans `creerMillesime`, la ligne `Semis` reçoit `Ou: ['L', ...emplacements]` et `Plantes: <nombre>` à la place de `1`. Pas de `Nb_godets` ni `Nb_graines`. `Nb_etiquettes: 0` inchangé.
> 4. Ne pas écrire `Controle_mere` ni `Statut_mere` : la plante doit être proposée au contrôle l'année suivante.

## `semis_realises`
- [ ] Adapter les classes renommées (voir ci-dessus).
- [ ] Une case « Plante mère » n'y est probablement pas à sa place (voir cas 3).

## Cas 3 : un semis maison devient plante mère (menthe)
- [ ] Piste : case « Garder comme plante mère » sur la carte de « À planter », créant à l'enregistrement un millésime (origine AR, année de plantation = année en cours, `Plante_mere` cochée) et une ligne `Semis` de plante mère (lieu et nombre gardés).
- [ ] Laisser `Plantes` de la ligne d'origine inchangé (la réduire ferait réapparaître la carte dans « À planter »).
- [ ] Conséquence : la plante apparaît deux fois dans « Sélection pour étiquettes ».

## `gestion_etiquettes`
- [ ] `filtrerParRecherche` : utiliser `correspondRecherche`.
- [ ] Vérifier le comportement avec les plantes mères « Mortes » (`Plante_mere` décochée) et leur `Plantes = 0`.

## Étiquettes à la récolte
- [ ] `Nb_etiquettes` se remplit à la récolte, avec l'outil millésime. À décider : lien entre le millésime récolté et le semis d'origine, sens du nombre d'étiquettes (un pour soi, le reste au don), lignes pour les plantes mères.

## Grist
- [ ] Supprimer les colonnes inutilisées : `Lieux_morts`, `Annuelle`.
- [ ] Données : 7 plantes mères sur 117 n'avaient pas de ligne `Semis` de plante mère (110 trouvées) : les compléter ou les laisser se créer via « Encore là ».
- [ ] Date affichée des 4 autres outils. dateAffichee(s.date) affiche « 01/01/1970 » si la date est vide.	Dans scriptcommun.js, première ligne de dateAffichee : if (typeof secondes !== 'number') return '?';. Teste les 4 outils.
- [ ] .div-champ n’a plus display: flex. Ses flex-wrap, align-items et column-gap n’agissent pas (ligne Filtrer/Trier, date de plantation).	Ajoute display: flex;, ou fusionne avec .div-champ-carte (voir §3). Le menu liste-choix s'ouvre par dessus la carte, il doit s'ouvrir sous le champ
- [ ] .liste-choix est passée en position: relative. Le menu pousse maintenant le contenu au lieu de se superposer, et z-index et .champ-liste { position: relative } ne servent plus.	Si c’est voulu, garde-le et retire ces deux règles. Sinon remets position: absolute; left: 0; right: 0;. Vérifie semis_realises : ses menus (variété, millésime, type) comptaient sur le menu superposé.