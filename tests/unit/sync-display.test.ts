import { beforeEach, describe, expect, test } from 'bun:test'

import type { SourceResult } from '@/lib/wattpad-sync/source'
import type { StatsStore, StoredRecord } from '@/lib/wattpad-sync/store'
import type { BookCounts } from '@/lib/wattpad-sync/types'

import { BOOKS } from '@/lib/wattpad-sync/books'
import {
	computeDisplayStats,
	loadSnapshot,
	resetDisplayMemory,
} from '@/lib/wattpad-sync/display'
import { buildHealth } from '@/lib/wattpad-sync/health'
import {
	createPocketBaseStore,
	readRecord,
	toRecordFields,
} from '@/lib/wattpad-sync/store'
import { getSyncState, resetSyncState, runSync } from '@/lib/wattpad-sync/sync'

const snapshot = loadSnapshot()
const CS = snapshot['coeurs-sombres']
const APS = snapshot['au-prix-du-silence']
const fresh: Record<string, BookCounts> = {
	'au-prix-du-silence': {
		parts: 50,
		reads: APS.reads + 40,
		votes: APS.votes + 2,
	},
	'coeurs-sombres': { parts: 48, reads: CS.reads + 100, votes: CS.votes + 5 },
}

/** PocketBase en mémoire, avec pannes à la demande. */
function memoryStore(initial: Partial<Record<string, StoredRecord>> = {}) {
	const records: Record<string, StoredRecord> = { ...initial } as any
	const writes: { book: string; counts: BookCounts }[] = []
	const ctl = { readFails: false, writeFails: false }
	const store: StatsStore = {
		async readAll() {
			if (ctl.readFails) throw new Error('down')
			return structuredClone(records) as any
		},
		async write(book, counts) {
			if (ctl.writeFails)
				throw Object.assign(new Error('nope'), { status: 400 })
			writes.push({ book, counts })
			records[book] = { counts, updatedAt: new Date().toISOString() }
		},
	}
	return { ctl, records, store, writes }
}
const stored = (
	counts: BookCounts | null,
	updatedAt = '2026-11-02T04:14:47.175Z'
): StoredRecord => ({
	counts,
	updatedAt,
})
const fromWattpad =
	(result: (book: string) => SourceResult) => async (book: { type: string }) =>
		result(book.type)
const okSource = fromWattpad(book => ({
	counts: fresh[book],
	ok: true,
	via: 'api',
}))

beforeEach(() => {
	resetSyncState()
	resetDisplayMemory()
})

describe('synchro : modes de panne', () => {
	test('Wattpad refuse (403 partout) : aucune écriture, échec compté', async () => {
		const pb = memoryStore({ 'coeurs-sombres': stored(CS) })
		const report = await runSync({
			fetchCounts: fromWattpad(() => ({
				error: 'api : HTTP 403 ; page : HTTP 403',
				ok: false,
			})),
			store: pb.store,
		})
		expect(pb.writes).toEqual([])
		expect(report.success).toBe(false)
		expect(report.books.map(b => b.outcome)).toEqual([
			'echec-wattpad',
			'echec-wattpad',
		])
		expect(getSyncState().consecutiveFailures).toBe(1)
	})
	test('Wattpad renvoie 0 : refusé, la base garde la dernière valeur bonne', async () => {
		const pb = memoryStore({ 'coeurs-sombres': stored(CS) })
		const report = await runSync({
			fetchCounts: fromWattpad(() => ({
				counts: { parts: 0, reads: 0, votes: 0 },
				ok: true,
				via: 'api',
			})),
			store: pb.store,
		})
		expect(pb.writes).toEqual([])
		expect(report.books[0]).toMatchObject({
			outcome: 'refuse',
			reason: 'lectures à zéro',
		})
	})
	test('réponse partielle : rien n’est écrit pour le livre touché, l’autre passe', async () => {
		const pb = memoryStore()
		await runSync({
			fetchCounts: fromWattpad(book =>
				book === 'coeurs-sombres'
					? { error: 'api : champs absents', ok: false }
					: { counts: fresh[book], ok: true, via: 'api' }
			),
			store: pb.store,
		})
		expect(pb.writes.map(w => w.book)).toEqual(['au-prix-du-silence'])
	})
	test('relevé valide : écrit les chiffres exacts', async () => {
		const pb = memoryStore({
			'coeurs-sombres': stored(CS),
			'au-prix-du-silence': stored(APS),
		})
		const report = await runSync({ fetchCounts: okSource, store: pb.store })
		expect(report.success).toBe(true)
		expect(pb.writes).toEqual([
			{ book: 'coeurs-sombres', counts: fresh['coeurs-sombres'] },
			{ book: 'au-prix-du-silence', counts: fresh['au-prix-du-silence'] },
		])
	})
	test('base déjà corrompue par l’ancien code (zéros) : réparée au premier relevé valide', async () => {
		const pb = memoryStore({
			'coeurs-sombres': readRecord({
				book: 'coeurs-sombres',
				created: '',
				id: '1',
				parts: '0',
				reads: '0',
				reads_complete: '0',
				updated: '2026-01-01 00:00:00Z',
				votes: '0',
			}),
		})
		expect(pb.records['coeurs-sombres'].counts).toBeNull()
		await runSync({ fetchCounts: okSource, store: pb.store })
		expect(pb.records['coeurs-sombres'].counts).toEqual(fresh['coeurs-sombres'])
	})
	test('recul : refusé deux fois, accepté à la troisième confirmation', async () => {
		const pb = memoryStore({
			'coeurs-sombres': stored(CS),
			'au-prix-du-silence': stored(APS),
		})
		const drop = fromWattpad(book =>
			book === 'coeurs-sombres'
				? {
						counts: { ...fresh[book], reads: CS.reads - 500 },
						ok: true,
						via: 'api',
					}
				: { counts: fresh[book], ok: true, via: 'api' }
		)
		const outcomes: string[] = []
		for (let i = 0; i < 3; i++) {
			const r = await runSync(
				{ fetchCounts: drop, store: pb.store },
				{ force: true }
			)
			outcomes.push(r.books[0].outcome)
		}
		expect(outcomes).toEqual(['refuse', 'refuse', 'ecrit'])
	})
	test('PocketBase illisible : on ne valide pas à l’aveugle, rien n’est écrit', async () => {
		const pb = memoryStore()
		pb.ctl.readFails = true
		const report = await runSync({ fetchCounts: okSource, store: pb.store })
		expect(pb.writes).toEqual([])
		expect(
			report.books.every(b => b.outcome === 'pocketbase-injoignable')
		).toBe(true)
	})
	test('écriture refusée par PocketBase : signalée, sans exception', async () => {
		const pb = memoryStore()
		pb.ctl.writeFails = true
		const report = await runSync({ fetchCounts: okSource, store: pb.store })
		expect(report.books[0]).toMatchObject({
			outcome: 'echec-ecriture',
			reason: 'PocketBase : HTTP 400',
		})
	})
	test('redémarrage : l’état en mémoire repart de zéro, la référence reste PocketBase', async () => {
		const pb = memoryStore({
			'coeurs-sombres': stored(CS),
			'au-prix-du-silence': stored(APS),
		})
		await runSync({ fetchCounts: okSource, store: pb.store })
		resetSyncState() // simule un redémarrage du conteneur
		resetDisplayMemory()
		const lower = fromWattpad(book => ({
			counts: { ...fresh[book], reads: fresh[book].reads - 1 },
			ok: true,
			via: 'api',
		}))
		const report = await runSync({ fetchCounts: lower, store: pb.store })
		expect(report.books.map(b => b.outcome)).toEqual(['refuse', 'refuse'])
	})
	test('une seule synchro à la fois', async () => {
		const pb = memoryStore()
		let calls = 0
		const slow = async (book: { type: string }): Promise<SourceResult> => {
			calls++
			await new Promise(r => setTimeout(r, 20))
			return { counts: fresh[book.type], ok: true, via: 'api' }
		}
		const [a, b] = await Promise.all([
			runSync({ fetchCounts: slow, store: pb.store }),
			runSync({ fetchCounts: slow, store: pb.store }, { force: true }),
		])
		expect(a).toBe(b)
		expect(calls).toBe(BOOKS.length)
	})
	test('pas plus d’une tentative par quart d’heure (hors forçage)', async () => {
		const pb = memoryStore()
		let t = Date.parse('2026-11-02T08:00:00Z')
		const now = () => t
		await runSync({ fetchCounts: okSource, now, store: pb.store })
		t += 5 * 60 * 1000
		expect(
			(await runSync({ fetchCounts: okSource, now, store: pb.store })).skipped
		).toBe('trop-tot')
		t += 11 * 60 * 1000
		expect(
			(await runSync({ fetchCounts: okSource, now, store: pb.store })).skipped
		).toBeUndefined()
	})
	test('rafraîchissement des pages seulement si un chiffre change', async () => {
		const pb = memoryStore()
		let refreshed = 0
		const onChanged = async () => {
			refreshed++
		}
		await runSync(
			{ fetchCounts: okSource, onChanged, store: pb.store },
			{ force: true }
		)
		await runSync(
			{ fetchCounts: okSource, onChanged, store: pb.store },
			{ force: true }
		)
		expect(refreshed).toBe(1)
	})
})

describe('affichage : jamais 0, jamais de recul', () => {
	test('cache vide au build / PocketBase injoignable : relevé committé, pas 0', async () => {
		const pb = memoryStore()
		pb.ctl.readFails = true
		const d = await computeDisplayStats({ store: pb.store })
		expect(d.pocketbase).toBe('injoignable')
		expect(d.books['coeurs-sombres']).toMatchObject({
			reads: CS.reads,
			source: 'releve',
		})
		expect(d.total.reads).toBe(CS.reads + APS.reads)
	})
	test('zéros en base : écartés, motif exposé', async () => {
		const zero = readRecord({
			book: 'coeurs-sombres',
			created: '',
			id: '1',
			parts: '0',
			reads: '0',
			reads_complete: '0',
			updated: '2026-11-02 05:00:00Z',
			votes: '0',
		})
		const d = await computeDisplayStats({
			store: memoryStore({ 'coeurs-sombres': zero }).store,
		})
		expect(d.books['coeurs-sombres'].reads).toBe(CS.reads)
		expect(d.rejected['coeurs-sombres']).toBe('lectures à zéro')
	})
	test('valeur abrégée en base (« 366K ») : écartée', async () => {
		const short = readRecord({
			book: 'coeurs-sombres',
			created: '',
			id: '1',
			parts: '48',
			reads: '366K',
			reads_complete: '366K',
			updated: '2026-11-02 05:00:00Z',
			votes: '11.1K',
		})
		expect(short.counts).toBeNull()
	})
	test('PocketBase plus récent que le relevé : PocketBase', async () => {
		const pb = memoryStore({
			'coeurs-sombres': stored(
				fresh['coeurs-sombres'],
				'2026-11-02T10:00:00.000Z'
			),
		})
		const d = await computeDisplayStats({ store: pb.store })
		expect(d.books['coeurs-sombres']).toMatchObject({
			reads: fresh['coeurs-sombres'].reads,
			source: 'pocketbase',
		})
	})
	test('PocketBase revenu à un enregistrement plus ancien : la mémoire gagne, pas de recul', async () => {
		const pb = memoryStore({
			'coeurs-sombres': stored(
				fresh['coeurs-sombres'],
				'2026-11-02T10:00:00.000Z'
			),
		})
		await computeDisplayStats({ store: pb.store })
		pb.records['coeurs-sombres'] = stored(
			{ ...CS, reads: CS.reads + 1 },
			'2026-11-02T08:00:00.000Z'
		)
		const d = await computeDisplayStats({ store: pb.store })
		expect(d.books['coeurs-sombres']).toMatchObject({
			reads: fresh['coeurs-sombres'].reads,
			source: 'memoire',
		})
	})
	test('PocketBase plus ancien et plus bas que le relevé committé : le relevé', async () => {
		const pb = memoryStore({
			'coeurs-sombres': stored(
				{ ...CS, reads: CS.reads - 50 },
				'2026-11-01T22:00:00.000Z'
			),
		})
		const d = await computeDisplayStats({ store: pb.store })
		expect(d.books['coeurs-sombres']).toMatchObject({
			reads: CS.reads,
			source: 'releve',
		})
	})
	test('recul confirmé trois fois par la synchro : il est affiché (il a une raison)', async () => {
		const pb = memoryStore({
			'au-prix-du-silence': stored(APS),
			'coeurs-sombres': stored(CS),
		})
		await computeDisplayStats({ store: pb.store }) // le site a affiché l’ancienne valeur
		const dropped = { ...fresh['coeurs-sombres'], reads: CS.reads - 500 }
		const drop = fromWattpad(book =>
			book === 'coeurs-sombres'
				? { counts: dropped, ok: true, via: 'api' }
				: { counts: fresh[book], ok: true, via: 'api' }
		)
		for (let i = 0; i < 3; i++) {
			await runSync({ fetchCounts: drop, store: pb.store }, { force: true })
		}
		const d = await computeDisplayStats({ store: pb.store })
		expect(d.books['coeurs-sombres']).toMatchObject({
			reads: dropped.reads,
			source: 'pocketbase',
		})
	})
})

describe('santé', () => {
	const now = Date.parse('2026-11-02T12:00:00Z')
	test('ok quand PocketBase sert des chiffres de moins de 24 h', async () => {
		const pb = memoryStore({
			'au-prix-du-silence': stored(
				fresh['au-prix-du-silence'],
				'2026-11-02T10:00:00.000Z'
			),
			'coeurs-sombres': stored(
				fresh['coeurs-sombres'],
				'2026-11-02T10:00:00.000Z'
			),
		})
		const h = buildHealth({
			display: await computeDisplayStats({ store: pb.store }),
			intervalHours: 6,
			now,
			syncEnabled: true,
			syncState: getSyncState(),
		})
		expect(h.statut).toBe('ok')
		expect(h.ageHeures).toBe(2)
		expect(JSON.stringify(h)).not.toMatch(/token|secret|Bearer/i)
	})
	test('en-retard au-delà de 24 h', async () => {
		const pb = memoryStore({
			'au-prix-du-silence': stored(
				fresh['au-prix-du-silence'],
				'2026-11-01T06:00:00.000Z'
			),
			'coeurs-sombres': stored(
				fresh['coeurs-sombres'],
				'2026-11-02T10:00:00.000Z'
			),
		})
		const h = buildHealth({
			display: await computeDisplayStats({ store: pb.store }),
			intervalHours: 6,
			now,
			syncEnabled: true,
			syncState: getSyncState(),
		})
		expect(h.statut).toBe('en-retard')
	})
	test('relevé committé plus récent que PocketBase : pas une panne (ok)', async () => {
		const pb = memoryStore({
			'au-prix-du-silence': stored(
				{ ...APS, reads: APS.reads - 7 },
				'2026-11-02T06:00:00.000Z'
			),
			'coeurs-sombres': stored(
				{ ...CS, reads: CS.reads - 13 },
				'2026-11-02T06:00:00.000Z'
			),
		})
		const h = buildHealth({
			display: await computeDisplayStats({ store: pb.store }),
			intervalHours: 6,
			now,
			syncEnabled: true,
			syncState: getSyncState(),
		})
		expect(h.livres['coeurs-sombres'].source).toBe('releve')
		expect(h.statut).toBe('ok')
	})
	test('degrade quand PocketBase n’a rien de valide pour un roman', async () => {
		const pb = memoryStore({
			'coeurs-sombres': stored(
				fresh['coeurs-sombres'],
				'2026-11-02T10:00:00.000Z'
			),
		})
		const display = await computeDisplayStats({ store: pb.store })
		expect(display.rejected['au-prix-du-silence']).toBe('aucun enregistrement')
		const h = buildHealth({
			display,
			intervalHours: 6,
			now,
			syncEnabled: true,
			syncState: getSyncState(),
		})
		expect(h.statut).toBe('degrade')
	})
	test('degrade quand PocketBase est injoignable', async () => {
		const pb = memoryStore()
		pb.ctl.readFails = true
		const h = buildHealth({
			display: await computeDisplayStats({ store: pb.store }),
			intervalHours: 6,
			now,
			syncEnabled: true,
			syncState: getSyncState(),
		})
		expect(h.statut).toBe('degrade')
		expect(h.livres['coeurs-sombres'].lectures).toBe(CS.reads)
	})
})

describe('stockage PocketBase', () => {
	test('format d’écriture identique à l’ancien (reads abrégé, le reste exact)', () => {
		expect(
			toRecordFields('coeurs-sombres', {
				parts: 48,
				reads: 366177,
				votes: 11126,
			})
		).toEqual({
			book: 'coeurs-sombres',
			is_active: true,
			parts: '48',
			reads: '366K',
			reads_complete: '366177',
			votes: '11126',
		})
	})
	test('sans jeton PocketBase : aucune écriture tentée', async () => {
		let updates = 0
		const fakePb = {
			collection: () => ({
				create: async () => updates++,
				getList: async () => ({ items: [] }),
				update: async () => updates++,
			}),
		} as any
		const store = createPocketBaseStore(
			() => fakePb,
			async () => false
		)
		await expect(
			store.write('coeurs-sombres', fresh['coeurs-sombres'])
		).rejects.toThrow('jeton absent')
		expect(updates).toBe(0)
	})
	test('lecture : l’enregistrement actif le plus récent par livre', async () => {
		const items = [
			{
				book: 'coeurs-sombres',
				created: '2',
				id: 'b',
				parts: '48',
				reads: '366K',
				reads_complete: '366177',
				updated: '2026-11-02 04:14:47.175Z',
				votes: '11126',
			},
			{
				book: 'coeurs-sombres',
				created: '1',
				id: 'a',
				parts: '0',
				reads: '0',
				reads_complete: '0',
				updated: '2025-01-01 00:00:00Z',
				votes: '0',
			},
		]
		const fakePb = {
			collection: () => ({ getList: async () => ({ items }) }),
		} as any
		const all = await createPocketBaseStore(() => fakePb).readAll()
		expect(all['coeurs-sombres']).toEqual({
			counts: { parts: 48, reads: 366177, votes: 11126 },
			updatedAt: '2026-11-02T04:14:47.175Z',
		})
	})
})
