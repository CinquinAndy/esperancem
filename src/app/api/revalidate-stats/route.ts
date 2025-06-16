import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

// This endpoint can be called by a cron job or webhook to revalidate the stats
export async function POST(request: NextRequest) {
	try {
		const authHeader = request.headers.get('authorization')

		// Simple auth check (you should use environment variable)
		if (authHeader !== `Bearer ${process.env.REVALIDATE_SECRET}`) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
		}

		// Revalidate all pages that use Wattpad stats
		revalidatePath('/')
		revalidatePath('/about')

		return NextResponse.json({
			message: 'Stats revalidated successfully',
			revalidated: true,
			timestamp: new Date().toISOString(),
		})
	} catch (error) {
		console.error('Error revalidating stats:', error)
		return NextResponse.json(
			{ message: 'Error revalidating', revalidated: false },
			{ status: 500 }
		)
	}
}

// Allow GET for manual testing
export async function GET() {
	return NextResponse.json({
		message: 'Stats revalidation endpoint',
		usage: 'Send POST request with Bearer token to revalidate',
	})
}
