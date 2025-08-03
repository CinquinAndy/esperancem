'use server'

import type {
	SeoMetadata,
	SiteContent,
	SiteSetting,
	SocialLink,
	WattpadRanking,
} from '@/lib/pocketbase'

import { PocketBaseService } from '@/services/pocketbase'

// Cache en mémoire pour optimiser les performances ISR
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCacheKey(operation: string, ...params: string[]): string {
	return `${operation}:${params.join(':')}`
}

function isCacheValid(timestamp: number): boolean {
	return Date.now() - timestamp < CACHE_DURATION
}

function getCachedData<T>(key: string): T | null {
	const cached = cache.get(key)
	if (cached && isCacheValid(cached.timestamp)) {
		return cached.data as T
	}
	return null
}

function setCachedData<T>(key: string, data: T): void {
	cache.set(key, { data, timestamp: Date.now() })
}

// Cache global pour les données qui changent rarement
let globalContentCache: Record<string, Record<string, SiteContent[]>> | null =
	null
let globalSocialLinksCache: SocialLink[] | null = null
let globalSettingsCache: Record<string, SiteSetting> | null = null

/**
 * Get specific content by key with caching
 */
export async function getContent(
	page: string,
	section: string,
	key: string
): Promise<string> {
	const cacheKey = getCacheKey('content', page, section, key)
	const cached = getCachedData<string>(cacheKey)
	if (cached !== null) {
		return cached
	}

	try {
		const content = await PocketBaseService.siteContent.getContentByKey(
			page,
			section,
			key
		)
		const result = content?.content || ''
		setCachedData(cacheKey, result)
		return result
	} catch (error) {
		console.error(
			`Error fetching content for ${page}/${section}/${key}:`,
			error
		)
		return ''
	}
}

/**
 * Get all content for a page section with caching
 */
export async function getSectionContent(
	page: string,
	section: string
): Promise<SiteContent[]> {
	const cacheKey = getCacheKey('section', page, section)
	const cached = getCachedData<SiteContent[]>(cacheKey)
	if (cached !== null) {
		return cached
	}

	try {
		const result = await PocketBaseService.siteContent.getContent(page, section)
		setCachedData(cacheKey, result)
		return result
	} catch (error) {
		console.error(
			`Error fetching section content for ${page}/${section}:`,
			error
		)
		return []
	}
}

/**
 * Get all content for a page with global caching
 */
export async function getPageContent(
	page: string
): Promise<Record<string, SiteContent[]>> {
	// Utiliser le cache global si disponible
	if (globalContentCache && globalContentCache[page]) {
		return globalContentCache[page]
	}

	try {
		const content = await PocketBaseService.siteContent.getContent(page)
		const grouped: Record<string, SiteContent[]> = {}

		content.forEach(item => {
			if (!grouped[item.section]) {
				grouped[item.section] = []
			}
			grouped[item.section].push(item)
		})

		// Mettre en cache global
		if (!globalContentCache) globalContentCache = {}
		globalContentCache[page] = grouped

		return grouped
	} catch (error) {
		console.error(`Error fetching page content for ${page}:`, error)
		return {}
	}
}

/**
 * Get SEO metadata for a specific page with caching
 */
export async function getSeoMetadata(
	page: string
): Promise<SeoMetadata | null> {
	const cacheKey = getCacheKey('seo', page)
	const cached = getCachedData<SeoMetadata>(cacheKey)
	if (cached !== null) {
		return cached
	}

	try {
		const result = await PocketBaseService.seoMetadata.getPageMetadata(page)
		setCachedData(cacheKey, result)
		return result
	} catch (error) {
		console.error(`Error fetching SEO metadata for ${page}:`, error)
		return null
	}
}

/**
 * Get all social links with global caching
 */
export async function getSocialLinks(): Promise<SocialLink[]> {
	// Utiliser le cache global si disponible
	if (globalSocialLinksCache !== null) {
		return globalSocialLinksCache
	}

	try {
		const result = await PocketBaseService.socialLinks.getSocialLinks()
		globalSocialLinksCache = result
		return result
	} catch (error) {
		console.error('Error fetching social links:', error)
		return []
	}
}

/**
 * Get Wattpad rankings with caching
 */
export async function getWattpadRankings(): Promise<WattpadRanking[]> {
	const cacheKey = getCacheKey('rankings')
	const cached = getCachedData<WattpadRanking[]>(cacheKey)
	if (cached !== null) {
		return cached
	}

	try {
		const result = await PocketBaseService.wattpadStats.getRankings()
		setCachedData(cacheKey, result)
		return result
	} catch (error) {
		console.error('Error fetching Wattpad rankings:', error)
		return []
	}
}

/**
 * Get site settings with global caching
 */
export async function getSiteSettings(): Promise<Record<string, SiteSetting>> {
	// Utiliser le cache global si disponible
	if (globalSettingsCache !== null) {
		return globalSettingsCache
	}

	try {
		const result = await PocketBaseService.siteSettings.getAllSettings()
		globalSettingsCache = result
		return result
	} catch (error) {
		console.error('Error fetching site settings:', error)
		return {}
	}
}

/**
 * Get specific site setting with caching
 */
export async function getSiteSetting(key: string): Promise<string> {
	const cacheKey = getCacheKey('setting', key)
	const cached = getCachedData<string>(cacheKey)
	if (cached !== null) {
		return cached
	}

	try {
		const result = await PocketBaseService.siteSettings.getSettingValue(key)
		const value = result || ''
		setCachedData(cacheKey, value)
		return value
	} catch (error) {
		console.error(`Error fetching site setting ${key}:`, error)
		return ''
	}
}

/**
 * Get content with fallback and caching
 */
export async function getContentWithFallback(
	page: string,
	section: string,
	key: string,
	fallback: string
): Promise<string> {
	const content = await getContent(page, section, key)
	return content || fallback
}

/**
 * Get multiple content items in batch for better performance
 */
export async function getMultipleContent(
	items: Array<{ page: string; section: string; key: string; fallback: string }>
): Promise<Record<string, string>> {
	const results: Record<string, string> = {}

	// Grouper par page pour optimiser les requêtes
	const pageGroups = new Map<
		string,
		Array<{ section: string; key: string; fallback: string; index: number }>
	>()

	items.forEach((item, index) => {
		if (!pageGroups.has(item.page)) {
			pageGroups.set(item.page, [])
		}
		pageGroups.get(item.page)!.push({
			fallback: item.fallback,
			index,
			key: item.key,
			section: item.section,
		})
	})

	// Traiter chaque page en parallèle
	await Promise.all(
		Array.from(pageGroups.entries()).map(async ([page, pageItems]) => {
			try {
				// Récupérer tout le contenu de la page en une seule requête
				const pageContent = await getPageContent(page)

				// Extraire les valeurs demandées
				pageItems.forEach(({ fallback, key, section }) => {
					const sectionContent = pageContent[section] || []
					const contentItem = sectionContent.find(item => item.key === key)
					const value = contentItem?.content || fallback

					// Utiliser l'index pour maintenir l'ordre
					results[`${page}:${section}:${key}`] = value
				})
			} catch (error) {
				console.error(`Error fetching content for page ${page}:`, error)
				// Fallback pour tous les items de cette page
				pageItems.forEach(({ fallback, key, section }) => {
					results[`${page}:${section}:${key}`] = fallback
				})
			}
		})
	)

	return results
}

/**
 * Get 404 content with caching
 */
export async function get404Content(): Promise<{
	buttonText: string
	description: string
	title: string
}> {
	const cacheKey = getCacheKey('404')
	const cached = getCachedData<{
		buttonText: string
		description: string
		title: string
	}>(cacheKey)
	if (cached !== null) {
		return cached
	}

	try {
		const [buttonText, description, title] = await Promise.all([
			getContentWithFallback(
				'404',
				'page',
				'button_text',
				"Retour à l'accueil"
			),
			getContentWithFallback(
				'404',
				'page',
				'description',
				"La page que vous recherchez n'existe pas."
			),
			getContentWithFallback('404', 'page', 'title', 'Page non trouvée'),
		])

		const result = { buttonText, description, title }
		setCachedData(cacheKey, result)
		return result
	} catch (error) {
		console.error('Error fetching 404 content:', error)
		return {
			buttonText: "Retour à l'accueil",
			description: "La page que vous recherchez n'existe pas.",
			title: 'Page non trouvée',
		}
	}
}

/**
 * Get layout content with caching
 */
export async function getLayoutContent(): Promise<{
	copyright: string
	siteDescription: string
	siteName: string
}> {
	const cacheKey = getCacheKey('layout')
	const cached = getCachedData<{
		copyright: string
		siteDescription: string
		siteName: string
	}>(cacheKey)
	if (cached !== null) {
		return cached
	}

	try {
		const [copyright, siteDescription, siteName] = await Promise.all([
			getContentWithFallback(
				'layout',
				'site',
				'copyright',
				'© 2024 Espérance Masson. Tous droits réservés.'
			),
			getContentWithFallback(
				'layout',
				'site',
				'site_description',
				'Autrice française de dark romance'
			),
			getContentWithFallback('layout', 'site', 'site_name', 'Espérance Masson'),
		])

		const result = { copyright, siteDescription, siteName }
		setCachedData(cacheKey, result)
		return result
	} catch (error) {
		console.error('Error fetching layout content:', error)
		return {
			copyright: '© 2024 Espérance Masson. Tous droits réservés.',
			siteDescription: 'Autrice française de dark romance',
			siteName: 'Espérance Masson',
		}
	}
}

/**
 * Clear all caches (useful for testing or manual refresh)
 */
export async function clearContentCache(): Promise<void> {
	cache.clear()
	globalContentCache = null
	globalSocialLinksCache = null
	globalSettingsCache = null
}
