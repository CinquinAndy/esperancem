import { NextResponse } from 'next/server'

import {
	createSuccessResponse,
	createErrorResponse,
	handleError,
} from '@/lib/utils'
import { WattpadStatsService } from '@/services/pocketbase'
import { WattpadStatsUpdater } from '@/services/wattpad-stats-updater'

export async function GET() {
	console.info('Fetching Wattpad stats for all books')

	try {
		// First try to get from PocketBase (preferred for consistency)
		const pocketbaseStats = await WattpadStatsService.getAllBooksStats()

		// Check if we have valid data in PocketBase
		const hasValidData = Object.values(pocketbaseStats).some(
			stats =>
				stats &&
				(parseInt(stats.reads || '0') > 0 || parseInt(stats.votes || '0') > 0)
		)

		if (hasValidData) {
			console.info('📋 Using PocketBase stats')
			// Transform PocketBase data to match expected format
			const transformedStats = {
				'au-prix-du-silence': pocketbaseStats['au-prix-du-silence']
					? {
							book: 'au-prix-du-silence',
							parts: pocketbaseStats['au-prix-du-silence'].parts || '0',
							reads: pocketbaseStats['au-prix-du-silence'].reads || '0',
							readsComplete:
								pocketbaseStats['au-prix-du-silence'].reads_complete ||
								pocketbaseStats['au-prix-du-silence'].reads ||
								'0',
							votes: pocketbaseStats['au-prix-du-silence'].votes || '0',
						}
					: null,
				'coeurs-sombres': pocketbaseStats['coeurs-sombres']
					? {
							book: 'coeurs-sombres',
							parts: pocketbaseStats['coeurs-sombres'].parts || '0',
							reads: pocketbaseStats['coeurs-sombres'].reads || '0',
							readsComplete:
								pocketbaseStats['coeurs-sombres'].reads_complete ||
								pocketbaseStats['coeurs-sombres'].reads ||
								'0',
							votes: pocketbaseStats['coeurs-sombres'].votes || '0',
						}
					: null,
				lastUpdated: Date.now(),
			}

			const response = createSuccessResponse(transformedStats)
			response.cached = true
			return NextResponse.json(response)
		}

		// Fallback: fetch from Wattpad and save to PocketBase
		console.info(
			'📡 No valid PocketBase data, fetching from Wattpad and saving...'
		)
		const result = await WattpadStatsUpdater.performUpdate()

		if (result.success && result.stats) {
			const response = createSuccessResponse(result.stats)
			response.cached = false
			return NextResponse.json(response)
		} else {
			const { response, status } = createErrorResponse(
				'Failed to fetch and save stats'
			)
			return NextResponse.json(response, { status })
		}
	} catch (error) {
		console.error('Error fetching Wattpad stats:', error)
		const { response, status } = createErrorResponse(handleError(error))
		return NextResponse.json(response, { status })
	}
}
