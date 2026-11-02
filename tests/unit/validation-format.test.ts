import { describe, expect, test } from 'bun:test'

import {
	formatThousandsPlus,
	formatWattpadShort,
	legacyThousands,
} from '@/lib/wattpad-sync/format'
import {
	anomalies,
	CONFIRMATIONS_REQUIRED,
	implausibility,
	judge,
	nextPending,
	parseExactCount,
} from '@/lib/wattpad-sync/validation'

describe('parseExactCount', () => {
	test('accepte les nombres exacts', () => {
		expect(parseExactCount(366177)).toBe(366177)
		expect(parseExactCount('366177')).toBe(366177)
		expect(parseExactCount('366,177')).toBe(366177)
		expect(parseExactCount(' 48 ')).toBe(48)
	})
	test('refuse les abréviations (cause du « 0k+ » de /about)', () => {
		expect(parseExactCount('366K')).toBeNull()
		expect(parseExactCount('11.1K')).toBeNull()
		expect(parseExactCount('1.2M')).toBeNull()
	})
	test('refuse le reste', () => {
		for (const v of [
			'',
			'abc',
			'-3',
			'3.5',
			null,
			undefined,
			{},
			-1,
			1.5,
			NaN,
			'36,61,77',
		]) {
			expect(parseExactCount(v)).toBeNull()
		}
	})
})

describe('implausibility', () => {
	test('zéro refusé', () => {
		expect(implausibility({ parts: 0, reads: 0, votes: 0 })).toBe(
			'lectures à zéro'
		)
		expect(implausibility({ parts: 0, reads: 10, votes: 1 })).toBe(
			'chapitres à zéro'
		)
		expect(implausibility({ parts: 48, reads: 366177, votes: 0 })).toBe(
			'votes à zéro'
		)
	})
	test('incohérences refusées', () => {
		expect(implausibility({ parts: 48, reads: 10, votes: 20 })).toBe(
			'plus de votes que de lectures'
		)
		expect(implausibility({ parts: 5000, reads: 10, votes: 1 })).not.toBeNull()
		expect(implausibility({ parts: 48, reads: NaN, votes: 1 })).not.toBeNull()
	})
	test('valeurs réelles acceptées', () => {
		expect(
			implausibility({ parts: 48, reads: 366177, votes: 11126 })
		).toBeNull()
	})
})

describe('judge', () => {
	const previous = { parts: 48, reads: 366164, votes: 11122 }
	test('progression normale acceptée', () => {
		expect(
			judge({ parts: 48, reads: 366177, votes: 11126 }, previous, 0)
		).toEqual({ accepted: true })
	})
	test('premier relevé (aucune valeur connue) accepté s’il est plausible', () => {
		expect(
			judge({ parts: 48, reads: 366177, votes: 11126 }, null, 0).accepted
		).toBe(true)
	})
	test('recul des lectures refusé tant qu’il n’est pas confirmé', () => {
		const drop = { parts: 48, reads: 300000, votes: 11126 }
		for (let streak = 1; streak < CONFIRMATIONS_REQUIRED; streak++) {
			const v = judge(drop, previous, streak)
			expect(v.accepted).toBe(false)
			if (!v.accepted) expect(v.pending).toBe(true)
		}
		const confirmed = judge(drop, previous, CONFIRMATIONS_REQUIRED)
		expect(confirmed.accepted).toBe(true)
	})
	test('légère baisse des votes (quelques votes retirés) acceptée', () => {
		expect(
			judge({ parts: 48, reads: 366200, votes: 11115 }, previous, 0).accepted
		).toBe(true)
	})
	test('baisse des votes au-delà de la borne absolue refusée (−122, puis −1,9 %)', () => {
		for (const votes of [11000, Math.round(11122 * 0.981)]) {
			expect(
				judge({ parts: 48, reads: 366200, votes }, previous, 1).accepted
			).toBe(false)
		}
	})
	test('forte baisse des votes refusée', () => {
		expect(
			judge({ parts: 48, reads: 366200, votes: 5000 }, previous, 1).accepted
		).toBe(false)
	})
	test('bond ×3 (erreur d’unité) refusé', () => {
		expect(
			judge({ parts: 48, reads: 366177000, votes: 11126 }, previous, 1).accepted
		).toBe(false)
	})
	test('bonds isolés refusés : votes ×1,5, chapitres +6, lectures ×1,5', () => {
		for (const bad of [
			{ parts: 48, reads: 366200, votes: 55610 },
			{ parts: 48, reads: 366200, votes: 16700 },
			{ parts: 54, reads: 366200, votes: 11126 },
			{ parts: 480, reads: 366200, votes: 11126 },
			{ parts: 48, reads: 915410, votes: 11126 },
			{ parts: 48, reads: 549300, votes: 11126 },
		]) {
			const v = judge(bad, previous, 1)
			expect(v.accepted).toBe(false)
			if (!v.accepted) expect(v.reason).toContain('bond à confirmer (1/3)')
		}
	})
	test('votes qui montent plus que les lectures : bond à confirmer', () => {
		expect(
			judge({ parts: 48, reads: 366264, votes: 11300 }, previous, 1).accepted
		).toBe(false)
	})
	test('hausses réelles acceptées : votes et chapitres au rythme normal', () => {
		for (const ok of [
			{ parts: 48, reads: 366264, votes: 11124 },
			{ parts: 49, reads: 366564, votes: 11182 },
			{ parts: 50, reads: 366464, votes: 11162 },
			// Lectures en retard sur les votes le jour d'un chapitre (Au prix du silence).
			{ parts: 49, reads: 366204, votes: 11182 },
		]) {
			expect(judge(ok, previous, 0)).toEqual({ accepted: true })
		}
	})
	test('faux relevés juste sous les anciens seuils : refusés', () => {
		for (const bad of [
			{ parts: 48, reads: 366164 + 5000, votes: 11124 },
			{ parts: 48, reads: Math.round(366164 * 1.4), votes: 11124 },
			{ parts: 51, reads: 366264, votes: 11124 },
			{ parts: 53, reads: 366264, votes: 11124 },
			{ parts: 48, reads: 366264, votes: 11122 + 48 },
			{ parts: 45, reads: 366264, votes: 11124 },
		]) {
			expect(judge(bad, previous, 1).accepted).toBe(false)
		}
	})
	test('bornes symétriques : un faux juste sous la borne puis la vraie valeur passent tous les deux', () => {
		const truth = { parts: 48, reads: 366264, votes: 11124 }
		const fake = { parts: 50, reads: 366164 + 1800, votes: 11122 + 50 }
		expect(judge(fake, previous, 0).accepted).toBe(true)
		expect(judge(truth, fake, 0).accepted).toBe(true)
	})
	test('bornes proportionnelles au temps écoulé', () => {
		const twoDays = 2 * 24 * 3600_000
		const later = { parts: 49, reads: 366164 + 4000, votes: 11122 + 30 }
		expect(anomalies(later, previous)).not.toEqual([])
		expect(anomalies(later, previous, twoDays)).toEqual([])
		// Plafonnées à 7 jours : une référence très ancienne n'ouvre pas la porte à ×1,4.
		const fake = { ...later, reads: Math.round(366164 * 1.4) }
		expect(anomalies(fake, previous, 365 * 24 * 3600_000)).not.toEqual([])
	})
	test('anomalie grave (chapitres 48 → 1, votes ÷1000) : 3 relevés ne suffisent pas, il faut 7 jours', () => {
		const bad = { parts: 1, reads: 361197, votes: 11 }
		const v = judge(bad, previous, 10, { pendingForMs: 6 * 24 * 3600_000 })
		expect(v.accepted).toBe(false)
		if (!v.accepted) expect(v.reason).toContain('anomalie grave')
		expect(
			judge(bad, previous, 2, { pendingForMs: 8 * 24 * 3600_000 }).accepted
		).toBe(false)
	})
	test('chapitres sous le relevé committé : anomalie grave', () => {
		const floor = { parts: 48, reads: 366177, votes: 11126 }
		const v = judge({ parts: 40, reads: 366200, votes: 11120 }, previous, 3, {
			floor,
		})
		expect(v.accepted).toBe(false)
		if (!v.accepted) expect(v.reason).toContain('sous le relevé committé')
	})
	test('toutes les anomalies du relevé sont signalées, pas seulement la première', () => {
		const v = judge({ parts: 1, reads: 361197, votes: 11 }, previous, 3, {
			pendingForMs: 7 * 24 * 3600_000,
		})
		expect(v.accepted).toBe(true)
		if (v.accepted) {
			expect(v.confirmedAnomaly).toContain('lectures 366164 → 361197')
			expect(v.confirmedAnomaly).toContain('votes 11122 → 11')
			expect(v.confirmedAnomaly).toContain('chapitres 48 → 1')
		}
	})
	test('0 vote refusé même confirmé', () => {
		expect(
			judge({ parts: 48, reads: 366200, votes: 0 }, previous, 10, {
				pendingForMs: 30 * 24 * 3600_000,
			}).accepted
		).toBe(false)
	})
	test('zéro refusé même confirmé', () => {
		expect(judge({ parts: 0, reads: 0, votes: 0 }, previous, 10).accepted).toBe(
			false
		)
	})
})

describe('nextPending', () => {
	const previous = { parts: 48, reads: 366186, votes: 11130 }
	const at = (reads: number, votes = 11130, parts = 48) => ({
		parts,
		reads,
		votes,
	})
	test('relevé normal ou invraisemblable : rien en attente', () => {
		expect(nextPending(null, at(366300), previous)).toBeNull()
		expect(
			nextPending(
				{
					count: 2,
					counts: at(300000),
					signature: 'recul:reads',
				},
				at(0, 0, 0),
				previous
			)
		).toBeNull()
	})
	test('même anomalie, valeur proche : le compte avance', () => {
		const one = nextPending(null, at(300000), previous, { now: 0 })
		expect(one).toEqual({
			count: 1,
			counts: at(300000),
			signature: 'recul:reads',
			since: new Date(0).toISOString(),
		})
		const two = nextPending(one, at(305000), previous, { now: 6 * 3600_000 })
		expect(two?.count).toBe(2)
		// La série garde la date de son premier relevé.
		expect(two?.since).toBe(new Date(0).toISOString())
	})
	test('valeur éloignée de plus de 2 % : le compte repart à 1', () => {
		const one = nextPending(null, at(300000), previous)
		expect(nextPending(one, at(307000), previous)?.count).toBe(1)
	})
	test('autre nature (bond) ou autre champ (votes) : le compte repart à 1', () => {
		const one = nextPending(null, at(300000), previous)
		expect(nextPending(one, at(1_500_000), previous)).toMatchObject({
			count: 1,
			signature: 'bond:reads',
		})
		expect(nextPending(one, at(366300, 5000), previous)).toMatchObject({
			count: 1,
			signature: 'recul:votes',
		})
	})
	test('un champ de plus en anomalie : le compte repart à 1 (cas D de la relecture)', () => {
		const one = nextPending(null, at(361186), previous)
		const two = nextPending(one, at(361196), previous)
		expect(two?.count).toBe(2)
		const three = nextPending(two, at(361206, 11, 1), previous)
		expect(three).toMatchObject({
			count: 1,
			signature: 'recul:parts,recul:reads,recul:votes',
		})
	})
	test('même anomalie mais un autre champ éloigné du relevé précédent : le compte repart à 1', () => {
		// Chapitres 47 puis 50 : aucun des deux n'est une anomalie face à 48, mais ils s'écartent de 3.
		const one = nextPending(null, at(300000, 11130, 47), previous)
		const two = nextPending(one, at(300010, 11130, 50), previous)
		expect(two).toMatchObject({ count: 1, signature: 'recul:reads' })
		const near = nextPending(one, at(300010, 11120, 48), previous)
		expect(near?.count).toBe(2)
	})
	test('chapitres : un chapitre d’écart reste la même anomalie', () => {
		const one = nextPending(null, at(366300, 11130, 40), previous)
		expect(one).toMatchObject({ count: 1, signature: 'recul:parts' })
		expect(nextPending(one, at(366400, 11130, 41), previous)?.count).toBe(2)
		expect(nextPending(one, at(366400, 11130, 30), previous)?.count).toBe(1)
	})
})

describe('mise en forme', () => {
	test('ancien champ « reads » du total : milliers entiers, y compris au-delà du million', () => {
		expect(legacyThousands(366177)).toBe(366)
		expect(legacyThousands(11126)).toBe(11)
		expect(legacyThousands(999)).toBe(999)
		expect(legacyThousands(1_250_000)).toBe(1250)
		// Identique à l'ancien calcul (parseInt de l'abréviation) sous le million.
		for (const n of [999, 1000, 6571, 99_999, 137_099, 366_177, 999_999]) {
			expect(legacyThousands(n)).toBe(parseInt(formatWattpadShort(n), 10))
		}
	})
	test('« 503k+ » : même gabarit que « 365k+ »', () => {
		expect(formatThousandsPlus(503275)).toBe('503k+')
		expect(formatThousandsPlus(366177)).toBe('366k+')
		expect(formatThousandsPlus(999)).toBe('999+')
		expect(formatThousandsPlus(1_250_000)).toBe('1.2M+')
		expect(formatThousandsPlus(0)).toBe('')
	})
	test('abréviation identique à celle de Wattpad (troncature)', () => {
		expect(formatWattpadShort(366177)).toBe('366K')
		expect(formatWattpadShort(137099)).toBe('137K')
		expect(formatWattpadShort(11126)).toBe('11.1K')
		expect(formatWattpadShort(6571)).toBe('6.5K')
		expect(formatWattpadShort(6000)).toBe('6K')
		expect(formatWattpadShort(48)).toBe('48')
	})
})
