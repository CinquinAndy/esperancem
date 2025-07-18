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
 * Script to update Wattpad stats in PocketBase using the existing crawling system
 * Run with: PB_URL=https://api.esperancem.fr PB_TOKEN=your_token node scripts/update-wattpad-stats.mjs
 */

async function fetchWattpadStats() {
	console.log('🔍 Fetching Wattpad stats from website...')

	try {
		// Fetch fresh data from Wattpad using the same logic as the API
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

		// Extract stats from the HTML structure (same logic as API)
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

		const stats = {
			reads,
			readsComplete,
			votes,
			parts,
			lastUpdated: Date.now(),
		}

		console.log('✅ Stats fetched successfully:', stats)
		return stats
	} catch (error) {
		console.error('❌ Error fetching Wattpad stats:', error)
		throw error
	}
}

async function updatePocketBaseStats(stats) {
	console.log('📝 Updating PocketBase with new stats...')

	const pb = createPocketBase()

	try {
		// Check if we already have stats in PocketBase
		const existingStats = await pb.collection('wattpad_stats').getList(1, 1, {
			filter: 'is_active = true',
			sort: '-created',
		})

		const statsData = {
			reads: stats.reads,
			readsComplete: stats.readsComplete,
			votes: stats.votes,
			parts: stats.parts,
			is_active: true,
		}

		if (existingStats.items.length > 0) {
			// Update existing record
			const existingRecord = existingStats.items[0]
			console.log('🔄 Updating existing stats record...')

			await pb.collection('wattpad_stats').update(existingRecord.id, statsData)
			console.log('✅ Stats updated successfully')
		} else {
			// Create new record
			console.log('🆕 Creating new stats record...')

			await pb.collection('wattpad_stats').create(statsData)
			console.log('✅ Stats created successfully')
		}

		return true
	} catch (error) {
		console.error('❌ Error updating PocketBase stats:', error)
		throw error
	}
}

async function triggerRevalidation() {
	console.log('🔄 Triggering Next.js revalidation...')

	try {
		const SITE_URL = process.env.SITE_URL || 'https://esperancem.fr'
		const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET

		if (!REVALIDATE_SECRET) {
			console.warn('⚠️ REVALIDATE_SECRET not set, skipping revalidation')
			return
		}

		const response = await fetch(`${SITE_URL}/api/revalidate-stats`, {
			headers: {
				Authorization: `Bearer ${REVALIDATE_SECRET}`,
				'Content-Type': 'application/json',
			},
			method: 'POST',
		})

		if (response.ok) {
			console.log('✅ Revalidation triggered successfully')
		} else {
			console.warn('⚠️ Revalidation failed:', response.status)
		}
	} catch (error) {
		console.warn('⚠️ Error triggering revalidation:', error.message)
	}
}

async function updateWattpadStats() {
	console.log('🚀 Starting Wattpad stats update process...\n')

	try {
		// Step 1: Fetch stats from Wattpad
		const stats = await fetchWattpadStats()

		// Step 2: Update PocketBase
		await updatePocketBaseStats(stats)

		// Step 3: Trigger Next.js revalidation
		await triggerRevalidation()

		console.log('\n🎉 Wattpad stats update completed successfully!')
		console.log('\n📊 Final Stats:')
		console.log(`- Reads: ${stats.reads}`)
		console.log(`- Reads Complete: ${stats.readsComplete}`)
		console.log(`- Votes: ${stats.votes}`)
		console.log(`- Parts: ${stats.parts}`)
		console.log(`- Updated: ${new Date(stats.lastUpdated).toLocaleString()}`)
	} catch (error) {
		console.error('\n💥 Error during stats update:', error)
		process.exit(1)
	}
}

// Run the script
updateWattpadStats()
