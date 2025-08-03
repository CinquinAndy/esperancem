import { NextResponse } from 'next/server'

import { updateWattpadStats } from '@/app/actions/wattpad-stats'

/**
 * Cron job endpoint for updating Wattpad stats for all books
 * Called automatically by Vercel every 6 hours
 *
 * For local development/testing, you can call this endpoint manually:
 * curl -X GET http://localhost:3000/api/cron/update-wattpad-stats
 */
export async function GET() {
	try {
		console.info('🔄 Cron job: Starting Wattpad stats update for all books...')

		const result = await updateWattpadStats()

		if (result.success) {
			console.info('✅ Cron job: All books stats updated successfully')
			return NextResponse.json({
				message: 'All books stats updated successfully',
				results: result.results,
				success: true,
				timestamp: result.timestamp,
			})
		} else {
			console.error(
				'❌ Cron job: Failed to update some books stats:',
				result.results
			)
			return NextResponse.json(
				{
					error: 'Some books failed to update',
					results: result.results,
					success: false,
					timestamp: result.timestamp,
				},
				{ status: 500 }
			)
		}
	} catch (error) {
		console.error('💥 Cron job: Unexpected error:', error)
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : 'Unknown error',
				success: false,
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		)
	}
}
