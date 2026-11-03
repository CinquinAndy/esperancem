#!/usr/bin/env bash
# Lance le build e2e et les tests Playwright (parcours, SEO, visuel) dans l'image officielle de Playwright,
# la même que la CI : les captures de référence n'ont de sens que dans cet environnement.
#   bun run test:visuel                 # vérifie
#   bun run test:visuel:maj             # régénère les références (tests/e2e/__captures__)
#   bash scripts/e2e-docker.sh --grep accueil --project telephone
# E2E_SANS_BUILD=1 réutilise le .next d'un précédent `build:e2e`.
set -euo pipefail
cd "$(dirname "$0")/.."
PLAYWRIGHT=$(node -p "require('./package.json').devDependencies['@playwright/test']")
BUN=$(node -p "require('./package.json').packageManager.split('@')[1]")
exec docker run --rm --init --ipc=host \
	--user "$(id -u):$(id -g)" -e HOME=/tmp/home -e CI="${CI:-}" -e E2E_SANS_BUILD="${E2E_SANS_BUILD:-}" \
	-v "$PWD:/work:z" -w /work \
	"mcr.microsoft.com/playwright:v${PLAYWRIGHT}-noble" \
	bash -c '
		set -euo pipefail
		mkdir -p "$HOME"
		npx --yes "bun@'"$BUN"'" install --frozen-lockfile
		[ -n "$E2E_SANS_BUILD" ] || node tests/e2e/construire.mjs
		npx playwright test "$@"
	' bash "$@"
