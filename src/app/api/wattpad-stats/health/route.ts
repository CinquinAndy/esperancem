import { NextResponse } from 'next/server'

import { CRON_INTERVAL_MS, isSyncEnabled } from '@/lib/cron/wattpad-stats'
import { computeDisplayStats } from '@/lib/wattpad-sync/display'
import { buildHealth } from '@/lib/wattpad-sync/health'
import { getSyncState } from '@/lib/wattpad-sync/sync'

export const dynamic = 'force-dynamic'

/**
 * Fraîcheur des chiffres Wattpad, pour le QG et la surveillance. Publique et sans secret.
 * Lit PocketBase à chaque appel (pas de cache) pour dire la vérité sur son état.
 */
export async function GET() {
	const health = buildHealth({
		display: await computeDisplayStats(),
		intervalHours: CRON_INTERVAL_MS / 36e5,
		now: Date.now(),
		syncEnabled: isSyncEnabled(),
		syncState: getSyncState(),
	})
	return NextResponse.json(health, {
		headers: { 'Cache-Control': 'no-store' },
	})
}
