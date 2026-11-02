// Faux PocketBase + faux Wattpad pour les tests d'intégration (aucun accès réseau extérieur).
// Contrôle : GET /__mode?wattpad=ok|403|429|garbage|partial|zero|format|apidown&pb=ok|down
//            GET /__writes, GET /__reset
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const storyPage = readFileSync(
	join(import.meta.dir, '..', 'fixtures', 'wattpad-story-coeurs-sombres.html'),
	'utf8'
)
const API: Record<
	string,
	{ numParts: number; readCount: number; voteCount: number }
> = {
	'368278312': { numParts: 48, readCount: 366500, voteCount: 11200 },
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
	]
}

export function startStub() {
	let stats = initialStats()
	let mode = { pb: 'ok', wattpad: 'ok' }
	let writes: any[] = []

	const server = Bun.serve({
		hostname: '127.0.0.1',
		port: 0,
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
					return new Response(storyPage)
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
				const book = url.searchParams
					.get('filter')
					?.match(/book = "([^"]+)"/)?.[1]
				if (book) items = items.filter(i => i.book === book)
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
			return Response.json(rec ?? body)
		},
	})
	return { server, url: `http://127.0.0.1:${server.port}` }
}
