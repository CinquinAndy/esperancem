import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { BOOKS } from '@/lib/wattpad-sync/books'
import { fetchBookCounts, parseStoryPage } from '@/lib/wattpad-sync/source'

const fixtures = join(import.meta.dir, '..', 'fixtures')
const storyPage = readFileSync(
	join(fixtures, 'wattpad-story-coeurs-sombres.html'),
	'utf8'
)
const book = BOOKS[0]

type Handler = (url: string) => Response | Promise<Response>
function fakeFetch(handler: Handler) {
	const calls: string[] = []
	const impl = (async (input: RequestInfo | URL) => {
		const url = String(input)
		calls.push(url)
		return handler(url)
	}) as typeof fetch
	return { calls, impl }
}
const api = (body: unknown, status = 200) =>
	new Response(typeof body === 'string' ? body : JSON.stringify(body), {
		status,
	})
const ok = {
	id: '368278312',
	numParts: 48,
	readCount: 366177,
	voteCount: 11126,
}
const run = (handler: Handler) => {
	const f = fakeFetch(handler)
	return fetchBookCounts(book, {
		baseUrl: 'https://w.test',
		fetchImpl: f.impl,
	}).then(r => ({ ...f, r }))
}

describe('parseStoryPage (page réelle du 02/11/2026)', () => {
	test('lit les libellés accessibles, pas les classes générées', () => {
		expect(parseStoryPage(storyPage)).toEqual({
			parts: 48,
			reads: 366177,
			votes: 11126,
		})
	})
	test('page sans les libellés (format changé) : rien plutôt que 0', () => {
		expect(
			parseStoryPage(storyPage.replace(/>Reads /g, '>Lectures '))
		).toBeNull()
		expect(parseStoryPage('<html>nouvelle maquette</html>')).toBeNull()
	})
	test('libellés contradictoires : on s’abstient', () => {
		expect(
			parseStoryPage(`${storyPage}<span class="sr-only">Reads 1,000</span>`)
		).toBeNull()
	})
})

describe('fetchBookCounts : modes de panne de Wattpad', () => {
	test('API JSON en état de marche', async () => {
		const { calls, r } = await run(() => api(ok))
		expect(r).toEqual({
			counts: { parts: 48, reads: 366177, votes: 11126 },
			ok: true,
			via: 'api',
		})
		expect(calls).toHaveLength(1)
		expect(calls[0]).toContain('/api/v3/stories/368278312')
	})
	test('API refusée (403) : repli sur la page du roman', async () => {
		const { r } = await run(url =>
			url.includes('/api/') ? api('Forbidden', 403) : new Response(storyPage)
		)
		expect(r).toEqual({
			counts: { parts: 48, reads: 366177, votes: 11126 },
			ok: true,
			via: 'page',
		})
	})
	test('blocage complet (429 partout) : échec explicite, aucun chiffre', async () => {
		const { r } = await run(() => api('Too many', 429))
		expect(r.ok).toBe(false)
		if (!r.ok) expect(r.error).toBe('api : HTTP 429 ; page : HTTP 429')
	})
	test('réponse illisible (page HTML de maintenance à la place du JSON)', async () => {
		const { r } = await run(() => new Response('<html>maintenance</html>'))
		expect(r.ok).toBe(false)
		if (!r.ok) expect(r.error).toContain('api : réponse illisible')
	})
	test('réponse partielle (readCount absent) : échec, pas de zéro', async () => {
		const { readCount: _omit, ...partial } = ok
		const { r } = await run(url =>
			url.includes('/api/') ? api(partial) : new Response('<html></html>')
		)
		expect(r.ok).toBe(false)
		if (!r.ok) expect(r.error).toContain('champs absents')
	})
	test('format changé (« 366K » au lieu de 366177) : refusé', async () => {
		const { r } = await run(url =>
			url.includes('/api/')
				? api({ ...ok, readCount: '366K' })
				: new Response('<html></html>')
		)
		expect(r.ok).toBe(false)
	})
	test('délai dépassé', async () => {
		const { r } = await run(() => {
			throw Object.assign(new Error('timeout'), { name: 'TimeoutError' })
		})
		expect(r.ok).toBe(false)
		if (!r.ok)
			expect(r.error).toBe('api : délai dépassé ; page : délai dépassé')
	})
	test('zéros renvoyés par l’API : la source les transmet, la validation les refusera', async () => {
		const { r } = await run(() =>
			api({ ...ok, numParts: 0, readCount: 0, voteCount: 0 })
		)
		expect(r).toEqual({
			counts: { parts: 0, reads: 0, votes: 0 },
			ok: true,
			via: 'api',
		})
	})
})
