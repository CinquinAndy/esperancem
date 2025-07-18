import type {
	SiteContent,
	SeoMetadata,
	SocialLink,
	WattpadStats,
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
 * Get SEO metadata for a page
 */
export async function getPageMetadata(
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
 * Get current Wattpad stats
 */
export async function getWattpadStats(): Promise<WattpadStats | null> {
	try {
		return await PocketBaseService.wattpadStats.getCurrentStats()
	} catch (error) {
		console.error('Error fetching Wattpad stats:', error)
		return null
	}
}

/**
 * Get all Wattpad rankings
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
 * Get a site setting by key
 */
export async function getSetting(key: string): Promise<string | null> {
	try {
		return await PocketBaseService.siteSettings.getSettingValue(key)
	} catch (error) {
		console.error(`Error fetching setting ${key}:`, error)
		return null
	}
}

/**
 * Get all site settings
 */
export async function getAllSettings(): Promise<Record<string, SiteSetting>> {
	try {
		return await PocketBaseService.siteSettings.getAllSettings()
	} catch (error) {
		console.error('Error fetching site settings:', error)
		return {}
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
