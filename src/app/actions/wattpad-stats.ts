'use server'

import type { BookType } from '@/lib/pocketbase'

import { WattpadStatsService } from '@/services/pocketbase'
import { WattpadStatsUpdater } from '@/services/wattpad-stats-updater'

/**
 * Get Wattpad stats for a specific book
 */
export async function getWattpadStats(bookType: BookType = 'coeurs-sombres') {
	try {
		// First try to get from PocketBase (preferred for SSG)
		const stats = await WattpadStatsService.getCurrentStats(bookType)

		if (stats) {
			// Transform to match frontend expectations
			const transformedStats = {
				lastUpdated: stats.updated
					? new Date(stats.updated).getTime()
					: Date.now(),
				parts: stats.parts || '0',
				reads: stats.reads || '0',
				readsComplete: stats.reads_complete || stats.reads || '0',
				votes: stats.votes || '0',
			}

			return {
				stats: transformedStats,
				success: true,
			}
		}

		// Fallback to fetching from Wattpad if no PocketBase data
		console.info(
			`No PocketBase stats found for ${bookType}, fetching from Wattpad...`
		)
		const result = await WattpadStatsUpdater.getBookStats(bookType)

		if (result) {
			const transformedStats = {
				lastUpdated: Date.now(),
				parts: result.parts,
				reads: result.reads,
				readsComplete: result.readsComplete,
				votes: result.votes,
			}

			return {
				stats: transformedStats,
				success: true,
			}
		}

		return {
			error: 'No stats found',
			stats: null,
			success: false,
		}
	} catch (error) {
		console.error('Error getting Wattpad stats:', error)
		return {
			error: error instanceof Error ? error.message : 'Unknown error',
			stats: null,
			success: false,
		}
	}
}

/**
 * Get stats for all books
 */
export async function getAllWattpadStats() {
	try {
		// First try to get from PocketBase
		const pocketbaseStats = await WattpadStatsService.getAllBooksStats()

		// Transform PocketBase stats to frontend format
		const transformedStats: Record<BookType, any> = {
			'au-prix-du-silence': null,
			'coeurs-sombres': null,
		}

		let hasPocketbaseData = false

		Object.keys(pocketbaseStats).forEach(bookType => {
			const stats = pocketbaseStats[bookType as BookType]
			if (stats) {
				hasPocketbaseData = true
				transformedStats[bookType as BookType] = {
					lastUpdated: stats.updated
						? new Date(stats.updated).getTime()
						: Date.now(),
					parts: stats.parts || '0',
					reads: stats.reads || '0',
					readsComplete: stats.reads_complete || stats.reads || '0',
					votes: stats.votes || '0',
				}
			}
		})

		if (hasPocketbaseData) {
			return {
				stats: transformedStats,
				success: true,
			}
		}

		// Fallback to fetching from Wattpad
		console.info('No PocketBase stats found, fetching from Wattpad...')
		const result = await WattpadStatsUpdater.getStats()

		if (result.success && result.data) {
			const transformedStats: Record<BookType, any> = {
				'au-prix-du-silence': {
					lastUpdated: result.data.lastUpdated,
					parts: result.data['au-prix-du-silence'].parts,
					reads: result.data['au-prix-du-silence'].reads,
					readsComplete: result.data['au-prix-du-silence'].readsComplete,
					votes: result.data['au-prix-du-silence'].votes,
				},
				'coeurs-sombres': {
					lastUpdated: result.data.lastUpdated,
					parts: result.data['coeurs-sombres'].parts,
					reads: result.data['coeurs-sombres'].reads,
					readsComplete: result.data['coeurs-sombres'].readsComplete,
					votes: result.data['coeurs-sombres'].votes,
				},
			}

			return {
				stats: transformedStats,
				success: true,
			}
		}

		return {
			error: 'No stats found',
			stats: null,
			success: false,
		}
	} catch (error) {
		console.error('Error getting all Wattpad stats:', error)
		return {
			error: error instanceof Error ? error.message : 'Unknown error',
			stats: null,
			success: false,
		}
	}
}

/**
 * Update Wattpad stats for all books
 */
export async function updateWattpadStats() {
	try {
		const result = await WattpadStatsUpdater.performUpdate()
		return result
	} catch (error) {
		console.error('Error updating Wattpad stats:', error)
		return {
			results: {
				'au-prix-du-silence': false,
				'coeurs-sombres': false,
			},
			stats: null,
			success: false,
			timestamp: new Date().toISOString(),
		}
	}
}

/**
 * Refresh Wattpad stats (force refresh from Wattpad)
 */
export async function refreshWattpadStats() {
	try {
		const result = await WattpadStatsUpdater.performUpdate()
		return result
	} catch (error) {
		console.error('Error refreshing Wattpad stats:', error)
		return {
			results: {
				'au-prix-du-silence': false,
				'coeurs-sombres': false,
			},
			stats: null,
			success: false,
			timestamp: new Date().toISOString(),
		}
	}
}
