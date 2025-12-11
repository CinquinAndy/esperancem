/**
 * Wattpad Stats Cron Job
 * Automatically updates Wattpad stats every 6 hours
 *
 * This module is loaded by Next.js instrumentation at server startup
 */

import { WattpadStatsUpdater } from '@/services/wattpad-stats-updater'

// Cron interval: 6 hours in milliseconds
const CRON_INTERVAL_MS = 6 * 60 * 60 * 1000

// Track if cron is already running (prevent duplicates in dev mode with hot reload)
let cronStarted = false
let cronIntervalId: ReturnType<typeof setInterval> | null = null

/**
 * Perform the stats update
 */
async function updateStats() {
	const timestamp = new Date().toISOString()
	console.info(`\n🔄 [${timestamp}] Wattpad Stats Cron: Starting update...`)

	try {
		const result = await WattpadStatsUpdater.performUpdate()

		if (result.success) {
			console.info(`✅ [${timestamp}] Cron successful:`)
			console.info(
				`   - Cœurs Sombres: ${result.stats['coeurs-sombres'].reads} reads, ${result.stats['coeurs-sombres'].votes} votes`
			)
			console.info(
				`   - Au Prix du Silence: ${result.stats['au-prix-du-silence'].reads} reads, ${result.stats['au-prix-du-silence'].votes} votes`
			)
		} else {
			console.error(`❌ [${timestamp}] Cron failed:`, result.results)
		}

		return result
	} catch (error) {
		console.error(
			`💥 [${timestamp}] Cron error:`,
			error instanceof Error ? error.message : error
		)
		throw error
	}
}

/**
 * Start the Wattpad stats cron job
 * Called from instrumentation.ts at server startup
 */
export function startWattpadStatsCron() {
	// Prevent multiple cron instances (important for Next.js dev mode)
	if (cronStarted) {
		console.info('⚠️ Wattpad Stats Cron already running, skipping...')
		return
	}

	cronStarted = true

	console.info('🕐 Wattpad Stats Cron: Initializing...')
	console.info(`⏰ Update interval: ${CRON_INTERVAL_MS / 1000 / 60 / 60} hours`)
	console.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`)

	// Run immediately on startup (with a small delay to let the server fully start)
	setTimeout(async () => {
		console.info('🚀 Wattpad Stats Cron: Running initial update...')
		try {
			await updateStats()
		} catch (error) {
			console.error('💥 Initial cron update failed:', error)
		}
	}, 10000) // 10 second delay

	// Then run every 6 hours
	cronIntervalId = setInterval(async () => {
		try {
			await updateStats()
		} catch {
			// Error already logged in updateStats
		}
	}, CRON_INTERVAL_MS)

	console.info('✅ Wattpad Stats Cron: Started successfully!')
}

/**
 * Stop the cron job (useful for graceful shutdown)
 */
export function stopWattpadStatsCron() {
	if (cronIntervalId) {
		clearInterval(cronIntervalId)
		cronIntervalId = null
		cronStarted = false
		console.info('🛑 Wattpad Stats Cron: Stopped')
	}
}
