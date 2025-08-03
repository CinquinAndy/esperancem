#!/usr/bin/env node

/**
 * Simple cron script for Coolify
 * Calls the cron endpoint every 6 hours
 */

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000'
const CRON_INTERVAL = 6 * 60 * 60 * 1000 // 6 hours

console.info('🕐 Simple cron starting...')
console.info(`⏰ Interval: ${CRON_INTERVAL / 1000 / 60} minutes`)
console.info(`🌐 Site URL: ${SITE_URL}`)

async function runCron() {
	const timestamp = new Date().toISOString()
	console.info(`\n🔄 [${timestamp}] Running cron job...`)

	try {
		const response = await fetch(`${SITE_URL}/api/cron/update-wattpad-stats`)
		const data = await response.json()

		if (response.ok) {
			console.info(`✅ [${timestamp}] Cron successful:`, data.message)
		} else {
			console.error(`❌ [${timestamp}] Cron failed:`, data.error)
		}
	} catch (error) {
		console.error(`💥 [${timestamp}] Cron error:`, error.message)
	}
}

// Run immediately
runCron()

// Then every 6 hours
setInterval(runCron, CRON_INTERVAL)

console.info('🚀 Cron is now running...')
