// Faux PocketBase + faux Wattpad pour les tests d'intégration (aucun accès réseau extérieur).
// Contrôle : GET /__mode?wattpad=ok|403|429|garbage|partial|zero|format|apidown&pb=ok|down
//            GET /__writes (écritures acceptées et refusées), GET /__reset
// Les écritures dans wattpad_stats passent par le schéma de production (voir WATTPAD_STATS_SCHEMA) :
// un champ hors schéma répond 400 comme PocketBase, avec le détail par champ.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const fixture = (name: string) =>
	readFileSync(join(import.meta.dir, '..', 'fixtures', name), 'utf8')
const storyPage = fixture('wattpad-story-coeurs-sombres.html')
const storyPageFr = fixture('wattpad-story-coeurs-sombres-fr.html')
// Comme le vrai Wattpad (vérifié le 02/11/2026) : libellés traduits selon la première langue demandée.
const pageFor = (req: Request) =>
	/^\s*fr/i.test(req.headers.get('accept-language') ?? '')
		? storyPageFr
		: storyPage
const API: Record<
	string,
	{ numParts: number; readCount: number; voteCount: number }
> = {
	// Une heure après la base (366 177 lectures, 11 126 votes) : progression réaliste, dans les bornes d'un relevé.
	'368278312': { numParts: 48, readCount: 366500, voteCount: 11140 },
	'395344686': { numParts: 50, readCount: 137300, voteCount: 6600 },
}

/**
 * Schéma de `wattpad_stats` en production : export PocketBase (`file.json`, supprimé par ddf8bda, à lire avec
 * `git show ddf8bda^:file.json`) : quatre champs texte de 50 caractères au plus, aucun requis, aucun index.
 * `book` a été ajouté après cet export (dc2e4d2) : on n'accepte que les deux romans suivis.
 */
const TEXT_MAX = 50
const BOOKS = ['coeurs-sombres', 'au-prix-du-silence']

/** Erreurs par champ, au format de PocketBase ; vide si l'enregistrement est accepté. */
export function validateWattpadStats(body: Record<string, unknown>) {
	const errors: Record<string, { code: string; message: string }> = {}
	for (const name of ['reads', 'reads_complete', 'votes', 'parts']) {
		const value = body[name]
		if (value === undefined || value === null) continue
		if (typeof value !== 'string' && typeof value !== 'number')
			errors[name] = {
				code: 'validation_invalid_value',
				message: 'Invalid value.',
			}
		else if (String(value).length > TEXT_MAX)
			errors[name] = {
				code: 'validation_max_text_constraint',
				message: `Must be no more than ${TEXT_MAX} character(s).`,
			}
	}
	if (body.is_active !== undefined && typeof body.is_active !== 'boolean')
		errors.is_active = {
			code: 'validation_invalid_value',
			message: 'Invalid value.',
		}
	if (
		body.last_updated !== undefined &&
		body.last_updated !== '' &&
		Number.isNaN(Date.parse(String(body.last_updated)))
	)
		errors.last_updated = {
			code: 'validation_invalid_date',
			message: 'Must be a valid date.',
		}
	if (body.book !== undefined && !BOOKS.includes(String(body.book)))
		errors.book = {
			code: 'validation_invalid_value',
			message: 'Invalid value.',
		}
	return errors
}

function initialStats() {
	const updated = new Date(Date.now() - 3600_000)
		.toISOString()
		.replace('T', ' ')
	return [
		{
			book: 'coeurs-sombres',
			created: '2025-07-18 17:22:12.648Z',
			id: 'w1',
			is_active: true,
			parts: '48',
			reads: '366K',
			reads_complete: '366177',
			updated,
			votes: '11126',
		},
		{
			book: 'au-prix-du-silence',
			created: '2025-08-03 10:00:00.000Z',
			id: 'w2',
			is_active: true,
			parts: '50',
			reads: '137K',
			reads_complete: '137098',
			updated,
			votes: '6570',
		},
		// Ancien enregistrement désactivé, plausible : ne doit servir ni d'affichage ni de référence.
		{
			book: 'coeurs-sombres',
			created: '2025-03-01 09:00:00.000Z',
			id: 'w0',
			is_active: false,
			parts: '40',
			reads: '300K',
			reads_complete: '300000',
			updated: '2025-03-01 09:00:00.000Z',
			votes: '9000',
		},
	]
}

export function startStub() {
	let stats = initialStats()
	let mode = { pb: 'ok', wattpad: 'ok' }
	let writes: any[] = []
	let rejected: any[] = []

	const server = Bun.serve({
		async fetch(req) {
			const url = new URL(req.url)
			if (url.pathname === '/__mode') {
				for (const k of ['pb', 'wattpad'] as const) {
					const v = url.searchParams.get(k)
					if (v) mode[k] = v
				}
				return Response.json(mode)
			}
			if (url.pathname === '/__writes')
				return Response.json({ rejected, stats, writes })
			if (url.pathname === '/__reset') {
				stats = initialStats()
				writes = []
				rejected = []
				mode = { pb: 'ok', wattpad: 'ok' }
				return Response.json({ ok: true })
			}
			const api = url.pathname.match(/^\/api\/v3\/stories\/(\d+)/)
			const page = url.pathname.match(/^\/story\/(\d+)/)
			if (api || page) {
				const m = mode.wattpad
				if (m === '403' || m === '429')
					return new Response('denied', { status: Number(m) })
				if (api) {
					const data = { id: api[1], ...API[api[1]] }
					if (m === 'apidown') return new Response('gone', { status: 404 })
					if (m === 'garbage') return new Response('<html>maintenance</html>')
					if (m === 'partial')
						return Response.json({ ...data, readCount: undefined })
					if (m === 'zero')
						return Response.json({
							...data,
							numParts: 0,
							readCount: 0,
							voteCount: 0,
						})
					if (m === 'format')
						return Response.json({ ...data, readCount: '366K' })
					return Response.json(data)
				}
				if (m === 'apidown' && page![1] === '368278312')
					return new Response(pageFor(req))
				return new Response('<html><body>nouvelle maquette</body></html>')
			}
			const col = url.pathname.match(
				/^\/api\/collections\/(\w+)\/records(?:\/(\w+))?$/
			)
			if (!col) return new Response('not found', { status: 404 })
			if (mode.pb === 'down')
				return Response.json({ message: 'down' }, { status: 503 })
			const [, name, id] = col
			if (req.method === 'GET') {
				let items: any[] = name === 'wattpad_stats' ? stats : []
				// Comme PocketBase : filtres sur le roman, l'état actif et le début du champ `reads`.
				const filter = url.searchParams.get('filter') ?? ''
				const book = filter.match(/book = "([^"]+)"/)?.[1]
				const active = filter.match(/is_active = (true|false)/)?.[1]
				const like = filter.match(/reads ~ "([^"]+)"/)?.[1]
				if (book) items = items.filter(i => i.book === book)
				if (active)
					items = items.filter(i => i.is_active === (active === 'true'))
				if (like) items = items.filter(i => String(i.reads).includes(like))
				return Response.json({
					items,
					page: 1,
					perPage: 50,
					totalItems: items.length,
					totalPages: 1,
				})
			}
			const body = await req.json()
			if (name === 'wattpad_stats') {
				const errors = validateWattpadStats(body)
				if (Object.keys(errors).length > 0) {
					rejected.push({ body, errors, id, method: req.method })
					return Response.json(
						{
							data: errors,
							message: id
								? 'Failed to update record.'
								: 'Failed to create record.',
							status: 400,
						},
						{ status: 400 }
					)
				}
			}
			writes.push({
				auth: req.headers.get('authorization') !== null,
				body,
				id,
				method: req.method,
				name,
			})
			const now = new Date().toISOString().replace('T', ' ')
			const rec = stats.find(s => s.id === id)
			if (rec) Object.assign(rec, body, { updated: now })
			else if (req.method === 'POST' && name === 'wattpad_stats') {
				const created = {
					...body,
					created: now,
					id: `n${stats.length + 1}`,
					updated: now,
				}
				stats.push(created)
				return Response.json(created)
			}
			return Response.json(rec ?? body)
		},
		hostname: '127.0.0.1',
		port: 0,
	})
	return { server, url: `http://127.0.0.1:${server.port}` }
}
