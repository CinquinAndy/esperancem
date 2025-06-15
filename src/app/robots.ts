import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
	const baseUrl = 'https://esperance-masson.fr'

	return {
		host: baseUrl,
		rules: [
			{
				allow: '/',
				disallow: ['/api/', '/_next/', '/admin/'],
				userAgent: '*',
			},
			{
				allow: '/',
				disallow: ['/api/', '/admin/'],
				userAgent: 'Googlebot',
			},
		],
		sitemap: `${baseUrl}/sitemap.xml`,
	}
}
