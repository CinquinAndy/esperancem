/**
 * Non-régression visuelle au pixel près (maxDiffPixels: 0) de toutes les pages publiques, en bureau et en
 * téléphone, plus le menu mobile ouvert et les deux images de partage. Références : tests/e2e/__captures__,
 * produites dans le conteneur Playwright (`bun run test:visuel:maj`).
 */
import { expect, test } from '@playwright/test'

import { preparer, ROUTES, stabiliser } from './outils'

for (const route of ROUTES) {
	test(`capture ${route.id}`, async ({ page }) => {
		const journal = await preparer(page)
		await page.goto(route.chemin)
		await stabiliser(page)
		await expect(page).toHaveScreenshot(`${route.id}.png`, { fullPage: true })
		// La seule erreur admise : le statut 404 du document de la page 404 elle-même.
		expect(journal.console).toEqual(
			route.id === '404'
				? [
						'Failed to load resource: the server responded with a status of 404 (Not Found)',
					]
				: []
		)
		expect(journal.nonGet).toEqual([])
	})
}

test('capture menu mobile ouvert', async ({ page }, info) => {
	test.skip(info.project.name !== 'telephone', 'menu propre au téléphone')
	await preparer(page)
	await page.goto('/')
	await stabiliser(page)
	await page.getByRole('button', { name: 'Menu' }).click()
	await expect(page.getByRole('button', { name: 'Close menu' })).toBeVisible()
	// Fin de la transition d'ouverture de Headless UI (attributs data-enter / data-transition retirés).
	await expect(page.locator('[data-transition]')).toHaveCount(0)
	await expect(page).toHaveScreenshot('menu-ouvert.png')
})

test('images de partage (Open Graph)', async ({ request }, info) => {
	test.skip(info.project.name !== 'bureau', 'indépendant de la taille d’écran')
	for (const [nom, chemin] of [
		['og-accueil', '/opengraph-image'],
		['og-a-propos', '/about/opengraph-image'],
	]) {
		const r = await request.get(chemin)
		expect(r.status(), chemin).toBe(200)
		expect(r.headers()['content-type']).toBe('image/png')
		expect(await r.body()).toMatchSnapshot(`${nom}.png`)
	}
})
