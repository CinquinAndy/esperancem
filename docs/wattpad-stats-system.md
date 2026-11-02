# Chiffres Wattpad (lectures, votes, chapitres)

## Principe

Le site n'affiche jamais un chiffre lu en direct sur Wattpad. Il affiche la **dernière valeur connue bonne** :

1. **Relevé** : toutes les 6 heures (et 10 s après chaque démarrage), le serveur Next.js lui-même interroge
   Wattpad (`src/instrumentation.ts` → `src/lib/cron/wattpad-stats.ts`). Rien à installer sur la machine.
2. **Source** : l'API JSON publique de Wattpad (`/api/v3/stories/<id>`), non documentée mais stable ; en secours,
   la page du roman, demandée en anglais et lue par ses libellés d'accessibilité (« Reads 366,177 », ou « Lectures 366,177 » si elle arrive en français), jamais par ses classes CSS générées.
3. **Validation avant écriture** (`src/lib/wattpad-sync/validation.ts`) : nombres exacts uniquement (pas « 366K »),
   jamais 0, votes ≤ lectures. Chaque chiffre est contrôlé, pas seulement le premier anormal : un recul (lectures ;
   votes au-delà de 2 % ; plus de 2 chapitres) ou un bond (lectures au-delà de ×1,5 ; votes au-delà de ×1,5 ou qui
   montent plus que les lectures, au-delà de 50 ; plus de 5 chapitres d'un coup) est refusé tant que 3 relevés
   successifs ne le confirment pas. Ne comptent comme confirmation que des relevés plausibles, avec exactement les
   mêmes anomalies (même nature, mêmes chiffres) et proches du relevé anormal précédent sur les trois chiffres
   (2 % d'écart au plus, ou 2 chapitres) ; un échec de lecture, un relevé invraisemblable
   (0…) ou un relevé normal remettent le compte à zéro. Une vraie correction de Wattpad donne une valeur stable,
   une erreur de format des valeurs sans rapport entre elles.
4. **Stockage** : la collection PocketBase existante `wattpad_stats`, mêmes champs qu'avant. Aucune migration.
   Lecture d'un enregistrement par roman (le plus récent actif), quelle que soit la taille de la collection.
5. **Affichage** (`src/lib/wattpad-sync/display.ts`) : parmi PocketBase, la mémoire du processus et le relevé
   committé `src/data/wattpad-releve.json`, la valeur la plus récemment confirmée par Wattpad (à égalité, la plus
   haute). Toutes ont été validées : un chiffre ne vaut jamais 0, ne recule que si le recul a été confirmé trois
   fois, et reste affiché si PocketBase est injoignable au build ou au rendu.
6. **Compteurs de l'accueil** (`src/components/WattpadStats.tsx`) : le HTML serveur porte les vrais chiffres (avec
   ou sans JavaScript). Un compteur déjà à l'écran au chargement ne bouge pas ; un compteur hors écran est remis
   à 0 sans être vu, puis compte jusqu'à la vraie valeur quand il arrive à l'écran. Avec « réduire les
   animations », pas de comptage.

Les routes publiques (`/api/wattpad-stats`, `/[book]`, `/total`) sont en lecture seule : une visite ne déclenche
jamais d'appel à Wattpad ni d'écriture.

## Santé (pour le QG)

`GET /api/wattpad-stats/health`, publique, sans secret. La lecture de PocketBase y est gardée 5 s
(`WATTPAD_HEALTH_CACHE_MS`, 0 dans les tests) ; l'état de la synchro est toujours celui du moment :

- `statut` : `ok`, `en-retard` (dernière confirmation Wattpad > 24 h) ou `degrade` (PocketBase injoignable ou sans
  valeur valide) ;
- `livres` : chiffres affichés, leur `source` et leur date (`valeurDu`), dernière synchro réussie (`verifieLe`,
  `ageHeures`) ;
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
PLAYWRIGHT_PATH=… bun run test:e2e   # navigateur, autonome (faux PocketBase + next start sur .next)
PLAYWRIGHT_PATH=… E2E_BASE=http://127.0.0.1:3000 node tests/e2e/accueil.e2e.mjs   # sur un serveur déjà lancé
```

Les tests d'intégration et le bout en bout autonome régénèrent des pages dans `.next` : refaire `bun run build`
avant de servir ce build.

## Pannes connues et réponse

| Situation                                  | Avant                                      | Maintenant                                        |
| ------------------------------------------ | ------------------------------------------ | ------------------------------------------------- |
| Wattpad refuse (403, 429) ou délai dépassé | zéros écrits en base, compteurs à 0        | rien écrit, dernière valeur gardée, échec visible |
| Wattpad change sa page (classes CSS)       | zéros écrits                               | API JSON d'abord ; page lue par ses libellés      |
| Réponse partielle ou abrégée (« 366K »)    | valeur fausse (« 0k+ » sur /about)         | refusée                                           |
| Redémarrage pendant une panne Wattpad      | zéros écrits 10 s après le démarrage       | rien écrit                                        |
| PocketBase injoignable au build            | « Plus de ... lectures » figé dans la page | relevé committé                                   |
| Appel du navigateur aux routes qui échoue  | compteurs à 0                              | chiffres déjà dans la page                        |
| HTML serveur, ou navigateur sans JS        | compteurs à 0                              | vrais chiffres                                    |
| Route de synchro publique                  | n'importe qui déclenchait une écriture     | protégée par `REVALIDATE_SECRET`                  |
