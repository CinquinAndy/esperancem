/**
 * Intégration SEO sur le vrai serveur : titres, description, canonical, Open Graph, Twitter, JSON-LD,
 * robots.txt et sitemap.xml tels que les voit un moteur de recherche (HTML brut, sans JavaScript).
 */
import { expect, test } from '@playwright/test'
import { load } from 'cheerio'

import { instantane } from './outils'

test.beforeEach(({}, info) => {
	test.skip(info.project.name !== 'bureau', 'indépendant de la taille d’écran')
})

const html = async (request: any, chemin: string) =>
	load(await (await request.get(chemin)).text())
const meta = ($: ReturnType<typeof load>, attr: string, nom: string) =>
	$(`head meta[${attr}="${nom}"]`).attr('content')

test('accueil : métadonnées du CMS (seo_metadata « home »)', async ({
	request,
}) => {
	const seo = instantane.seo_metadata[0]
	const $ = await html(request, '/')
	expect($('head title').text()).toBe(seo.title)
	expect(meta($, 'name', 'description')).toBe(seo.description)
	expect(meta($, 'name', 'keywords')).toBe(seo.keywords.join(','))
	expect(meta($, 'property', 'og:title')).toBe(seo.og_title)
	expect(meta($, 'property', 'og:description')).toBe(seo.og_description)
	expect(meta($, 'property', 'og:url')).toBe(seo.og_url)
	expect(meta($, 'name', 'twitter:card')).toBe('summary_large_image')
	expect(meta($, 'name', 'twitter:title')).toBe(seo.twitter_title)
	expect(meta($, 'name', 'twitter:site')).toBe(seo.twitter_site)
	expect($('link[rel="canonical"]').attr('href')).toBe('https://esperancem.fr')
	expect(meta($, 'property', 'og:image')).toMatch(
		/^https:\/\/esperancem\.fr\/opengraph-image\?/
	)
	expect($('html').attr('lang')).toBe('fr')
	expect(meta($, 'name', 'robots')).toBe('index, follow')
})

test('à propos : titre avec gabarit, chiffres de lecture dans la description Open Graph', async ({
	request,
}) => {
	const $ = await html(request, '/about')
	expect($('head title').text()).toBe(
		"À propos d'Espérance Masson - Autrice Dark Romance | Cœurs Sombres | Espérance Masson - Autrice"
	)
	const lectures = Number(
		instantane.wattpad_stats.find(s => s.book === 'coeurs-sombres')!
			.reads_complete
	)
	expect(meta($, 'property', 'og:description')).toContain(
		`plus de ${Math.floor(lectures / 1000)}k+ lecteurs`
	)
	expect(meta($, 'property', 'og:url')).toBe('https://esperancem.fr/about')
	expect(meta($, 'property', 'og:image')).toMatch(
		/^https:\/\/esperancem\.fr\/about\/opengraph-image\?/
	)
})

test('404 : non indexée', async ({ request }) => {
	const r = await request.get('/page-inexistante-test-404')
	expect(r.status()).toBe(404)
	const $ = load(await r.text())
	expect($('head meta[name="robots"][content="noindex"]').length).toBe(1)
})

test('JSON-LD : personne, roman et site, liens des réseaux du CMS', async ({
	request,
}) => {
	const $ = await html(request, '/')
	const ld = JSON.parse($('script[type="application/ld+json"]').first().text())
	const types = ld['@graph'].map((n: any) => n['@type'])
	expect(types).toEqual(['Person', 'Book', 'WebSite'])
	expect(ld['@graph'][0].sameAs).toEqual(
		instantane.social_links.map(r => r.url)
	)
	expect(ld['@graph'][1].aggregateRating).toBeUndefined()
})

test('robots.txt', async ({ request }) => {
	const texte = await (await request.get('/robots.txt')).text()
	expect(texte).toContain('User-Agent: *')
	expect(texte).toContain('Disallow: /api/')
	expect(texte).toContain('Sitemap: https://esperancem.fr/sitemap.xml')
	expect(texte).toContain('Host: https://esperancem.fr')
})

test('sitemap.xml : les deux pages publiques', async ({ request }) => {
	const r = await request.get('/sitemap.xml')
	expect(r.headers()['content-type']).toContain('xml')
	const $ = load(await r.text(), { xml: true })
	expect(
		$('url > loc')
			.toArray()
			.map(e => $(e).text())
	).toEqual(['https://esperancem.fr', 'https://esperancem.fr/about'])
})
