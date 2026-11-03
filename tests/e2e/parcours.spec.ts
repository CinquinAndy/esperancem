/**
 * Parcours e2e : chaque route publique répond, navigation principale (bureau et menu mobile), liens sortants,
 * compteurs Wattpad. Le site n'a aucun formulaire : rien n'est envoyé (toute requête non GET est refusée
 * et fait échouer le test).
 */
import { expect, test } from '@playwright/test'

import { instantane, preparer, ROUTES } from './outils'

const chiffre = (t: string | null) =>
	t == null ? NaN : Number(t.replace(/\D/g, '') || NaN)
const stats = (book: string) => {
	const s = instantane.wattpad_stats.find(x => x.book === book)!
	return [Number(s.reads_complete), Number(s.votes), Number(s.parts)]
}

test.describe('routes', () => {
	for (const { chemin, id } of ROUTES) {
		test(`${id} répond`, async ({ request }) => {
			const r = await request.get(chemin)
			expect(r.status()).toBe(id === '404' ? 404 : 200)
			expect(r.headers()['content-type']).toContain('text/html')
		})
	}

	for (const chemin of [
		'/robots.txt',
		'/sitemap.xml',
		'/opengraph-image',
		'/about/opengraph-image',
		'/api/health',
		'/api/wattpad-stats',
		'/api/wattpad-stats/total',
		'/api/wattpad-stats/coeurs-sombres',
		'/api/wattpad-stats/health',
	]) {
		test(`${chemin} répond 200`, async ({ request }) => {
			expect((await request.get(chemin)).status()).toBe(200)
		})
	}
})

test.describe('navigation', () => {
	test('menu du bureau : Accueil ↔ À propos', async ({ page }, info) => {
		test.skip(info.project.name !== 'bureau', 'menu du bureau')
		const journal = await preparer(page)
		await page.goto('/')
		const nav = page.getByRole('navigation').filter({ hasText: 'À propos' })
		await nav.getByRole('link', { name: 'À propos' }).click()
		await expect(page).toHaveURL(/\/about$/)
		await expect(page.locator('h1')).toContainText('Je suis Espérance Masson')
		await nav.getByRole('link', { name: 'Accueil' }).click()
		await expect(page).toHaveURL(/\/$/)
		await expect(page.locator('h1')).toContainText(
			'autrice française de dark romance'
		)
		expect(journal.nonGet).toEqual([])
		expect(journal.console).toEqual([])
	})

	test('menu mobile : ouverture, lien À propos, fermeture', async ({
		page,
	}, info) => {
		test.skip(info.project.name !== 'telephone', 'menu du téléphone')
		await preparer(page)
		await page.goto('/')
		await page.getByRole('button', { name: 'Menu' }).click()
		await page.getByRole('link', { name: 'À propos' }).click()
		await expect(page).toHaveURL(/\/about$/)
		await expect(page.getByRole('button', { name: 'Close menu' })).toBeHidden()
		await page.getByRole('button', { name: 'Menu' }).click()
		await page.getByRole('button', { name: 'Close menu' }).click()
		await expect(page.getByRole('button', { name: 'Close menu' })).toBeHidden()
	})

	test('404 : le bouton ramène à l’accueil', async ({ page }) => {
		await preparer(page)
		await page.goto('/page-inexistante-test-404')
		await expect(page.locator('h1')).toHaveText('Page non trouvée')
		await page.getByRole('link', { name: "Retour à l'accueil" }).click()
		await expect(page).toHaveURL(/\/$/)
	})

	test('liens sortants : réseaux, Wattpad et e-mail', async ({ page }) => {
		await preparer(page)
		await page.goto('/')
		for (const r of instantane.social_links) {
			await expect(
				page.getByRole('link', {
					name: `Suivez Espérance Masson sur ${r.display_name}`,
				})
			).toHaveAttribute('href', r.url)
			await expect(
				page.locator('footer').getByRole('link', { name: r.display_name })
			).toHaveAttribute('href', r.url)
		}
		const url = (cle: string) =>
			instantane.site_content.find(c => c.key === cle)!.content
		await expect(
			page.locator(`main a[href="${url('wattpad_url')}"]`)
		).toHaveCount(1)
		await expect(
			page.locator(`main a[href="${url('wattpad_url_2')}"]`)
		).toHaveCount(1)
		await expect(
			page.locator('footer a[href="mailto:esperance.masson@gmail.com"]')
		).toHaveCount(1)
	})
})

test.describe('compteurs Wattpad', () => {
	test('l’accueil affiche les chiffres servis par PocketBase (pas le relevé committé)', async ({
		page,
	}) => {
		const journal = await preparer(page)
		await page.goto('/')
		// Valeur lue par les lecteurs d'écran (texte masqué sous chaque compteur décoratif).
		const valeurs = page.locator('main span.sr-only')
		await expect(valeurs).toHaveCount(6)
		const attendus = [
			...stats('coeurs-sombres'),
			...stats('au-prix-du-silence'),
		]
		expect((await valeurs.allTextContents()).map(chiffre)).toEqual(attendus)
		const total =
			Number(stats('coeurs-sombres')[0]) +
			Number(stats('au-prix-du-silence')[0])
		await expect(page.locator('main')).toContainText(
			`Plus de ${Math.floor(total / 1000)}k+ lectures sur Wattpad`
		)
		expect(journal.nonGet).toEqual([])
	})

	test('animation : un compteur hors écran compte jusqu’à la vraie valeur quand il apparaît', async ({
		browser,
	}) => {
		const contexte = await browser.newContext({
			reducedMotion: 'no-preference',
		})
		const page = await contexte.newPage()
		await preparer(page)
		await page.goto('/')
		// Valeur dessinée par NumberFlow : chiffre courant de chaque colonne (--current), dans son shadow DOM.
		const dernier = page.locator('number-flow-react').last()
		const dessine = () =>
			dernier.evaluate(el =>
				Number(
					[...el.shadowRoot!.querySelectorAll('[part~="integer-digit"]')]
						.map(d =>
							(d as HTMLElement).style.getPropertyValue('--current').trim()
						)
						.join('') || NaN
				)
			)
		const attendu = stats('au-prix-du-silence')[2]
		await expect.poll(dessine).toBe(0) // hors écran au chargement : remis à 0 sans animation
		await dernier.scrollIntoViewIfNeeded()
		await expect.poll(dessine, { timeout: 10_000 }).toBe(attendu)
		await contexte.close()
	})
})

test.describe('copyright', () => {
	const pied = (page: import('@playwright/test').Page) =>
		page.locator('footer').getByText(/Tous droits réservés/)

	for (const { chemin, id } of ROUTES) {
		test(`${id} : l’année en cours, sans erreur d’hydratation`, async ({
			page,
		}) => {
			const journal = await preparer(page)
			await page.goto(chemin)
			// Année du serveur (COPYRIGHT_ANNEE=2026 dans le build des tests), pas celle écrite dans le CMS (2024).
			await expect(pied(page)).toHaveText(
				'© 2026 Espérance Masson. Tous droits réservés.'
			)
			expect(journal.console.filter(m => !m.includes('404'))).toEqual([])
		})
	}

	test('page générée l’an passé : le navigateur corrige l’année après l’hydratation', async ({
		page,
	}) => {
		// Navigateur au 1er janvier 2027, serveur encore en 2026 (cas de la 404, générée au build seulement).
		const journal = await preparer(page, Date.parse('2027-01-01T08:00:00.000Z'))
		const reponse = await page.goto('/page-inexistante-test-404')
		expect(await reponse!.text()).toContain('© 2026 Espérance Masson')
		await expect(pied(page)).toHaveText(
			'© 2027 Espérance Masson. Tous droits réservés.'
		)
		expect(journal.console.filter(m => !m.includes('404'))).toEqual([])
	})
})
