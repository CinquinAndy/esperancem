import { unstable_noStore as noStore } from 'next/cache'

import { WattpadStatsService } from '@/services/pocketbase'
import { WattpadStatsUpdater } from '@/services/wattpad-stats-updater'

/**
 * Internal utilities for admin and maintenance operations
 * These functions are not exposed to the public and are used internally
 */

/**
 * Check if the current request is from an admin
 */
export function isAdminRequest(request: Request): boolean {
	const authHeader = request.headers.get('authorization')
	return authHeader === `Bearer ${process.env.ADMIN_SECRET}`
}

/**
 * Get system health status
 */
export async function getSystemHealth() {
	noStore() // Disable caching for health checks

	try {
		// Check PocketBase connection
		const stats = await WattpadStatsService.getCurrentStats()
		const pocketbaseHealthy = !!stats

		// Check if stats are recent (within last 24 hours)
		const statsAge = stats?.updated
			? Date.now() - new Date(stats.updated).getTime()
			: Infinity
		const statsRecent = statsAge < 24 * 60 * 60 * 1000 // 24 hours

		return {
			healthy: pocketbaseHealthy && statsRecent,
			lastUpdate: stats?.updated || null,
			services: {
				pocketbase: pocketbaseHealthy,
				stats: statsRecent,
			},
			statsAge: statsAge,
			timestamp: new Date().toISOString(),
		}
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : 'Unknown error',
			healthy: false,
			services: {
				pocketbase: false,
				stats: false,
			},
			timestamp: new Date().toISOString(),
		}
	}
}

/**
 * Force update stats (admin only)
 */
export async function forceUpdateStats() {
	noStore()

	try {
		const result = await WattpadStatsUpdater.performUpdate()

		return {
			stats: result.stats,
			success: result.success,
			timestamp: result.timestamp,
		}
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : 'Unknown error',
			success: false,
			timestamp: new Date().toISOString(),
		}
	}
}

/**
 * Get system metrics
 */
export async function getSystemMetrics() {
	noStore()

	try {
		const stats = await WattpadStatsService.getCurrentStats()

		return {
			stats: stats
				? {
						lastUpdated: stats.updated,
						parts: stats.parts,
						reads: stats.reads,
						votes: stats.votes,
					}
				: null,
			system: {
				memory: process.memoryUsage(),
				uptime: process.uptime(),
				version: process.version,
			},
			timestamp: new Date().toISOString(),
		}
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : 'Unknown error',
			timestamp: new Date().toISOString(),
		}
	}
}

/**
 * Validate environment configuration
 */
export function validateEnvironment() {
	const required = ['PB_URL', 'PB_TOKEN', 'ADMIN_SECRET']

	const missing = required.filter(key => !process.env[key])

	return {
		configured: required.length - missing.length,
		missing,
		total: required.length,
		valid: missing.length === 0,
	}
}
