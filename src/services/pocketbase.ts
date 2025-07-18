import {
	createPocketBase,
	COLLECTIONS,
	type SiteContent,
	type SeoMetadata,
	type SocialLink,
	type WattpadStats,
	type WattpadRanking,
	type SiteSetting,
} from '@/lib/pocketbase'

/**
 * Site Content Service
 * Handles all site content operations from PocketBase
 */
export class SiteContentService {
	/**
	 * Get all active content for a specific page and section
	 */
	static async getContent(
		page: string,
		section?: string
	): Promise<SiteContent[]> {
		const pb = createPocketBase()

		try {
			let filter = `page = "${page}" && is_active = true`
			if (section) {
				filter += ` && section = "${section}"`
			}

			const records = await pb
				.collection(COLLECTIONS.SITE_CONTENT)
				.getList<SiteContent>(1, 100, {
					filter,
					sort: 'order',
				})

			return records.items
		} catch (error) {
			console.error('Error fetching site content:', error)
			return []
		}
	}

	/**
	 * Get specific content by key
	 */
	static async getContentByKey(
		page: string,
		section: string,
		key: string
	): Promise<SiteContent | null> {
		const pb = createPocketBase()

		try {
			const filter = `page = "${page}" && section = "${section}" && key = "${key}" && is_active = true`
			const records = await pb
				.collection(COLLECTIONS.SITE_CONTENT)
				.getList<SiteContent>(1, 1, {
					filter,
				})

			return records.items[0] || null
		} catch (error) {
			console.error('Error fetching content by key:', error)
			return null
		}
	}

	/**
	 * Get all content for a page
	 */
	static async getPageContent(
		page: string
	): Promise<Record<string, SiteContent[]>> {
		const content = await this.getContent(page)
		const grouped: Record<string, SiteContent[]> = {}

		content.forEach(item => {
			if (!grouped[item.section]) {
				grouped[item.section] = []
			}
			grouped[item.section].push(item)
		})

		return grouped
	}
}

/**
 * SEO Metadata Service
 * Handles all SEO metadata operations from PocketBase
 */
export class SeoMetadataService {
	/**
	 * Get SEO metadata for a specific page
	 */
	static async getPageMetadata(page: string): Promise<SeoMetadata | null> {
		const pb = createPocketBase()

		try {
			const filter = `page = "${page}" && is_active = true`
			const records = await pb
				.collection(COLLECTIONS.SEO_METADATA)
				.getList<SeoMetadata>(1, 1, {
					filter,
				})

			return records.items[0] || null
		} catch (error) {
			console.error('Error fetching SEO metadata:', error)
			return null
		}
	}

	/**
	 * Get all SEO metadata
	 */
	static async getAllMetadata(): Promise<SeoMetadata[]> {
		const pb = createPocketBase()

		try {
			const records = await pb
				.collection(COLLECTIONS.SEO_METADATA)
				.getList<SeoMetadata>(1, 100, {
					filter: 'is_active = true',
				})

			return records.items
		} catch (error) {
			console.error('Error fetching all SEO metadata:', error)
			return []
		}
	}
}

/**
 * Social Links Service
 * Handles all social links operations from PocketBase
 */
export class SocialLinksService {
	/**
	 * Get all active social links
	 */
	static async getSocialLinks(): Promise<SocialLink[]> {
		const pb = createPocketBase()

		try {
			const records = await pb
				.collection(COLLECTIONS.SOCIAL_LINKS)
				.getList<SocialLink>(1, 100, {
					filter: 'is_active = true',
					sort: 'order',
				})

			return records.items
		} catch (error) {
			console.error('Error fetching social links:', error)
			return []
		}
	}

	/**
	 * Get social links by platform
	 */
	static async getSocialLinksByPlatform(
		platform: string
	): Promise<SocialLink[]> {
		const pb = createPocketBase()

		try {
			const filter = `platform = "${platform}" && is_active = true`
			const records = await pb
				.collection(COLLECTIONS.SOCIAL_LINKS)
				.getList<SocialLink>(1, 100, {
					filter,
					sort: 'order',
				})

			return records.items
		} catch (error) {
			console.error('Error fetching social links by platform:', error)
			return []
		}
	}
}

/**
 * Wattpad Stats Service
 * Handles all Wattpad statistics operations from PocketBase
 */
export class WattpadStatsService {
	/**
	 * Get current Wattpad stats
	 */
	static async getCurrentStats(): Promise<WattpadStats | null> {
		const pb = createPocketBase()

		try {
			const filter = 'is_active = true'
			const records = await pb
				.collection(COLLECTIONS.WATTPAD_STATS)
				.getList<WattpadStats>(1, 1, {
					filter,
					sort: '-created',
				})

			return records.items[0] || null
		} catch (error) {
			console.error('Error fetching Wattpad stats:', error)
			return null
		}
	}

	/**
	 * Get all Wattpad rankings
	 */
	static async getRankings(): Promise<WattpadRanking[]> {
		const pb = createPocketBase()

		try {
			const records = await pb
				.collection(COLLECTIONS.WATTPAD_RANKINGS)
				.getList<WattpadRanking>(1, 100, {
					filter: 'is_active = true',
					sort: '-date',
				})

			return records.items
		} catch (error) {
			console.error('Error fetching Wattpad rankings:', error)
			return []
		}
	}

	/**
	 * Get rankings by category
	 */
	static async getRankingsByCategory(
		category: string
	): Promise<WattpadRanking[]> {
		const pb = createPocketBase()

		try {
			const filter = `category = "${category}" && is_active = true`
			const records = await pb
				.collection(COLLECTIONS.WATTPAD_RANKINGS)
				.getList<WattpadRanking>(1, 100, {
					filter,
					sort: '-date',
				})

			return records.items
		} catch (error) {
			console.error('Error fetching rankings by category:', error)
			return []
		}
	}
}

/**
 * Site Settings Service
 * Handles all site settings operations from PocketBase
 */
export class SiteSettingsService {
	/**
	 * Get a specific setting by key
	 */
	static async getSetting(key: string): Promise<SiteSetting | null> {
		const pb = createPocketBase()

		try {
			const filter = `key = "${key}" && is_active = true`
			const records = await pb
				.collection(COLLECTIONS.SITE_SETTINGS)
				.getList<SiteSetting>(1, 1, {
					filter,
				})

			return records.items[0] || null
		} catch (error) {
			console.error('Error fetching site setting:', error)
			return null
		}
	}

	/**
	 * Get all active settings
	 */
	static async getAllSettings(): Promise<Record<string, SiteSetting>> {
		const pb = createPocketBase()

		try {
			const records = await pb
				.collection(COLLECTIONS.SITE_SETTINGS)
				.getList<SiteSetting>(1, 100, {
					filter: 'is_active = true',
				})

			const settings: Record<string, SiteSetting> = {}
			records.items.forEach(setting => {
				settings[setting.key] = setting
			})

			return settings
		} catch (error) {
			console.error('Error fetching all site settings:', error)
			return {}
		}
	}

	/**
	 * Get setting value by key
	 */
	static async getSettingValue(key: string): Promise<string | null> {
		const setting = await this.getSetting(key)
		return setting?.value || null
	}
}

/**
 * Main service that combines all services for easy access
 */
export class PocketBaseService {
	static siteContent = SiteContentService
	static seoMetadata = SeoMetadataService
	static socialLinks = SocialLinksService
	static wattpadStats = WattpadStatsService
	static siteSettings = SiteSettingsService
}
