import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

import { getWattpadStats } from '@/app/actions/wattpad-stats'
import { verifyAdminAuth } from '@/lib/auth'
import { runSync } from '@/lib/wattpad-sync/sync'

export const dynamic = 'force-dynamic'

/** Lecture des chiffres affichés (ADMIN_SECRET requis). */
export async function GET(request: NextRequest) {
	const authResult = verifyAdminAuth(request)
	if (!authResult.authorized) {
		return NextResponse.json({ error: authResult.error }, { status: 401 })
	}
	return NextResponse.json(await getWattpadStats())
}

/** Synchro immédiate, sans attendre le quart d'heure minimal (ADMIN_SECRET requis). */
export async function POST(request: NextRequest) {
	const authResult = verifyAdminAuth(request)
	if (!authResult.authorized) {
		return NextResponse.json({ error: authResult.error }, { status: 401 })
	}
	const report = await runSync(
		{
			onChanged: async () => {
				revalidatePath('/')
				revalidatePath('/about')
			},
		},
		{ force: true }
	)
	return NextResponse.json(report, { status: report.success ? 200 : 502 })
}
