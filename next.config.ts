import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	// Build optimization for images
	experimental: {
		optimizePackageImports: ['lucide-react'],
	},
	images: {
		contentDispositionType: 'attachment',
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
		dangerouslyAllowSVG: true,
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		// Configuration for maximum quality optimization
		formats: ['image/webp', 'image/avif'],
		imageSizes: [
			16, 32, 48, 64, 96, 128, 256, 384, 512, 640, 750, 828, 1080, 1200,
		],
		minimumCacheTTL: 60 * 60 * 24 * 365,
	},
}

export default nextConfig
