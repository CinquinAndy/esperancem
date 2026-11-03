#!/usr/bin/env node
/**
 * Refait l'instantané PocketBase des tests (tests/donnees/pocketbase-instantane.json) à partir du site en
 * production : la lecture anonyme de PocketBase est refusée (403), on relit donc le HTML public rendu par
 * Next, qui contient le contenu du CMS tel qu'il s'affiche. GET seulement, aucun secret.
 *   node tests/donnees/extraire-instantane.mjs [https://esperancem.fr]
 * Après l'avoir relancé, régénérer les captures de référence (`bun run test:visuel:maj`) et relire l'écart.
 *
 * Les dates sont figées : les chiffres Wattpad sont datés après le relevé committé
 * (src/data/wattpad-releve.json) pour que l'affichage les retienne, quel que soit le jour du test.
 */
import { load } from 'cheerio'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const base = (process.argv[2] || 'https://esperancem.fr').replace(/\/$/, '')
const sortie = join(
	dirname(fileURLToPath(import.meta.url)),
	'pocketbase-instantane.json'
)
const DATE = '2026-11-03 12:00:00.000Z'
// Postérieure à tout relevé committé plausible : la valeur de l'instantané l'emporte (pickBest, display.ts).
const DATE_CHIFFRES = '2099-01-01 00:00:00.000Z'

async function page(chemin) {
	const r = await fetch(base + chemin, {
		headers: { 'user-agent': 'esperancem-tests-instantane' },
	})
	if (chemin.startsWith('/page-') ? r.status !== 404 : !r.ok)
		throw new Error(`${chemin} : ${r.status}`)
	return load(await r.text())
}
const interieur = $el => {
	if ($el.length !== 1)
		throw new Error(`élément attendu une fois, trouvé ${$el.length}`)
	return $el.html()
}

const accueil = await page('/')
const apropos = await page('/about')

let n = 0
const contenu = (page, section, key, content) => ({
	content,
	created: DATE,
	id: `contenu${String(++n).padStart(8, '0')}`,
	is_active: true,
	key,
	order: n,
	page,
	section,
	updated: DATE,
})

// Accueil
const $a = accueil
const h1 = $a('main h1')
const livres = $a('main div.rounded-2xl.border')
if (livres.length !== 2)
	throw new Error(
		`2 blocs livre attendus sur l'accueil, ${livres.length} trouvés`
	)
const livre = i => {
	const $l = livres.eq(i)
	const bouton = $l.children('a')
	return {
		bouton: interieur(bouton.children('span')),
		description: interieur($l.find('h2').first().next('div')),
		titre: interieur($l.find('h2').first()),
		url: bouton.attr('href'),
	}
}
const l1 = livre(0)
const l2 = livre(1)
const site_content = [
	contenu('home', 'hero', 'main_title', interieur(h1)),
	contenu('home', 'hero', 'main_description', interieur(h1.next('div'))),
	contenu('home', 'book', 'book_title', l1.titre),
	contenu('home', 'book', 'book_description', l1.description),
	contenu('home', 'book', 'rankings_title', interieur(livres.eq(0).find('h3'))),
	contenu('home', 'book', 'wattpad_button', l1.bouton),
	contenu('home', 'book', 'wattpad_url', l1.url),
	contenu('home', 'book', 'book_title_2', l2.titre),
	contenu('home', 'book', 'book_description_2', l2.description),
	contenu('home', 'book', 'wattpad_button_2', l2.bouton),
	contenu('home', 'book', 'wattpad_url_2', l2.url),
]

// À propos
const $p = apropos
const h1p = $p('main h1')
site_content.push(
	contenu('about', 'hero', 'main_title', interieur(h1p)),
	contenu('about', 'hero', 'biography', interieur(h1p.next('div')))
)
const h2p = $p('main h2')
if (h2p.length !== 2)
	throw new Error(
		`2 titres de livre attendus sur /about, ${h2p.length} trouvés`
	)
site_content.push(
	contenu('about', 'book', 'book_title', interieur(h2p.eq(0))),
	contenu(
		'about',
		'book',
		'book_description',
		interieur(h2p.eq(0).next('div'))
	),
	contenu('about', 'book', 'book_title_2', interieur(h2p.eq(1))),
	contenu(
		'about',
		'book',
		'book_description_2',
		interieur(h2p.eq(1).next('div'))
	),
	contenu(
		'about',
		'contact',
		'email',
		$p('main a[href^="mailto:"]')
			.attr('href')
			.replace(/^mailto:/, '')
	)
)

// Pied de page : le copyright (texte du CMS ou valeur de repli, identiques à l'écran).
const pied = $a('footer div.text-zinc-500').last()
site_content.push(contenu('layout', 'site', 'copyright', interieur(pied)))

// Réseaux : ordre, libellé et lien tels qu'affichés sur l'accueil (le libellé vient de l'aria-label).
const ICONES = {
	instagram: 'InstagramIcon',
	tiktok: 'TikTokIcon',
	wattpad: 'WattpadIcon',
}
const social_links = $a('main div.mt-6.flex.gap-6 a')
	.toArray()
	.map((el, i) => {
		const url = $a(el).attr('href')
		const platform = Object.keys(ICONES).find(p => url.includes(p))
		if (!platform) throw new Error(`réseau inconnu : ${url}`)
		return {
			created: DATE,
			display_name: $a(el)
				.attr('aria-label')
				.replace(/^Suivez Espérance Masson sur /, ''),
			icon: ICONES[platform],
			id: `reseau${String(i + 1).padStart(9, '0')}`,
			is_active: true,
			order: i + 1,
			platform,
			updated: DATE,
			url,
			username: '',
		}
	})

// Classements : « #1 catégorie (16/06/2025) », triés par date décroissante comme PocketBase (sort: -date).
const wattpad_rankings = livres
	.eq(0)
	.find('h3')
	.next('div')
	.children('p')
	.toArray()
	.map(el => $a(el).text())
	.filter(t => t.startsWith('#'))
	.map((t, i) => {
		const m = t.match(/^#(\d+)\s+(.+?)\s+\((\d{2})\/(\d{2})\/(\d{4})\)$/)
		if (!m) throw new Error(`classement illisible : ${t}`)
		return {
			category: m[2],
			created: DATE,
			// Midi UTC : la date affichée (fr-FR) reste la même quel que soit le fuseau du serveur.
			date: `${m[5]}-${m[4]}-${m[3]} 12:00:00.000Z`,
			id: `classement${String(i + 1).padStart(5, '0')}`,
			is_active: true,
			position: Number(m[1]),
		}
	})

// Métadonnées SEO de l'accueil (generateMetadata de src/app/page.tsx).
const meta = (attr, nom) => $a(`head meta[${attr}="${nom}"]`).attr('content')
const seo_metadata = [
	{
		created: DATE,
		description: meta('name', 'description'),
		id: 'seoaccueil00001',
		is_active: true,
		keywords: meta('name', 'keywords').split(','),
		og_description: meta('property', 'og:description'),
		og_title: meta('property', 'og:title'),
		og_url: meta('property', 'og:url'),
		page: 'home',
		title: $a('head title').text(),
		twitter_creator: meta('name', 'twitter:creator'),
		twitter_description: meta('name', 'twitter:description'),
		twitter_site: meta('name', 'twitter:site'),
		twitter_title: meta('name', 'twitter:title'),
		updated: DATE,
	},
]

// Chiffres Wattpad tels que les sert la production.
const stats = (await (await fetch(`${base}/api/wattpad-stats`)).json()).data
const wattpad_stats = ['coeurs-sombres', 'au-prix-du-silence'].map(
	(book, i) => {
		const s = stats[book]
		return {
			book,
			created: DATE,
			id: `stats${String(i + 1).padStart(10, '0')}`,
			is_active: true,
			parts: String(s.parts),
			reads: s.reads,
			reads_complete: String(s.readsComplete),
			updated: DATE_CHIFFRES,
			votes: String(s.votes),
		}
	}
)

const instantane = {
	_source: `${base} (HTML public), relevé le ${new Date().toISOString().slice(0, 10)}`,
	seo_metadata,
	site_content,
	site_settings: [],
	social_links,
	wattpad_rankings,
	wattpad_stats,
}
writeFileSync(sortie, JSON.stringify(instantane, null, '\t') + '\n')
console.log(
	`${sortie} : ${site_content.length} contenus, ${social_links.length} réseaux, ${wattpad_rankings.length} classements`
)
