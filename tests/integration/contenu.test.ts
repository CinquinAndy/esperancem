/**
 * Intégration : lecture du contenu du CMS (src/lib/content.ts → services PocketBase → SDK) contre le faux
 * PocketBase de l'instantané. Vérifie la transformation des données, l'ordre, les filtres et les replis.
 * Pas besoin de build. Lancer : `bun run test:integration`.
 */
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

import {
	demarrerInstantane,
	INSTANTANE,
} from '../donnees/serveur-instantane.mjs'

let pocketbase: Awaited<ReturnType<typeof demarrerInstantane>>
let content: typeof import('@/lib/content')

const valeur = (page: string, section: string, key: string) =>
	INSTANTANE.site_content.find(
		(c: any) => c.page === page && c.section === section && c.key === key
	)!.content

beforeAll(async () => {
	pocketbase = await demarrerInstantane()
	// L'adresse de PocketBase est lue au chargement du module : on la pose avant l'import.
	process.env.PB_URL = pocketbase.url
	process.env.PB_TOKEN = ''
	content = await import('@/lib/content')
})
afterAll(() => pocketbase.arreter())

describe('contenu des pages', () => {
	test('clé présente : le HTML du CMS tel quel', async () => {
		expect(await content.getContent('home', 'hero', 'main_title')).toBe(
			valeur('home', 'hero', 'main_title')
		)
	})

	test('même clé sur deux pages : chaque page lit la sienne', async () => {
		const accueil = await content.getContent('home', 'book', 'book_title')
		const apropos = await content.getContent('about', 'book', 'book_title')
		expect(accueil).toBe(valeur('home', 'book', 'book_title'))
		expect(apropos).toBe(valeur('about', 'book', 'book_title'))
		expect(accueil).not.toBe(apropos)
	})

	test('clé absente : chaîne vide, ou la valeur de repli', async () => {
		expect(await content.getContent('home', 'hero', 'inexistante')).toBe('')
		expect(
			await content.getContentWithFallback(
				'home',
				'hero',
				'inexistante',
				'repli'
			)
		).toBe('repli')
	})

	test('404 : valeurs de repli quand le CMS n’a rien', async () => {
		expect(await content.get404Content()).toEqual({
			buttonText: "Retour à l'accueil",
			description: "La page que vous recherchez n'existe pas.",
			title: 'Page non trouvée',
		})
	})

	test('mise en page : copyright du CMS, nom et description de repli', async () => {
		const layout = await content.getLayoutContent()
		expect(layout.copyright).toBe(valeur('layout', 'site', 'copyright'))
		expect(layout.siteName).toBe('Espérance Masson')
		expect(layout.siteDescription).toBe('Autrice française de dark romance')
	})

	test('contenu groupé par section', async () => {
		const page = await content.getPageContent('about')
		expect(Object.keys(page).sort()).toEqual(['book', 'contact', 'hero'])
		expect(page.book.map(c => c.key)).toEqual([
			'book_title',
			'book_description',
			'book_title_2',
			'book_description_2',
		])
	})
})

describe('réseaux, classements, SEO', () => {
	test('réseaux actifs, dans l’ordre du CMS', async () => {
		const liens = await content.getSocialLinks()
		expect(liens.map(l => l.platform)).toEqual([
			'instagram',
			'tiktok',
			'wattpad',
		])
	})

	test('classements triés du plus récent au plus ancien', async () => {
		const dates = (await content.getWattpadRankings()).map(r => r.date)
		expect(dates).toEqual([...dates].sort().reverse())
		expect(dates.length).toBe(INSTANTANE.wattpad_rankings.length)
	})

	test('métadonnées SEO de l’accueil ; page inconnue : null', async () => {
		const seo = await content.getSeoMetadata('home')
		expect(seo?.title).toBe(INSTANTANE.seo_metadata[0].title)
		expect(seo?.keywords).toEqual(INSTANTANE.seo_metadata[0].keywords)
		expect(await content.getSeoMetadata('inconnue')).toBeNull()
	})

	test('aucune écriture vers PocketBase', async () => {
		const r = await fetch(`${pocketbase.url}/__ecritures`)
		expect((await r.json()).ecritures).toBe(0)
	})
})
