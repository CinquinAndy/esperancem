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
const storyPageFr = readFileSync(
	join(fixtures, 'wattpad-story-coeurs-sombres-fr.html'),
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
	test('classes CSS renommées par Wattpad (ce qui cassait l’ancien code) : lecture intacte', () => {
		expect(parseStoryPage(storyPage.replaceAll('uG9U1', 'aB3xY'))).toEqual({
			parts: 48,
			reads: 366177,
			votes: 11126,
		})
	})
	test('page servie en français (« Lectures », « Chapitres ») : lecture intacte', () => {
		expect(parseStoryPage(storyPageFr)).toEqual({
			parts: 48,
			reads: 366177,
			votes: 11126,
		})
	})
	test('page sans les libellés connus (format changé) : rien plutôt que 0', () => {
		expect(
			parseStoryPage(storyPage.replace(/>Reads /g, '>Leituras '))
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
	test('la page du roman est demandée en anglais (libellés stables)', async () => {
		const languages: (string | null)[] = []
		const impl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
			languages.push(new Headers(init?.headers).get('accept-language'))
			return api('Forbidden', 403)
		}) as typeof fetch
		await fetchBookCounts(book, { baseUrl: 'https://w.test', fetchImpl: impl })
		expect(languages).toHaveLength(2)
		for (const l of languages) expect(l).toMatch(/^en/)
	})
	test('API refusée (403) et page servie en français : repli sur la page quand même', async () => {
		const { r } = await run(url =>
			url.includes('/api/') ? api('Forbidden', 403) : new Response(storyPageFr)
		)
		expect(r).toEqual({
			counts: { parts: 48, reads: 366177, votes: 11126 },
			ok: true,
			via: 'page',
		})
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
	test('zéros renvoyés par l’API, page illisible : échec, rien de transmis', async () => {
		const { r } = await run(url =>
			url.includes('/api/')
				? api({ ...ok, numParts: 0, readCount: 0, voteCount: 0 })
				: new Response('<html></html>')
		)
		expect(r).toEqual({
			error: 'api : lectures à zéro ; page : chiffres introuvables',
			ok: false,
		})
	})
	test('0 vote renvoyé par l’API : la page prend le relais avec les vrais chiffres', async () => {
		const { r } = await run(url =>
			url.includes('/api/')
				? api({ ...ok, voteCount: 0 })
				: new Response(storyPage)
		)
		expect(r).toEqual({
			counts: { parts: 48, reads: 366177, votes: 11126 },
			ok: true,
			via: 'page',
		})
	})
	test('0 vote sur la page aussi : échec, rien de transmis', async () => {
		const { r } = await run(url =>
			url.includes('/api/')
				? api({ ...ok, voteCount: 0 })
				: new Response(storyPage.replaceAll('11,126', '0'))
		)
		expect(r).toEqual({
			error: 'api : votes à zéro ; page : votes à zéro',
			ok: false,
		})
	})
})
