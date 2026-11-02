/**
 * Intégration : vrai serveur Next (`next start` sur le build de .next) branché sur un faux PocketBase
 * et un faux Wattpad. Prérequis : `bun run build`. Lancer : `bun run test:integration`.
 * Les secrets sont générés à chaque lancement, jamais écrits ni affichés.
 * Attention : une synchro réussie régénère les pages dans .next (contenu du faux PocketBase) ;
 * refaire `bun run build` avant de servir ou de capturer ce build.
 */
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from 'bun:test'
import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { startStub } from './stub'

const root = join(import.meta.dir, '..', '..')
const revalidateSecret = randomBytes(24).toString('hex')
const adminSecret = randomBytes(24).toString('hex')
const port = 3200 + Math.floor(Math.random() * 500)
const site = `http://127.0.0.1:${port}`
let stub: ReturnType<typeof startStub>
let server: ReturnType<typeof Bun.spawn>

const mode = (q: string) => fetch(`${stub.url}/__mode?${q}`)
const writes = async () =>
	(await (await fetch(`${stub.url}/__writes`)).json()).writes as any[]
const json = async (path: string, init?: RequestInit) => {
	const r = await fetch(site + path, init)
	return { body: await r.json(), status: r.status }
}
const admin = () =>
	json('/api/admin/wattpad-stats', {
		headers: { Authorization: `Bearer ${adminSecret}` },
		method: 'POST',
	})

beforeAll(async () => {
	if (!existsSync(join(root, '.next', 'BUILD_ID')))
		throw new Error('Lancer `bun run build` avant ce test')
	stub = startStub()
	server = Bun.spawn(
		['bunx', 'next', 'start', '-p', String(port), '-H', '127.0.0.1'],
		{
			cwd: root,
			env: {
				...process.env,
				ADMIN_SECRET: adminSecret,
				NEXT_TELEMETRY_DISABLED: '1',
				PB_TOKEN: 'jeton-de-test-local',
				PB_URL: stub.url,
				REVALIDATE_SECRET: revalidateSecret,
				WATTPAD_BASE_URL: stub.url,
				WATTPAD_HEALTH_CACHE_MS: '0', // la santé relit PocketBase à chaque appel (modes changés en cours de test)
				WATTPAD_SYNC: 'off', // les synchros sont déclenchées par les routes dans ces tests
			},
			stderr: 'pipe',
			stdout: 'pipe',
		}
	)
	for (let i = 0; i < 60; i++) {
		try {
			if ((await fetch(`${site}/api/wattpad-stats/health`)).ok) return
		} catch {}
		await Bun.sleep(500)
	}
	throw new Error('Le serveur Next ne répond pas')
}, 60_000)

afterAll(() => {
	server?.kill()
	stub?.server.stop(true)
})

beforeEach(async () => {
	await fetch(`${stub.url}/__reset`)
})

describe('routes de lecture : jamais 0, forme inchangée', () => {
	test('/api/wattpad-stats/total garde les champs lus par le QG', async () => {
		const { body, status } = await json('/api/wattpad-stats/total')
		expect(status).toBe(200)
		expect(body.data).toMatchObject({
			parts: '98',
			reads: '503',
			readsComplete: '503275',
			votes: '17696',
		})
	})
	test('/api/wattpad-stats/[book]', async () => {
		const { body } = await json('/api/wattpad-stats/coeurs-sombres')
		expect(body.data).toMatchObject({
			book: 'coeurs-sombres',
			parts: '48',
			reads: '366K',
			readsComplete: '366177',
			votes: '11126',
		})
		expect((await json('/api/wattpad-stats/inconnu')).status).toBe(400)
	})
	test('une visite ne déclenche ni appel à Wattpad ni écriture', async () => {
		await mode('wattpad=403')
		for (const p of [
			'/api/wattpad-stats',
			'/api/wattpad-stats/total',
			'/api/wattpad-stats/au-prix-du-silence',
		]) {
			expect((await fetch(site + p)).status).toBe(200)
		}
		expect(await writes()).toEqual([])
	})
})

describe('route de synchro protégée', () => {
	test('sans secret : 401, aucune écriture', async () => {
		const { status } = await json('/api/cron/update-wattpad-stats')
		expect(status).toBe(401)
		expect(await writes()).toEqual([])
	})
	test('avec secret et Wattpad en forme : chiffres exacts écrits', async () => {
		const { body, status } = await json('/api/cron/update-wattpad-stats', {
			headers: { Authorization: `Bearer ${revalidateSecret}` },
		})
		expect(status).toBe(200)
		expect(body.results.map((r: any) => r.outcome)).toEqual(['ecrit', 'ecrit'])
		const w = await writes()
		const active = w.filter(x => x.body.is_active)
		expect(active.map(x => x.body.reads_complete)).toEqual(['366500', '137300'])
		// Historique de la synchro : la valeur d'avant, dans un enregistrement inactif marqué (créé une fois).
		const history = w.filter(x => x.body.is_active === false)
		expect(history.map(x => [x.method, x.body.reads_complete])).toEqual([
			['POST', '366177'],
			['POST', '137098'],
		])
		expect(
			history.every(x => x.body.reads.startsWith('historique-synchro '))
		).toBe(true)
		expect(w.every(x => x.auth)).toBe(true)
	})
})

describe('modes de panne, de bout en bout côté serveur', () => {
	const cases: [string, string][] = [
		['403', 'echec-wattpad'],
		['429', 'echec-wattpad'],
		['garbage', 'echec-wattpad'],
		['partial', 'echec-wattpad'],
		['format', 'echec-wattpad'],
		['zero', 'echec-wattpad'],
	]
	for (const [wattpad, outcome] of cases) {
		test(`Wattpad « ${wattpad} » : ${outcome}, rien écrit, l’affichage garde la dernière valeur bonne`, async () => {
			await mode(`wattpad=${wattpad}`)
			const { body, status } = await admin()
			expect(status).toBe(502)
			expect(body.books.map((b: any) => b.outcome)).toEqual([outcome, outcome])
			expect(await writes()).toEqual([])
			const total = await json('/api/wattpad-stats/total')
			expect(Number(total.body.data.readsComplete)).toBeGreaterThan(0)
		})
	}
	test('API Wattpad disparue : repli sur la page du roman pour Cœurs Sombres', async () => {
		await mode('wattpad=apidown')
		const { body } = await admin()
		expect(body.books[0]).toMatchObject({ outcome: 'ecrit', via: 'page' })
		expect(body.books[1].outcome).toBe('echec-wattpad')
	})
	test('PocketBase en panne : chiffres servis quand même (jamais 0), santé « degrade », aucune écriture', async () => {
		await json('/api/wattpad-stats/total') // la mémoire du processus a vu PocketBase
		await mode('pb=down')
		await Bun.sleep(31_000) // expiration du cache de 30 s des routes de lecture
		const total = await json('/api/wattpad-stats/total')
		expect(total.status).toBe(200)
		expect(Number(total.body.data.readsComplete)).toBeGreaterThanOrEqual(503275)
		const health = await json('/api/wattpad-stats/health')
		expect(health.body).toMatchObject({
			pocketbase: 'injoignable',
			statut: 'degrade',
		})
		const sync = await admin()
		expect(sync.body.books.map((b: any) => b.outcome)).toEqual([
			'pocketbase-injoignable',
			'pocketbase-injoignable',
		])
		expect(await writes()).toEqual([])
	}, 60_000)
})

describe('santé et premier rendu', () => {
	test('/api/wattpad-stats/health : état lisible, sans secret', async () => {
		const r = await fetch(`${site}/api/wattpad-stats/health`)
		const text = await r.text()
		expect(r.headers.get('cache-control')).toContain('no-store')
		const body = JSON.parse(text)
		expect(body.statut).toBe('ok')
		expect(body.livres['coeurs-sombres'].lectures).toBeGreaterThan(0)
		expect(body.synchro.intervalleHeures).toBe(6)
		expect(text).not.toContain(revalidateSecret)
		expect(text).not.toContain(adminSecret)
		expect(text).not.toContain('jeton-de-test-local')
	})
	test('le HTML initial de l’accueil porte les vrais chiffres', async () => {
		const html = await (await fetch(site + '/')).text()
		const hidden = [...html.matchAll(/<span class="sr-only">([\d ]+)/g)].map(
			m => Number(m[1].replace(/ /g, ''))
		)
		expect(hidden.length).toBe(6)
		expect(hidden.every(n => n > 0)).toBe(true)
		expect(html).not.toContain('0k+')
	})
})
