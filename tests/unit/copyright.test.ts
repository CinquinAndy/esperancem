/**
 * Copyright du pied de page : l'année affichée est l'année en cours, quel que soit le texte du CMS.
 */
import { afterEach, describe, expect, test } from 'bun:test'

import { anneeDuServeur, avecAnnee } from '@/lib/copyright'

const TEXTE_CMS = '© 2024 Espérance Masson. Tous droits réservés.'

describe('avecAnnee', () => {
	test("remplace l'année écrite dans le texte du CMS", () => {
		expect(avecAnnee(TEXTE_CMS, 2027)).toBe(
			'© 2027 Espérance Masson. Tous droits réservés.'
		)
	})

	test("remplace une plage d'années et l'entité HTML &copy;", () => {
		expect(avecAnnee('&copy; 2024-2025 Espérance Masson', 2026)).toBe(
			'&copy; 2026 Espérance Masson'
		)
		expect(avecAnnee('©2024–2025 E. M.', 2026)).toBe('©2026 E. M.')
	})

	test('accepte le jeton {annee}', () => {
		expect(avecAnnee('Espérance Masson, {annee}. ©', 2030)).toBe(
			'Espérance Masson, 2030. ©'
		)
	})

	test('garde le reste du HTML intact et ne touche pas un texte sans année', () => {
		expect(avecAnnee('<p>© 2024 <strong>E. M.</strong> 1999</p>', 2026)).toBe(
			'<p>© 2026 <strong>E. M.</strong> 1999</p>'
		)
		expect(avecAnnee('Tous droits réservés.', 2026)).toBe(
			'Tous droits réservés.'
		)
	})
})

describe('anneeDuServeur', () => {
	const avant = process.env.COPYRIGHT_ANNEE
	afterEach(() => {
		if (avant === undefined) delete process.env.COPYRIGHT_ANNEE
		else process.env.COPYRIGHT_ANNEE = avant
	})

	test("suit l'horloge : passage à la nouvelle année sans rebuild", () => {
		delete process.env.COPYRIGHT_ANNEE
		expect(anneeDuServeur(new Date('2026-12-31T22:59:59Z'))).toBe(2026)
		expect(anneeDuServeur(new Date('2027-01-01T12:00:00Z'))).toBe(2027)
	})

	test('COPYRIGHT_ANNEE fige l’année (tests visuels)', () => {
		process.env.COPYRIGHT_ANNEE = '2026'
		expect(anneeDuServeur(new Date('2031-06-01T00:00:00Z'))).toBe(2026)
		process.env.COPYRIGHT_ANNEE = 'pas une année'
		expect(anneeDuServeur(new Date('2031-06-01T00:00:00Z'))).toBe(2031)
	})
})
