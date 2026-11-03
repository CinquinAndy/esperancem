/**
 * SEO : robots, sitemap et métadonnées générées (layout, accueil, à propos). Les chiffres Wattpad sont
 * fixés dans le cache de l'affichage : aucun accès à PocketBase.
 */
import { afterAll, describe, expect, test } from 'bun:test'

import robots from '@/app/robots'
import sitemap from '@/app/sitemap'
import {
	generateAboutMetadata,
	generateHomeMetadata,
	generateLayoutMetadata,
} from '@/lib/metadata'
import { resetDisplayMemory } from '@/lib/wattpad-sync/display'

// Chiffres posés dans le cache de 30 s de getDisplayStats (partagé par le processus) : pas de PocketBase.
const LECTURES = 366_425
const etat = ((globalThis as any).__wattpadDisplay ??= {
	cached: null,
	memory: {},
})
etat.cached = {
	at: Date.now() + 3_600_000,
	value: {
		books: {
			'au-prix-du-silence': { parts: 50, reads: 137_220, votes: 6594 },
			'coeurs-sombres': { parts: 48, reads: LECTURES, votes: 11_156 },
		},
	},
}
afterAll(() => resetDisplayMemory())

describe('robots', () => {
	test('tout est ouvert sauf les routes techniques ; sitemap et hôte', () => {
		expect(robots()).toEqual({
			host: 'https://esperancem.fr',
			rules: [
				{
					allow: '/',
					disallow: ['/api/', '/_next/', '/admin/'],
					userAgent: '*',
				},
				{ allow: '/', disallow: ['/api/', '/admin/'], userAgent: 'Googlebot' },
			],
			sitemap: 'https://esperancem.fr/sitemap.xml',
		})
	})
})

describe('sitemap', () => {
	test('les deux pages publiques, avec priorité et fréquence', () => {
		const pages = sitemap()
		expect(
			pages.map(({ changeFrequency, priority, url }) => ({
				changeFrequency,
				priority,
				url,
			}))
		).toEqual([
			{ changeFrequency: 'weekly', priority: 1, url: 'https://esperancem.fr' },
			{
				changeFrequency: 'monthly',
				priority: 0.8,
				url: 'https://esperancem.fr/about',
			},
		])
		for (const p of pages) expect(p.lastModified).toBeInstanceOf(Date)
	})
})

describe('métadonnées', () => {
	test('layout : canonical, base, gabarit de titre, robots, chiffres arrondis', async () => {
		const m = await generateLayoutMetadata()
		expect(m.alternates?.canonical).toBe('https://esperancem.fr')
		expect(String(m.metadataBase)).toBe('https://esperancem.fr/')
		expect(m.title).toEqual({
			default: 'Espérance Masson - Autrice de Dark Romance | Cœurs Sombres',
			template: '%s | Espérance Masson - Autrice',
		})
		expect(m.robots).toMatchObject({ follow: true, index: true })
		expect(m.description).toContain('plus de 366k lectures')
		expect(m.openGraph).toMatchObject({
			locale: 'fr_FR',
			type: 'website',
			url: 'https://esperancem.fr',
		})
	})

	test('à propos : URL et chiffres « 366k+ »', async () => {
		const m = await generateAboutMetadata()
		expect(m.openGraph?.url).toBe('https://esperancem.fr/about')
		expect(m.openGraph?.description).toContain('plus de 366k+ lecteurs')
		expect(m.twitter).toMatchObject({ card: 'summary_large_image' })
	})

	test('accueil (repli sans CMS) : titre et URL', async () => {
		const m = await generateHomeMetadata()
		expect(m.title).toBe(
			'Accueil - Espérance Masson | Autrice de Cœurs Sombres'
		)
		expect(m.openGraph?.url).toBe('https://esperancem.fr')
	})
})
