import * as cheerio from 'cheerio'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

interface WattpadStats {
	reads: string
	readsComplete: string
	votes: string
	parts: string
	lastUpdated: number
}

// Cache duration: 24 hours in milliseconds
// const CACHE_DURATION = 24 * 60 * 60 * 1000
const CACHE_DURATION = 0

// Simple in-memory cache (in production, consider using Redis or database)
let statsCache: WattpadStats | null = null

export async function GET() {
	console.info('Fetching Wattpad stats')
	try {
		// Check if cache is still valid
		if (statsCache && Date.now() - statsCache.lastUpdated < CACHE_DURATION) {
			console.info('Cached data is still valid')
			return NextResponse.json({
				cached: true,
				data: statsCache,
				success: true,
			})
		}

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

		// Extract stats from the HTML structure
		let reads = '0'
		let readsComplete = '0'
		let votes = '0'
		let parts = '0'

		// Find the meta social-meta div and extract values
		$('.meta.social-meta').each((index, element) => {
			const $element = $(element)

			// Extract reads: both displayed text and complete value from data-original-title
			const readsSpan = $element.find('.read-count')
			console.info('Found read-count spans:', readsSpan.length)

			if (readsSpan.length > 0) {
				// Get displayed text (like "84.7K")
				const readsText = readsSpan.text().trim()
				console.info('Reads text:', readsText)
				const readsMatch = readsText.match(/[\d.]+[KMB]?/)
				if (readsMatch) {
					reads = readsMatch[0]
				}

				// Get complete value from data-original-title attribute
				const originalTitle = readsSpan.attr('data-original-title')
				console.info('Original title attribute:', originalTitle)
				if (originalTitle) {
					// Extract number from "84,758 Lectures" format
					const readsCompleteMatch = originalTitle.match(/^([\d,]+)/)
					if (readsCompleteMatch) {
						readsComplete = readsCompleteMatch[1].replace(/,/g, '') // Remove commas: "84758"
						console.info('Extracted readsComplete:', readsComplete)
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

		// Alternative parsing if the above doesn't work - look for any spans with the expected pattern
		if (
			reads === '0' ||
			votes === '0' ||
			parts === '0' ||
			readsComplete === '0'
		) {
			// Look for elements containing the stats pattern
			$('span').each((index, element) => {
				const $span = $(element)
				const text = $span.text().trim()

				// Check for read count pattern (like "84.2K")
				if (
					text.match(/^\d+\.?\d*[KMB]?$/) &&
					$span.parent().text().includes('Reads')
				) {
					if (reads === '0') reads = text

					// Try to get complete reads from data-original-title if not already found
					if (readsComplete === '0') {
						const originalTitle = $span.attr('data-original-title')
						if (originalTitle) {
							const completeMatch = originalTitle.match(/^([\d,]+)/)
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

		const stats: WattpadStats = {
			lastUpdated: Date.now(),
			parts,
			reads,
			readsComplete,
			votes,
		}
		console.info('stats', stats)

		// Update cache
		statsCache = stats

		// Revalidate pages that use this data for SSG
		revalidatePath('/')
		revalidatePath('/about')

		return NextResponse.json({
			cached: false,
			data: stats,
			success: true,
		})
	} catch (error) {
		console.error('Error fetching Wattpad stats:', error)

		// Return cached data if available, even if stale
		if (statsCache) {
			return NextResponse.json({
				cached: true,
				data: statsCache,
				error: 'Failed to fetch fresh data, returning cached data',
				success: true,
			})
		}

		return NextResponse.json(
			{
				details: error instanceof Error ? error.message : 'Unknown error',
				error: 'Failed to fetch Wattpad statistics',
				success: false,
			},
			{ status: 500 }
		)
	}
}
