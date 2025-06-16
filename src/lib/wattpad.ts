import * as cheerio from 'cheerio'

interface WattpadStats {
	reads: string
	readsComplete: string
	votes: string
	parts: string
	lastUpdated: number
}

// Utility function to format stats value, rounding down to nearest hundred
export function formatWattpadStat(value: string): string {
	if (!value || value === '0') return '85k+'

	// Convert value to number (handle K, M suffixes)
	const getNumericValue = (val: string): number => {
		const num = parseFloat(val.replace(/[kmb]/i, ''))
		const suffix = val.slice(-1).toLowerCase()

		switch (suffix) {
			case 'k':
				return num * 1000
			case 'm':
				return num * 1000000
			case 'b':
				return num * 1000000000
			default:
				return parseFloat(val) || 0
		}
	}

	const numericValue = getNumericValue(value)

	// Round down to nearest hundred
	const roundedDown = Math.floor(numericValue / 100) * 100

	// Format back to K/M notation
	if (roundedDown >= 1000000) {
		const millions = Math.floor(roundedDown / 1000000)
		const thousands = Math.floor((roundedDown % 1000000) / 1000)
		return thousands > 0
			? `${millions}.${Math.floor(thousands / 100)}M+`
			: `${millions}M+`
	} else if (roundedDown >= 1000) {
		const thousands = Math.floor(roundedDown / 1000)
		const hundreds = Math.floor((roundedDown % 1000) / 100)
		return hundreds > 0 ? `${thousands}.${hundreds}k+` : `${thousands}k+`
	} else {
		return `${roundedDown}+`
	}
}

// Utility function to display exact stats for landing page
export function formatWattpadStatExact(value: string): string {
	if (!value || value === '0') return '85,000'

	// If value is already a plain number (exact from API), format it directly
	const plainNumber = parseInt(value.replace(/[^\d]/g, ''))
	if (!isNaN(plainNumber) && plainNumber > 0) {
		return plainNumber.toLocaleString('fr-FR')
	}

	// Convert value to number (handle K, M suffixes as fallback)
	const getNumericValue = (val: string): number => {
		const num = parseFloat(val.replace(/[kmb]/i, ''))
		const suffix = val.slice(-1).toLowerCase()

		switch (suffix) {
			case 'k':
				return num * 1000
			case 'm':
				return num * 1000000
			case 'b':
				return num * 1000000000
			default:
				return parseFloat(val) || 0
		}
	}

	const numericValue = getNumericValue(value)

	// Return exact number with commas
	return numericValue.toLocaleString('fr-FR')
}

export async function fetchWattpadStats(): Promise<WattpadStats | null> {
	try {
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
			// ISR: revalidate every 24 hours
			next: { revalidate: 86400 },
		})

		if (!response.ok) {
			throw new Error(`Failed to fetch Wattpad page: ${response.status}`)
		}

		const html = await response.text()
		const $ = cheerio.load(html)

		let reads = '0'
		let votes = '0'
		let parts = '0'
		let readsComplete = '0'

		// Find the meta social-meta div and extract values
		$('.meta.social-meta').each((index, element) => {
			const $element = $(element)

			// Extract reads
			const readsSpan = $element.find('.read-count')
			if (readsSpan.length > 0) {
				const readsText = readsSpan.text().trim()
				const readsMatch = readsText.match(/[\d.]+[KMB]?/)
				if (readsMatch) {
					reads = readsMatch[0]
				}
			}

			// Extract votes
			const votesSpan = $element.find('.vote-count')
			if (votesSpan.length > 0) {
				const votesText = votesSpan.text().trim()
				const votesMatch = votesText.match(/[\d.]+[KMB]?/)
				if (votesMatch) {
					votes = votesMatch[0]
				}
			}

			// Extract parts
			const partsSpan = $element.find('.part-count')
			if (partsSpan.length > 0) {
				const partsText = partsSpan.text().trim()
				const partsMatch = partsText.match(/\d+/)
				if (partsMatch) {
					parts = partsMatch[0]
				}
			}

			// Extract readsComplete
			const readsCompleteSpan = $element.find('.read-count')
			if (readsCompleteSpan.length > 0) {
				const readsCompleteText = readsCompleteSpan.text().trim()
				const readsCompleteMatch = readsCompleteText.match(/[\d.]+[KMB]?/)
				if (readsCompleteMatch) {
					readsComplete = readsCompleteMatch[0]
				}
			}
		})

		// Alternative parsing if the above doesn't work
		if (reads === '0' || votes === '0' || parts === '0') {
			$('span').each((index, element) => {
				const text = $(element).text().trim()

				if (
					text.match(/^\d+\.?\d*[KMB]?$/) &&
					$(element).parent().text().includes('Reads')
				) {
					reads = text
				}

				if (
					text.match(/^\d+\.?\d*[KMB]?$/) &&
					$(element).parent().text().includes('Votes')
				) {
					votes = text
				}

				if (
					text.match(/^\d+$/) &&
					$(element).siblings().find('.fa-list').length > 0
				) {
					parts = text
				}

				if (
					text.match(/^\d+$/) &&
					$(element).siblings().find('.fa-book').length > 0
				) {
					readsComplete = text
				}
			})
		}

		return {
			lastUpdated: Date.now(),
			parts,
			reads,
			readsComplete,
			votes,
		}
	} catch (error) {
		console.error('Error fetching Wattpad stats:', error)
		return null
	}
}
