#!/usr/bin/env node
/**
 * Serveur des tests e2e : faux PocketBase (instantané figé) + `next start` sur le build de .next.
 * Prérequis : `bun run build:e2e` (build fait sur ce même instantané). Arrêt propre sur SIGINT/SIGTERM.
 *   node tests/e2e/serveur.mjs [port]
 */
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { demarrerInstantane } from '../donnees/serveur-instantane.mjs'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const port = Number(process.argv[2] ?? 3100)

const marque = join(racine, '.next', 'E2E_INSTANTANE')
if (!existsSync(marque))
	throw new Error(
		'Build absent ou fait sans l’instantané : lancer `bun run build:e2e`'
	)

const pocketbase = await demarrerInstantane()
const next = spawn(
	join(racine, 'node_modules', '.bin', 'next'),
	['start', '-p', String(port), '-H', '127.0.0.1'],
	{
		cwd: racine,
		env: {
			...process.env,
			ADMIN_SECRET: randomBytes(24).toString('hex'),
			// Même année figée que le build (tests/e2e/construire.mjs) pour les pages régénérées.
			COPYRIGHT_ANNEE: '2026',
			NEXT_TELEMETRY_DISABLED: '1',
			PB_TOKEN: '',
			PB_URL: pocketbase.url,
			REVALIDATE_SECRET: randomBytes(24).toString('hex'),
			WATTPAD_BASE_URL: pocketbase.url,
			WATTPAD_SYNC: 'off',
		},
		stdio: 'inherit',
	}
)
console.info(
	`e2e : build ${readFileSync(marque, 'utf8').trim()}, PocketBase ${pocketbase.url}, site :${port}`
)

const arreter = async () => {
	next.kill('SIGTERM')
	await pocketbase.arreter()
	process.exit(0)
}
process.on('SIGINT', arreter)
process.on('SIGTERM', arreter)
next.on('exit', async code => {
	await pocketbase.arreter()
	process.exit(code ?? 1)
})
