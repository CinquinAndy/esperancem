import { NextRequest, NextResponse } from 'next/server'

import type { BookType } from '@/lib/pocketbase'

import {
	createSuccessResponse,
	createErrorResponse,
	handleError,
} from '@/lib/utils'
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
		// Get stats for specific book
		const result = await WattpadStatsUpdater.getBookStats(bookType)

		if (result) {
			const response = createSuccessResponse({
				book: result.book,
				lastUpdated: Date.now(),
				parts: result.parts,
				reads: result.reads,
				readsComplete: result.readsComplete,
				votes: result.votes,
			})

			return NextResponse.json(response)
		} else {
			const { response, status } = createErrorResponse(
				`Failed to fetch stats for ${bookType}`
			)
			return NextResponse.json(response, { status })
		}
	} catch (error) {
		console.error(`Error fetching Wattpad stats for ${bookType}:`, error)
		const { response, status } = createErrorResponse(handleError(error))
		return NextResponse.json(response, { status })
	}
}
