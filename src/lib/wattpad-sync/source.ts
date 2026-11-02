import type { BookConfig } from './books'
import type { BookCounts } from './types'

import { parseExactCount } from './validation'

export interface SourceOptions {
	baseUrl?: string
	fetchImpl?: typeof fetch
	timeoutMs?: number
}

export type SourceResult =
	| { counts: BookCounts; ok: true; via: 'api' | 'page' }
	| { error: string; ok: false }

const DEFAULT_BASE_URL = 'https://www.wattpad.com'
const HEADERS = {
	'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
	'User-Agent':
		'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
}

export function wattpadBaseUrl(): string {
	return (process.env.WATTPAD_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '')
}

async function get(url: string, accept: string, options: SourceOptions) {
	const fetchImpl = options.fetchImpl ?? fetch
	return fetchImpl(url, {
		cache: 'no-store',
		headers: { ...HEADERS, Accept: accept },
		signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
	})
}

function describe(error: unknown): string {
	if (
		error instanceof Error &&
		(error.name === 'TimeoutError' || error.name === 'AbortError')
	) {
		return 'délai dépassé'
	}
	return 'réseau injoignable'
}

/** API JSON publique (non documentée) de Wattpad : la source la plus stable, vérifiée le 02/11/2026. */
async function fromApi(
	book: BookConfig,
	options: SourceOptions
): Promise<SourceResult> {
	const base = options.baseUrl ?? wattpadBaseUrl()
	const url = `${base}/api/v3/stories/${book.id}?fields=id,readCount,voteCount,numParts`
	let response: Response
	try {
		response = await get(url, 'application/json', options)
	} catch (error) {
		return { error: `api : ${describe(error)}`, ok: false }
	}
	if (!response.ok) return { error: `api : HTTP ${response.status}`, ok: false }
	let data: any
	try {
		data = await response.json()
	} catch {
		return { error: 'api : réponse illisible', ok: false }
	}
	const counts = {
		parts: parseExactCount(data?.numParts),
		reads: parseExactCount(data?.readCount),
		votes: parseExactCount(data?.voteCount),
	}
	if (counts.reads === null || counts.votes === null || counts.parts === null) {
		return { error: 'api : champs absents ou au mauvais format', ok: false }
	}
	return { counts: counts as BookCounts, ok: true, via: 'api' }
}

/**
 * Page publique du roman, en secours. Lit les libellés d'accessibilité (« Reads 366,177 »), jamais les
 * classes CSS générées (« uG9U1 ») qui changent à chaque mise en ligne de Wattpad. L'état JSON embarqué
 * n'est pas utilisé : il contient aussi les chiffres des romans recommandés.
 */
export function parseStoryPage(html: string): BookCounts | null {
	const fromLabel = (label: string) => {
		const found = [
			...html.matchAll(new RegExp(`>\\s*${label}\\s+([\\d,]+)\\s*<`, 'gi')),
		]
		const values = new Set(found.map(match => parseExactCount(match[1])))
		// Un seul libellé attendu ; plusieurs valeurs différentes = page inattendue, on s'abstient.
		if (values.size !== 1) return null
		return [...values][0]
	}
	const reads = fromLabel('Reads')
	const votes = fromLabel('Votes')
	const parts = fromLabel('Parts')
	if (reads === null || votes === null || parts === null) return null
	return { parts, reads, votes }
}

async function fromPage(
	book: BookConfig,
	options: SourceOptions
): Promise<SourceResult> {
	const base = options.baseUrl ?? wattpadBaseUrl()
	let response: Response
	try {
		response = await get(`${base}/story/${book.id}`, 'text/html', options)
	} catch (error) {
		return { error: `page : ${describe(error)}`, ok: false }
	}
	if (!response.ok)
		return { error: `page : HTTP ${response.status}`, ok: false }
	const counts = parseStoryPage(await response.text())
	if (!counts) return { error: 'page : chiffres introuvables', ok: false }
	return { counts, ok: true, via: 'page' }
}

/** Relève les chiffres d'un roman. Ne lève jamais d'exception. */
export async function fetchBookCounts(
	book: BookConfig,
	options: SourceOptions = {}
): Promise<SourceResult> {
	const api = await fromApi(book, options)
	if (api.ok) return api
	const page = await fromPage(book, options)
	if (page.ok) return page
	return { error: `${api.error} ; ${page.error}`, ok: false }
}
