#!/usr/bin/env node

/**
 * Script to trigger revalidation of Wattpad stats
 * Can be run as a cron job every 24 hours
 *
 * Usage:
 * node scripts/revalidate-stats.js
 *
 * Or as a cron job:
 * 0 6 * * * /usr/bin/node /path/to/your/project/scripts/revalidate-stats.js
 */

const SITE_URL = process.env.SITE_URL || 'https://esperancem.fr'
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET

async function revalidateStats() {
	try {
		if (!REVALIDATE_SECRET) {
			throw new Error('REVALIDATE_SECRET environment variable is required')
		}

		console.info('🔄 Starting Wattpad stats revalidation...')

		const response = await fetch(`${SITE_URL}/api/revalidate-stats`, {
			headers: {
				Authorization: `Bearer ${REVALIDATE_SECRET}`,
				'Content-Type': 'application/json',
			},
			method: 'POST',
		})

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const result = await response.json()

		if (result.revalidated) {
			console.info('✅ Stats revalidated successfully!')
			console.info(`⏰ Timestamp: ${result.timestamp}`)
		} else {
			console.warn('❌ Revalidation failed:', result.message)
		}

		return result
	} catch (error) {
		console.error('🚨 Error during revalidation:', error.message)
		process.exit(1)
	}
}

// Run the script if called directly
if (require.main === module) {
	revalidateStats()
		.then(() => {
			console.info('🎉 Revalidation process completed!')
			process.exit(0)
		})
		.catch(error => {
			console.error('💥 Fatal error:', error)
			process.exit(1)
		})
}

module.exports = { revalidateStats }
