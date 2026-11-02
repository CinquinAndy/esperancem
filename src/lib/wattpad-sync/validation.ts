import type { BookCounts } from './types'

/**
 * Lit un nombre exact : 366177, "366177" ou "366,177".
 * Refuse tout le reste, en particulier les abréviations (« 366K », « 11.1K ») qui ont causé « 0k+ ».
 */
export function parseExactCount(value: unknown): number | null {
	if (typeof value === 'number') {
		return Number.isSafeInteger(value) && value >= 0 ? value : null
	}
	if (typeof value !== 'string') return null
	const text = value.trim()
	if (!/^(\d+|\d{1,3}(,\d{3})+)$/.test(text)) return null
	const parsed = Number(text.replace(/,/g, ''))
	return Number.isSafeInteger(parsed) ? parsed : null
}

/** Raison du refus si les chiffres sont impossibles, sinon null. */
export function implausibility(counts: BookCounts): string | null {
	const { parts, reads, votes } = counts
	for (const [name, value] of Object.entries({ parts, reads, votes })) {
		if (!Number.isSafeInteger(value) || value < 0)
			return `${name} n'est pas un entier positif`
	}
	if (reads === 0) return 'lectures à zéro'
	if (parts === 0) return 'chapitres à zéro'
	if (votes > reads) return 'plus de votes que de lectures'
	if (parts > 2000) return 'nombre de chapitres invraisemblable'
	return null
}

/** Combien de relevés successifs doivent confirmer un recul ou un bond avant de l'accepter. */
export const CONFIRMATIONS_REQUIRED = 3
/** Les votes peuvent baisser un peu (votes retirés) : jusqu'à 2 % passe sans confirmation. */
const VOTES_DROP_TOLERANCE = 0.02
/** Un ou deux chapitres retirés passent sans confirmation. */
const PARTS_DROP_TOLERANCE = 2
/** Au-delà de ×3 en un relevé, on soupçonne une erreur d'unité ou de format. */
const SPIKE_FACTOR = 3

export type Anomaly = 'recul' | 'bond'

/** Écart suspect entre le relevé et la dernière valeur connue bonne, ou null. */
export function anomaly(
	candidate: BookCounts,
	previous: BookCounts | null
): { kind: Anomaly; detail: string } | null {
	if (!previous) return null
	if (candidate.reads < previous.reads) {
		return {
			detail: `lectures ${previous.reads} → ${candidate.reads}`,
			kind: 'recul',
		}
	}
	if (candidate.votes < previous.votes * (1 - VOTES_DROP_TOLERANCE)) {
		return {
			detail: `votes ${previous.votes} → ${candidate.votes}`,
			kind: 'recul',
		}
	}
	if (candidate.parts < previous.parts - PARTS_DROP_TOLERANCE) {
		return {
			detail: `chapitres ${previous.parts} → ${candidate.parts}`,
			kind: 'recul',
		}
	}
	if (
		previous.reads >= 1000 &&
		candidate.reads > previous.reads * SPIKE_FACTOR
	) {
		return {
			detail: `lectures ${previous.reads} → ${candidate.reads}`,
			kind: 'bond',
		}
	}
	return null
}

export type Verdict =
	| { accepted: true; confirmedAnomaly?: string }
	| { accepted: false; reason: string; pending: boolean }

/**
 * Décide si un relevé peut remplacer la dernière valeur connue bonne.
 * `streak` : nombre de relevés successifs (celui-ci compris) qui montrent la même anomalie.
 */
export function judge(
	candidate: BookCounts,
	previous: BookCounts | null,
	streak: number
): Verdict {
	const wrong = implausibility(candidate)
	if (wrong) return { accepted: false, pending: false, reason: wrong }
	const odd = anomaly(candidate, previous)
	if (!odd) return { accepted: true }
	if (streak >= CONFIRMATIONS_REQUIRED) {
		return {
			accepted: true,
			confirmedAnomaly: `${odd.kind} confirmé : ${odd.detail}`,
		}
	}
	return {
		accepted: false,
		pending: true,
		reason: `${odd.kind} à confirmer (${streak}/${CONFIRMATIONS_REQUIRED}) : ${odd.detail}`,
	}
}
