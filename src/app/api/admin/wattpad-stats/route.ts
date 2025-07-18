import { NextRequest, NextResponse } from 'next/server'

import {
	updateWattpadStats,
	getWattpadStats,
} from '@/app/actions/wattpad-stats'

/**
 * Admin-only endpoint for Wattpad stats management
 * Requires ADMIN_SECRET for authentication
 */
export async function GET(request: NextRequest) {
	try {
		// Check admin authentication
		const authHeader = request.headers.get('authorization')
		if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const stats = await getWattpadStats()

		return NextResponse.json(stats)
	} catch (error) {
		console.error('Error in admin stats GET:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

/**
 * Admin-only endpoint to trigger manual stats update
 */
export async function POST(request: NextRequest) {
	try {
		// Check admin authentication
		const authHeader = request.headers.get('authorization')
		if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const result = await updateWattpadStats()

		return NextResponse.json(result)
	} catch (error) {
		console.error('Error in admin stats POST:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
