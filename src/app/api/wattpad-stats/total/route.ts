import { NextResponse } from 'next/server'

import { createSuccessResponse } from '@/lib/utils'
import { getDisplayStats } from '@/lib/wattpad-sync/display'
import { legacyThousands } from '@/lib/wattpad-sync/format'

export const dynamic = 'force-dynamic'

// Lecture seule. Forme inchangée (lue par le QG) : `readsComplete`, `votes`, `parts` exacts ;
// `reads` reste la somme des milliers abrégés (« 366K » + « 137K » = « 503 »), comme avant ; au-delà
// du million, « 1.2M » compte 1200 et non plus 1.
export async function GET() {
	const display = await getDisplayStats()
	const { books, total } = display
	const legacyReads = Object.values(books).reduce(
		(sum, stats) => sum + legacyThousands(stats.reads),
		0
	)
	const response = createSuccessResponse({
		lastUpdated: Date.parse(total.checkedAt),
		parts: String(total.parts),
		reads: String(legacyReads),
		readsComplete: String(total.reads),
		votes: String(total.votes),
	})
	response.cached = true
	return NextResponse.json(response)
}
