import type { BookType } from '@/lib/pocketbase'

import type { SourceResult } from './source'
import type { StatsStore, StoredRecord } from './store'
import type { BookCounts } from './types'

import { BOOKS, type BookConfig } from './books'
import { chooseKnown, invalidateDisplayCache, loadSnapshot } from './display'
import { fetchBookCounts } from './source'
import { createPocketBaseStore } from './store'
import { anomaly, judge } from './validation'

export type BookOutcome =
	| 'ecrit'
	| 'refuse'
	| 'echec-wattpad'
	| 'echec-ecriture'
	| 'pocketbase-injoignable'

export interface BookReport {
	book: BookType
	counts?: BookCounts
	outcome: BookOutcome
	reason?: string
	via?: 'api' | 'page'
}

export interface SyncReport {
	at: string
	books: BookReport[]
	skipped?: 'trop-tot'
	success: boolean
}

export interface SyncState {
	consecutiveFailures: number
	lastAttemptAt: string | null
	lastReport: SyncReport | null
	/** Dernière confirmation par Wattpad, par roman (même si les chiffres n'ont pas bougé). */
	lastSuccessAt: Partial<Record<BookType, string>>
	/** Nombre de relevés successifs montrant la même anomalie (recul, bond), par roman. */
	streaks: Partial<Record<BookType, number>>
}

export interface SyncDeps {
	books?: readonly BookConfig[]
	fetchCounts?: (book: BookConfig) => Promise<SourceResult>
	minIntervalMs?: number
	now?: () => number
	/** Appelé quand au moins un chiffre a changé (rafraîchir les pages). */
	onChanged?: () => Promise<void>
	store?: StatsStore
}

export const MIN_INTERVAL_MS = 15 * 60 * 1000

// État partagé par tout le processus : Next charge ce module plusieurs fois (instrumentation, routes,
// pages), une variable de module ne serait pas vue par la route de santé.
const shared = globalThis as typeof globalThis & {
	__wattpadSync?: { running: Promise<SyncReport> | null; state: SyncState }
}
function emptyState(): SyncState {
	return {
		consecutiveFailures: 0,
		lastAttemptAt: null,
		lastReport: null,
		lastSuccessAt: {},
		streaks: {},
	}
}
const sync = (shared.__wattpadSync ??= { running: null, state: emptyState() })
const state = sync.state

export function getSyncState(): SyncState {
	return structuredClone(state)
}

export function resetSyncState() {
	Object.assign(state, emptyState())
	sync.running = null
}

function same(a: BookCounts, b: BookCounts | null) {
	return (
		!!b && a.reads === b.reads && a.votes === b.votes && a.parts === b.parts
	)
}

async function syncOnce(deps: SyncDeps): Promise<SyncReport> {
	const now = deps.now ?? Date.now
	const at = new Date(now()).toISOString()
	const books = deps.books ?? BOOKS
	const store = deps.store ?? createPocketBaseStore()
	const fetchCounts = deps.fetchCounts ?? (book => fetchBookCounts(book))
	state.lastAttemptAt = at

	// Référence de comparaison : PocketBase, sinon le relevé committé (jamais « rien »).
	let records: Partial<Record<BookType, StoredRecord>> | null = null
	try {
		records = await store.readAll()
	} catch {
		records = null
	}
	const snapshot = loadSnapshot()

	const reports: BookReport[] = []
	let changed = false
	for (const book of books) {
		if (!records) {
			// Sans lecture fiable de la dernière valeur, on ne peut pas valider : on n'écrit rien.
			reports.push({ book: book.type, outcome: 'pocketbase-injoignable' })
			continue
		}
		const stored = records[book.type]?.counts ?? null
		// Référence = ce que le site affiche (même règle de choix que l'affichage).
		const previous = chooseKnown(book.type, records[book.type], snapshot)
		const fetched = await fetchCounts(book)
		if (!fetched.ok) {
			reports.push({
				book: book.type,
				outcome: 'echec-wattpad',
				reason: fetched.error,
			})
			continue
		}
		const odd = anomaly(fetched.counts, previous)
		const streak = odd ? (state.streaks[book.type] ?? 0) + 1 : 0
		state.streaks[book.type] = streak
		const verdict = judge(fetched.counts, previous, streak)
		if (!verdict.accepted) {
			reports.push({
				book: book.type,
				counts: fetched.counts,
				outcome: 'refuse',
				reason: verdict.reason,
				via: fetched.via,
			})
			continue
		}
		try {
			await store.write(book.type, fetched.counts)
		} catch (error) {
			const status = (error as { status?: number })?.status
			reports.push({
				book: book.type,
				counts: fetched.counts,
				outcome: 'echec-ecriture',
				reason: status
					? `PocketBase : HTTP ${status}`
					: 'PocketBase : écriture impossible',
				via: fetched.via,
			})
			continue
		}
		state.streaks[book.type] = 0
		state.lastSuccessAt[book.type] = at
		if (!same(fetched.counts, stored)) changed = true
		reports.push({
			book: book.type,
			counts: fetched.counts,
			outcome: 'ecrit',
			reason: verdict.confirmedAnomaly,
			via: fetched.via,
		})
	}

	const success =
		reports.length > 0 && reports.every(r => r.outcome === 'ecrit')
	state.consecutiveFailures = success ? 0 : state.consecutiveFailures + 1
	const report: SyncReport = { at, books: reports, success }
	state.lastReport = report
	if (changed) {
		invalidateDisplayCache()
		await deps.onChanged?.().catch(() => {})
	}
	return report
}

/**
 * Synchronise Wattpad → PocketBase. Ne lève jamais d'exception.
 * Une seule synchro à la fois ; hors `force`, pas plus d'une tentative par quart d'heure.
 */
export function runSync(
	deps: SyncDeps = {},
	{ force = false } = {}
): Promise<SyncReport> {
	if (sync.running) return sync.running
	const now = (deps.now ?? Date.now)()
	const minInterval = deps.minIntervalMs ?? MIN_INTERVAL_MS
	if (
		!force &&
		state.lastAttemptAt &&
		now - Date.parse(state.lastAttemptAt) < minInterval
	) {
		return Promise.resolve({
			at: new Date(now).toISOString(),
			books: [],
			skipped: 'trop-tot',
			success: true,
		})
	}
	sync.running = syncOnce(deps)
		.catch((): SyncReport => {
			state.consecutiveFailures += 1
			return { at: new Date(now).toISOString(), books: [], success: false }
		})
		.finally(() => {
			sync.running = null
		})
	return sync.running
}
