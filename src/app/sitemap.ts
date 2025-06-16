import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = 'https://esperancem.fr'
	const currentDate = new Date()

	return [
		{
			changeFrequency: 'weekly',
			lastModified: currentDate,
			priority: 1,
			url: baseUrl,
		},
		{
			changeFrequency: 'monthly',
			lastModified: currentDate,
			priority: 0.8,
			url: `${baseUrl}/about`,
		},
	]
}
