import { describe, expect, test } from 'bun:test'

import {
	formatThousandsPlus,
	formatWattpadShort,
	legacyThousands,
} from '@/lib/wattpad-sync/format'
import {
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
	test('légère baisse des votes (votes retirés) acceptée', () => {
		expect(
			judge({ parts: 48, reads: 366200, votes: 11000 }, previous, 0).accepted
		).toBe(true)
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
				{ count: 2, field: 'reads', kind: 'recul', value: 300000 },
				at(0, 0, 0),
				previous
			)
		).toBeNull()
	})
	test('même anomalie, valeur proche : le compte avance', () => {
		const one = nextPending(null, at(300000), previous)
		expect(one).toEqual({
			count: 1,
			field: 'reads',
			kind: 'recul',
			value: 300000,
		})
		const two = nextPending(one, at(305000), previous)
		expect(two?.count).toBe(2)
	})
	test('valeur éloignée de plus de 2 % : le compte repart à 1', () => {
		const one = nextPending(null, at(300000), previous)
		expect(nextPending(one, at(307000), previous)?.count).toBe(1)
	})
	test('autre nature (bond) ou autre champ (votes) : le compte repart à 1', () => {
		const one = nextPending(null, at(300000), previous)
		expect(nextPending(one, at(1_500_000), previous)).toMatchObject({
			count: 1,
			kind: 'bond',
		})
		expect(nextPending(one, at(366300, 5000), previous)).toMatchObject({
			count: 1,
			field: 'votes',
		})
	})
	test('chapitres : un chapitre d’écart reste la même anomalie', () => {
		const one = nextPending(null, at(366300, 11130, 40), previous)
		expect(one).toMatchObject({ count: 1, field: 'parts' })
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
