// Scénarios de la quatrième relecture : vrai runSync, PocketBase en mémoire, Wattpad simulé, un relevé
// toutes les 6 h. Rythme réel : Cœurs sombres +100 lectures par relevé, Au prix du silence +40.
import { beforeEach, describe, expect, test } from 'bun:test'

import type {
	StatsStore,
	StoredHistory,
	StoredRecord,
} from '@/lib/wattpad-sync/store'
import type { BookCounts } from '@/lib/wattpad-sync/types'

import {
	computeDisplayStats,
	loadSnapshot,
	resetDisplayMemory,
} from '@/lib/wattpad-sync/display'
import { resetSyncState, runSync } from '@/lib/wattpad-sync/sync'
import { SEVERE_CONFIRMATION_MS } from '@/lib/wattpad-sync/validation'

const snapshot = loadSnapshot()
type Book = 'coeurs-sombres' | 'au-prix-du-silence'
const BOOKS_LIST: Book[] = ['coeurs-sombres', 'au-prix-du-silence']
const SIX_HOURS = 6 * 3600 * 1000

let clock = Date.parse('2026-11-02T12:00:00Z')
function makeStore() {
	const records: Record<string, StoredRecord> = {}
	for (const b of BOOKS_LIST)
		records[b] = {
			counts: {
				parts: snapshot[b].parts,
				reads: snapshot[b].reads,
				votes: snapshot[b].votes,
			},
			updatedAt: new Date(clock).toISOString(),
		}
	const ctl = {
		historyReadFails: false,
		historyWriteFails: false,
		readFails: false,
		writeFails: false,
	}
	const writes: { book: string; counts: BookCounts }[] = []
	// Historique gardé par la synchro : survit au redémarrage simulé (même objet store).
	const history: Record<string, StoredHistory> = {}
	const store: StatsStore = {
		async readAll() {
			if (ctl.readFails) throw new Error('down')
			return structuredClone(records) as any
		},
		async readHistory() {
			if (ctl.historyReadFails) throw new Error('down')
			return structuredClone(history) as any
		},
		async write(book, counts) {
			if (ctl.writeFails) throw Object.assign(new Error('x'), { status: 500 })
			writes.push({ book, counts: { ...counts } })
			records[book] = {
				counts: { ...counts },
				updatedAt: new Date(clock).toISOString(),
			}
		},
		async writeHistory(book, value) {
			if (ctl.historyWriteFails)
				throw Object.assign(new Error('x'), { status: 403 })
			history[book] = structuredClone(value)
		},
	}
	return { ctl, history, records, store, writes }
}

// Vraie évolution : chaque relevé, +100 lectures CS, +40 APS, +2 votes, un chapitre tous les 10 relevés.
function truth(step: number, b: Book): BookCounts {
	const s = snapshot[b]
	const readsPer = b === 'coeurs-sombres' ? 100 : 40
	return {
		parts: s.parts + Math.floor(step / 10),
		reads: s.reads + readsPer * step,
		votes: s.votes + 2 * step,
	}
}
const both = (step: number): Record<Book, BookCounts> => ({
	'au-prix-du-silence': truth(step, 'au-prix-du-silence'),
	'coeurs-sombres': truth(step, 'coeurs-sombres'),
})

async function releve(
	pb: ReturnType<typeof makeStore>,
	counts: Record<Book, BookCounts | null>,
	elapsed = SIX_HOURS
) {
	clock += elapsed
	const report = await runSync({
		fetchCounts: async book =>
			counts[book.type as Book]
				? { counts: counts[book.type as Book]!, ok: true, via: 'api' }
				: { error: 'api : HTTP 503 ; page : HTTP 503', ok: false },
		now: () => clock,
		store: pb.store,
	})
	const display = await computeDisplayStats({
		now: () => clock,
		store: pb.store,
	})
	const out = (b: Book) => report.books.find(x => x.book === b)!
	return { display, out, report }
}

const shown = (d: { reads: number; votes: number; parts: number }) => ({
	parts: d.parts,
	reads: d.reads,
	votes: d.votes,
})

beforeEach(() => {
	resetSyncState()
	resetDisplayMemory()
})

/** Redémarrage du serveur (déploiement, conteneur relancé) : la mémoire du processus est perdue. */
function restart() {
	resetSyncState()
	resetDisplayMemory()
}
const TEN_SECONDS = 10_000

describe('évolution normale : chaque relevé passe sans délai', () => {
	test('8 jours, 4 relevés par jour, chapitres de temps en temps', async () => {
		const pb = makeStore()
		for (let step = 1; step <= 32; step++) {
			const t = both(step)
			const { display, report } = await releve(pb, t)
			for (const r of report.books) expect(r.outcome).toBe('ecrit')
			for (const b of BOOKS_LIST) expect(shown(display.books[b])).toEqual(t[b])
		}
	})

	test('jour de nouveau chapitre : +1 chapitre, +400 lectures, +60 votes', async () => {
		const pb = makeStore()
		const s = snapshot['coeurs-sombres']
		const { report } = await releve(pb, {
			'au-prix-du-silence': truth(1, 'au-prix-du-silence'),
			'coeurs-sombres': {
				parts: s.parts + 1,
				reads: s.reads + 400,
				votes: s.votes + 60,
			},
		})
		expect(report.books.map(r => r.outcome)).toEqual(['ecrit', 'ecrit'])
	})

	test('Au prix du silence : nouveau chapitre, +40 lectures mais +60 votes', async () => {
		const pb = makeStore()
		const s = snapshot['au-prix-du-silence']
		const { out } = await releve(pb, {
			'au-prix-du-silence': {
				parts: s.parts + 1,
				reads: s.reads + 40,
				votes: s.votes + 60,
			},
			'coeurs-sombres': truth(1, 'coeurs-sombres'),
		})
		expect(out('au-prix-du-silence').outcome).toBe('ecrit')
	})

	test('deux chapitres le même jour (+2), +300 lectures, +40 votes', async () => {
		const pb = makeStore()
		const s = snapshot['au-prix-du-silence']
		const { out } = await releve(pb, {
			'au-prix-du-silence': {
				parts: s.parts + 2,
				reads: s.reads + 300,
				votes: s.votes + 40,
			},
			'coeurs-sombres': truth(1, 'coeurs-sombres'),
		})
		expect(out('au-prix-du-silence').outcome).toBe('ecrit')
	})

	test('chapitre : écart votes/lectures qui se résorbe, ou votes qui restent devant', async () => {
		const A = snapshot['au-prix-du-silence']
		const cs = both(0)['coeurs-sombres']
		for (const series of [
			[
				{ parts: A.parts + 1, reads: A.reads + 40, votes: A.votes + 60 },
				{ parts: A.parts + 1, reads: A.reads + 120, votes: A.votes + 65 },
			],
			[1, 2, 3, 4].map(i => ({
				parts: A.parts + 1,
				reads: A.reads + 30 * i,
				votes: A.votes + 60 + 5 * i,
			})),
		]) {
			resetSyncState()
			resetDisplayMemory()
			const pb = makeStore()
			for (const aps of series) {
				const { out } = await releve(pb, {
					'au-prix-du-silence': aps,
					'coeurs-sombres': cs,
				})
				expect(out('au-prix-du-silence').outcome).toBe('ecrit')
			}
		}
	})
})

// Un relevé faux isolé au relevé 2, puis la vérité reprend (relevés 3 à 8). Mesures : le faux a-t-il été
// publié, combien de vrais relevés ensuite sont refusés, pendant combien de relevés le faux reste affiché.
type Fault = {
	book: Book
	f: (c: BookCounts) => BookCounts
	name: string
	/** Dans les bornes d'un relevé normal : publié, puis corrigé par la vraie valeur suivante. */
	withinBounds?: true
}
const faults: Fault[] = [
	{
		book: 'coeurs-sombres',
		f: c => ({ ...c, reads: c.reads * 10 }),
		name: 'lectures ×10',
	},
	{
		book: 'coeurs-sombres',
		f: c => ({ ...c, reads: Math.round(c.reads * 1.4) }),
		name: 'lectures ×1,4',
	},
	{
		book: 'coeurs-sombres',
		f: c => ({ ...c, reads: c.reads + 5000 }),
		name: 'lectures +5 000',
	},
	{
		book: 'coeurs-sombres',
		f: c => ({ ...c, reads: c.reads - 101 }),
		name: 'lectures −1',
		withinBounds: true,
	},
	{
		book: 'coeurs-sombres',
		f: c => ({ ...c, reads: Math.round(c.reads / 1000) }),
		name: 'lectures ÷1000',
	},
	{
		book: 'au-prix-du-silence',
		f: c => ({ ...c, reads: snapshot['coeurs-sombres'].reads }),
		name: 'lectures = autre roman',
	},
	{
		book: 'coeurs-sombres',
		f: c => ({ ...c, votes: c.votes * 10 }),
		name: 'votes ×10',
	},
	{
		book: 'coeurs-sombres',
		f: c => ({ ...c, votes: c.votes + 48 }),
		name: 'votes +48',
	},
	{
		book: 'coeurs-sombres',
		f: c => ({ ...c, votes: c.votes + 200 }),
		name: 'votes +200',
	},
	{
		book: 'coeurs-sombres',
		f: c => ({ ...c, votes: Math.round(c.votes * 0.981) }),
		name: 'votes −1,9 % (CS)',
	},
	{
		book: 'au-prix-du-silence',
		f: c => ({ ...c, votes: Math.round(c.votes * 0.981) }),
		name: 'votes −1,9 % (APS)',
	},
	{
		book: 'coeurs-sombres',
		f: c => ({ ...c, votes: Math.round(c.votes * 0.9) }),
		name: 'votes −10 %',
	},
	{ book: 'coeurs-sombres', f: c => ({ ...c, votes: 0 }), name: 'votes = 0' },
	{
		book: 'coeurs-sombres',
		f: c => ({ ...c, votes: c.reads }),
		name: 'votes = lectures',
	},
	{
		book: 'coeurs-sombres',
		f: c => ({ ...c, parts: c.parts + 3 }),
		name: 'chapitres +3',
	},
	{
		book: 'coeurs-sombres',
		f: c => ({ ...c, parts: c.parts + 5 }),
		name: 'chapitres +5',
	},
	{
		book: 'coeurs-sombres',
		f: c => ({ ...c, parts: c.parts + 6 }),
		name: 'chapitres +6',
	},
	{
		book: 'coeurs-sombres',
		f: c => ({ ...c, parts: c.parts - 2 }),
		name: 'chapitres −2',
		withinBounds: true,
	},
	{
		book: 'coeurs-sombres',
		f: c => ({ ...c, parts: c.parts - 3 }),
		name: 'chapitres −3',
	},
	{
		book: 'coeurs-sombres',
		f: c => ({ ...c, parts: 0 }),
		name: 'chapitres = 0',
	},
	{
		book: 'coeurs-sombres',
		f: c => ({ ...c, parts: 1 }),
		name: 'chapitres = 1',
	},
	{
		book: 'au-prix-du-silence',
		f: c => ({ ...c, parts: snapshot['coeurs-sombres'].parts }),
		name: 'chapitres de l’autre roman (50 → 48)',
		withinBounds: true,
	},
	{
		book: 'coeurs-sombres',
		f: c => ({
			...c,
			reads: Math.round(c.reads * 1.4),
			votes: Math.round(c.votes * 1.4),
		}),
		name: 'lectures ×1,4 et votes ×1,4',
	},
]

describe('relevé faux isolé : jamais bloquant, publié seulement s’il reste dans les bornes', () => {
	for (const fault of faults) {
		test(fault.name, async () => {
			const pb = makeStore()
			await releve(pb, both(1))
			const bad = both(2)
			bad[fault.book] = fault.f(bad[fault.book])
			await releve(pb, bad)
			const published =
				JSON.stringify(pb.records[fault.book].counts) ===
				JSON.stringify(bad[fault.book])
			let refusedAfter = 0
			let wrongShown = published ? 1 : 0
			for (let step = 3; step <= 8; step++) {
				const { display, out } = await releve(pb, both(step))
				if (out(fault.book).outcome !== 'ecrit') refusedAfter++
				const d = shown(display.books[fault.book])
				expect(d.reads).toBeGreaterThan(0)
				expect(d.votes).toBeGreaterThan(0)
				expect(d.parts).toBeGreaterThan(0)
				if (JSON.stringify(d) === JSON.stringify(bad[fault.book])) wrongShown++
				expect(d).toEqual(both(step)[fault.book])
			}
			expect(published).toBe(!!fault.withinBounds)
			expect(refusedAfter).toBe(0)
			expect(wrongShown).toBeLessThanOrEqual(1)
		})
	}
})

describe('un faux accepté ne bloque jamais la vraie valeur', () => {
	test('faux juste sous la borne après 2 jours de panne Wattpad : la vraie valeur passe au relevé suivant', async () => {
		const pb = makeStore()
		await releve(pb, both(1))
		for (let i = 0; i < 7; i++)
			await releve(pb, { 'au-prix-du-silence': null, 'coeurs-sombres': null })
		// 48 h sans relevé : bornes larges (8 pas). Un faux de +14 000 lectures passe.
		const fake = { ...both(9) }
		fake['coeurs-sombres'] = {
			...fake['coeurs-sombres'],
			reads: both(1)['coeurs-sombres'].reads + 14_000,
		}
		const r1 = await releve(pb, fake)
		expect(r1.out('coeurs-sombres').outcome).toBe('ecrit')
		// La vraie valeur suivante recule de 13 000 par rapport au faux : hors bornes d'un pas, mais cohérente
		// avec la valeur d'avant le faux. Acceptée tout de suite.
		const r2 = await releve(pb, both(10))
		expect(r2.out('coeurs-sombres').outcome).toBe('ecrit')
		expect(r2.out('coeurs-sombres').reason).toContain(
			'cohérent avec la valeur du'
		)
		expect(shown(r2.display.books['coeurs-sombres'])).toEqual(
			both(10)['coeurs-sombres']
		)
		// Et la suite continue normalement.
		const r3 = await releve(pb, both(11))
		expect(r3.out('coeurs-sombres').outcome).toBe('ecrit')
	})

	test('source qui alterne faux juste sous la borne et vrai : la vraie valeur passe à chaque fois', async () => {
		const pb = makeStore()
		await releve(pb, both(1))
		for (let step = 2; step <= 12; step++) {
			const t = both(step)
			if (step % 2 === 0) {
				t['coeurs-sombres'] = {
					...t['coeurs-sombres'],
					reads: t['coeurs-sombres'].reads + 1700,
				}
			}
			const { display, out } = await releve(pb, t)
			const d = shown(display.books['coeurs-sombres'])
			if (step % 2 === 1) {
				expect(out('coeurs-sombres').outcome).toBe('ecrit')
				expect(d).toEqual(both(step)['coeurs-sombres'])
			} else {
				// Faux ou non, l'affichage ne s'écarte jamais de la vérité de plus d'une borne (1 830 lectures).
				expect(
					Math.abs(d.reads - both(step)['coeurs-sombres'].reads)
				).toBeLessThanOrEqual(1830)
			}
		}
	})
})

describe('redémarrage : l’historique de la synchro survit (cinquième relecture)', () => {
	const cs = (step: number) => both(step)['coeurs-sombres']
	const withCs = (step: number, c: BookCounts) => ({
		...both(step),
		'coeurs-sombres': c,
	})
	// Faux à la baisse juste sous la borne (1 830 lectures pour un pas), accepté, puis redémarrage.
	for (const [label, delay] of [
		['1 h', 3600 * 1000],
		['6 h', SIX_HOURS],
	] as const) {
		test(`faux à la baisse accepté puis redémarrage, relevé ${label} après : la vraie valeur passe tout de suite`, async () => {
			const pb = makeStore()
			await releve(pb, both(1))
			const fake = { ...cs(2), reads: cs(1).reads - 1830 }
			expect(
				(await releve(pb, withCs(2, fake))).out('coeurs-sombres').outcome
			).toBe('ecrit')
			restart()
			// Relevé de démarrage (10 s après), puis toutes les 6 h.
			const first = await releve(pb, both(3), delay + TEN_SECONDS)
			expect(first.out('coeurs-sombres').outcome).toBe('ecrit')
			expect(shown(first.display.books['coeurs-sombres'])).toEqual(cs(3))
			for (let step = 4; step <= 6; step++) {
				const r = await releve(pb, both(step))
				expect(r.out('coeurs-sombres').outcome).toBe('ecrit')
				expect(shown(r.display.books['coeurs-sombres'])).toEqual(cs(step))
			}
		})
	}

	test('panne de 2 jours, faux de −14 000 accepté, redémarrage : la vraie valeur passe au relevé suivant', async () => {
		const pb = makeStore()
		await releve(pb, both(1))
		for (let i = 0; i < 7; i++)
			await releve(pb, { 'au-prix-du-silence': null, 'coeurs-sombres': null })
		const fake = { ...cs(9), reads: cs(1).reads - 14_000 }
		expect(
			(await releve(pb, withCs(9, fake))).out('coeurs-sombres').outcome
		).toBe('ecrit')
		restart()
		const r = await releve(pb, both(10), TEN_SECONDS)
		expect(r.out('coeurs-sombres').outcome).toBe('ecrit')
		expect(r.out('coeurs-sombres').reason).toContain(
			'cohérent avec la valeur du'
		)
		expect(shown(r.display.books['coeurs-sombres'])).toEqual(cs(10))
	})

	test('jour de chapitre coupé par un redémarrage : le pic de votes passe tout de suite', async () => {
		const pb = makeStore()
		const s = snapshot['coeurs-sombres']
		const t1 = { parts: s.parts + 1, reads: s.reads + 150, votes: s.votes + 10 }
		expect(
			(await releve(pb, withCs(1, t1))).out('coeurs-sombres').outcome
		).toBe('ecrit')
		restart()
		const t2 = {
			parts: s.parts + 1,
			reads: t1.reads + 400,
			votes: t1.votes + 60,
		}
		const r2 = await releve(pb, withCs(2, t2))
		expect(r2.out('coeurs-sombres').outcome).toBe('ecrit')
		expect(shown(r2.display.books['coeurs-sombres'])).toEqual(t2)
		const t3 = {
			parts: s.parts + 1,
			reads: t2.reads + 100,
			votes: t2.votes + 2,
		}
		expect(
			(await releve(pb, withCs(3, t3))).out('coeurs-sombres').outcome
		).toBe('ecrit')
	})

	test('le même pic de votes sans chapitre dans l’historique reste refusé (la marge n’est pas élargie)', async () => {
		const pb = makeStore()
		await releve(pb, both(1))
		restart()
		const t2 = { ...cs(2), reads: cs(1).reads + 400, votes: cs(1).votes + 70 }
		const r = await releve(pb, withCs(2, t2))
		expect(r.out('coeurs-sombres').outcome).toBe('refuse')
	})

	test('historique illisible et impossible à garder : la synchro écrit quand même, l’historique reste en mémoire', async () => {
		const pb = makeStore()
		pb.ctl.historyReadFails = true
		pb.ctl.historyWriteFails = true
		await releve(pb, both(1))
		const fake = { ...cs(2), reads: cs(1).reads - 1830 }
		const r2 = await releve(pb, withCs(2, fake))
		expect(r2.report.books.map(b => b.outcome)).toEqual(['ecrit', 'ecrit'])
		// Sans redémarrage, la mémoire suffit.
		const r3 = await releve(pb, both(3))
		expect(r3.out('coeurs-sombres').outcome).toBe('ecrit')
		expect(pb.history).toEqual({})
	})

	test('anomalie confirmée : l’historique gardé repart de la nouvelle valeur, l’ancienne n’est plus une référence', async () => {
		const pb = makeStore()
		await releve(pb, both(1))
		// Vrai recul (recompte de Wattpad) de 20 000 lectures, confirmé au 3e relevé.
		for (let step = 2; step <= 4; step++)
			await releve(
				pb,
				withCs(step, { ...cs(step), reads: cs(step).reads - 20_000 })
			)
		expect(pb.history['coeurs-sombres'].counts.reads).toBe(cs(4).reads - 20_000)
		restart()
		// Un faux qui revient à l’ancienne valeur n’est pas accepté grâce à elle.
		const r = await releve(pb, both(5))
		expect(r.out('coeurs-sombres').outcome).toBe('refuse')
	})
	test('historique non gardé lors d’un recompte confirmé : l’ancien, périmé, est ignoré après redémarrage', async () => {
		const pb = makeStore()
		await releve(pb, both(1))
		await releve(pb, both(2))
		const before = structuredClone(pb.history['coeurs-sombres'])
		// Recompte de −20 000 confirmé au 3e relevé, mais l’historique ne peut plus être écrit.
		pb.ctl.historyWriteFails = true
		for (let step = 3; step <= 5; step++)
			await releve(
				pb,
				withCs(step, { ...cs(step), reads: cs(step).reads - 20_000 })
			)
		expect(pb.records['coeurs-sombres'].counts!.reads).toBe(
			cs(5).reads - 20_000
		)
		expect(pb.history['coeurs-sombres']).toEqual(before)
		restart()
		// L’historique gardé décrit la situation d’avant le recompte : un retour à l’ancienne valeur reste refusé.
		const r = await releve(pb, both(6))
		expect(r.out('coeurs-sombres').outcome).toBe('refuse')
	})

	test('valeur active modifiée hors de la synchro (ancien code, à la main) : l’historique gardé est ignoré', async () => {
		const pb = makeStore()
		await releve(pb, both(1))
		await releve(pb, both(2))
		pb.records['coeurs-sombres'] = {
			counts: { ...cs(2), reads: cs(2).reads - 1830 },
			updatedAt: new Date(clock).toISOString(),
		}
		restart()
		// Sans historique repris, la vraie valeur s’écarte de plus d’une borne de la valeur modifiée.
		const r = await releve(pb, both(3), TEN_SECONDS)
		expect(r.out('coeurs-sombres').outcome).toBe('refuse')
	})
})

describe('pannes', () => {
	test('Wattpad en panne 2 jours puis reprise : rien écrit, affichage conservé, reprise immédiate', async () => {
		const pb = makeStore()
		await releve(pb, both(1))
		for (let i = 0; i < 8; i++) {
			const r = await releve(pb, {
				'au-prix-du-silence': null,
				'coeurs-sombres': null,
			})
			expect(r.report.books.every(b => b.outcome === 'echec-wattpad')).toBe(
				true
			)
			expect(r.display.books['coeurs-sombres'].reads).toBe(
				both(1)['coeurs-sombres'].reads
			)
		}
		const r = await releve(pb, both(10))
		expect(r.report.books.map(b => b.outcome)).toEqual(['ecrit', 'ecrit'])
	})

	test('PocketBase illisible, puis écriture impossible, puis reprise', async () => {
		const pb = makeStore()
		await releve(pb, both(1))
		pb.ctl.readFails = true
		const r2 = await releve(pb, both(2))
		expect(
			r2.report.books.every(b => b.outcome === 'pocketbase-injoignable')
		).toBe(true)
		expect(r2.display.pocketbase).toBe('injoignable')
		expect(r2.display.books['coeurs-sombres'].reads).toBe(
			both(1)['coeurs-sombres'].reads
		)
		pb.ctl.readFails = false
		pb.ctl.writeFails = true
		const r3 = await releve(pb, both(3))
		expect(r3.report.books.every(b => b.outcome === 'echec-ecriture')).toBe(
			true
		)
		pb.ctl.writeFails = false
		const r4 = await releve(pb, both(4))
		expect(r4.report.books.map(b => b.outcome)).toEqual(['ecrit', 'ecrit'])
	})

	test('panne PocketBase au milieu d’une confirmation : la série repart', async () => {
		const pb = makeStore()
		await releve(pb, both(1))
		const bad = (s: number) => ({
			...both(s),
			'coeurs-sombres': { ...both(s)['coeurs-sombres'], reads: 300000 + s },
		})
		await releve(pb, bad(2))
		await releve(pb, bad(3))
		pb.ctl.readFails = true
		await releve(pb, bad(4))
		pb.ctl.readFails = false
		const r = await releve(pb, bad(5))
		expect(r.out('coeurs-sombres').outcome).toBe('refuse')
		expect(r.out('coeurs-sombres').reason).toContain('(1/3)')
	})
})

describe('valeurs absurdes : jamais publiées, même répétées', () => {
	test('0 vote trois fois de suite : refusé, l’affichage garde les vrais votes', async () => {
		const pb = makeStore()
		await releve(pb, both(1))
		for (let s = 2; s <= 4; s++) {
			const r = await releve(pb, {
				...both(s),
				'coeurs-sombres': { ...both(s)['coeurs-sombres'], votes: 0 },
			})
			expect(r.out('coeurs-sombres').outcome).toBe('refuse')
			expect(r.out('coeurs-sombres').reason).toBe('votes à zéro')
			expect(r.display.books['coeurs-sombres'].votes).toBe(
				both(1)['coeurs-sombres'].votes
			)
		}
	})

	test('chapitres = 1 (page d’un seul chapitre) : refusé pendant 7 jours de relevés identiques', async () => {
		const pb = makeStore()
		await releve(pb, both(1))
		const steps = SEVERE_CONFIRMATION_MS / SIX_HOURS
		// Premier relevé faux, puis un toutes les 6 h : 28 relevés couvrent 6 jours 3/4.
		for (let s = 0; s < steps; s++) {
			const r = await releve(pb, {
				...both(1),
				'coeurs-sombres': { ...both(1)['coeurs-sombres'], parts: 1 },
			})
			expect(r.out('coeurs-sombres').outcome).toBe('refuse')
			expect(r.out('coeurs-sombres').reason).toContain('anomalie grave')
			expect(r.display.books['coeurs-sombres'].parts).toBe(
				both(1)['coeurs-sombres'].parts
			)
		}
		// Au bout de 7 jours sans un seul relevé différent ni échec, la valeur est tenue pour vraie (l'autrice
		// a retiré ses chapitres) : choix documenté dans validation.ts.
		const last = await releve(pb, {
			...both(1),
			'coeurs-sombres': { ...both(1)['coeurs-sombres'], parts: 1 },
		})
		expect(last.out('coeurs-sombres').outcome).toBe('ecrit')
	})

	test('un échec de lecture pendant ces 7 jours fait repartir le délai', async () => {
		const pb = makeStore()
		await releve(pb, both(1))
		const one = {
			...both(1),
			'coeurs-sombres': { ...both(1)['coeurs-sombres'], parts: 1 },
		}
		for (let s = 0; s < 20; s++) await releve(pb, one)
		await releve(pb, { 'au-prix-du-silence': null, 'coeurs-sombres': null })
		for (let s = 0; s < 20; s++) {
			const r = await releve(pb, one)
			expect(r.out('coeurs-sombres').outcome).toBe('refuse')
		}
	})
})
