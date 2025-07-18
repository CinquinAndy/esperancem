'use server'

import { revalidatePath } from 'next/cache'

import { WattpadStatsService } from '@/services/pocketbase'
import { WattpadStatsUpdater } from '@/services/wattpad-stats-updater'

/**
 * Server Action to get current Wattpad stats
 * This is used for SSG and server-side rendering
 */
export async function getWattpadStats() {
	try {
		// First try to get from PocketBase (preferred for SSG)
		const stats = await WattpadStatsService.getCurrentStats()

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
		console.info('No PocketBase stats found, fetching from Wattpad...')
		const result = await WattpadStatsUpdater.getStats()

		if (result.success && result.data) {
			return {
				stats: result.data,
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
 * Server Action to update Wattpad stats (admin only)
 * This triggers the full update process and revalidates pages
 */
export async function updateWattpadStats() {
	try {
		// Perform the complete update using unified service
		const result = await WattpadStatsUpdater.performUpdate()

		if (result.success) {
			// Revalidate pages that use stats
			revalidatePath('/')
			revalidatePath('/about')

			return {
				message: 'Stats updated and pages revalidated successfully',
				stats: result.stats,
				success: true,
				timestamp: result.timestamp,
			}
		} else {
			return {
				error: 'Failed to update stats',
				success: false,
			}
		}
	} catch (error) {
		console.error('Error updating Wattpad stats:', error)
		return {
			error: error instanceof Error ? error.message : 'Unknown error',
			success: false,
		}
	}
}

/**
 * Server Action to refresh stats without revalidation
 * Used for background updates
 */
export async function refreshWattpadStats() {
	try {
		const result = await WattpadStatsUpdater.performUpdate()

		return {
			stats: result.stats,
			success: result.success,
			timestamp: result.timestamp,
		}
	} catch (error) {
		console.error('Error refreshing Wattpad stats:', error)
		return {
			error: error instanceof Error ? error.message : 'Unknown error',
			success: false,
		}
	}
}
