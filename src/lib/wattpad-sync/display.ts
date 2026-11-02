import type { BookType } from '@/lib/pocketbase'

import snapshotFile from '@/data/wattpad-releve.json'

import type { StatsStore, StoredRecord } from './store'
import type { BookCounts, KnownStats } from './types'

import { BOOK_TYPES } from './books'
import { createPocketBaseStore } from './store'
import { implausibility } from './validation'

export interface DisplayStats {
	books: Record<BookType, KnownStats>
	pocketbase: 'ok' | 'injoignable'
	/** Raisons pour lesquelles un enregistrement PocketBase a été écarté. */
	rejected: Partial<Record<BookType, string>>
	/** Date de la dernière valeur valide trouvée dans PocketBase, par roman (absente = rien de valide). */
	storedAt: Partial<Record<BookType, string>>
	total: BookCounts & { checkedAt: string }
}

type Snapshot = Record<BookType, BookCounts & { checkedAt: string }>

/** Relevé committé, validé à la lecture comme le reste. */
export function loadSnapshot(raw: unknown = snapshotFile): Snapshot {
	const books = (raw as { books?: Record<string, any> })?.books ?? {}
	const result = {} as Snapshot
	for (const book of BOOK_TYPES) {
		const entry = books[book]
		const counts = {
			parts: entry?.parts,
			reads: entry?.reads,
			votes: entry?.votes,
		}
		if (
			!entry ||
			implausibility(counts) ||
			Number.isNaN(Date.parse(entry.checkedAt))
		) {
			throw new Error(`Relevé Wattpad committé invalide pour ${book}`)
		}
		result[book] = {
			...counts,
			checkedAt: new Date(entry.checkedAt).toISOString(),
		}
	}
	return result
}

// Dernière valeur bonne vue par ce processus : couvre une panne de PocketBase entre deux lectures.
// Partagée par tout le processus (Next charge ce module plusieurs fois : pages, routes, images).
const shared = globalThis as typeof globalThis & {
	__wattpadDisplay?: {
		cached: { at: number; value: DisplayStats } | null
		memory: Partial<Record<BookType, KnownStats>>
	}
}
const processState = (shared.__wattpadDisplay ??= { cached: null, memory: {} })
const memory = processState.memory

export function resetDisplayMemory() {
	for (const book of BOOK_TYPES) delete memory[book]
	processState.cached = null
}

/**
 * Choisit la valeur à afficher : la plus récemment confirmée par Wattpad parmi PocketBase, la mémoire du
 * processus et le relevé committé (à égalité de date, la plus avancée en lectures). Toutes ont été validées
 * avant d'être retenues : 0 est impossible, et un recul n'apparaît que s'il a été confirmé par la synchro.
 * Une base restée en arrière (plus ancienne) ne fait donc pas reculer l'affichage.
 */
export function pickBest(candidates: KnownStats[]): KnownStats {
	return [...candidates].sort(
		(a, b) =>
			Date.parse(b.checkedAt) - Date.parse(a.checkedAt) || b.reads - a.reads
	)[0]
}

/** Dernière valeur connue bonne d'un roman, sans toucher à la mémoire (sert aussi de référence à la synchro). */
export function chooseKnown(
	book: BookType,
	record: StoredRecord | undefined,
	snapshot: Snapshot
): KnownStats {
	const candidates: KnownStats[] = [
		{ ...snapshot[book], book, source: 'releve' },
	]
	if (record?.counts && record.updatedAt) {
		candidates.push({
			...record.counts,
			book,
			checkedAt: record.updatedAt,
			source: 'pocketbase',
		})
	}
	const remembered = memory[book]
	if (remembered) candidates.push({ ...remembered, source: 'memoire' })
	return pickBest(candidates)
}

export interface DisplayDeps {
	now?: () => number
	snapshot?: Snapshot
	store?: StatsStore
}

const CACHE_MS = 30_000

export async function computeDisplayStats(
	deps: DisplayDeps = {}
): Promise<DisplayStats> {
	const snapshot = deps.snapshot ?? loadSnapshot()
	const store = deps.store ?? createPocketBaseStore()
	let records: Partial<Record<BookType, StoredRecord>> = {}
	let pocketbase: DisplayStats['pocketbase'] = 'ok'
	try {
		records = await store.readAll()
	} catch {
		pocketbase = 'injoignable'
	}

	const books = {} as Record<BookType, KnownStats>
	const rejected: DisplayStats['rejected'] = {}
	const storedAt: DisplayStats['storedAt'] = {}
	for (const book of BOOK_TYPES) {
		const record = records[book]
		if (record?.counts && record.updatedAt) {
			storedAt[book] = record.updatedAt
		} else if (record) {
			rejected[book] = record.invalidReason ?? 'date absente'
		} else if (pocketbase === 'ok') {
			rejected[book] = 'aucun enregistrement'
		}
		const best = chooseKnown(book, record, snapshot)
		books[book] = best
		memory[book] = { ...best }
	}

	const values = Object.values(books)
	const total = {
		checkedAt: values.map(v => v.checkedAt).sort()[0],
		parts: values.reduce((sum, v) => sum + v.parts, 0),
		reads: values.reduce((sum, v) => sum + v.reads, 0),
		votes: values.reduce((sum, v) => sum + v.votes, 0),
	}
	return { books, pocketbase, rejected, storedAt, total }
}

/** Point d'entrée des pages et des routes. Mis en cache 30 s par processus pour ménager PocketBase. */
export async function getDisplayStats(): Promise<DisplayStats> {
	const now = Date.now()
	if (processState.cached && now - processState.cached.at < CACHE_MS) {
		return processState.cached.value
	}
	const value = await computeDisplayStats()
	processState.cached = { at: now, value }
	return value
}

/** À appeler après une écriture : la prochaine lecture repart de PocketBase. */
export function invalidateDisplayCache() {
	processState.cached = null
}
