#!/usr/bin/env node
/**
 * Faux PocketBase en lecture seule qui sert l'instantané tests/donnees/pocketbase-instantane.json.
 * Sert au build et au serveur des tests e2e et visuels : les pages sont rendues avec des données figées.
 *   node tests/donnees/serveur-instantane.mjs [port]     (18090 par défaut)
 * Comprend le sous-ensemble de l'API utilisé par le site : GET /api/collections/<c>/records avec
 * page, perPage, filter (clauses `champ = "x"`, `champ = true|false`, `champ ~ "x"` reliées par &&) et sort.
 * Toute autre méthode répond 405 et est comptée (GET /__ecritures). Aucun accès réseau extérieur.
 */
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ici = dirname(fileURLToPath(import.meta.url))
export const INSTANTANE = JSON.parse(
	readFileSync(join(ici, 'pocketbase-instantane.json'), 'utf8')
)

/** Transforme un filtre PocketBase simple en prédicat ; lève une erreur sur une syntaxe inconnue. */
export function lireFiltre(filtre) {
	if (!filtre?.trim()) return () => true
	const clauses = filtre.split('&&').map(c => {
		const m = c
			.trim()
			.match(/^(\w+)\s*(=|~)\s*(?:"((?:[^"\\]|\\.)*)"|(true|false|\d+))$/)
		if (!m) throw new Error(`filtre non pris en charge : ${c.trim()}`)
		const [, champ, op, texte, brut] = m
		const attendu =
			texte ??
			(brut === 'true' ? true : brut === 'false' ? false : Number(brut))
		return op === '~'
			? r => String(r[champ] ?? '').includes(String(attendu))
			: r => r[champ] === attendu
	})
	return r => clauses.every(c => c(r))
}

/** Tri PocketBase : « order », « -date », « -created,id »… */
export function trier(items, tri) {
	if (!tri) return items
	const cles = tri.split(',').map(t => ({
		champ: t.replace(/^[-+]/, ''),
		sens: t.startsWith('-') ? -1 : 1,
	}))
	return [...items].sort((a, b) => {
		for (const { champ, sens } of cles) {
			if (a[champ] < b[champ]) return -sens
			if (a[champ] > b[champ]) return sens
		}
		return 0
	})
}

export function repondre(collection, params, donnees = INSTANTANE) {
	const tout = donnees[collection]
	if (!Array.isArray(tout))
		return { corps: { message: 'introuvable' }, statut: 404 }
	const page = Math.max(1, Number(params.get('page') ?? 1))
	const parPage = Math.max(1, Number(params.get('perPage') ?? 30))
	let filtres
	try {
		filtres = trier(
			tout.filter(lireFiltre(params.get('filter'))),
			params.get('sort')
		)
	} catch (e) {
		return { corps: { message: String(e.message) }, statut: 400 }
	}
	return {
		corps: {
			items: filtres.slice((page - 1) * parPage, page * parPage),
			page,
			perPage: parPage,
			totalItems: filtres.length,
			totalPages: Math.ceil(filtres.length / parPage),
		},
		statut: 200,
	}
}

export function demarrerInstantane(port = 0) {
	let ecritures = 0
	const serveur = createServer((req, res) => {
		const url = new URL(req.url, 'http://instantane')
		const json = (statut, corps) => {
			res.writeHead(statut, { 'content-type': 'application/json' })
			res.end(JSON.stringify(corps))
		}
		if (url.pathname === '/__ecritures') return json(200, { ecritures })
		if (url.pathname === '/api/health')
			return json(200, { code: 200, message: 'API is healthy.' })
		if (req.method !== 'GET') {
			ecritures++
			return json(405, { message: 'lecture seule' })
		}
		const col = url.pathname.match(/^\/api\/collections\/(\w+)\/records$/)
		if (!col) return json(404, { message: 'introuvable' })
		const { corps, statut } = repondre(col[1], url.searchParams)
		return json(statut, corps)
	})
	return new Promise(resolve =>
		serveur.listen(port, '127.0.0.1', () =>
			resolve({
				arreter: () => new Promise(r => serveur.close(r)),
				url: `http://127.0.0.1:${serveur.address().port}`,
			})
		)
	)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const { url } = await demarrerInstantane(Number(process.argv[2] ?? 18090))
	console.info(`Faux PocketBase (instantané) sur ${url}`)
}
