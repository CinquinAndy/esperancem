import { type NextRequest, NextResponse } from 'next/server'

/**
 * Middleware to secure endpoints and prevent external access to sensitive data
 */
export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl

	// Block direct access to admin endpoints from external sources
	if (pathname.startsWith('/api/admin/')) {
		// Check if request is from same origin
		const origin = request.headers.get('origin')
		const host = request.headers.get('host')

		// Allow only same-origin requests or requests with valid admin secret
		const authHeader = request.headers.get('authorization')
		const isAdminRequest = authHeader === `Bearer ${process.env.ADMIN_SECRET}`

		if (!isAdminRequest && origin && origin !== `https://${host}`) {
			return NextResponse.json({ error: 'Access denied' }, { status: 403 })
		}
	}

	// Block access to any remaining PocketBase endpoints (should not exist anymore)
	if (pathname.startsWith('/api/pocketbase/')) {
		return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
	}

	// Add security headers to all responses
	const response = NextResponse.next()

	// Security headers
	response.headers.set('X-Frame-Options', 'DENY')
	response.headers.set('X-Content-Type-Options', 'nosniff')
	response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
	response.headers.set('X-XSS-Protection', '1; mode=block')

	// Content Security Policy
	response.headers.set(
		'Content-Security-Policy',
		"default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.esperancem.fr;"
	)

	return response
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public files (images, etc.)
		 */
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
}
