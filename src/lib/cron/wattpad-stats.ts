/**
 * Synchro Wattpad planifiée, dans le processus Next.js (rien à installer sur le serveur).
 * Chargée par instrumentation.ts au démarrage : un relevé 10 s après le lancement, puis toutes les 6 h.
 * WATTPAD_SYNC=off la coupe (builds de comparaison, tests).
 */

import { runSync, type SyncReport } from '@/lib/wattpad-sync/sync'

export const CRON_INTERVAL_MS = 6 * 60 * 60 * 1000

let started = false
let intervalId: ReturnType<typeof setInterval> | null = null

export function isSyncEnabled() {
	return process.env.WATTPAD_SYNC !== 'off'
}

/**
 * Rafraîchit les pages après un changement de chiffres, via la route protégée existante sur la boucle locale.
 * Sans REVALIDATE_SECRET, les pages se mettent à jour à leur prochaine régénération (1 h au plus).
 */
export async function revalidatePages() {
	const secret = process.env.REVALIDATE_SECRET
	if (!secret) return
	const port = process.env.PORT || '3000'
	const response = await fetch(
		`http://127.0.0.1:${port}/api/revalidate-stats`,
		{
			cache: 'no-store',
			headers: { Authorization: `Bearer ${secret}` },
			method: 'POST',
			signal: AbortSignal.timeout(10_000),
		}
	)
	if (!response.ok) {
		console.warn(
			`Wattpad : rafraîchissement des pages refusé (HTTP ${response.status})`
		)
	}
}

export function logReport(report: SyncReport) {
	if (report.skipped) return
	for (const book of report.books) {
		const counts = book.counts
			? ` ${book.counts.reads} lectures, ${book.counts.votes} votes, ${book.counts.parts} chapitres`
			: ''
		const line = `Wattpad ${book.book} : ${book.outcome}${counts}${book.reason ? ` (${book.reason})` : ''}`
		if (book.outcome === 'ecrit') console.info(line)
		else console.warn(line)
	}
}

async function tick() {
	logReport(await runSync({ onChanged: revalidatePages }))
}

export function startWattpadStatsCron() {
	if (started || !isSyncEnabled()) return
	started = true
	setTimeout(tick, 10_000).unref?.()
	intervalId = setInterval(tick, CRON_INTERVAL_MS)
	intervalId.unref?.()
	console.info('Wattpad : synchro planifiée toutes les 6 h')
}

export function stopWattpadStatsCron() {
	if (intervalId) clearInterval(intervalId)
	intervalId = null
	started = false
}
