import { WattpadStatsUpdater } from './wattpad-stats-updater.mjs'

/**
 * Script to update Wattpad stats in PocketBase using the service
 * Run with: PB_URL=https://api.esperancem.fr PB_TOKEN=your_token node scripts/update-wattpad-stats.mjs
 */

async function updateWattpadStats() {
	console.log('🚀 Starting Wattpad stats update process...\n')

	try {
		// Use the service to perform the complete update
		const result = await WattpadStatsUpdater.performUpdate()

		// Trigger revalidation
		await WattpadStatsUpdater.triggerRevalidation()

		console.log('\n🎉 Wattpad stats update completed successfully!')
		console.log(`\n📊 Result:`, result)
	} catch (error) {
		console.error('\n💥 Error during stats update:', error)
		process.exit(1)
	}
}

// Run the script
updateWattpadStats()
