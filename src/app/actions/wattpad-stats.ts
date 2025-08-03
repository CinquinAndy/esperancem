'use server'

import type { BookType } from '@/lib/pocketbase'

import { WattpadStatsService } from '@/services/pocketbase'
import { WattpadStatsUpdater } from '@/services/wattpad-stats-updater'

// Cache en mémoire pour les Server Actions
const statsCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Type pour le retour de getWattpadStats
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

function getCacheKey(operation: string, bookType?: string): string {
	return bookType ? `${operation}:${bookType}` : operation
}

function isCacheValid(timestamp: number): boolean {
	return Date.now() - timestamp < CACHE_DURATION
}

function getCachedStats<T>(key: string): T | null {
	const cached = statsCache.get(key)
	if (cached && isCacheValid(cached.timestamp)) {
		return cached.data as T
	}
	return null
}

function setCachedStats<T>(key: string, data: T): void {
	statsCache.set(key, { data, timestamp: Date.now() })
}

/**
 * Get Wattpad stats for a specific book with caching
 */
export async function getWattpadStats(
	bookType: BookType = 'coeurs-sombres'
): Promise<WattpadStatsResult> {
	const cacheKey = getCacheKey('stats', bookType)
	const cached = getCachedStats<WattpadStatsResult>(cacheKey)
	if (cached !== null) {
		return cached
	}

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

			const result: WattpadStatsResult = {
				stats: transformedStats,
				success: true,
			}

			setCachedStats(cacheKey, result)
			return result
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

			const response: WattpadStatsResult = {
				stats: transformedStats,
				success: true,
			}

			setCachedStats(cacheKey, response)
			return response
		}

		const errorResult: WattpadStatsResult = {
			error: 'No stats found',
			stats: null,
			success: false,
		}

		setCachedStats(cacheKey, errorResult)
		return errorResult
	} catch (error) {
		console.error('Error getting Wattpad stats:', error)
		const errorResult: WattpadStatsResult = {
			error: error instanceof Error ? error.message : 'Unknown error',
			stats: null,
			success: false,
		}
		setCachedStats(cacheKey, errorResult)
		return errorResult
	}
}

/**
 * Get stats for all books with caching
 */
export async function getAllWattpadStats() {
	const cacheKey = getCacheKey('all-stats')
	const cached = getCachedStats(cacheKey)
	if (cached !== null) {
		return cached
	}

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
			const result = {
				stats: transformedStats,
				success: true,
			}
			setCachedStats(cacheKey, result)
			return result
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

			const response = {
				stats: transformedStats,
				success: true,
			}
			setCachedStats(cacheKey, response)
			return response
		}

		const errorResult = {
			error: 'No stats found',
			stats: null,
			success: false,
		}
		setCachedStats(cacheKey, errorResult)
		return errorResult
	} catch (error) {
		console.error('Error getting all Wattpad stats:', error)
		const errorResult = {
			error: error instanceof Error ? error.message : 'Unknown error',
			stats: null,
			success: false,
		}
		setCachedStats(cacheKey, errorResult)
		return errorResult
	}
}

/**
 * Update Wattpad stats for all books
 */
export async function updateWattpadStats() {
	try {
		// Clear cache before updating to force fresh data
		WattpadStatsUpdater.clearCache()
		statsCache.clear() // Clear our cache too

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
		// Clear all caches
		WattpadStatsUpdater.clearCache()
		statsCache.clear()

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

/**
 * Clear all caches (useful for testing or manual refresh)
 */
export async function clearStatsCache(): Promise<void> {
	statsCache.clear()
}
