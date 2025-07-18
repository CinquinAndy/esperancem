import { unstable_noStore as noStore } from 'next/cache'

import { refreshWattpadStats } from '@/app/actions/wattpad-stats'

/**
 * Work Job for automatic Wattpad stats updates
 * This runs in the background and updates stats without affecting the user experience
 *
 * Next.js 15 Work Jobs are perfect for this type of background processing
 */
export async function wattpadStatsUpdateJob() {
	// Disable caching for this job
	noStore()

	console.info('🔄 Starting Wattpad stats update job...')

	try {
		const result = await refreshWattpadStats()

		if (result.success) {
			console.info('✅ Wattpad stats update job completed successfully')
			console.info(
				`📊 Updated stats: ${result.stats?.reads} reads, ${result.stats?.votes} votes, ${result.stats?.parts} parts`
			)

			return {
				message: 'Stats updated successfully',
				success: true,
				timestamp: result.timestamp,
			}
		} else {
			console.error('❌ Wattpad stats update job failed:', result.error)

			return {
				error: result.error,
				success: false,
				timestamp: new Date().toISOString(),
			}
		}
	} catch (error) {
		console.error('💥 Error in Wattpad stats update job:', error)

		return {
			error: error instanceof Error ? error.message : 'Unknown error',
			success: false,
			timestamp: new Date().toISOString(),
		}
	}
}

/**
 * Scheduled Work Job - runs every 6 hours
 * This is configured in next.config.js with the experimental.workJobs option
 */
export const wattpadStatsUpdateSchedule = {
	// Run every 6 hours
	cron: '0 */6 * * *',

	description: 'Update Wattpad statistics from the website',

	// Job function
	job: wattpadStatsUpdateJob,
	// Job metadata
	name: 'wattpad-stats-update',

	// Retry configuration
	retry: {
		attempts: 3,
		delay: 5000, // 5 seconds
	},

	// Timeout configuration
	timeout: 30000, // 30 seconds
}
