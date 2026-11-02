import type PocketBase from 'pocketbase'

import {
	authenticatePocketBase,
	type BookType,
	COLLECTIONS,
	createPocketBase,
	type WattpadStats,
} from '@/lib/pocketbase'

import type { BookCounts } from './types'

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
	/** Lève une erreur si PocketBase est injoignable. */
	readAll(): Promise<Partial<Record<BookType, StoredRecord>>>
	/** N'écrit que des chiffres déjà validés. Lève une erreur si l'écriture échoue. */
	write(book: BookType, counts: BookCounts): Promise<void>
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

	async function latest(pb: PocketBase, book?: BookType) {
		const filter = book
			? `is_active = true && book = "${book}"`
			: 'is_active = true'
		const list = await pb
			.collection(COLLECTIONS.WATTPAD_STATS)
			.getList<WattpadStats>(1, 50, { filter, sort: '-created', ...options() })
		return list.items
	}

	return {
		async readAll() {
			const items = await latest(factory())
			const result: Partial<Record<BookType, StoredRecord>> = {}
			// Même règle que l'écriture : l'enregistrement actif le plus récemment créé fait foi.
			for (const item of items) {
				if (item.book && !result[item.book])
					result[item.book] = readRecord(item)
			}
			return result
		},
		async write(book, counts) {
			const pb = factory()
			if (!(await authenticate(pb)))
				throw new Error('PocketBase : jeton absent')
			const [existing] = await latest(pb, book)
			const fields = toRecordFields(book, counts)
			const collection = pb.collection(COLLECTIONS.WATTPAD_STATS)
			if (existing) await collection.update(existing.id, fields, options())
			else await collection.create(fields, options())
		},
	}
}
