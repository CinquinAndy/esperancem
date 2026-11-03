/**
 * Redémarrage du serveur pendant que Wattpad refuse : la synchro planifiée (10 s après le démarrage)
 * échoue, n'écrit rien, l'affichage garde la dernière valeur bonne et la route de santé le dit.
 * Avant ce correctif, ce scénario écrivait des zéros dans PocketBase. Prérequis : `bun run build`.
 */
import { afterAll, beforeAll, expect, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { startStub } from './stub'

const root = join(import.meta.dir, '..', '..')
const port = 3700 + Math.floor(Math.random() * 200)
const site = `http://127.0.0.1:${port}`
let stub: ReturnType<typeof startStub>
let server: ReturnType<typeof Bun.spawn>

beforeAll(async () => {
	if (!existsSync(join(root, '.next', 'BUILD_ID')))
		throw new Error('Lancer `bun run build` avant ce test')
	stub = startStub()
	await fetch(`${stub.url}/__mode?wattpad=403`)
	server = Bun.spawn(
		['bunx', 'next', 'start', '-p', String(port), '-H', '127.0.0.1'],
		{
			cwd: root,
			env: {
				...process.env,
				NEXT_TELEMETRY_DISABLED: '1',
				PB_TOKEN: 'jeton-de-test-local',
				PB_URL: stub.url,
				PORT: String(port),
				WATTPAD_BASE_URL: stub.url,
				WATTPAD_SYNC: 'on',
			},
			stderr: 'pipe',
			stdout: 'pipe',
		}
	)
}, 30_000)

afterAll(() => {
	server?.kill()
	stub?.server.stop(true)
})

test('Wattpad refuse au redémarrage : aucune écriture, chiffres intacts, échec visible', async () => {
	let health: any = null
	// Attendre la fin de la synchro (résultats enregistrés), pas seulement son début : la tentative est datée
	// avant les résultats, et un relevé lu entre les deux faisait échouer le test au hasard.
	for (let i = 0; i < 90; i++) {
		await Bun.sleep(1000)
		try {
			health = await (await fetch(`${site}/api/wattpad-stats/health`)).json()
			if (health.synchro.derniereTentative && health.synchro.resultats?.length)
				break
		} catch {}
	}
	expect(health.synchro.derniereTentative).not.toBeNull()
	expect(health.synchro.echecsConsecutifs).toBe(1)
	expect(health.synchro.resultats.map((r: any) => r.resultat)).toEqual([
		'echec-wattpad',
		'echec-wattpad',
	])
	expect(health.synchro.resultats[0].motif).toBe(
		'api : HTTP 403 ; page : HTTP 403'
	)
	expect(health.livres['coeurs-sombres'].lectures).toBe(366177)

	const { writes } = await (await fetch(`${stub.url}/__writes`)).json()
	expect(writes).toEqual([])
	const book = await (
		await fetch(`${site}/api/wattpad-stats/coeurs-sombres`)
	).json()
	expect(book.data.readsComplete).toBe('366177')
}, 120_000)
