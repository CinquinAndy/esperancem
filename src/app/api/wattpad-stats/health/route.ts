import { NextResponse } from 'next/server'

import { CRON_INTERVAL_MS, isSyncEnabled } from '@/lib/cron/wattpad-stats'
import {
	computeDisplayStats,
	type DisplayStats,
} from '@/lib/wattpad-sync/display'
import { buildHealth } from '@/lib/wattpad-sync/health'
import { getSyncState } from '@/lib/wattpad-sync/sync'

export const dynamic = 'force-dynamic'

/**
 * Lecture de PocketBase gardée quelques secondes : la route est publique, des appels rapprochés
 * (surveillance, rechargements) partagent une seule lecture. WATTPAD_HEALTH_CACHE_MS=0 la coupe (tests).
 */
const DEFAULT_CACHE_MS = 5000
let cached: { at: number; value: Promise<DisplayStats> } | null = null

function cacheMs() {
	const raw = Number(process.env.WATTPAD_HEALTH_CACHE_MS)
	return process.env.WATTPAD_HEALTH_CACHE_MS && Number.isFinite(raw) && raw >= 0
		? raw
		: DEFAULT_CACHE_MS
}

function readDisplay(now: number): Promise<DisplayStats> {
	if (cached && now - cached.at < cacheMs()) return cached.value
	const value = computeDisplayStats()
	cached = { at: now, value }
	// computeDisplayStats ne lève pas (PocketBase injoignable donne l'état « injoignable ») ; par
	// prudence, une erreur imprévue n'est pas gardée en cache.
	value.catch(() => {
		if (cached?.value === value) cached = null
	})
	return value
}

/**
 * Fraîcheur des chiffres Wattpad, pour le QG et la surveillance. Publique et sans secret.
 * L'état lu dans PocketBase a au plus 5 s ; l'état de la synchro est toujours celui du moment.
 */
export async function GET() {
	const now = Date.now()
	const health = buildHealth({
		display: await readDisplay(now),
		intervalHours: CRON_INTERVAL_MS / 36e5,
		now,
		syncEnabled: isSyncEnabled(),
		syncState: getSyncState(),
	})
	return NextResponse.json(health, {
		headers: { 'Cache-Control': 'no-store' },
	})
}
