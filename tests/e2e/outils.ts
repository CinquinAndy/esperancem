import type { Page } from '@playwright/test'

import instantane from '../donnees/pocketbase-instantane.json'

export { instantane }

/** Heure figée du navigateur pendant les tests (le fond WebGL et l'année affichée en dépendent). */
export const HEURE_FIXE = Date.parse('2026-11-03T12:00:00.000Z')

/** Pages publiques du site (src/app : /, /about et la page 404 ; aucune route dynamique). */
export const ROUTES = [
	{ chemin: '/', id: 'accueil' },
	{ chemin: '/about', id: 'a-propos' },
	{ chemin: '/page-inexistante-test-404', id: '404' },
] as const

const EXTERNES_BLOQUES =
	/umami\.wadefade\.fr|google-analytics|googletagmanager/i

export interface Journal {
	console: string[]
	externes: string[]
	nonGet: string[]
}

/**
 * Prépare la page : horloge figée (Date.now et new Date() sans argument ; page.clock fait expirer les
 * captures à cause de la boucle WebGL), mesure d'audience bloquée, requêtes autres que GET refusées et notées.
 */
export async function preparer(
	page: Page,
	heure: number = HEURE_FIXE
): Promise<Journal> {
	const journal: Journal = { console: [], externes: [], nonGet: [] }
	await page.addInitScript(t => {
		const Origine = Date
		class DateFigee extends Origine {
			constructor(...args: unknown[]) {
				if (args.length === 0) super(t)
				else super(...(args as [string]))
			}
			static now() {
				return t
			}
		}
		// eslint-disable-next-line no-global-assign
		Date = DateFigee as DateConstructor
	}, heure)
	await page.route('**/*', route => {
		const req = route.request()
		const url = req.url()
		if (req.method() !== 'GET' && req.method() !== 'HEAD') {
			journal.nonGet.push(`${req.method()} ${url}`)
			return route.abort()
		}
		if (EXTERNES_BLOQUES.test(url)) {
			// Réponse vide plutôt qu'un abandon : pas d'erreur « Failed to load resource » dans la console.
			journal.externes.push(url)
			return route.fulfill({
				body: '',
				contentType: 'application/javascript',
				status: 200,
			})
		}
		return route.continue()
	})
	page.on('console', m => {
		if (m.type() === 'error') journal.console.push(m.text())
	})
	page.on('pageerror', e => journal.console.push(String(e)))
	return journal
}

/** Fait défiler toute la page (images paresseuses), attend polices et images, revient en haut. */
export async function stabiliser(page: Page) {
	const hauteurVue = page.viewportSize()!.height
	for (let y = 0, i = 0; i < 80; i++) {
		const total = await page.evaluate(
			() => document.documentElement.scrollHeight
		)
		if (y >= total) break
		await page.evaluate(
			v => window.scrollTo({ behavior: 'instant', top: v }),
			y
		)
		await page.waitForTimeout(100)
		y += Math.floor(hauteurVue * 0.8)
	}
	await page.evaluate(() => window.scrollTo({ behavior: 'instant', top: 0 }))
	await page.waitForLoadState('networkidle')
	await page.evaluate(async () => {
		await document.fonts.ready
		await Promise.all(
			[...document.images].map(i =>
				i.complete
					? i.decode().catch(() => {})
					: new Promise(r => {
							i.onload = i.onerror = r
						})
			)
		)
	})
}
