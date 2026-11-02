import type { BookType } from '@/lib/pocketbase'

import type { DisplayStats } from './display'
import type { SyncState } from './sync'

/** Au-delà, les chiffres affichés sont considérés en retard (4 synchros manquées). */
export const STALE_AFTER_HOURS = 24

export type HealthStatus = 'ok' | 'en-retard' | 'degrade'

export interface HealthInput {
	display: DisplayStats
	intervalHours: number
	now: number
	syncEnabled: boolean
	syncState: SyncState
}

const hours = (from: string, now: number) =>
	Math.round(((now - Date.parse(from)) / 36e5) * 10) / 10

/**
 * État de fraîcheur lisible par le QG. Aucun secret : chiffres publics, dates et motifs d'échec rédigés ici.
 * - degrade : PocketBase injoignable, ou sans valeur valide pour un roman ;
 * - en-retard : la dernière synchro réussie (écriture validée en base) date de plus de 24 h pour un roman ;
 * - ok : sinon.
 */
export function buildHealth({
	display,
	intervalHours,
	now,
	syncEnabled,
	syncState,
}: HealthInput) {
	const books = {} as Record<
		BookType,
		{
			ageHeures: number | null
			chapitres: number
			lectures: number
			source: string
			valeurDu: string
			verifieLe: string | null
			votes: number
		}
	>
	for (const [book, stats] of Object.entries(display.books) as [
		BookType,
		DisplayStats['books'][BookType],
	][]) {
		// Fraîcheur de la synchro, pas de la valeur affichée : un relevé committé récent ne doit pas masquer
		// une synchro arrêtée. Une synchro réussie sans changement ne modifie pas forcément `updated`.
		const confirmed =
			[display.storedAt[book], syncState.lastSuccessAt[book]]
				.filter((v): v is string => !!v)
				.sort()
				.at(-1) ?? null
		books[book] = {
			ageHeures: confirmed ? hours(confirmed, now) : null,
			chapitres: stats.parts,
			lectures: stats.reads,
			source: stats.source,
			valeurDu: stats.checkedAt,
			verifieLe: confirmed,
			votes: stats.votes,
		}
	}
	const dates = Object.values(books).map(b => b.verifieLe)
	const oldest = dates.includes(null) ? null : (dates as string[]).sort()[0]
	const age = oldest ? hours(oldest, now) : null
	// Dégradé = PocketBase ne peut pas servir de dernière valeur bonne (injoignable, vide ou écartée).
	const degraded = display.pocketbase !== 'ok' || oldest === null
	const status: HealthStatus = degraded
		? 'degrade'
		: (age ?? Infinity) > STALE_AFTER_HOURS
			? 'en-retard'
			: 'ok'
	const report = syncState.lastReport
	return {
		ageHeures: age,
		ecartes: display.rejected,
		livres: books,
		pocketbase: display.pocketbase,
		seuilRetardHeures: STALE_AFTER_HOURS,
		statut: status,
		synchro: {
			active: syncEnabled,
			derniereTentative: syncState.lastAttemptAt,
			echecsConsecutifs: syncState.consecutiveFailures,
			intervalleHeures: intervalHours,
			resultats:
				report?.books.map(b => ({
					livre: b.book,
					motif: b.reason ?? null,
					resultat: b.outcome,
				})) ?? [],
		},
		total: {
			chapitres: display.total.parts,
			lectures: display.total.reads,
			votes: display.total.votes,
		},
		verifieLe: oldest,
	}
}
