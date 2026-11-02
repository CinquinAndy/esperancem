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
/**
 * Hausse des lectures au-delà de ×1,5 en un relevé : suspecte (erreur d'unité, de format, autre roman).
 * Le rythme réel est d'environ +100 lectures par roman toutes les 6 h sur plus de 100 000.
 */
const READS_SPIKE_FACTOR = 1.5
/** Hausse des votes au-delà de ×1,5, ou plus forte que celle des lectures : suspecte. */
const VOTES_SPIKE_FACTOR = 1.5
/** En dessous de cette hausse, les votes ne sont jamais traités comme un bond (petits nombres). */
const VOTES_SPIKE_MIN = 50
/** Plus de 5 chapitres publiés d'un relevé à l'autre : suspect. */
const PARTS_SPIKE = 5

export type Anomaly = 'recul' | 'bond'
export type AnomalyField = keyof BookCounts

export interface AnomalyDetail {
	detail: string
	field: AnomalyField
	kind: Anomaly
}

const LABELS: Record<AnomalyField, string> = {
	parts: 'chapitres',
	reads: 'lectures',
	votes: 'votes',
}

/**
 * Tous les écarts suspects entre le relevé et la dernière valeur connue bonne, champ par champ
 * (lectures, votes, chapitres ; un recul ou un bond chacun). Liste vide si rien n'est suspect.
 */
export function anomalies(
	candidate: BookCounts,
	previous: BookCounts | null
): AnomalyDetail[] {
	if (!previous) return []
	const found: AnomalyDetail[] = []
	const add = (field: AnomalyField, kind: Anomaly) =>
		found.push({
			detail: `${LABELS[field]} ${previous[field]} → ${candidate[field]}`,
			field,
			kind,
		})

	if (candidate.reads < previous.reads) add('reads', 'recul')
	else if (
		previous.reads >= 1000 &&
		candidate.reads > previous.reads * READS_SPIKE_FACTOR
	)
		add('reads', 'bond')

	const votesGain = candidate.votes - previous.votes
	const readsGain = Math.max(0, candidate.reads - previous.reads)
	if (candidate.votes < previous.votes * (1 - VOTES_DROP_TOLERANCE))
		add('votes', 'recul')
	else if (
		votesGain > VOTES_SPIKE_MIN &&
		(candidate.votes > previous.votes * VOTES_SPIKE_FACTOR ||
			votesGain > readsGain)
	)
		add('votes', 'bond')

	if (candidate.parts < previous.parts - PARTS_DROP_TOLERANCE)
		add('parts', 'recul')
	else if (candidate.parts > previous.parts + PARTS_SPIKE) add('parts', 'bond')

	return found
}

/** Signature d'un ensemble d'anomalies : deux relevés ne se confirment que s'ils ont la même. */
function signature(found: AnomalyDetail[]) {
	return found
		.map(a => `${a.kind}:${a.field}`)
		.sort()
		.join(',')
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

function allClose(a: BookCounts, b: BookCounts) {
	return (['reads', 'votes', 'parts'] as const).every(field =>
		close(field, a[field], b[field])
	)
}

/** Anomalies en attente de confirmation pour un roman : mêmes anomalies, relevés proches sur tous les champs. */
export interface PendingAnomaly {
	/** Nombre de relevés successifs (le dernier compris) qui montrent ces anomalies. */
	count: number
	/** Relevé anormal précédent, en entier (référence de proximité du suivant, champ par champ). */
	counts: BookCounts
	/** Anomalies du relevé, triées (« recul:reads », « bond:votes »…). */
	signature: string
}

/**
 * Suite des confirmations après un relevé réussi. Repart de zéro (null) si le relevé est invraisemblable
 * ou normal ; repart à 1 si les anomalies diffèrent de celles en attente (autre type, autre champ, un champ
 * de plus ou de moins) ou si un champ, quel qu'il soit, s'éloigne de plus de CONFIRMATION_TOLERANCE du
 * relevé anormal précédent. Un échec de lecture se traite à part : l'appelant efface l'attente.
 */
export function nextPending(
	pending: PendingAnomaly | null | undefined,
	candidate: BookCounts,
	previous: BookCounts | null
): PendingAnomaly | null {
	if (implausibility(candidate)) return null
	const found = anomalies(candidate, previous)
	if (found.length === 0) return null
	const sig = signature(found)
	const continues =
		!!pending &&
		pending.signature === sig &&
		allClose(pending.counts, candidate)
	return {
		count: continues ? pending.count + 1 : 1,
		counts: { ...candidate },
		signature: sig,
	}
}

export type Verdict =
	| { accepted: true; confirmedAnomaly?: string }
	| { accepted: false; reason: string; pending: boolean }

/**
 * Décide si un relevé peut remplacer la dernière valeur connue bonne.
 * `streak` : nombre de relevés successifs (celui-ci compris) qui montrent les mêmes anomalies, compté par
 * `nextPending` (mêmes anomalies, tous les champs proches, sans échec ni relevé normal entre deux).
 */
export function judge(
	candidate: BookCounts,
	previous: BookCounts | null,
	streak: number
): Verdict {
	const wrong = implausibility(candidate)
	if (wrong) return { accepted: false, pending: false, reason: wrong }
	const found = anomalies(candidate, previous)
	if (found.length === 0) return { accepted: true }
	// « recul », « bond » ou « recul et bond », puis le détail de chaque champ.
	const kinds = [...new Set(found.map(a => a.kind))].join(' et ')
	const detail = found.map(a => a.detail).join(' ; ')
	if (streak >= CONFIRMATIONS_REQUIRED) {
		return { accepted: true, confirmedAnomaly: `${kinds} confirmé : ${detail}` }
	}
	return {
		accepted: false,
		pending: true,
		reason: `${kinds} à confirmer (${streak}/${CONFIRMATIONS_REQUIRED}) : ${detail}`,
	}
}
