#!/usr/bin/env node

/**
 * Cron Runner for Coolify
 * Runs Wattpad stats updates at regular intervals
 */

import { updateWattpadStats } from '../src/app/actions/wattpad-stats.js'

const CRON_INTERVAL = parseInt(process.env.CRON_INTERVAL) || 21600000 // 6 hours default
const APP_URL = process.env.SITE_URL || 'http://localhost:3000'

console.log('🕐 Cron Runner starting...')
console.log(`⏰ Interval: ${CRON_INTERVAL / 1000 / 60} minutes`)
console.log(`🌐 App URL: ${APP_URL}`)

/**
 * Execute the Wattpad stats update
 */
async function executeUpdate() {
	const timestamp = new Date().toISOString()
	console.log(`\n🔄 [${timestamp}] Starting scheduled update...`)

	try {
		const result = await updateWattpadStats()

		if (result.success) {
			console.log(`✅ [${timestamp}] Update successful`)
			console.log(`📊 Stats: ${JSON.stringify(result.stats, null, 2)}`)
		} else {
			console.error(`❌ [${timestamp}] Update failed:`, result.error)
		}
	} catch (error) {
		console.error(`💥 [${timestamp}] Unexpected error:`, error)
	}
}

/**
 * Health check to ensure the app is running
 */
async function healthCheck() {
	try {
		const response = await fetch(`${APP_URL}/api/health`)
		if (!response.ok) {
			console.warn('⚠️ Health check failed, app might not be ready')
			return false
		}
		return true
	} catch (error) {
		console.warn('⚠️ Health check error:', error.message)
		return false
	}
}

/**
 * Main cron loop
 */
async function startCron() {
	// Initial health check
	console.log('🏥 Performing initial health check...')
	const isHealthy = await healthCheck()

	if (!isHealthy) {
		console.log('⏳ Waiting for app to be ready...')
		// Wait 30 seconds and try again
		await new Promise(resolve => setTimeout(resolve, 30000))
	}

	// Execute first update
	await executeUpdate()

	// Set up recurring updates
	setInterval(async () => {
		await executeUpdate()
	}, CRON_INTERVAL)

	console.log(
		'🚀 Cron runner is now active and will execute updates automatically'
	)
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
	console.log('🛑 Received SIGTERM, shutting down gracefully...')
	process.exit(0)
})

process.on('SIGINT', () => {
	console.log('🛑 Received SIGINT, shutting down gracefully...')
	process.exit(0)
})

// Start the cron runner
startCron().catch(error => {
	console.error('💥 Failed to start cron runner:', error)
	process.exit(1)
})
