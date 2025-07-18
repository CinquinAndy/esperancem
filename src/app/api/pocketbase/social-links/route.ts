import { NextResponse } from 'next/server'

import { SocialLinksService } from '@/services/pocketbase'

/**
 * GET /api/pocketbase/social-links
 * Fetch social links from PocketBase
 */
export async function GET() {
	try {
		const socialLinks = await SocialLinksService.getSocialLinks()

		return NextResponse.json(socialLinks)
	} catch (error) {
		console.error('Error in social links API route:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
