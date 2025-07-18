import * as cheerio from 'cheerio'
import PocketBase from 'pocketbase'

// PocketBase server URL - should be in environment variables
const POCKETBASE_URL = process.env.PB_URL || 'http://127.0.0.1:8090'
const PB_TOKEN = process.env.PB_TOKEN

// Create PocketBase instance for server-side operations
function createPocketBase() {
	const pb = new PocketBase(POCKETBASE_URL)

	// Authenticate with admin token if available
	if (PB_TOKEN) {
		pb.authStore.save(PB_TOKEN, null)
	}

	return pb
}

/**
 * Service for updating Wattpad stats directly without API routes
 * This service can be used in server-side functions, cron jobs, etc.
 */
export class WattpadStatsUpdater {
	/**
	 * Fetch fresh stats from Wattpad website
	 */
	static async fetchWattpadStats() {
		console.info('🔍 Fetching fresh Wattpad stats...')

		try {
			// Fetch fresh data from Wattpad using the same logic as the original API
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

			// Extract stats from the HTML structure (same logic as original API)
			let reads = '0'
			let readsComplete = '0'
			let votes = '0'
			let parts = '0'

			// Find the meta social-meta div and extract values
			$('.meta.social-meta').each((index, element) => {
				const $element = $(element)

				// Extract reads: both displayed text and complete value from title attribute
				const readsSpan = $element.find('.read-count')
				if (readsSpan.length > 0) {
					// Get displayed text (like "84.7K")
					const readsText = readsSpan.text().trim()
					const readsMatch = readsText.match(/[\d.]+[KMB]?/)
					if (readsMatch) {
						reads = readsMatch[0]
					}

					// Get complete value from title attribute
					const titleAttr = readsSpan.attr('title')
					if (titleAttr) {
						// Extract number from "84,794 Reads" format
						const readsCompleteMatch = titleAttr.match(/^([\d,]+)/)
						if (readsCompleteMatch) {
							readsComplete = readsCompleteMatch[1].replace(/,/g, '') // Remove commas: "84794"
						}
					}
				}

				// Extract exact votes from data-original-title attribute
				const votesSpan = $element.find('.vote-count')
				if (votesSpan.length > 0) {
					const originalTitle = votesSpan.attr('data-original-title')
					if (originalTitle) {
						// Extract number from "2,650 Votes" format
						const votesMatch = originalTitle.match(/^([\d,]+)/)
						if (votesMatch) {
							votes = votesMatch[1].replace(/,/g, '') // Remove commas: "2650"
						}
					} else {
						// Fallback to displayed text if no data-original-title
						const votesText = votesSpan.text().trim()
						const votesMatch = votesText.match(/[\d.]+[KMB]?/)
						if (votesMatch) {
							votes = votesMatch[0]
						}
					}
				}

				// Extract parts (no tooltip needed, displayed number is exact)
				const partsSpan = $element.find('.part-count')
				if (partsSpan.length > 0) {
					const partsText = partsSpan.text().trim()
					const partsMatch = partsText.match(/\d+/)
					if (partsMatch) {
						parts = partsMatch[0]
					}
				}
			})

			// Alternative parsing if the above doesn't work
			if (
				reads === '0' ||
				votes === '0' ||
				parts === '0' ||
				readsComplete === '0'
			) {
				$('span').each((index, element) => {
					const $span = $(element)
					const text = $span.text().trim()

					// Check for read count pattern (like "84.2K")
					if (
						text.match(/^\d+\.?\d*[KMB]?$/) &&
						$span.parent().text().includes('Reads')
					) {
						if (reads === '0') reads = text

						// Try to get complete reads from title attribute if not already found
						if (readsComplete === '0') {
							const titleAttr = $span.attr('title')
							if (titleAttr) {
								const completeMatch = titleAttr.match(/^([\d,]+)/)
								if (completeMatch) {
									readsComplete = completeMatch[1].replace(/,/g, '')
								}
							}
						}
					}

					// Check for vote count pattern
					if (
						text.match(/^\d+\.?\d*[KMB]?$/) &&
						$span.parent().text().includes('Votes')
					) {
						votes = text
					}

					// Check for parts count pattern (just numbers)
					if (
						text.match(/^\d+$/) &&
						$span.siblings().find('.fa-list').length > 0
					) {
						parts = text
					}
				})
			}

			const fetchedStats = {
				parts,
				reads,
				readsComplete,
				votes,
			}

			console.info('✅ Stats fetched from Wattpad:', fetchedStats)
			return fetchedStats
		} catch (error) {
			console.error('❌ Error fetching Wattpad stats:', error)
			throw error
		}
	}

	/**
	 * Update stats in PocketBase
	 */
	static async updateStats(stats) {
		console.info('📝 Updating PocketBase with new stats...')

		const pb = createPocketBase()

		try {
			// Check if we already have stats in PocketBase
			const existingStats = await pb.collection('wattpad_stats').getList(1, 1, {
				filter: 'is_active = true',
				sort: '-created',
			})

			const statsData = {
				is_active: true,
				parts: stats.parts,
				reads: stats.reads,
				reads_complete: stats.readsComplete,
				votes: stats.votes,
			}

			if (existingStats.items.length > 0) {
				// Update existing record
				const existingRecord = existingStats.items[0]
				console.info('🔄 Updating existing stats record...')

				const updatedRecord = await pb
					.collection('wattpad_stats')
					.update(existingRecord.id, statsData)
				console.info('✅ Stats updated successfully')
				return updatedRecord
			} else {
				// Create new record
				console.info('🆕 Creating new stats record...')

				const newRecord = await pb.collection('wattpad_stats').create(statsData)
				console.info('✅ Stats created successfully')
				return newRecord
			}
		} catch (error) {
			console.error('❌ Error updating PocketBase stats:', error)
			throw error
		}
	}

	/**
	 * Complete update process: fetch from Wattpad and update PocketBase
	 */
	static async performUpdate() {
		console.info('🚀 Starting Wattpad stats update process...')

		try {
			// Step 1: Fetch stats from Wattpad
			const stats = await this.fetchWattpadStats()

			// Step 2: Update PocketBase
			const updatedStats = await this.updateStats(stats)

			console.info('🎉 Wattpad stats update completed successfully!')
			console.info('\n📊 Final Stats:')
			console.info(`- Reads: ${stats.reads}`)
			console.info(`- Reads Complete: ${stats.readsComplete}`)
			console.info(`- Votes: ${stats.votes}`)
			console.info(`- Parts: ${stats.parts}`)
			console.info(`- Updated: ${new Date().toLocaleString()}`)

			return {
				success: true,
				stats: updatedStats,
				timestamp: new Date().toISOString(),
			}
		} catch (error) {
			console.error('\n💥 Error during stats update:', error)
			throw error
		}
	}

	/**
	 * Trigger Next.js revalidation (if REVALIDATE_SECRET is available)
	 */
	static async triggerRevalidation() {
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
