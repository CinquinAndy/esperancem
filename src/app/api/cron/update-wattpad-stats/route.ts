import { NextRequest, NextResponse } from 'next/server'

import { updateWattpadStats } from '@/app/actions/wattpad-stats'
import { verifyCronAuth } from '@/lib/auth'

/**
 * Cron job endpoint for updating Wattpad stats for all books
 * Called automatically by Vercel every 6 hours
 */
export async function GET(request: NextRequest) {
	try {
		// Verify authentication using centralized utility
		const authResult = verifyCronAuth(request)
		if (!authResult.authorized) {
			return NextResponse.json({ error: authResult.error }, { status: 401 })
		}

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
