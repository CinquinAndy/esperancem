/** @type {import('next').NextConfig} */
const nextConfig = {
	// Enable compression
	compress: true,
	experimental: {
		// Enable static regeneration for better performance
		staleTimes: {
			dynamic: 0,
			static: 180, // 3 minutes cache for static content
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
						value: 's-maxage=86400, stale-while-revalidate=604800', // 24h cache, 1 week stale
					},
				],
				source: '/api/wattpad-stats',
			},
		]
	},
	// Optimize images for better performance
	images: {
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		formats: ['image/webp'],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		minimumCacheTTL: 86400, // 24 hours cache for images
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
}

module.exports = nextConfig
