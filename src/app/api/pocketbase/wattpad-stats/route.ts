import { NextResponse } from 'next/server'

import { WattpadStatsService } from '@/services/pocketbase'

/**
 * GET /api/pocketbase/wattpad-stats
 * Fetch Wattpad stats from PocketBase
 */
export async function GET() {
	try {
		const stats = await WattpadStatsService.getCurrentStats()

		return NextResponse.json(stats)
	} catch (error) {
		console.error('Error in Wattpad stats API route:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
