import type { BookType } from '@/lib/pocketbase'

import type { SourceResult } from './source'
import type { StatsStore, StoredRecord } from './store'
import type { BookCounts, KnownStats } from './types'

import { BOOKS, type BookConfig } from './books'
import { chooseKnown, invalidateDisplayCache, loadSnapshot } from './display'
import { fetchBookCounts } from './source'
import { createPocketBaseStore } from './store'
import {
	anomalies,
	implausibility,
	judge,
	nextPending,
	type PendingAnomaly,
} from './validation'

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

/** Valeur écrite par la synchro, avec la date où Wattpad l'a donnée. */
export interface AcceptedValue {
	checkedAt: string
	counts: BookCounts
}

export interface SyncState {
	consecutiveFailures: number
	/**
	 * Dernières valeurs écrites, par roman (la plus récente en dernier, HISTORY_SIZE au plus). Un relevé
	 * cohérent avec l'une d'elles est accepté tout de suite : si un faux relevé est passé sous les bornes,
	 * la vraie valeur suivante reste acceptée grâce à la valeur d'avant le faux. En mémoire seulement : un
	 * redémarrage repart de la valeur de PocketBase (les bornes symétriques suffisent alors dans le cas courant).
	 */
	history: Partial<Record<BookType, AcceptedValue[]>>
	lastAttemptAt: string | null
	lastReport: SyncReport | null
	/** Dernière confirmation par Wattpad, par roman (même si les chiffres n'ont pas bougé). */
	lastSuccessAt: Partial<Record<BookType, string>>
	/**
	 * Anomalie (recul, bond) en attente de confirmation, par roman. Effacée par un échec de lecture, un
	 * relevé invraisemblable, un relevé normal ou une écriture réussie.
	 */
	pending: Partial<Record<BookType, PendingAnomaly>>
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
/** Valeurs écrites gardées par roman : un jour de relevés toutes les 6 h. */
const HISTORY_SIZE = 4

// État partagé par tout le processus : Next charge ce module plusieurs fois (instrumentation, routes,
// pages), une variable de module ne serait pas vue par la route de santé.
const shared = globalThis as typeof globalThis & {
	__wattpadSync?: { running: Promise<SyncReport> | null; state: SyncState }
}
function emptyState(): SyncState {
	return {
		consecutiveFailures: 0,
		history: {},
		lastAttemptAt: null,
		lastReport: null,
		lastSuccessAt: {},
		pending: {},
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

function elapsedSince(nowMs: number, checkedAt: string) {
	const at = Date.parse(checkedAt)
	// Date absente ou dans le futur (horloges décalées) : un pas de 6 h, le minimum des bornes.
	return Number.isNaN(at) ? undefined : Math.max(0, nowMs - at)
}

function same(a: BookCounts, b: BookCounts | null) {
	return (
		!!b && a.reads === b.reads && a.votes === b.votes && a.parts === b.parts
	)
}

/**
 * Valeurs écrites après une écriture réussie. Accepté grâce à une valeur plus ancienne : les valeurs plus
 * récentes que celle-ci (le faux relevé passé) sont oubliées. Anomalie confirmée : on repart de la nouvelle
 * valeur seule.
 */
function nextHistory(
	history: AcceptedValue[],
	previous: KnownStats,
	coherentWith: number,
	written: AcceptedValue
): AcceptedValue[] {
	let base: AcceptedValue[]
	if (coherentWith < 0) base = []
	else if (coherentWith === 0) {
		const last = history.at(-1)
		base =
			last &&
			last.checkedAt === previous.checkedAt &&
			same(last.counts, previous)
				? history
				: [
						...history,
						{
							checkedAt: previous.checkedAt,
							counts: {
								parts: previous.parts,
								reads: previous.reads,
								votes: previous.votes,
							},
						},
					]
	} else base = history.slice(0, history.length - coherentWith + 1)
	return [...base, written].slice(-HISTORY_SIZE)
}

async function syncOnce(deps: SyncDeps): Promise<SyncReport> {
	const now = deps.now ?? Date.now
	const nowMs = now()
	const at = new Date(nowMs).toISOString()
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
			delete state.pending[book.type]
			reports.push({ book: book.type, outcome: 'pocketbase-injoignable' })
			continue
		}
		const stored = records[book.type]?.counts ?? null
		// Référence = ce que le site affiche (même règle de choix que l'affichage).
		const previous = chooseKnown(book.type, records[book.type], snapshot)
		const fetched = await fetchCounts(book)
		if (!fetched.ok) {
			// Un échec coupe la série : les confirmations doivent être des relevés successifs.
			delete state.pending[book.type]
			reports.push({
				book: book.type,
				outcome: 'echec-wattpad',
				reason: fetched.error,
			})
			continue
		}
		const counts = fetched.counts
		const history = state.history[book.type] ?? []
		const elapsedMs = elapsedSince(nowMs, previous.checkedAt)
		// Référence affichée d'abord, puis les valeurs écrites plus anciennes (de la plus récente à la plus
		// ancienne) : la première avec laquelle le relevé est cohérent l'accepte. Toutes sont jugées avec le
		// temps écoulé depuis la référence affichée : une valeur plus ancienne n'élargit jamais les bornes
		// (sinon un faux de +48 votes passerait en comparant à la valeur d'il y a 12 h).
		const coherentWith = implausibility(counts)
			? -1
			: [
					{ checkedAt: previous.checkedAt, counts: previous },
					...[...history].reverse(),
				].findIndex(
					ref => anomalies(counts, ref.counts, elapsedMs).length === 0
				)
		let pending: PendingAnomaly | null = null
		let verdict: ReturnType<typeof judge>
		if (coherentWith >= 0) {
			verdict = { accepted: true }
			if (coherentWith > 0) {
				const ref = history[history.length - coherentWith]
				verdict.confirmedAnomaly = `cohérent avec la valeur du ${ref.checkedAt} : ${previous.reads} lectures, ${previous.votes} votes, ${previous.parts} chapitres écartés`
			}
		} else {
			pending = nextPending(state.pending[book.type], counts, previous, {
				elapsedMs,
				now: nowMs,
			})
			verdict = judge(counts, previous, pending?.count ?? 0, {
				elapsedMs,
				floor: snapshot[book.type],
				pendingForMs: pending?.since
					? Math.max(0, nowMs - Date.parse(pending.since))
					: 0,
			})
		}
		if (pending) state.pending[book.type] = pending
		else delete state.pending[book.type]
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
		delete state.pending[book.type]
		state.history[book.type] = nextHistory(history, previous, coherentWith, {
			checkedAt: at,
			counts: { ...counts },
		})
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
		await deps.onChanged?.().catch(error => {
			// Les pages se mettront à jour à leur prochaine régénération (1 h au plus) : on le signale.
			console.warn(
				`Wattpad : rafraîchissement des pages impossible (${error instanceof Error ? error.message : String(error)})`
			)
		})
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
