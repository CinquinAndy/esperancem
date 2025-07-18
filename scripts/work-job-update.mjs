#!/usr/bin/env node

/**
 * Work Job script for Next.js 15
 * This script is designed to work with Next.js 15 Work Jobs
 * It can be called directly or used as a standalone script
 */

import { WattpadStatsUpdater } from '../src/services/wattpad-stats-updater.js'

/**
 * Main work job function
 * This is the entry point for Next.js 15 Work Jobs
 */
export async function wattpadStatsWorkJob() {
	console.info('🔄 Starting Wattpad stats work job...')

	const startTime = Date.now()

	try {
		// Perform the update
		const result = await WattpadStatsUpdater.performUpdate()

		const duration = Date.now() - startTime

		if (result.success) {
			console.info('✅ Work job completed successfully')
			console.info(
				`📊 Updated stats: ${result.stats?.reads} reads, ${result.stats?.votes} votes, ${result.stats?.parts} parts`
			)
			console.info(`⏱️  Duration: ${duration}ms`)

			return {
				success: true,
				message: 'Stats updated successfully',
				stats: result.stats,
				duration,
				timestamp: result.timestamp,
			}
		} else {
			console.error('❌ Work job failed:', result.error)

			return {
				success: false,
				error: result.error,
				duration,
				timestamp: new Date().toISOString(),
			}
		}
	} catch (error) {
		const duration = Date.now() - startTime
		console.error('💥 Error in work job:', error)

		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			duration,
			timestamp: new Date().toISOString(),
		}
	}
}

/**
 * Standalone execution (for testing or manual runs)
 */
if (import.meta.url === `file://${process.argv[1]}`) {
	console.info('🚀 Running Wattpad stats work job in standalone mode...')

	wattpadStatsWorkJob()
		.then(result => {
			if (result.success) {
				console.info('🎉 Work job completed successfully')
				process.exit(0)
			} else {
				console.error('💥 Work job failed:', result.error)
				process.exit(1)
			}
		})
		.catch(error => {
			console.error('💥 Unexpected error:', error)
			process.exit(1)
		})
}
