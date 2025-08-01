import {
	createPocketBase,
	COLLECTIONS,
	type SiteContent,
	type SeoMetadata,
	type SocialLink,
	type WattpadStats,
	type WattpadRanking,
	type SiteSetting,
	type BookType,
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
	 * Get current Wattpad stats for a specific book
	 */
	static async getCurrentStats(book?: BookType): Promise<WattpadStats | null> {
		const pb = createPocketBase()

		try {
			let filter = 'is_active = true'
			if (book) {
				filter += ` && book = "${book}"`
			}

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
	 * Get current stats for all books
	 */
	static async getAllBooksStats(): Promise<
		Record<BookType, WattpadStats | null>
	> {
		const pb = createPocketBase()

		try {
			const records = await pb
				.collection(COLLECTIONS.WATTPAD_STATS)
				.getList<WattpadStats>(1, 100, {
					filter: 'is_active = true',
					sort: '-created',
				})

			const stats: Record<BookType, WattpadStats | null> = {
				'au-prix-du-silence': null,
				'coeurs-sombres': null,
			}

			// Group by book and get the most recent for each
			const bookGroups: Record<BookType, WattpadStats[]> = {
				'au-prix-du-silence': [],
				'coeurs-sombres': [],
			}

			records.items.forEach(record => {
				if (record.book && bookGroups[record.book]) {
					bookGroups[record.book].push(record)
				}
			})

			// Get the most recent for each book
			Object.keys(bookGroups).forEach(bookType => {
				const bookStats = bookGroups[bookType as BookType]
				if (bookStats.length > 0) {
					// Sort by created date and take the most recent
					bookStats.sort(
						(a, b) =>
							new Date(b.created).getTime() - new Date(a.created).getTime()
					)
					stats[bookType as BookType] = bookStats[0]
				}
			})

			return stats
		} catch (error) {
			console.error('Error fetching all books stats:', error)
			return {
				'au-prix-du-silence': null,
				'coeurs-sombres': null,
			}
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

	/**
	 * Update or create Wattpad stats for a specific book
	 */
	static async updateBookStats(stats: {
		book: BookType
		reads: string
		readsComplete: string
		votes: string
		parts: string
	}): Promise<WattpadStats | null> {
		const pb = createPocketBase()

		try {
			// Check if we already have stats for this book in PocketBase
			const existingStats = await pb
				.collection(COLLECTIONS.WATTPAD_STATS)
				.getList<WattpadStats>(1, 1, {
					filter: `is_active = true && book = "${stats.book}"`,
					sort: '-created',
				})

			const statsData = {
				book: stats.book,
				is_active: true,
				parts: stats.parts,
				reads: stats.reads,
				reads_complete: stats.readsComplete,
				votes: stats.votes,
			}

			if (existingStats.items.length > 0) {
				// Update existing record
				const existingRecord = existingStats.items[0]
				const updatedRecord = await pb
					.collection(COLLECTIONS.WATTPAD_STATS)
					.update<WattpadStats>(existingRecord.id, statsData)
				return updatedRecord
			} else {
				// Create new record
				const newRecord = await pb
					.collection(COLLECTIONS.WATTPAD_STATS)
					.create<WattpadStats>(statsData)
				return newRecord
			}
		} catch (error) {
			console.error('Error updating Wattpad stats:', error)
			return null
		}
	}

	/**
	 * Update or create Wattpad stats (legacy method for backward compatibility)
	 */
	static async updateStats(stats: {
		reads: string
		readsComplete: string
		votes: string
		parts: string
	}): Promise<WattpadStats | null> {
		// Default to 'coeurs-sombres' for backward compatibility
		return this.updateBookStats({
			book: 'coeurs-sombres',
			...stats,
		})
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
