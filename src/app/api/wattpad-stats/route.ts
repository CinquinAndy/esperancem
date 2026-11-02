import { NextResponse } from 'next/server'

import { toLegacyStats } from '@/app/actions/wattpad-stats'
import { createSuccessResponse } from '@/lib/utils'
import { getDisplayStats } from '@/lib/wattpad-sync/display'

export const dynamic = 'force-dynamic'

// Lecture seule : la synchro Wattpad ne se déclenche jamais depuis une visite.
export async function GET() {
	const display = await getDisplayStats()
	const response = createSuccessResponse({
		'au-prix-du-silence': {
			book: 'au-prix-du-silence',
			...toLegacyStats(display.books['au-prix-du-silence']),
		},
		'coeurs-sombres': {
			book: 'coeurs-sombres',
			...toLegacyStats(display.books['coeurs-sombres']),
		},
		lastUpdated: Date.parse(display.total.checkedAt),
	})
	response.cached = true
	return NextResponse.json(response)
}
