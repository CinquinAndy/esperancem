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
	readHistoryRecord,
	readRecord,
	toHistoryFields,
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
			'au-prix-du-silence': stored(APS),
			'coeurs-sombres': stored(CS),
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
			'au-prix-du-silence': stored(APS),
			'coeurs-sombres': stored(CS),
		})
		const drop = fromWattpad(book =>
			book === 'coeurs-sombres'
				? {
						counts: { ...fresh[book], reads: CS.reads - 5000 },
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
			'au-prix-du-silence': stored(APS),
			'coeurs-sombres': stored(CS),
		})
		await runSync({ fetchCounts: okSource, store: pb.store })
		resetSyncState() // simule un redémarrage du conteneur
		resetDisplayMemory()
		// Recul hors bornes (−5 000 lectures en un relevé) : la mémoire perdue ne le rend pas acceptable.
		const lower = fromWattpad(book => ({
			counts: { ...fresh[book], reads: fresh[book].reads - 5000 },
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
	test('0 vote en base (lectures et chapitres normaux) : écarté, motif exposé', () => {
		expect(
			readRecord({
				book: 'coeurs-sombres',
				created: '',
				id: '1',
				parts: '48',
				reads: '366K',
				reads_complete: '366177',
				updated: '2026-11-02 05:00:00Z',
				votes: '0',
			})
		).toMatchObject({ counts: null, invalidReason: 'votes à zéro' })
	})
	test('relevé committé avec 0 vote : refusé au chargement', () => {
		const books = {
			'au-prix-du-silence': {
				checkedAt: '2026-11-02T07:16:35.000Z',
				parts: 50,
				reads: 137098,
				votes: 6570,
			},
			'coeurs-sombres': {
				checkedAt: '2026-11-02T07:16:35.000Z',
				parts: 48,
				reads: 366177,
				votes: 0,
			},
		}
		expect(() => loadSnapshot({ books })).toThrow('coeurs-sombres')
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

describe('confirmation d’une anomalie : trois relevés plausibles, de même nature et proches', () => {
	// Base du relecteur : 366 186 lectures en base, relevés espacés de 6 h (synchro planifiée, sans forçage).
	const base: BookCounts = { parts: 48, reads: 366186, votes: 11130 }
	const SIX_HOURS = 6 * 3600_000
	type Reading = BookCounts | 'echec' | 'pb-down'
	const reads = (n: number): BookCounts => ({ ...base, reads: n })
	const zero: BookCounts = { parts: 0, reads: 0, votes: 0 }

	async function play(
		readings: Reading[],
		{ writeFailsAt = -1 }: { writeFailsAt?: number } = {}
	) {
		const pb = memoryStore({
			'au-prix-du-silence': stored(APS, '2026-11-02T08:00:00.000Z'),
			'coeurs-sombres': stored(base, '2026-11-02T08:00:00.000Z'),
		})
		let t = Date.parse('2026-11-02T09:00:00.000Z')
		const outcomes: string[] = []
		const reasons: (string | undefined)[] = []
		for (const [i, reading] of readings.entries()) {
			pb.ctl.readFails = reading === 'pb-down'
			pb.ctl.writeFails = i === writeFailsAt
			const report = await runSync({
				fetchCounts: fromWattpad(book =>
					book !== 'coeurs-sombres'
						? { counts: fresh[book], ok: true, via: 'api' }
						: reading === 'echec'
							? { error: 'api : HTTP 429', ok: false }
							: { counts: reading as BookCounts, ok: true, via: 'api' }
				),
				now: () => t,
				store: pb.store,
			})
			expect(report.skipped).toBeUndefined()
			outcomes.push(report.books[0].outcome)
			reasons.push(report.books[0].reason)
			t += SIX_HOURS
		}
		const written = pb.writes
			.filter(w => w.book === 'coeurs-sombres')
			.map(w => w.counts.reads)
		const writtenCounts = pb.writes
			.filter(w => w.book === 'coeurs-sombres')
			.map(w => w.counts)
		pb.ctl.readFails = false
		const display = await computeDisplayStats({ store: pb.store })
		return {
			displayed: display.books['coeurs-sombres'].reads,
			displayedCounts: {
				parts: display.books['coeurs-sombres'].parts,
				reads: display.books['coeurs-sombres'].reads,
				votes: display.books['coeurs-sombres'].votes,
			},
			outcomes,
			reasons,
			written,
			writtenCounts,
		}
	}

	test('0, 0, puis 300 000 : les zéros ne comptent pas, pas de « recul confirmé »', async () => {
		const r = await play([zero, zero, reads(300_000)])
		expect(r.outcomes).toEqual(['refuse', 'refuse', 'refuse'])
		expect(r.reasons[2]).toContain('recul à confirmer (1/3)')
		expect(r.written).toEqual([])
		expect(r.displayed).toBe(base.reads)
	})
	test('0, 0, puis 1 500 000 : pas de « bond confirmé », rien d’affiché', async () => {
		const r = await play([zero, zero, reads(1_500_000)])
		expect(r.outcomes).toEqual(['refuse', 'refuse', 'refuse'])
		expect(r.reasons[2]).toContain('bond à confirmer (1/3)')
		expect(r.written).toEqual([])
		expect(r.displayed).toBe(base.reads)
	})
	test('360 000, 1 500 000, 200 000 : anomalies de natures différentes, 200 000 refusé', async () => {
		const r = await play([reads(360_000), reads(1_500_000), reads(200_000)])
		expect(r.outcomes).toEqual(['refuse', 'refuse', 'refuse'])
		expect(r.reasons).toEqual([
			expect.stringContaining('recul à confirmer (1/3)'),
			expect.stringContaining('bond à confirmer (1/3)'),
			expect.stringContaining('recul à confirmer (1/3)'),
		])
		expect(r.written).toEqual([])
		expect(r.displayed).toBe(base.reads)
	})
	test('reculs de valeurs éloignées (300 000, 250 000, 200 000) : jamais confirmés', async () => {
		const r = await play([reads(300_000), reads(250_000), reads(200_000)])
		expect(r.outcomes).toEqual(['refuse', 'refuse', 'refuse'])
		expect(r.written).toEqual([])
	})
	// Relecture 3 : un chiffre faux isolé vers le haut ne doit ni s'afficher ni bloquer la vraie valeur ensuite.
	for (const [name, bad] of [
		['votes ×5', { ...base, votes: base.votes * 5 }],
		['chapitres 48 → 480', { ...base, parts: 480 }],
		['lectures ×2,5', { ...base, reads: Math.floor(base.reads * 2.5) }],
	] as const) {
		test(`bond isolé (${name}) refusé, la vraie valeur passe au relevé suivant`, async () => {
			const real = { ...base, reads: base.reads + 10, votes: base.votes + 1 }
			const r = await play([bad, real])
			expect(r.outcomes).toEqual(['refuse', 'ecrit'])
			expect(r.reasons[0]).toContain('bond à confirmer (1/3)')
			expect(r.writtenCounts).toEqual([real])
			expect(r.displayedCounts).toEqual(real)
		})
	}
	test('recul confirmé deux fois, puis 3e relevé avec votes et chapitres faux : rien de publié', async () => {
		const low = base.reads - 5000
		const r = await play([
			reads(low),
			reads(low + 10),
			{ parts: 1, reads: low + 20, votes: 11 },
		])
		expect(r.outcomes).toEqual(['refuse', 'refuse', 'refuse'])
		expect(r.reasons[2]).toContain('à confirmer (1/3)')
		expect(r.writtenCounts).toEqual([])
		expect(r.displayedCounts).toEqual(base)
	})
	test('vrai recul (recompte Wattpad) : trois relevés proches qui progressent, accepté au troisième', async () => {
		const r = await play([reads(300_000), reads(300_080), reads(300_150)])
		expect(r.outcomes).toEqual(['refuse', 'refuse', 'ecrit'])
		expect(r.reasons[2]).toContain('recul confirmé')
		expect(r.written).toEqual([300_150])
		expect(r.displayed).toBe(300_150)
	})
	test('anomalie, échec Wattpad, anomalie, anomalie : l’échec remet le compte à zéro', async () => {
		const r = await play([
			reads(300_000),
			'echec',
			reads(300_050),
			reads(300_100),
			reads(300_150),
		])
		expect(r.outcomes).toEqual([
			'refuse',
			'echec-wattpad',
			'refuse',
			'refuse',
			'ecrit',
		])
		expect(r.written).toEqual([300_150])
	})
	test('anomalie, PocketBase injoignable, anomalie, anomalie : pas de confirmation', async () => {
		const r = await play([
			reads(300_000),
			'pb-down',
			reads(300_050),
			reads(300_100),
		])
		expect(r.outcomes).toEqual([
			'refuse',
			'pocketbase-injoignable',
			'refuse',
			'refuse',
		])
		expect(r.written).toEqual([])
	})
	test('anomalie, relevé normal, anomalie, anomalie : le relevé normal remet le compte à zéro', async () => {
		const r = await play([
			reads(300_000),
			reads(366_300),
			reads(300_050),
			reads(300_100),
		])
		expect(r.outcomes).toEqual(['refuse', 'ecrit', 'refuse', 'refuse'])
		expect(r.written).toEqual([366_300])
		expect(r.displayed).toBe(366_300)
	})
	test('anomalie, zéro, anomalie, anomalie : un relevé invraisemblable remet aussi à zéro', async () => {
		const r = await play([reads(300_000), zero, reads(300_050), reads(300_100)])
		expect(r.outcomes).toEqual(['refuse', 'refuse', 'refuse', 'refuse'])
		expect(r.written).toEqual([])
	})
	test('recul des lectures puis recul des votes : deux anomalies distinctes, pas de confirmation', async () => {
		const r = await play([
			reads(300_000),
			{ ...base, reads: 366_300, votes: 5000 },
			reads(300_050),
		])
		expect(r.outcomes).toEqual(['refuse', 'refuse', 'refuse'])
		expect(r.reasons[1]).toContain('votes')
		expect(r.written).toEqual([])
	})
	test('écriture refusée après confirmation : l’attente est gardée, le relevé suivant est écrit', async () => {
		const r = await play(
			[reads(300_000), reads(300_050), reads(300_100), reads(300_150)],
			{ writeFailsAt: 2 }
		)
		expect(r.outcomes).toEqual(['refuse', 'refuse', 'echec-ecriture', 'ecrit'])
		expect(r.written).toEqual([300_150])
	})
	test('après une écriture, l’attente est effacée', async () => {
		await play([reads(300_000), reads(300_050), reads(300_100)])
		expect(getSyncState().pending).toEqual({})
	})
})

describe('lecture PocketBase par roman', () => {
	test('une requête par roman : un roman absent d’une longue liste n’est plus perdu', async () => {
		const filters: string[] = []
		const fakePb = {
			collection: () => ({
				getList: async (_page: number, perPage: number, opts: any) => {
					filters.push(`${perPage}:${opts.filter}`)
					const book = opts.filter.match(/book = "([^"]+)"/)[1]
					return {
						items: [
							{
								book,
								created: '9',
								id: book,
								parts: book === 'coeurs-sombres' ? '48' : '50',
								reads: '1K',
								reads_complete: book === 'coeurs-sombres' ? '366177' : '137098',
								updated: '2026-11-02 04:14:47.175Z',
								votes: '100',
							},
						],
					}
				},
			}),
		} as any
		const all = await createPocketBaseStore(() => fakePb).readAll()
		expect(filters.sort()).toEqual([
			'1:is_active = true && book = "au-prix-du-silence"',
			'1:is_active = true && book = "coeurs-sombres"',
		])
		expect(all['coeurs-sombres']?.counts?.reads).toBe(366177)
		expect(all['au-prix-du-silence']?.counts?.reads).toBe(137098)
	})
	test('PocketBase injoignable : readAll lève (la synchro n’écrit pas à l’aveugle)', async () => {
		const fakePb = {
			collection: () => ({
				getList: async () => {
					throw new Error('down')
				},
			}),
		} as any
		await expect(createPocketBaseStore(() => fakePb).readAll()).rejects.toThrow(
			'down'
		)
	})
})

describe('historique de la synchro dans PocketBase', () => {
	const value = {
		checkedAt: '2026-11-02T12:00:00.000Z',
		counts: { parts: 48, reads: 366177, votes: 11126 },
		successor: { parts: 48, reads: 366277, votes: 11128 },
	}
	const row = (extra: Record<string, unknown>) =>
		({
			book: 'coeurs-sombres',
			created: '',
			id: 'h',
			updated: '',
			...toHistoryFields('coeurs-sombres', value),
			...extra,
		}) as any

	test('enregistrement inactif marqué : relu tel qu’écrit', () => {
		expect(toHistoryFields('coeurs-sombres', value)).toEqual({
			book: 'coeurs-sombres',
			is_active: false,
			parts: '48',
			reads: 'historique-synchro 2026-11-02T12:00:00.000Z 366277,11128,48',
			reads_complete: '366177',
			votes: '11126',
		})
		expect(readHistoryRecord(row({}))).toEqual(value)
	})
	test('ancien enregistrement désactivé, enregistrement actif, chiffres invalides : jamais une référence', () => {
		expect(readHistoryRecord(row({ reads: '300K' }))).toBeNull()
		expect(readHistoryRecord(row({ is_active: true }))).toBeNull()
		expect(readHistoryRecord(row({ votes: '0' }))).toBeNull()
		expect(readHistoryRecord(row({ reads_complete: '366K' }))).toBeNull()
		expect(
			readHistoryRecord(
				row({ reads: 'historique-synchro pas-une-date 366277,11128,48' })
			)
		).toBeNull()
		// Sans valeur suivante, ou valeur suivante impossible : on ne peut pas vérifier qu'il est à jour.
		expect(
			readHistoryRecord(
				row({ reads: 'historique-synchro 2026-11-02T12:00:00.000Z' })
			)
		).toBeNull()
		expect(
			readHistoryRecord(
				row({ reads: 'historique-synchro 2026-11-02T12:00:00.000Z 0,0,0' })
			)
		).toBeNull()
	})
	test('écriture : met à jour l’enregistrement marqué, sinon en crée un, jamais un actif', async () => {
		const calls: any[] = []
		let items: any[] = []
		const fakePb = {
			collection: () => ({
				create: async (fields: any) => calls.push(['create', fields]),
				getList: async (_p: number, _n: number, o: any) => {
					calls.push(['list', o.filter])
					return { items }
				},
				update: async (id: string, fields: any) =>
					calls.push(['update', id, fields]),
			}),
		} as any
		const store = createPocketBaseStore(
			() => fakePb,
			async () => true
		)
		await store.writeHistory!('coeurs-sombres', value)
		expect(calls).toEqual([
			[
				'list',
				'is_active = false && book = "coeurs-sombres" && reads ~ "historique-synchro "',
			],
			['create', toHistoryFields('coeurs-sombres', value)],
		])
		calls.length = 0
		items = [row({})]
		await store.writeHistory!('coeurs-sombres', value)
		expect(calls[1]).toEqual([
			'update',
			'h',
			toHistoryFields('coeurs-sombres', value),
		])
		expect(await store.readHistory!()).toEqual({
			'au-prix-du-silence': undefined,
			'coeurs-sombres': value,
		} as any)
	})
	test('sans jeton : aucune écriture de l’historique', async () => {
		let writes = 0
		const fakePb = {
			collection: () => ({
				create: async () => writes++,
				getList: async () => ({ items: [] }),
				update: async () => writes++,
			}),
		} as any
		const store = createPocketBaseStore(
			() => fakePb,
			async () => false
		)
		await expect(store.writeHistory!('coeurs-sombres', value)).rejects.toThrow(
			'jeton absent'
		)
		expect(writes).toBe(0)
	})
})
