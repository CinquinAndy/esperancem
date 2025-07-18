import { NextResponse } from 'next/server'

import {
	createSuccessResponse,
	createErrorResponse,
	handleError,
} from '@/lib/utils'
import { WattpadStatsUpdater } from '@/services/wattpad-stats-updater'

export async function GET() {
	console.info('Fetching total Wattpad stats (sum of all books)')

	try {
		// Get stats for all books
		const result = await WattpadStatsUpdater.getStats()

		if (result.success && result.data) {
			// Calculate totals
			const coeursSombres = result.data['coeurs-sombres']
			const auPrixDuSilence = result.data['au-prix-du-silence']

			const totalStats = {
				lastUpdated: result.data.lastUpdated,
				parts: (
					parseInt(coeursSombres.parts || '0') +
					parseInt(auPrixDuSilence.parts || '0')
				).toString(),
				reads: (
					parseInt(coeursSombres.reads || '0') +
					parseInt(auPrixDuSilence.reads || '0')
				).toString(),
				readsComplete: (
					parseInt(coeursSombres.readsComplete || '0') +
					parseInt(auPrixDuSilence.readsComplete || '0')
				).toString(),
				votes: (
					parseInt(coeursSombres.votes || '0') +
					parseInt(auPrixDuSilence.votes || '0')
				).toString(),
			}

			const response = createSuccessResponse(totalStats)
			response.cached = result.cached

			return NextResponse.json(response)
		} else {
			const { response, status } = createErrorResponse(
				result.error || 'Failed to fetch total stats'
			)
			return NextResponse.json(response, { status })
		}
	} catch (error) {
		console.error('Error fetching total Wattpad stats:', error)
		const { response, status } = createErrorResponse(handleError(error))
		return NextResponse.json(response, { status })
	}
}
