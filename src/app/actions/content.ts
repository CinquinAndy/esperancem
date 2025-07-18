'use server'

import {
	SiteContentService,
	SeoMetadataService,
	SocialLinksService,
	WattpadStatsService,
	SiteSettingsService,
} from '@/services/pocketbase'

/**
 * Server Action to get site content
 * This replaces the /api/pocketbase/content endpoint
 */
export async function getContent(page: string, section?: string) {
	try {
		if (!page) {
			return {
				content: null,
				error: 'Page parameter is required',
				success: false,
			}
		}

		const content = await SiteContentService.getContent(page, section)

		return {
			content,
			success: true,
		}
	} catch (error) {
		console.error('Error getting content:', error)
		return {
			content: null,
			error: error instanceof Error ? error.message : 'Unknown error',
			success: false,
		}
	}
}

/**
 * Server Action to get page metadata
 * This replaces the /api/pocketbase/seo endpoint
 */
export async function getPageMetadata(page: string) {
	try {
		if (!page) {
			return {
				error: 'Page parameter is required',
				metadata: null,
				success: false,
			}
		}

		const metadata = await SeoMetadataService.getPageMetadata(page)

		return {
			metadata,
			success: true,
		}
	} catch (error) {
		console.error('Error getting page metadata:', error)
		return {
			error: error instanceof Error ? error.message : 'Unknown error',
			metadata: null,
			success: false,
		}
	}
}

/**
 * Server Action to get social links
 * This replaces the /api/pocketbase/social-links endpoint
 */
export async function getSocialLinks() {
	try {
		const socialLinks = await SocialLinksService.getSocialLinks()

		return {
			socialLinks,
			success: true,
		}
	} catch (error) {
		console.error('Error getting social links:', error)
		return {
			error: error instanceof Error ? error.message : 'Unknown error',
			socialLinks: null,
			success: false,
		}
	}
}

/**
 * Server Action to get Wattpad rankings
 * This replaces the /api/pocketbase/wattpad-rankings endpoint
 */
export async function getWattpadRankings() {
	try {
		const rankings = await WattpadStatsService.getRankings()

		return {
			rankings,
			success: true,
		}
	} catch (error) {
		console.error('Error getting Wattpad rankings:', error)
		return {
			error: error instanceof Error ? error.message : 'Unknown error',
			rankings: null,
			success: false,
		}
	}
}

/**
 * Server Action to get site settings
 * This replaces the /api/pocketbase/settings endpoint
 */
export async function getSiteSettings() {
	try {
		const settings = await SiteSettingsService.getAllSettings()

		return {
			settings,
			success: true,
		}
	} catch (error) {
		console.error('Error getting site settings:', error)
		return {
			error: error instanceof Error ? error.message : 'Unknown error',
			settings: null,
			success: false,
		}
	}
}
