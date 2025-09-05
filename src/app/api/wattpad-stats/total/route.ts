import { NextResponse } from 'next/server'

import {
	createSuccessResponse,
	createErrorResponse,
	handleError,
} from '@/lib/utils'
import { WattpadStatsService } from '@/services/pocketbase'
import { WattpadStatsUpdater } from '@/services/wattpad-stats-updater'

export async function GET() {
	console.info('Fetching total Wattpad stats (sum of all books)')

	try {
		// First try to get from PocketBase
		const pocketbaseStats = await WattpadStatsService.getAllBooksStats()

		// Check if we have valid data in PocketBase
		const hasValidData = Object.values(pocketbaseStats).some(
			stats =>
				stats &&
				(parseInt(stats.reads || '0') > 0 || parseInt(stats.votes || '0') > 0)
		)

		if (hasValidData) {
			console.info('📋 Using PocketBase stats for totals')
			const coeursSombres = pocketbaseStats['coeurs-sombres']
			const auPrixDuSilence = pocketbaseStats['au-prix-du-silence']

			const totalStats = {
				lastUpdated: Date.now(),
				parts: (
					parseInt(coeursSombres?.parts || '0') +
					parseInt(auPrixDuSilence?.parts || '0')
				).toString(),
				reads: (
					parseInt(coeursSombres?.reads || '0') +
					parseInt(auPrixDuSilence?.reads || '0')
				).toString(),
				readsComplete: (
					parseInt(
						coeursSombres?.reads_complete || coeursSombres?.reads || '0'
					) +
					parseInt(
						auPrixDuSilence?.reads_complete || auPrixDuSilence?.reads || '0'
					)
				).toString(),
				votes: (
					parseInt(coeursSombres?.votes || '0') +
					parseInt(auPrixDuSilence?.votes || '0')
				).toString(),
			}

			const response = createSuccessResponse(totalStats)
			response.cached = true
			return NextResponse.json(response)
		}

		// Fallback: fetch from Wattpad and save to PocketBase
		console.info(
			'📡 No valid PocketBase data, fetching from Wattpad and saving...'
		)
		const result = await WattpadStatsUpdater.performUpdate()

		if (result.success && result.stats) {
			// Calculate totals
			const coeursSombres = result.stats['coeurs-sombres']
			const auPrixDuSilence = result.stats['au-prix-du-silence']

			const totalStats = {
				lastUpdated: result.stats.lastUpdated,
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
			response.cached = false
			return NextResponse.json(response)
		} else {
			const { response, status } = createErrorResponse(
				'Failed to fetch and save total stats'
			)
			return NextResponse.json(response, { status })
		}
	} catch (error) {
		console.error('Error fetching total Wattpad stats:', error)
		const { response, status } = createErrorResponse(handleError(error))
		return NextResponse.json(response, { status })
	}
}
