import type PocketBase from 'pocketbase'

import {
	authenticatePocketBase,
	type BookType,
	COLLECTIONS,
	createPocketBase,
	type WattpadStats,
} from '@/lib/pocketbase'

import type { BookCounts } from './types'

import { BOOK_TYPES } from './books'
import { formatWattpadShort } from './format'
import { implausibility, parseExactCount } from './validation'

/** Enregistrement lu dans PocketBase : chiffres exacts validés, ou raison du rejet. */
export interface StoredRecord {
	counts: BookCounts | null
	invalidReason?: string
	/** Date de la dernière écriture validée (champ `updated` de PocketBase), en ISO. */
	updatedAt: string | null
}

export interface StatsStore {
	/** Une lecture par roman suivi. Lève une erreur si PocketBase est injoignable. */
	readAll(): Promise<Partial<Record<BookType, StoredRecord>>>
	/** N'écrit que des chiffres déjà validés. Lève une erreur si l'écriture échoue. */
	write(book: BookType, counts: BookCounts): Promise<void>
	/**
	 * Valeur écrite avant la valeur actuelle, par roman, gardée pour la synchro (voir `SyncState.history`).
	 * Facultatif : sans elle, la synchro ne garde cet historique qu'en mémoire. Lève une erreur si illisible.
	 */
	readHistory?(): Promise<Partial<Record<BookType, StoredHistory>>>
	/** Remplace la valeur gardée pour ce roman. Lève une erreur si l'écriture échoue. */
	writeHistory?(book: BookType, value: StoredHistory): Promise<void>
}

/** Valeur gardée par `readHistory` / `writeHistory`, avec la date où Wattpad l'a donnée. */
export interface StoredHistory {
	checkedAt: string
	counts: BookCounts
}

/**
 * Marque des enregistrements d'historique, dans le champ texte `reads` (suivie de la date de la valeur).
 * Ils sont inactifs (`is_active = false`) : le site et l'ancien code ne lisent que les actifs. La marque les
 * distingue des anciens enregistrements désactivés, qui ne doivent jamais servir de référence.
 */
export const HISTORY_MARK = 'historique-synchro'

/** Lit un enregistrement d'historique ; null s'il n'en est pas un ou si ses chiffres sont invalides. */
export function readHistoryRecord(record: WattpadStats): StoredHistory | null {
	const match = record.reads?.match(new RegExp(`^${HISTORY_MARK} (.+)$`))
	if (record.is_active !== false || !match) return null
	const at = Date.parse(match[1])
	const counts = {
		parts: parseExactCount(record.parts),
		reads: parseExactCount(record.reads_complete),
		votes: parseExactCount(record.votes),
	}
	if (
		Number.isNaN(at) ||
		counts.reads === null ||
		counts.votes === null ||
		counts.parts === null ||
		implausibility(counts as BookCounts)
	)
		return null
	return { checkedAt: new Date(at).toISOString(), counts: counts as BookCounts }
}

export function toHistoryFields(book: BookType, value: StoredHistory) {
	return {
		book,
		is_active: false,
		parts: String(value.counts.parts),
		reads: `${HISTORY_MARK} ${value.checkedAt}`,
		reads_complete: String(value.counts.reads),
		votes: String(value.counts.votes),
	}
}

const TIMEOUT_MS = 5000

function toIso(value: string | undefined): string | null {
	if (!value) return null
	const date = new Date(value.replace(' ', 'T'))
	return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** Transforme un enregistrement brut ; refuse les zéros et les abréviations (« 366K »). */
export function readRecord(record: WattpadStats): StoredRecord {
	const updatedAt = toIso(record.updated)
	const counts = {
		parts: parseExactCount(record.parts),
		reads: parseExactCount(record.reads_complete),
		votes: parseExactCount(record.votes),
	}
	if (counts.reads === null || counts.votes === null || counts.parts === null) {
		return {
			counts: null,
			invalidReason: 'champ manquant ou abrégé',
			updatedAt,
		}
	}
	const wrong = implausibility(counts as BookCounts)
	if (wrong) return { counts: null, invalidReason: wrong, updatedAt }
	return { counts: counts as BookCounts, updatedAt }
}

/** Même mise en forme qu'avant : `reads` abrégé (« 366K »), le reste en chiffres exacts. */
export function toRecordFields(book: BookType, counts: BookCounts) {
	return {
		book,
		is_active: true,
		parts: String(counts.parts),
		reads: formatWattpadShort(counts.reads),
		reads_complete: String(counts.reads),
		votes: String(counts.votes),
	}
}

export function createPocketBaseStore(
	factory: () => PocketBase = createPocketBase,
	authenticate: (pb: PocketBase) => Promise<boolean> = authenticatePocketBase
): StatsStore {
	// Le SDK annule les requêtes identiques en vol : requestKey null le désactive.
	const options = () => ({
		requestKey: null,
		signal: AbortSignal.timeout(TIMEOUT_MS),
	})

	/**
	 * L'enregistrement actif le plus récemment créé pour ce roman (celui que l'écriture met à jour).
	 * Une requête par roman : une liste globale limitée à une page pouvait ne pas contenir un roman
	 * si d'anciens enregistrements actifs s'accumulaient.
	 */
	async function latest(pb: PocketBase, book: BookType) {
		const list = await pb
			.collection(COLLECTIONS.WATTPAD_STATS)
			.getList<WattpadStats>(1, 1, {
				filter: `is_active = true && book = "${book}"`,
				sort: '-created',
				...options(),
			})
		return list.items.find(item => item.book === book)
	}

	/** L'enregistrement d'historique de ce roman (le plus récent s'il y en a plusieurs). */
	async function historyRecord(pb: PocketBase, book: BookType) {
		const list = await pb
			.collection(COLLECTIONS.WATTPAD_STATS)
			.getList<WattpadStats>(1, 1, {
				filter: `is_active = false && book = "${book}" && reads ~ "${HISTORY_MARK} "`,
				sort: '-updated',
				...options(),
			})
		return list.items.find(
			item => item.book === book && item.reads?.startsWith(`${HISTORY_MARK} `)
		)
	}

	return {
		async readAll() {
			const pb = factory()
			const entries = await Promise.all(
				BOOK_TYPES.map(async book => [book, await latest(pb, book)] as const)
			)
			const result: Partial<Record<BookType, StoredRecord>> = {}
			for (const [book, item] of entries) {
				if (item) result[book] = readRecord(item)
			}
			return result
		},
		async readHistory() {
			const pb = factory()
			const result: Partial<Record<BookType, StoredHistory>> = {}
			for (const book of BOOK_TYPES) {
				const item = await historyRecord(pb, book)
				const value = item && readHistoryRecord(item)
				if (value) result[book] = value
			}
			return result
		},
		async write(book, counts) {
			const pb = factory()
			if (!(await authenticate(pb)))
				throw new Error('PocketBase : jeton absent')
			const existing = await latest(pb, book)
			const fields = toRecordFields(book, counts)
			const collection = pb.collection(COLLECTIONS.WATTPAD_STATS)
			if (existing) await collection.update(existing.id, fields, options())
			else await collection.create(fields, options())
		},
		async writeHistory(book, value) {
			const pb = factory()
			if (!(await authenticate(pb)))
				throw new Error('PocketBase : jeton absent')
			const existing = await historyRecord(pb, book)
			const fields = toHistoryFields(book, value)
			const collection = pb.collection(COLLECTIONS.WATTPAD_STATS)
			if (existing) await collection.update(existing.id, fields, options())
			else await collection.create(fields, options())
		},
	}
}
