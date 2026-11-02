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
	// Les deux romans suivis ont des milliers de votes : 0 vient d'une source cassée, jamais de Wattpad.
	if (votes === 0) return 'votes à zéro'
	if (votes > reads) return 'plus de votes que de lectures'
	if (parts > 2000) return 'nombre de chapitres invraisemblable'
	return null
}

/** Combien de relevés successifs doivent confirmer un recul ou un bond avant de l'accepter. */
export const CONFIRMATIONS_REQUIRED = 3

/**
 * Bornes d'un relevé normal, symétriques (même écart admis vers le haut et vers le bas) et proportionnelles
 * au temps écoulé depuis la référence, compté en pas de 6 h (le rythme du minuteur), au moins un pas.
 * Rythme réel observé (02/11/2026) : Cœurs sombres environ +100 lectures et +1 vote par 6 h, Au prix du
 * silence environ +40 lectures ; le jour d'un chapitre, jusqu'à +400 lectures et +60 votes.
 * Symétriques : si un faux relevé passe juste sous une borne, la vraie valeur suivante, qui s'en écarte
 * d'autant dans l'autre sens, passe aussi ; un faux accepté ne bloque donc pas la vraie valeur.
 */
export const STEP_MS = 6 * 3600 * 1000
/** Au-delà de 7 jours sans référence plus récente, les bornes cessent de s'élargir. */
const MAX_STEPS = 28
/** Lectures : 0,5 % par pas (1 830 pour Cœurs sombres, 18 fois le rythme réel), au moins 1 000 par pas. */
const READS_RATE_PER_STEP = 0.005
const READS_FLOOR_PER_STEP = 1000
/**
 * Votes : bornés en valeur absolue (15 par pas, pour environ 1 vote réel), plus 1 vote pour 10 lectures
 * gagnées ou perdues et 50 par chapitre publié ou retiré (les votes d'un nouveau chapitre arrivent d'un coup,
 * parfois avant les lectures : +60 votes pour +40 lectures passe s'il y a un chapitre de plus).
 */
const VOTES_FLOOR_PER_STEP = 15
const VOTES_PER_READ = 0.1
const VOTES_PER_PART = 50
/** Chapitres : deux de plus ou de moins d'un relevé à l'autre. */
const PARTS_BAND = 2
/**
 * Anomalie grave : un chiffre divisé ou multiplié par 2 ou plus, ou des chapitres tombés sous le relevé
 * committé (plancher connu, moins les 2 chapitres de marge). C'est la signature d'une source cassée (page d'un seul chapitre, mauvais champ, mauvaise unité),
 * pas d'une évolution réelle. Elle n'est acceptée qu'après 7 jours de relevés cohérents sans interruption
 * (au moins 28 relevés) : le seul cas réel connu, l'autrice qui retire ou fusionne des chapitres, est rare
 * et peut attendre une semaine ; une source cassée se voit avant dans la route de santé (échecs et motif).
 */
export const SEVERE_CONFIRMATION_MS = 7 * 24 * 3600 * 1000
const SEVERE_FACTOR = 2

function steps(elapsedMs: number | undefined) {
	if (elapsedMs === undefined || !Number.isFinite(elapsedMs)) return 1
	return Math.min(MAX_STEPS, Math.max(1, elapsedMs / STEP_MS))
}

/** Écart admis pour chaque chiffre entre la référence et le relevé, dans les deux sens. */
export function bands(
	previous: BookCounts,
	candidate: BookCounts,
	elapsedMs?: number
): BookCounts {
	const n = steps(elapsedMs)
	const reads =
		Math.max(READS_FLOOR_PER_STEP, READS_RATE_PER_STEP * previous.reads) * n
	// Lectures prises en compte pour les votes : jamais plus que la borne des lectures (un faux ×10 sur les
	// lectures ne doit pas ouvrir la porte à n'importe quel nombre de votes).
	const readsMoved = Math.min(Math.abs(candidate.reads - previous.reads), reads)
	const partsMoved = Math.min(
		Math.abs(candidate.parts - previous.parts),
		PARTS_BAND
	)
	return {
		parts: PARTS_BAND,
		reads,
		votes:
			VOTES_FLOOR_PER_STEP * n +
			VOTES_PER_READ * readsMoved +
			VOTES_PER_PART * partsMoved,
	}
}

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
 * Tous les écarts suspects entre le relevé et une référence connue bonne, champ par champ (lectures, votes,
 * chapitres ; un recul ou un bond chacun), selon les bornes de `bands`. Liste vide si rien n'est suspect.
 * `elapsedMs` : temps écoulé depuis que Wattpad a confirmé la référence (un pas de 6 h si inconnu).
 */
export function anomalies(
	candidate: BookCounts,
	previous: BookCounts | null,
	elapsedMs?: number
): AnomalyDetail[] {
	if (!previous) return []
	const limit = bands(previous, candidate, elapsedMs)
	const found: AnomalyDetail[] = []
	for (const field of ['reads', 'votes', 'parts'] as const) {
		const delta = candidate[field] - previous[field]
		if (Math.abs(delta) <= limit[field]) continue
		found.push({
			detail: `${LABELS[field]} ${previous[field]} → ${candidate[field]}`,
			field,
			kind: delta < 0 ? 'recul' : 'bond',
		})
	}
	return found
}

/**
 * Raison pour laquelle une anomalie est grave (voir SEVERE_CONFIRMATION_MS), sinon null.
 * `floor` : relevé committé, plancher connu de chaque roman.
 */
export function severity(
	candidate: BookCounts,
	previous: BookCounts | null,
	floor?: BookCounts | null
): string | null {
	for (const field of ['reads', 'votes', 'parts'] as const) {
		if (previous) {
			if (candidate[field] * SEVERE_FACTOR <= previous[field])
				return `${LABELS[field]} divisés par ${SEVERE_FACTOR} ou plus`
			if (candidate[field] >= previous[field] * SEVERE_FACTOR)
				return `${LABELS[field]} multipliés par ${SEVERE_FACTOR} ou plus`
		}
	}
	if (floor && candidate.parts < floor.parts - PARTS_BAND)
		return `chapitres sous le relevé committé (${floor.parts})`
	return null
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
		field === 'parts' ? PARTS_BAND : 0
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
	/** Date (ISO) du premier relevé de la série : une anomalie grave se confirme dans la durée. */
	since?: string
}

export interface JudgeOptions {
	/** Temps écoulé depuis la confirmation de la référence par Wattpad (un pas de 6 h si absent). */
	elapsedMs?: number
	/** Relevé committé : plancher connu, sous lequel une anomalie est grave. */
	floor?: BookCounts | null
	/** Depuis combien de temps la série de confirmations dure (0 si absent). */
	pendingForMs?: number
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
	previous: BookCounts | null,
	{ elapsedMs, now = Date.now() }: { elapsedMs?: number; now?: number } = {}
): PendingAnomaly | null {
	if (implausibility(candidate)) return null
	const found = anomalies(candidate, previous, elapsedMs)
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
		since:
			(continues ? pending.since : undefined) ?? new Date(now).toISOString(),
	}
}

export type Verdict =
	| { accepted: true; confirmedAnomaly?: string }
	| { accepted: false; reason: string; pending: boolean }

function days(ms: number) {
	return Math.floor(ms / (24 * 3600 * 1000))
}

/**
 * Décide si un relevé peut remplacer la dernière valeur connue bonne.
 * `streak` : nombre de relevés successifs (celui-ci compris) qui montrent les mêmes anomalies, compté par
 * `nextPending` (mêmes anomalies, tous les champs proches, sans échec ni relevé normal entre deux).
 * Une anomalie grave (voir `severity`) demande en plus SEVERE_CONFIRMATION_MS de relevés cohérents.
 */
export function judge(
	candidate: BookCounts,
	previous: BookCounts | null,
	streak: number,
	{ elapsedMs, floor, pendingForMs = 0 }: JudgeOptions = {}
): Verdict {
	const wrong = implausibility(candidate)
	if (wrong) return { accepted: false, pending: false, reason: wrong }
	const found = anomalies(candidate, previous, elapsedMs)
	if (found.length === 0) return { accepted: true }
	// « recul », « bond » ou « recul et bond », puis le détail de chaque champ.
	const kinds = [...new Set(found.map(a => a.kind))].join(' et ')
	const detail = found.map(a => a.detail).join(' ; ')
	const severe = severity(candidate, previous, floor)
	if (
		streak >= CONFIRMATIONS_REQUIRED &&
		(!severe || pendingForMs >= SEVERE_CONFIRMATION_MS)
	) {
		return { accepted: true, confirmedAnomaly: `${kinds} confirmé : ${detail}` }
	}
	const grave = severe
		? ` ; anomalie grave (${severe}) : ${days(SEVERE_CONFIRMATION_MS)} jours de relevés cohérents requis, ${days(pendingForMs)} écoulé(s)`
		: ''
	return {
		accepted: false,
		pending: true,
		reason: `${kinds} à confirmer (${streak}/${CONFIRMATIONS_REQUIRED}) : ${detail}${grave}`,
	}
}
