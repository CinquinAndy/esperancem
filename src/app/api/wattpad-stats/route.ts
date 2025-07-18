import { NextResponse } from 'next/server'

import {
	createSuccessResponse,
	createErrorResponse,
	handleError,
} from '@/lib/utils'
import { WattpadStatsUpdater } from '@/services/wattpad-stats-updater'

export async function GET() {
	console.info('Fetching Wattpad stats for all books')

	try {
		// Use the unified service with caching
		const result = await WattpadStatsUpdater.getStats()

		if (result.success) {
			const response = createSuccessResponse(result.data)
			response.cached = result.cached

			return NextResponse.json(response)
		} else {
			const { response, status } = createErrorResponse(
				result.error || 'Failed to fetch stats'
			)
			return NextResponse.json(response, { status })
		}
	} catch (error) {
		console.error('Error fetching Wattpad stats:', error)
		const { response, status } = createErrorResponse(handleError(error))
		return NextResponse.json(response, { status })
	}
}
