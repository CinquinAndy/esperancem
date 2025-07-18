import { NextResponse } from 'next/server'

import { getSystemHealth, validateEnvironment } from '@/lib/utils/internal'

/**
 * Health check endpoint for monitoring
 * Returns system health status without sensitive information
 */
export async function GET() {
	try {
		const health = await getSystemHealth()
		const env = validateEnvironment()

		return NextResponse.json({
			environment: {
				configured: env.configured,
				total: env.total,
				valid: env.valid,
			},
			services: health.services,
			status: health.healthy ? 'healthy' : 'unhealthy',
			timestamp: health.timestamp,
		})
	} catch {
		return NextResponse.json(
			{
				error: 'Health check failed',
				status: 'error',
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		)
	}
}
