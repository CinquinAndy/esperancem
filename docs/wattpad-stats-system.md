# Chiffres Wattpad (lectures, votes, chapitres)

## Principe

Le site n'affiche jamais un chiffre lu en direct sur Wattpad. Il affiche la **dernière valeur connue bonne** :

1. **Relevé** : toutes les 6 heures (et 10 s après chaque démarrage), le serveur Next.js lui-même interroge
   Wattpad (`src/instrumentation.ts` → `src/lib/cron/wattpad-stats.ts`). Rien à installer sur la machine.
2. **Source** : l'API JSON publique de Wattpad (`/api/v3/stories/<id>`), non documentée mais stable ; en secours,
   la page du roman, lue par ses libellés d'accessibilité (« Reads 366,177 »), jamais par ses classes CSS générées.
3. **Validation avant écriture** (`src/lib/wattpad-sync/validation.ts`) : nombres exacts uniquement (pas « 366K »),
   jamais 0, votes ≤ lectures. Un recul des lectures (ou des votes au-delà de 2 %, ou plus de 2 chapitres) et un
   bond au-delà de ×3 sont refusés tant que 3 relevés successifs ne les confirment pas.
4. **Stockage** : la collection PocketBase existante `wattpad_stats`, mêmes champs qu'avant. Aucune migration.
5. **Affichage** (`src/lib/wattpad-sync/display.ts`) : la plus avancée en lectures parmi PocketBase, la mémoire du
   processus et le relevé committé `src/data/wattpad-releve.json`. Un chiffre affiché ne recule donc pas et ne vaut
   jamais 0, même si PocketBase est injoignable au build ou au rendu.

Les routes publiques (`/api/wattpad-stats`, `/[book]`, `/total`) sont en lecture seule : une visite ne déclenche
jamais d'appel à Wattpad ni d'écriture.

## Santé (pour le QG)

`GET /api/wattpad-stats/health`, publique, sans secret :

- `statut` : `ok`, `en-retard` (dernière confirmation Wattpad > 24 h) ou `degrade` (PocketBase injoignable ou sans
  valeur valide) ;
- `livres` : chiffres affichés, `source`, `verifieLe`, `ageHeures` ;
- `synchro` : dernière tentative, échecs consécutifs, résultat et motif par roman (`ecrit`, `refuse`,
  `echec-wattpad`, `echec-ecriture`, `pocketbase-injoignable`).

La dernière tentative est gardée en mémoire : après un redémarrage, elle est vide jusqu'au relevé de +10 s.

## Commandes

```bash
# Relevé immédiat (protégé ; au plus un par quart d'heure)
curl -H "Authorization: Bearer $REVALIDATE_SECRET" https://esperancem.fr/api/cron/update-wattpad-stats

# Relevé immédiat sans attendre le quart d'heure (ADMIN_SECRET)
curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" https://esperancem.fr/api/admin/wattpad-stats

# Remonter le plancher committé (à faire de temps en temps, puis committer)
node scripts/wattpad-releve.mjs
```

`WATTPAD_SYNC=off` coupe le relevé planifié ; `WATTPAD_BASE_URL` change l'hôte interrogé (tests).

## Tests

```bash
bun run test                 # unitaires : chaque mode de panne
bun run build && bun run test:integration   # vrai serveur Next + faux PocketBase/Wattpad
PLAYWRIGHT_PATH=… E2E_BASE=http://127.0.0.1:3000 node tests/e2e/accueil.e2e.mjs   # navigateur
```

Les tests d'intégration régénèrent des pages dans `.next` : refaire `bun run build` avant de servir ce build.

## Pannes connues et réponse

| Situation                                  | Avant                                      | Maintenant                                        |
| ------------------------------------------ | ------------------------------------------ | ------------------------------------------------- |
| Wattpad refuse (403, 429) ou délai dépassé | zéros écrits en base, compteurs à 0        | rien écrit, dernière valeur gardée, échec visible |
| Wattpad change sa page (classes CSS)       | zéros écrits                               | API JSON d'abord ; page lue par ses libellés      |
| Réponse partielle ou abrégée (« 366K »)    | valeur fausse (« 0k+ » sur /about)         | refusée                                           |
| Redémarrage pendant une panne Wattpad      | zéros écrits 10 s après le démarrage       | rien écrit                                        |
| PocketBase injoignable au build            | « Plus de ... lectures » figé dans la page | relevé committé                                   |
| Appel du navigateur aux routes qui échoue  | compteurs à 0                              | chiffres déjà dans la page                        |
| Route de synchro publique                  | n'importe qui déclenchait une écriture     | protégée par `REVALIDATE_SECRET`                  |
