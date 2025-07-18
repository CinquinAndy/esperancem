import { NextResponse } from 'next/server'

import { SiteSettingsService } from '@/services/pocketbase'

/**
 * GET /api/pocketbase/settings
 * Fetch site settings from PocketBase
 */
export async function GET() {
	try {
		const settings = await SiteSettingsService.getAllSettings()

		return NextResponse.json(settings)
	} catch (error) {
		console.error('Error in settings API route:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
