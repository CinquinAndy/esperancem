import { NextResponse } from 'next/server'

import { WattpadStatsService } from '@/services/pocketbase'

/**
 * GET /api/pocketbase/wattpad-rankings
 * Fetch Wattpad rankings from PocketBase
 */
export async function GET() {
	try {
		const rankings = await WattpadStatsService.getRankings()

		return NextResponse.json(rankings)
	} catch (error) {
		console.error('Error in Wattpad rankings API route:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
