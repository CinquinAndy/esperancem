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
export type AnomalyField = keyof BookCounts

/** Écart suspect entre le relevé et la dernière valeur connue bonne, ou null. */
export function anomaly(
	candidate: BookCounts,
	previous: BookCounts | null
): { detail: string; field: AnomalyField; kind: Anomaly } | null {
	if (!previous) return null
	if (candidate.reads < previous.reads) {
		return {
			detail: `lectures ${previous.reads} → ${candidate.reads}`,
			field: 'reads',
			kind: 'recul',
		}
	}
	if (candidate.votes < previous.votes * (1 - VOTES_DROP_TOLERANCE)) {
		return {
			detail: `votes ${previous.votes} → ${candidate.votes}`,
			field: 'votes',
			kind: 'recul',
		}
	}
	if (candidate.parts < previous.parts - PARTS_DROP_TOLERANCE) {
		return {
			detail: `chapitres ${previous.parts} → ${candidate.parts}`,
			field: 'parts',
			kind: 'recul',
		}
	}
	if (
		previous.reads >= 1000 &&
		candidate.reads > previous.reads * SPIKE_FACTOR
	) {
		return {
			detail: `lectures ${previous.reads} → ${candidate.reads}`,
			field: 'reads',
			kind: 'bond',
		}
	}
	return null
}

/**
 * Écart admis entre deux relevés anormaux successifs pour qu'ils confirment la même anomalie.
 * Une vraie correction de Wattpad (recompte, chapitres retirés) donne une nouvelle valeur stable, qui ne
 * bouge ensuite qu'au rythme des lectures : environ +100 par roman toutes les 6 h (0,03 %), et même un
 * pic de lecture reste loin de 2 %. Une erreur de format ou d'unité donne des valeurs sans rapport entre
 * elles (×3 à ×1000, ou une valeur différente à chaque relevé) : elles ne se confirment jamais entre elles.
 */
export const CONFIRMATION_TOLERANCE = 0.02

function close(field: AnomalyField, a: number, b: number) {
	const margin = Math.max(
		CONFIRMATION_TOLERANCE * Math.max(a, b),
		// Les chapitres se comptent à l'unité : 2 % de 48 ne laisserait aucune marge.
		field === 'parts' ? PARTS_DROP_TOLERANCE : 0
	)
	return Math.abs(a - b) <= margin
}

/** Anomalie en attente de confirmation pour un roman : même type, même champ, valeurs proches. */
export interface PendingAnomaly {
	/** Nombre de relevés successifs (le dernier compris) qui montrent cette anomalie. */
	count: number
	field: AnomalyField
	kind: Anomaly
	/** Valeur du champ au dernier relevé anormal (référence de proximité du suivant). */
	value: number
}

/**
 * Suite des confirmations après un relevé réussi. Repart de zéro (null) si le relevé est invraisemblable
 * ou normal ; repart à 1 si l'anomalie diffère de celle en attente (autre type, autre champ, ou valeur
 * éloignée de plus de CONFIRMATION_TOLERANCE du relevé anormal précédent). Un échec de lecture se traite
 * à part : l'appelant efface l'attente.
 */
export function nextPending(
	pending: PendingAnomaly | null | undefined,
	candidate: BookCounts,
	previous: BookCounts | null
): PendingAnomaly | null {
	if (implausibility(candidate)) return null
	const odd = anomaly(candidate, previous)
	if (!odd) return null
	const value = candidate[odd.field]
	const continues =
		!!pending &&
		pending.kind === odd.kind &&
		pending.field === odd.field &&
		close(odd.field, pending.value, value)
	return {
		count: continues ? pending.count + 1 : 1,
		field: odd.field,
		kind: odd.kind,
		value,
	}
}

export type Verdict =
	| { accepted: true; confirmedAnomaly?: string }
	| { accepted: false; reason: string; pending: boolean }

/**
 * Décide si un relevé peut remplacer la dernière valeur connue bonne.
 * `streak` : nombre de relevés successifs (celui-ci compris) qui montrent la même anomalie, compté par
 * `nextPending` (même type, même champ, valeurs proches, sans échec ni relevé normal entre deux).
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
