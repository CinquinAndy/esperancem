import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

import { verifyRevalidationAuth } from '@/lib/auth'
import { runSync } from '@/lib/wattpad-sync/sync'

export const dynamic = 'force-dynamic'

/**
 * Déclenche une synchro Wattpad à la demande (planificateur externe éventuel).
 * Protégée par REVALIDATE_SECRET : avant, n'importe qui pouvait lancer une écriture en base.
 * curl -H "Authorization: Bearer $REVALIDATE_SECRET" https://esperancem.fr/api/cron/update-wattpad-stats
 */
export async function GET(request: NextRequest) {
	const auth = verifyRevalidationAuth(request)
	if (!auth.authorized) {
		return NextResponse.json(
			{ error: auth.error, success: false },
			{ status: 401 }
		)
	}
	const report = await runSync({
		onChanged: async () => {
			revalidatePath('/')
			revalidatePath('/about')
		},
	})
	return NextResponse.json(
		{
			results: report.books.map(b => ({
				book: b.book,
				outcome: b.outcome,
				reason: b.reason ?? null,
			})),
			skipped: report.skipped ?? null,
			success: report.success,
			timestamp: report.at,
		},
		{ status: report.success ? 200 : 502 }
	)
}
