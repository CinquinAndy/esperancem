// Faux PocketBase + faux Wattpad pour les tests d'intégration (aucun accès réseau extérieur).
// Contrôle : GET /__mode?wattpad=ok|403|429|garbage|partial|zero|format|apidown&pb=ok|down
//            GET /__writes, GET /__reset
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
			if (url.pathname === '/__writes') return Response.json({ stats, writes })
			if (url.pathname === '/__reset') {
				stats = initialStats()
				writes = []
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
