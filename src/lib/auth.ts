/**
 * Centralized authentication utilities
 * Eliminates duplication of auth logic across API routes
 */

export interface AuthResult {
	authorized: boolean
	error?: string
}

/**
 * Verify Vercel cron job authentication
 */
export function verifyVercelCron(request: Request): AuthResult {
	const isVercelCron = request.headers.get('x-vercel-cron') === '1'

	if (isVercelCron) {
		return { authorized: true }
	}

	return {
		authorized: false,
		error: 'Not a Vercel cron job',
	}
}

/**
 * Verify Bearer token authentication
 */
export function verifyBearerToken(
	request: Request,
	secretEnvVar: string,
	secretName: string
): AuthResult {
	const authHeader = request.headers.get('authorization')
	const secret = process.env[secretEnvVar]

	if (!secret) {
		return {
			authorized: false,
			error: `${secretName} not configured`,
		}
	}

	if (authHeader !== `Bearer ${secret}`) {
		return {
			authorized: false,
			error: 'Invalid authorization header',
		}
	}

	return { authorized: true }
}

/**
 * Verify admin authentication
 */
export function verifyAdminAuth(request: Request): AuthResult {
	return verifyBearerToken(request, 'ADMIN_SECRET', 'Admin secret')
}

/**
 * Verify revalidation authentication
 */
export function verifyRevalidationAuth(request: Request): AuthResult {
	return verifyBearerToken(request, 'REVALIDATE_SECRET', 'Revalidation secret')
}

/**
 * Verify cron job authentication (supports both Vercel cron and manual with secret)
 */
export function verifyCronAuth(request: Request): AuthResult {
	// First check if it's a Vercel cron job
	const vercelResult = verifyVercelCron(request)
	if (vercelResult.authorized) {
		return vercelResult
	}

	// If not Vercel cron, check for manual authentication
	return verifyRevalidationAuth(request)
}
