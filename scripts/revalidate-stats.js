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

		console.info('🔄 Starting Wattpad stats update and revalidation...')

		// Step 1: Update stats in PocketBase
		console.info('📝 Step 1: Updating stats in PocketBase...')
		const updateResponse = await fetch(
			`${SITE_URL}/api/pocketbase/update-wattpad-stats`,
			{
				headers: {
					Authorization: `Bearer ${REVALIDATE_SECRET}`,
					'Content-Type': 'application/json',
				},
				method: 'POST',
			}
		)

		if (!updateResponse.ok) {
			throw new Error(`Stats update failed! status: ${updateResponse.status}`)
		}

		const updateResult = await updateResponse.json()

		if (updateResult.success) {
			console.info('✅ Stats updated in PocketBase successfully!')
			console.info(
				`📊 New stats: ${updateResult.stats.reads} reads, ${updateResult.stats.votes} votes, ${updateResult.stats.parts} parts`
			)
		} else {
			console.warn('❌ Stats update failed:', updateResult.error)
		}

		// Step 2: Trigger Next.js revalidation
		console.info('🔄 Step 2: Triggering Next.js revalidation...')
		const revalidateResponse = await fetch(`${SITE_URL}/api/revalidate-stats`, {
			headers: {
				Authorization: `Bearer ${REVALIDATE_SECRET}`,
				'Content-Type': 'application/json',
			},
			method: 'POST',
		})

		if (!revalidateResponse.ok) {
			throw new Error(
				`Revalidation failed! status: ${revalidateResponse.status}`
			)
		}

		const revalidateResult = await revalidateResponse.json()

		if (revalidateResult.revalidated) {
			console.info('✅ Pages revalidated successfully!')
			console.info(`⏰ Timestamp: ${revalidateResult.timestamp}`)
		} else {
			console.warn('❌ Revalidation failed:', revalidateResult.message)
		}

		return {
			statsUpdated: updateResult.success,
			pagesRevalidated: revalidateResult.revalidated,
			timestamp: new Date().toISOString(),
		}
	} catch (error) {
		console.error('🚨 Error during update and revalidation:', error.message)
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
