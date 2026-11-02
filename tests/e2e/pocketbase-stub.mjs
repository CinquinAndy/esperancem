/**
 * Faux PocketBase pour le bout en bout : chiffres Wattpad, contenus et classements. GET seulement :
 * toute autre méthode répond 405 et est comptée (GET /__ecritures). Aucun accès réseau extérieur.
 * Les chiffres diffèrent du relevé committé (src/data/wattpad-releve.json) : le test vérifie ainsi que
 * la page affiche bien ce que sert PocketBase.
 */
import { createServer } from 'node:http'

export const CHIFFRES = {
	'au-prix-du-silence': { parts: 50, reads: 137110, votes: 6580 },
	'coeurs-sombres': { parts: 48, reads: 366190, votes: 11140 },
}

const pbDate = date => date.toISOString().replace('T', ' ')

function stats() {
	// Plus récent que le relevé committé : c'est cette valeur que le site doit choisir.
	const updated = pbDate(new Date())
	return Object.entries(CHIFFRES).map(([book, c], i) => ({
		book,
		created: `2025-0${7 + i}-01 00:00:00.000Z`,
		id: `w${i + 1}`,
		is_active: true,
		parts: String(c.parts),
		reads: `${Math.floor(c.reads / 1000)}K`,
		reads_complete: String(c.reads),
		updated,
		votes: String(c.votes),
	}))
}

function contenu(key) {
	const created = pbDate(new Date('2026-10-01T00:00:00Z'))
	return {
		content: key.startsWith('wattpad_url')
			? 'https://www.wattpad.com/story/368278312'
			: `Texte ${key}`,
		created,
		id: `c-${key}`,
		is_active: true,
		key,
		page: 'home',
		section: 'book',
		updated: created,
	}
}

export function demarrerPocketBase() {
	let ecritures = 0
	const serveur = createServer((req, res) => {
		const url = new URL(req.url, 'http://stub')
		const json = (status, body) => {
			res.writeHead(status, { 'content-type': 'application/json' })
			res.end(JSON.stringify(body))
		}
		if (url.pathname === '/__ecritures') return json(200, { ecritures })
		if (req.method !== 'GET') {
			ecritures++
			return json(405, { message: 'lecture seule' })
		}
		const col = url.pathname.match(/^\/api\/collections\/(\w+)\/records$/)
		if (!col) return json(404, { message: 'introuvable' })
		const filtre = url.searchParams.get('filter') ?? ''
		let items = []
		if (col[1] === 'wattpad_stats') {
			const book = filtre.match(/book = "([^"]+)"/)?.[1]
			items = stats().filter(i => !book || i.book === book)
		} else if (col[1] === 'wattpad_rankings') {
			items = [
				{
					category: 'darkromance',
					created: pbDate(new Date('2026-10-01T00:00:00Z')),
					date: '2026-10-01 00:00:00.000Z',
					id: 'r1',
					is_active: true,
					position: 1,
				},
			]
		} else if (col[1] === 'site_content') {
			const key = filtre.match(/key = "([^"]+)"/)?.[1]
			if (key) items = [contenu(key)]
		}
		return json(200, {
			items,
			page: 1,
			perPage: 50,
			totalItems: items.length,
			totalPages: 1,
		})
	})
	return new Promise(resolve =>
		serveur.listen(0, '127.0.0.1', () =>
			resolve({
				arreter: () => serveur.close(),
				url: `http://127.0.0.1:${serveur.address().port}`,
			})
		)
	)
}
