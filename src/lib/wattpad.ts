import * as cheerio from 'cheerio'

interface WattpadStats {
	reads: string
	votes: string
	parts: string
	lastUpdated: number
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
			next: { revalidate: 86400 }, // 24 hours cache
		})

		if (!response.ok) {
			throw new Error(`Failed to fetch Wattpad page: ${response.status}`)
		}

		const html = await response.text()
		const $ = cheerio.load(html)

		let reads = '0'
		let votes = '0'
		let parts = '0'

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
			})
		}

		return {
			lastUpdated: Date.now(),
			parts,
			reads,
			votes,
		}
	} catch (error) {
		console.error('Error fetching Wattpad stats:', error)
		return null
	}
}
