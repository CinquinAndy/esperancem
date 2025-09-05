import { NextRequest, NextResponse } from 'next/server'

import type { BookType } from '@/lib/pocketbase'

import {
	createSuccessResponse,
	createErrorResponse,
	handleError,
} from '@/lib/utils'
import { WattpadStatsService } from '@/services/pocketbase'
import { WattpadStatsUpdater } from '@/services/wattpad-stats-updater'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ book: string }> }
) {
	const { book } = await params
	const bookType = book as BookType

	// Validate book type
	if (!['coeurs-sombres', 'au-prix-du-silence'].includes(bookType)) {
		return NextResponse.json(
			createErrorResponse('Invalid book type').response,
			{ status: 400 }
		)
	}

	console.info(`Fetching Wattpad stats for book: ${bookType}`)

	try {
		// First try to get from PocketBase
		const pocketbaseStats = await WattpadStatsService.getCurrentStats(bookType)

		if (
			pocketbaseStats &&
			(parseInt(pocketbaseStats.reads || '0') > 0 ||
				parseInt(pocketbaseStats.votes || '0') > 0)
		) {
			console.info(`📋 Using PocketBase stats for ${bookType}`)
			const response = createSuccessResponse({
				book: bookType,
				lastUpdated: pocketbaseStats.updated
					? new Date(pocketbaseStats.updated).getTime()
					: Date.now(),
				parts: pocketbaseStats.parts || '0',
				reads: pocketbaseStats.reads || '0',
				readsComplete:
					pocketbaseStats.reads_complete || pocketbaseStats.reads || '0',
				votes: pocketbaseStats.votes || '0',
			})
			response.cached = true
			return NextResponse.json(response)
		}

		// Fallback: fetch from Wattpad and save to PocketBase
		console.info(
			`📡 No valid PocketBase data for ${bookType}, fetching from Wattpad and saving...`
		)
		const result = await WattpadStatsUpdater.performUpdate()

		if (result.success && result.stats && result.stats[bookType]) {
			const bookStats = result.stats[bookType]
			const response = createSuccessResponse({
				book: bookStats.book,
				lastUpdated: result.stats.lastUpdated,
				parts: bookStats.parts,
				reads: bookStats.reads,
				readsComplete: bookStats.readsComplete,
				votes: bookStats.votes,
			})
			response.cached = false
			return NextResponse.json(response)
		} else {
			const { response, status } = createErrorResponse(
				`Failed to fetch and save stats for ${bookType}`
			)
			return NextResponse.json(response, { status })
		}
	} catch (error) {
		console.error(`Error fetching Wattpad stats for ${bookType}:`, error)
		const { response, status } = createErrorResponse(handleError(error))
		return NextResponse.json(response, { status })
	}
}
