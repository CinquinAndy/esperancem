import { NextResponse } from 'next/server'

import { getWattpadStats } from '@/app/actions/wattpad-stats'
import { getContent, getSocialLinks, getWattpadRankings } from '@/lib/content'

// Cache pour l'endpoint de données
const dataCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Optimized endpoint that returns all necessary data in one request
 * This reduces the number of API calls from the frontend
 */
export async function GET() {
	try {
		// Check cache first
		const cacheKey = 'all-data'
		const cached = dataCache.get(cacheKey)
		if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
			return NextResponse.json({
				...cached.data,
				cached: true,
				timestamp: new Date().toISOString(),
			})
		}

		// Fetch all data in parallel
		const [stats, socialLinks, rankings, homeContent, aboutContent] =
			await Promise.all([
				getWattpadStats(),
				getSocialLinks(),
				getWattpadRankings(),
				// Home page content
				Promise.all([
					getContent('home', 'hero', 'main_title'),
					getContent('home', 'hero', 'main_description'),
					getContent('home', 'book', 'book_description'),
					getContent('home', 'book', 'book_title'),
					getContent('home', 'book', 'rankings_title'),
					getContent('home', 'book', 'wattpad_button'),
					getContent('home', 'book', 'wattpad_url'),
				]),
				// About page content
				Promise.all([
					getContent('about', 'hero', 'main_title'),
					getContent('about', 'hero', 'biography'),
					getContent('about', 'book', 'book_title'),
					getContent('about', 'book', 'book_description'),
					getContent('about', 'contact', 'email'),
					getContent('about', 'book', 'book_title_2'),
					getContent('about', 'book', 'book_description_2'),
				]),
			])

		// Structure the response
		const response = {
			content: {
				about: {
					book: {
						book_description: aboutContent[3],
						book_title: aboutContent[2],
					},
					book2: {
						book_description: aboutContent[6],
						book_title: aboutContent[5],
					},
					contact: {
						email: aboutContent[4],
					},
					hero: {
						biography: aboutContent[1],
						main_title: aboutContent[0],
					},
				},
				home: {
					book: {
						book_description: homeContent[2],
						book_title: homeContent[3],
						rankings_title: homeContent[4],
						wattpad_button: homeContent[5],
						wattpad_url: homeContent[6],
					},
					hero: {
						main_description: homeContent[1],
						main_title: homeContent[0],
					},
				},
			},
			rankings,
			socialLinks,
			stats,
			success: true,
			timestamp: new Date().toISOString(),
		}

		// Cache the response
		dataCache.set(cacheKey, { data: response, timestamp: Date.now() })

		return NextResponse.json(response)
	} catch (error) {
		console.error('Error fetching all data:', error)
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : 'Unknown error',
				success: false,
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		)
	}
}

// Cache headers for better performance
export async function HEAD() {
	return new NextResponse(null, {
		headers: {
			'Cache-Control': 's-maxage=300, stale-while-revalidate=600', // 5min cache, 10min stale
		},
	})
}
