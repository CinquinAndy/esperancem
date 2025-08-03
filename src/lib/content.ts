import type {
	SiteContent,
	SeoMetadata,
	SocialLink,
	WattpadRanking,
	SiteSetting,
} from '@/lib/pocketbase'

import { PocketBaseService } from '@/services/pocketbase'

/**
 * Get content by key for a specific page and section
 */
export async function getContent(
	page: string,
	section: string,
	key: string
): Promise<string> {
	try {
		const content = await PocketBaseService.siteContent.getContentByKey(
			page,
			section,
			key
		)
		return content?.content || ''
	} catch (error) {
		console.error(
			`Error fetching content for ${page}/${section}/${key}:`,
			error
		)
		return ''
	}
}

/**
 * Get all content for a page section
 */
export async function getSectionContent(
	page: string,
	section: string
): Promise<SiteContent[]> {
	try {
		return await PocketBaseService.siteContent.getContent(page, section)
	} catch (error) {
		console.error(
			`Error fetching section content for ${page}/${section}:`,
			error
		)
		return []
	}
}

/**
 * Get all content for a page
 */
export async function getPageContent(
	page: string
): Promise<Record<string, SiteContent[]>> {
	try {
		return await PocketBaseService.siteContent.getPageContent(page)
	} catch (error) {
		console.error(`Error fetching page content for ${page}:`, error)
		return {}
	}
}

/**
 * Get SEO metadata for a specific page
 */
export async function getSeoMetadata(
	page: string
): Promise<SeoMetadata | null> {
	try {
		return await PocketBaseService.seoMetadata.getPageMetadata(page)
	} catch (error) {
		console.error(`Error fetching SEO metadata for ${page}:`, error)
		return null
	}
}

/**
 * Get all social links
 */
export async function getSocialLinks(): Promise<SocialLink[]> {
	try {
		return await PocketBaseService.socialLinks.getSocialLinks()
	} catch (error) {
		console.error('Error fetching social links:', error)
		return []
	}
}

/**
 * Get Wattpad rankings
 */
export async function getWattpadRankings(): Promise<WattpadRanking[]> {
	try {
		return await PocketBaseService.wattpadStats.getRankings()
	} catch (error) {
		console.error('Error fetching Wattpad rankings:', error)
		return []
	}
}

/**
 * Get site settings
 */
export async function getSiteSettings(): Promise<Record<string, SiteSetting>> {
	try {
		return await PocketBaseService.siteSettings.getAllSettings()
	} catch (error) {
		console.error('Error fetching site settings:', error)
		return {}
	}
}

/**
 * Get specific site setting by key
 */
export async function getSiteSetting(key: string): Promise<string> {
	try {
		const setting = await PocketBaseService.siteSettings.getSettingValue(key)
		return setting || ''
	} catch (error) {
		console.error(`Error fetching site setting ${key}:`, error)
		return ''
	}
}

/**
 * Helper function to get content with fallback
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
 * Helper function to get multiple content items at once
 */
export async function getMultipleContent(
	items: Array<{ page: string; section: string; key: string; fallback: string }>
): Promise<Record<string, string>> {
	const results: Record<string, string> = {}

	for (const item of items) {
		const content = await getContentWithFallback(
			item.page,
			item.section,
			item.key,
			item.fallback
		)
		results[item.key] = content
	}

	return results
}

/**
 * Get 404 page content
 */
export async function get404Content(): Promise<{
	buttonText: string
	description: string
	title: string
}> {
	const [buttonText, description, title] = await Promise.all([
		getContentWithFallback('404', 'error', 'button_text', "Retour à l'accueil"),
		getContentWithFallback(
			'404',
			'error',
			'description',
			"Désolé, nous n'avons pas trouvé la page que vous recherchez."
		),
		getContentWithFallback('404', 'error', 'title', 'Page non trouvée'),
	])

	return {
		buttonText,
		description,
		title,
	}
}

/**
 * Get layout content (header, footer, etc.)
 */
export async function getLayoutContent(): Promise<{
	copyright: string
	siteDescription: string
	siteName: string
}> {
	const [copyright, siteDescription, siteName] = await Promise.all([
		getContentWithFallback(
			'layout',
			'footer',
			'copyright',
			`© ${new Date().getFullYear()} Espérance Masson - Tous droits réservés.`
		),
		getContentWithFallback(
			'layout',
			'site',
			'site_description',
			'Autrice de dark romance'
		),
		getContentWithFallback('layout', 'site', 'site_name', 'Espérance Masson'),
	])

	return {
		copyright,
		siteDescription,
		siteName,
	}
}
