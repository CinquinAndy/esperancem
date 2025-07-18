import { NextRequest, NextResponse } from 'next/server'

import { SeoMetadataService } from '@/services/pocketbase'

/**
 * GET /api/pocketbase/seo
 * Fetch SEO metadata from PocketBase
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const page = searchParams.get('page')

		if (!page) {
			return NextResponse.json(
				{ error: 'Page parameter is required' },
				{ status: 400 }
			)
		}

		const metadata = await SeoMetadataService.getPageMetadata(page)

		return NextResponse.json(metadata)
	} catch (error) {
		console.error('Error in SEO API route:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
