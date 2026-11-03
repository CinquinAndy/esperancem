#!/usr/bin/env node
/**
 * Build des tests e2e : `next build` branché sur le faux PocketBase de l'instantané figé, pour que les pages
 * prérendues portent exactement ces données. Écrit .next/E2E_INSTANTANE (vérifié par tests/e2e/serveur.mjs).
 * Ce build n'est pas déployable (il ne contient pas le contenu réel du CMS).
 */
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { demarrerInstantane } from '../donnees/serveur-instantane.mjs'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const pocketbase = await demarrerInstantane()
// spawn et non spawnSync : le faux PocketBase tourne dans ce processus et doit pouvoir répondre.
const build = spawn(join(racine, 'node_modules', '.bin', 'next'), ['build'], {
	cwd: racine,
	env: {
		...process.env,
		NEXT_TELEMETRY_DISABLED: '1',
		PB_TOKEN: '',
		PB_URL: pocketbase.url,
		WATTPAD_BASE_URL: pocketbase.url,
		WATTPAD_SYNC: 'off',
	},
	stdio: 'inherit',
})
const statut = await new Promise(r => build.on('exit', code => r(code ?? 1)))
await pocketbase.arreter()
if (statut !== 0) process.exit(statut)

const empreinte = createHash('sha256')
	.update(
		readFileSync(join(racine, 'tests', 'donnees', 'pocketbase-instantane.json'))
	)
	.digest('hex')
	.slice(0, 12)
writeFileSync(
	join(racine, '.next', 'E2E_INSTANTANE'),
	`instantané ${empreinte}\n`
)
