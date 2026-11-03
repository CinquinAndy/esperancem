/**
 * Middleware (en-têtes de sécurité, routes bloquées) et lecteur de filtres du faux PocketBase des tests.
 */
import { describe, expect, test } from 'bun:test'
import { NextRequest } from 'next/server'

import { middleware } from '@/middleware'

import { lireFiltre, repondre, trier } from '../donnees/serveur-instantane.mjs'

const requete = (chemin: string, headers: Record<string, string> = {}) =>
	new NextRequest(`https://esperancem.fr${chemin}`, {
		headers: { host: 'esperancem.fr', ...headers },
	})

describe('middleware', () => {
	test('en-têtes de sécurité et CSP sur une page', () => {
		const r = middleware(requete('/'))
		expect(r.headers.get('x-frame-options')).toBe('DENY')
		expect(r.headers.get('x-content-type-options')).toBe('nosniff')
		expect(r.headers.get('referrer-policy')).toBe('origin-when-cross-origin')
		const csp = r.headers.get('content-security-policy')!
		expect(csp).toContain("default-src 'self'")
		expect(csp).toContain('https://umami.wadefade.fr')
	})

	test('ancienne route /api/pocketbase : 404', async () => {
		const r = middleware(requete('/api/pocketbase/x'))
		expect(r.status).toBe(404)
	})

	test('admin depuis une autre origine : 403 ; même origine : laisse passer', () => {
		expect(
			middleware(
				requete('/api/admin/wattpad-stats', {
					origin: 'https://ailleurs.example',
				})
			).status
		).toBe(403)
		expect(
			middleware(
				requete('/api/admin/wattpad-stats', { origin: 'https://esperancem.fr' })
			).status
		).toBe(200)
	})
})

describe('faux PocketBase des tests', () => {
	const r = { a: 'x', b: true, n: 2, t: 'abc def' }
	test('filtres pris en charge', () => {
		expect(lireFiltre('a = "x" && b = true')(r)).toBe(true)
		expect(lireFiltre('a = "y" && b = true')(r)).toBe(false)
		expect(lireFiltre('t ~ "c d"')(r)).toBe(true)
		expect(lireFiltre('n = 2')(r)).toBe(true)
		expect(lireFiltre('')(r)).toBe(true)
	})
	test('syntaxe inconnue : erreur, jamais un résultat silencieux', () => {
		expect(() => lireFiltre('a != "x"')).toThrow()
		expect(
			repondre('site_content', new URLSearchParams({ filter: 'a > 1' })).statut
		).toBe(400)
	})
	test('tri et pagination', () => {
		expect(trier([{ d: 1 }, { d: 3 }, { d: 2 }], '-d').map(x => x.d)).toEqual([
			3, 2, 1,
		])
		const { corps } = repondre(
			'site_content',
			new URLSearchParams({ filter: 'page = "home"', page: '2', perPage: '3' })
		)
		expect(corps.items).toHaveLength(3)
		expect(corps.page).toBe(2)
	})
	test('collection inconnue : 404', () => {
		expect(repondre('inconnue', new URLSearchParams()).statut).toBe(404)
	})
})
