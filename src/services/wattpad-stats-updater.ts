import * as cheerio from 'cheerio'

import type { BookType } from '@/lib/pocketbase'

import { WattpadStatsService } from './pocketbase'

// Book configuration
export interface BookConfig {
	id: string
	title: string
	type: BookType
	url: string
}

// Stats for a single book
export interface BookStats {
	book: BookType
	parts: string
	reads: string
	readsComplete: string
	votes: string
}

// All books stats
export interface AllBooksStats {
	'au-prix-du-silence': BookStats
	'coeurs-sombres': BookStats
	lastUpdated: number
}

/**
 * Service for updating Wattpad stats for multiple books
 * This service can be used in server-side functions, cron jobs, etc.
 */
export class WattpadStatsUpdater {
	// Cache for in-memory storage (shared across all instances)
	private static cache: {
		lastUpdated: number
		stats: AllBooksStats
	} | null = null

	private static readonly CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours

	// Book configurations
	private static readonly BOOKS: BookConfig[] = [
		{
			id: '368278312',
			title: 'Cœurs sombres',
			type: 'coeurs-sombres',
			url: '/story/368278312-c%C5%93urs-sombres',
		},
		{
			id: '395344686',
			title: 'Au prix du silence',
			type: 'au-prix-du-silence',
			url: '/story/395344686-au-prix-du-silence',
		},
	]

	/**
	 * Get cached stats if still valid
	 */
	static getCachedStats(): AllBooksStats | null {
		if (
			this.cache &&
			Date.now() - this.cache.lastUpdated < this.CACHE_DURATION
		) {
			return this.cache.stats
		}
		return null
	}

	/**
	 * Update cache with new stats
	 */
	static updateCache(stats: AllBooksStats) {
		this.cache = {
			lastUpdated: Date.now(),
			stats,
		}
	}

	/**
	 * Clear cache (useful for testing or manual refresh)
	 */
	static clearCache() {
		this.cache = null
	}

	/**
	 * Parse stats from HTML for a specific book
	 */
	static parseBookStatsFromHTML(
		$: cheerio.CheerioAPI,
		bookConfig: BookConfig
	): BookStats {
		const stats: BookStats = {
			book: bookConfig.type,
			parts: '0',
			reads: '0',
			readsComplete: '0',
			votes: '0',
		}

		// Find the book by its story ID
		const bookElement = $(`[data-story-id="${bookConfig.id}"]`)
		if (bookElement.length === 0) {
			console.warn(`⚠️ Book ${bookConfig.title} not found in HTML`)
			return stats
		}

		// Find the social-meta div within this book's content
		const socialMeta = bookElement.find('.meta.social-meta')
		if (socialMeta.length === 0) {
			console.warn(`⚠️ Social meta not found for ${bookConfig.title}`)
			return stats
		}

		// Extract reads: both displayed text and complete value from title attribute
		const readsSpan = socialMeta.find('.read-count')
		if (readsSpan.length > 0) {
			// Get displayed text (like "145K")
			const readsText = readsSpan.text().trim()
			const readsMatch = readsText.match(/[\d.]+[KMB]?/)
			if (readsMatch) {
				stats.reads = readsMatch[0]
			}

			// Get complete value from title attribute
			const titleAttr = readsSpan.attr('title')
			if (titleAttr) {
				// Extract number from "145,922 Lectures" format
				const readsCompleteMatch = titleAttr.match(/^([\d,]+)/)
				if (readsCompleteMatch) {
					stats.readsComplete = readsCompleteMatch[1].replace(/,/g, '') // Remove commas: "145922"
				}
			}
		}

		// Extract exact votes from data-original-title attribute
		const votesSpan = socialMeta.find('.vote-count')
		if (votesSpan.length > 0) {
			const originalTitle = votesSpan.attr('data-original-title')
			if (originalTitle) {
				// Extract number from "4,716 Votes" format
				const votesMatch = originalTitle.match(/^([\d,]+)/)
				if (votesMatch) {
					stats.votes = votesMatch[1].replace(/,/g, '') // Remove commas: "4716"
				}
			} else {
				// Fallback to displayed text if no data-original-title
				const votesText = votesSpan.text().trim()
				const votesMatch = votesText.match(/[\d.]+[KMB]?/)
				if (votesMatch) {
					stats.votes = votesMatch[0]
				}
			}
		}

		// Extract parts (no tooltip needed, displayed number is exact)
		const partsSpan = socialMeta.find('.part-count')
		if (partsSpan.length > 0) {
			const partsText = partsSpan.text().trim()
			const partsMatch = partsText.match(/\d+/)
			if (partsMatch) {
				stats.parts = partsMatch[0]
			}
		}

		console.info(`📊 Parsed stats for ${bookConfig.title}:`, stats)
		return stats
	}

	/**
	 * Fetch fresh stats from Wattpad website for all books
	 */
	static async fetchWattpadStats(): Promise<AllBooksStats> {
		console.info('🔍 Fetching fresh Wattpad stats for all books...')

		try {
			// Fetch fresh data from Wattpad
			const response = await fetch('https://www.wattpad.com/user/Esperancem', {
				headers: {
					Accept:
						'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
					'Accept-Encoding': 'gzip, deflate, br',
					'Accept-Language': 'en-US,en;q=0.5',
					'Cache-Control': 'no-cache',
					Pragma: 'no-cache',
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
				},
			})

			if (!response.ok) {
				throw new Error(`Failed to fetch Wattpad page: ${response.status}`)
			}

			const html = await response.text()
			const $ = cheerio.load(html)

			// Parse stats for each book
			const allStats: AllBooksStats = {
				'au-prix-du-silence': this.parseBookStatsFromHTML($, this.BOOKS[1]),
				'coeurs-sombres': this.parseBookStatsFromHTML($, this.BOOKS[0]),
				lastUpdated: Date.now(),
			}

			console.info('✅ All books stats fetched from Wattpad:', allStats)
			return allStats
		} catch (error) {
			console.error('❌ Error fetching Wattpad stats:', error)
			throw error
		}
	}

	/**
	 * Get stats with caching support
	 */
	static async getStats(forceRefresh = false): Promise<{
		cached: boolean
		data: AllBooksStats
		error?: string
		success: boolean
	}> {
		// Check cache first (unless forced refresh)
		if (!forceRefresh) {
			const cachedStats = this.getCachedStats()
			if (cachedStats) {
				console.info('📋 Using cached stats')
				return {
					cached: true,
					data: cachedStats,
					success: true,
				}
			}
		}

		try {
			// Fetch fresh stats
			const stats = await this.fetchWattpadStats()

			// Update cache
			this.updateCache(stats)

			return {
				cached: false,
				data: stats,
				success: true,
			}
		} catch (error) {
			console.error('❌ Error getting stats:', error)

			// Return cached data if available, even if stale
			const cachedStats = this.getCachedStats()
			if (cachedStats) {
				return {
					cached: true,
					data: cachedStats,
					error: 'Failed to fetch fresh data, returning cached data',
					success: true,
				}
			}

			return {
				cached: false,
				data: {
					'au-prix-du-silence': {
						book: 'au-prix-du-silence',
						parts: '0',
						reads: '0',
						readsComplete: '0',
						votes: '0',
					},
					'coeurs-sombres': {
						book: 'coeurs-sombres',
						parts: '0',
						reads: '0',
						readsComplete: '0',
						votes: '0',
					},
					lastUpdated: Date.now(),
				},
				error: error instanceof Error ? error.message : 'Unknown error',
				success: false,
			}
		}
	}

	/**
	 * Update stats in PocketBase for a specific book
	 */
	static async updateBookStats(stats: BookStats): Promise<boolean> {
		console.info(`📝 Updating PocketBase with stats for ${stats.book}...`)

		try {
			const updatedStats = await WattpadStatsService.updateBookStats(stats)

			if (!updatedStats) {
				throw new Error(
					`Failed to update stats for ${stats.book} in PocketBase`
				)
			}

			console.info(
				`✅ Stats updated in PocketBase for ${stats.book} successfully`
			)
			return true
		} catch (error) {
			console.error(
				`❌ Error updating PocketBase stats for ${stats.book}:`,
				error
			)
			return false
		}
	}

	/**
	 * Update stats in PocketBase for all books
	 */
	static async updateAllBooksStats(stats: AllBooksStats): Promise<{
		results: Record<BookType, boolean>
		success: boolean
	}> {
		console.info('📝 Updating PocketBase with stats for all books...')

		const results: Record<BookType, boolean> = {
			'au-prix-du-silence': false,
			'coeurs-sombres': false,
		}

		try {
			// Update each book's stats
			results['coeurs-sombres'] = await this.updateBookStats(
				stats['coeurs-sombres']
			)
			results['au-prix-du-silence'] = await this.updateBookStats(
				stats['au-prix-du-silence']
			)

			const allSuccess = Object.values(results).every(result => result)

			if (allSuccess) {
				console.info('✅ All books stats updated in PocketBase successfully')
			} else {
				console.warn('⚠️ Some books failed to update:', results)
			}

			return {
				results,
				success: allSuccess,
			}
		} catch (error) {
			console.error('❌ Error updating all books stats:', error)
			return {
				results,
				success: false,
			}
		}
	}

	/**
	 * Complete update process: fetch from Wattpad and update PocketBase
	 */
	static async performUpdate(): Promise<{
		results: Record<BookType, boolean>
		stats: AllBooksStats
		success: boolean
		timestamp: string
	}> {
		console.info('🚀 Starting Wattpad stats update process for all books...')

		try {
			// Step 1: Fetch stats from Wattpad
			const stats = await this.fetchWattpadStats()

			// Step 2: Update PocketBase for all books
			const updateResults = await this.updateAllBooksStats(stats)

			// Step 3: Update cache
			this.updateCache(stats)

			console.info('🎉 Wattpad stats update completed!')
			console.info('\n📊 Final Stats:')
			console.info(
				`- Cœurs Sombres: ${stats['coeurs-sombres'].reads} reads, ${stats['coeurs-sombres'].votes} votes, ${stats['coeurs-sombres'].parts} parts`
			)
			console.info(
				`- Au Prix du Silence: ${stats['au-prix-du-silence'].reads} reads, ${stats['au-prix-du-silence'].votes} votes, ${stats['au-prix-du-silence'].parts} parts`
			)
			console.info(`- Updated: ${new Date().toLocaleString()}`)

			return {
				results: updateResults.results,
				stats,
				success: updateResults.success,
				timestamp: new Date().toISOString(),
			}
		} catch (error) {
			console.error('\n💥 Error during stats update:', error)
			throw error
		}
	}

	/**
	 * Get stats for a specific book
	 */
	static async getBookStats(
		bookType: BookType,
		forceRefresh = false
	): Promise<BookStats | null> {
		const allStats = await this.getStats(forceRefresh)

		if (allStats.success) {
			return allStats.data[bookType]
		}

		return null
	}

	/**
	 * Trigger Next.js revalidation (if REVALIDATE_SECRET is available)
	 */
	static async triggerRevalidation(): Promise<boolean> {
		console.info('🔄 Triggering Next.js revalidation...')

		try {
			const SITE_URL = process.env.SITE_URL || 'https://esperancem.fr'
			const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET

			if (!REVALIDATE_SECRET) {
				console.warn('⚠️ REVALIDATE_SECRET not set, skipping revalidation')
				return false
			}

			const response = await fetch(`${SITE_URL}/api/revalidate-stats`, {
				headers: {
					Authorization: `Bearer ${REVALIDATE_SECRET}`,
					'Content-Type': 'application/json',
				},
				method: 'POST',
			})

			if (response.ok) {
				console.info('✅ Revalidation triggered successfully')
				return true
			} else {
				console.warn('⚠️ Revalidation failed:', response.status)
				return false
			}
		} catch (error) {
			console.warn('⚠️ Error triggering revalidation:', error)
			return false
		}
	}
}
