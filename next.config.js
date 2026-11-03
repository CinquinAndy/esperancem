/** @type {import('next').NextConfig} */
const nextConfig = {
	// Enable compression
	compress: true,
	// Enable instrumentation for cron jobs
	experimental: {
		// Enable instrumentation hook for server startup tasks (like cron jobs)
		instrumentationHook: true,
		// Enable optimized fetch caching
		optimizePackageImports: ['@/lib', '@/services'],
		// Secure Server Actions configuration
		serverActions: {
			// Only allow same-origin requests for security
			allowedOrigins: [],
			// Limit body size to prevent abuse
			bodySizeLimit: '1mb',
		},
		// Optimize ISR performance
		staleTimes: {
			dynamic: 0,
			static: 3600, // 1 hour cache for static content (was 3 minutes)
		},
	},
	// Generate static exports for better SEO
	generateEtags: true,
	// Headers for better caching
	async headers() {
		return [
			{
				headers: [
					{
						key: 'X-Frame-Options',
						value: 'DENY',
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
					{
						key: 'Referrer-Policy',
						value: 'origin-when-cross-origin',
					},
				],
				source: '/(.*)',
			},
			{
				headers: [
					{
						key: 'Cache-Control',
						value: 's-maxage=21600, stale-while-revalidate=86400', // 6h cache, 1 day stale
					},
				],
				source: '/api/wattpad-stats',
			},
			{
				headers: [
					{
						key: 'Cache-Control',
						value: 's-maxage=3600, stale-while-revalidate=7200', // 1h cache, 2h stale
					},
				],
				source: '/api/health',
			},
			{
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=3600, s-maxage=3600', // 1h cache
					},
				],
				source: '/api/revalidate-stats',
			},
		]
	},
	// Optimize images for better performance
	images: {
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		formats: ['image/webp', 'image/avif'],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		minimumCacheTTL: 86400, // 24 hours cache for images
		// Optimize image loading
		unoptimized: false,
	},
	// Output static files for better CDN caching
	output: 'standalone',
	// Enable power optimizations
	poweredByHeader: false,
	// Optimize for production
	productionBrowserSourceMaps: false,
	// Enable React strict mode
	reactStrictMode: true,
	// Configure ISR settings
	async rewrites() {
		return [
			{
				destination: '/api/revalidate-stats',
				source: '/api/revalidate-stats',
			},
		]
	},
	// Server external packages (moved from experimental)
	serverExternalPackages: ['@pocketbase/js'],
}

module.exports = nextConfig
