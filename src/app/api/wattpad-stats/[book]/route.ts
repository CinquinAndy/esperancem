import { NextRequest, NextResponse } from 'next/server'

import { toLegacyStats } from '@/app/actions/wattpad-stats'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'
import { isBookType } from '@/lib/wattpad-sync/books'
import { getDisplayStats } from '@/lib/wattpad-sync/display'

export const dynamic = 'force-dynamic'

// Lecture seule : la synchro Wattpad ne se déclenche jamais depuis une visite.
export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ book: string }> }
) {
	const { book } = await params
	if (!isBookType(book)) {
		return NextResponse.json(
			createErrorResponse('Invalid book type').response,
			{
				status: 400,
			}
		)
	}
	const display = await getDisplayStats()
	const response = createSuccessResponse({
		book,
		...toLegacyStats(display.books[book]),
	})
	response.cached = true
	return NextResponse.json(response)
}
