/**
 * Next.js Instrumentation - Runs at server startup
 * This file is automatically loaded by Next.js when the server starts
 *
 * Used to start the Wattpad stats cron job that runs every 6 hours
 */

export async function register() {
	// Only run on the server side (not during build or in edge runtime)
	if (process.env.NEXT_RUNTIME === 'nodejs') {
		console.info('🚀 Next.js instrumentation: Server starting...')

		// Import and start the cron job
		const { startWattpadStatsCron } = await import('./lib/cron/wattpad-stats')
		startWattpadStatsCron()
	}
}
