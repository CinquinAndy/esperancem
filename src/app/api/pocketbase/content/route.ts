import { NextRequest, NextResponse } from 'next/server'

import { SiteContentService } from '@/services/pocketbase'

/**
 * GET /api/pocketbase/content
 * Fetch site content from PocketBase
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const page = searchParams.get('page')
		const section = searchParams.get('section')

		if (!page) {
			return NextResponse.json(
				{ error: 'Page parameter is required' },
				{ status: 400 }
			)
		}

		const content = await SiteContentService.getContent(
			page,
			section || undefined
		)

		return NextResponse.json(content)
	} catch (error) {
		console.error('Error in content API route:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
