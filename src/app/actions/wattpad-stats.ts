import type { BookType } from '@/lib/pocketbase'
import type { KnownStats } from '@/lib/wattpad-sync/types'

import { getDisplayStats } from '@/lib/wattpad-sync/display'
import { formatWattpadShort } from '@/lib/wattpad-sync/format'
import { runSync, type SyncReport } from '@/lib/wattpad-sync/sync'

// Module serveur ordinaire (plus de « use server ») : rien ici n'est appelable depuis le navigateur.

export interface WattpadStatsResult {
	success: boolean
	stats?: {
		lastUpdated: number
		parts: string
		reads: string
		readsComplete: string
		votes: string
	} | null
	error?: string
}

/** Forme historique des réponses : `reads` abrégé (« 366K »), le reste en chiffres exacts. */
export function toLegacyStats(stats: KnownStats) {
	return {
		lastUpdated: Date.parse(stats.checkedAt),
		parts: String(stats.parts),
		reads: formatWattpadShort(stats.reads),
		readsComplete: String(stats.reads),
		votes: String(stats.votes),
	}
}

/** Dernière valeur connue bonne d'un roman. Toujours une valeur : jamais 0, jamais d'erreur. */
export async function getWattpadStats(
	bookType: BookType = 'coeurs-sombres'
): Promise<WattpadStatsResult> {
	const display = await getDisplayStats()
	return { stats: toLegacyStats(display.books[bookType]), success: true }
}

export async function getAllWattpadStats() {
	const display = await getDisplayStats()
	return {
		stats: {
			'au-prix-du-silence': toLegacyStats(display.books['au-prix-du-silence']),
			'coeurs-sombres': toLegacyStats(display.books['coeurs-sombres']),
		},
		success: true,
	}
}

/** Relève Wattpad maintenant (route d'administration et route protégée de synchro). */
export async function updateWattpadStats(): Promise<SyncReport> {
	return runSync({}, { force: true })
}

export const refreshWattpadStats = updateWattpadStats
