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
 * - en-retard : la plus ancienne confirmation Wattpad dépasse 24 h ;
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
			ageHeures: number
			chapitres: number
			lectures: number
			source: string
			verifieLe: string
			votes: number
		}
	>
	for (const [book, stats] of Object.entries(display.books) as [
		BookType,
		DisplayStats['books'][BookType],
	][]) {
		// Une synchro réussie sans changement ne modifie pas forcément `updated` : on retient la plus récente.
		const confirmed = [stats.checkedAt, syncState.lastSuccessAt[book]]
			.filter((v): v is string => !!v)
			.sort()
			.at(-1) as string
		books[book] = {
			ageHeures: hours(confirmed, now),
			chapitres: stats.parts,
			lectures: stats.reads,
			source: stats.source,
			verifieLe: confirmed,
			votes: stats.votes,
		}
	}
	const oldest = Object.values(books)
		.map(b => b.verifieLe)
		.sort()[0]
	const age = hours(oldest, now)
	// Dégradé = PocketBase ne peut pas servir de dernière valeur bonne (injoignable, vide ou écartée).
	// Un relevé committé simplement plus récent que PocketBase n'est pas une panne : c'est l'âge qui le dira.
	const degraded =
		display.pocketbase !== 'ok' ||
		Object.keys(display.books).some(book => !display.storedAt[book as BookType])
	const status: HealthStatus = degraded
		? 'degrade'
		: age > STALE_AFTER_HOURS
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
