# Checklist de test (PC puis téléphone)

## Avant
- [ ] Console (F12, filtre vidé) : aucun message rouge au chargement.
- [ ] Ctrl+F5 après tout changement du CSS ou du JS commun.

## Chargement
- [ ] La page s'affiche (pas d'accolades {{ }}, pas de page blanche).
- [ ] Titres et compteurs corrects.

## Saisie
- [ ] Une saisie : carte au liseré orange, statut « Non sauvegardé (n) », ligne dans « En cours ».
- [ ] Clic sur une ligne de « En cours » : ramène à la bonne carte.
- [ ] ✕ annule la saisie.
- [ ] Recherche : une saisie sur une carte masquée est conservée.

## Enregistrement
- [ ] Cas normal : valeurs justes dans Grist, saisies vidées, succès affiché 5 s.
- [ ] Cas refusé (lieu manquant, date vide) : message sous la bonne section, rien d'écrit.
- [ ] Valeur modifiée dans Grist pendant une saisie : rien n'est enregistré.

## Rechargement
- [ ] F5 avec une saisie en cours : elle revient.

## Téléphone
- [ ] Menus déroulants : s'ouvrent sous le champ, défilent sans sélection par erreur, se ferment après un choix.
- [ ] Clavier numérique dans les champs de quantité.
- [ ] Bandeau collé : ne masque pas le début des cartes.

## Si le commun a changé
- [ ] Ouvrir tous les outils qui en dépendent.