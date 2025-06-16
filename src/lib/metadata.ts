import { type Metadata } from 'next'

import { fetchWattpadStats, formatWattpadStat } from './wattpad'

// Cache pour éviter de refetch les stats à chaque génération de métadonnées
let cachedStats: Awaited<ReturnType<typeof fetchWattpadStats>> | null = null
let cacheTimestamp = 0

async function getWattpadStats() {
	const now = Date.now()
	const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 heures

	if (!cachedStats || now - cacheTimestamp > CACHE_DURATION) {
		cachedStats = await fetchWattpadStats()
		cacheTimestamp = now
	}

	return cachedStats
}

export async function generateHomeMetadata(): Promise<Metadata> {
	const stats = await getWattpadStats()
	const formattedReads = stats?.reads ? formatWattpadStat(stats.reads) : '85k+'

	return {
		description: `Découvrez l'univers sombre et passionné d'Espérance Masson. Lisez "Cœurs Sombres", son premier roman dark romance sur Wattpad qui captive plus de ${formattedReads.replace('+', '')} lecteurs. Plongez dans une histoire d'enemies to lovers avec Lucas Ferrari et Angèle.`,
		keywords: [
			'Cœurs Sombres Wattpad',
			'Lucas Ferrari',
			'Angèle roman',
			'dark romance française',
			'enemies to lovers français',
			'mafia romance Wattpad',
			'roman passion sombre',
			'autrice française Wattpad',
			'livre gratuit Wattpad',
			'romance française 2025',
		],
		openGraph: {
			description:
				'Plongez dans l\'univers dark romance d\'Espérance Masson. "Cœurs Sombres" - Son premier roman dark romance sur Wattpad.',
			title: 'Espérance Masson - Autrice Dark Romance | Cœurs Sombres Wattpad',
			url: 'https://esperancem.fr',
		},
		title: 'Accueil - Espérance Masson | Autrice de Cœurs Sombres',
	}
}

export async function generateLayoutMetadata(): Promise<Metadata> {
	const stats = await getWattpadStats()
	const formattedReads = stats?.reads ? formatWattpadStat(stats.reads) : '85k+'

	return {
		alternates: {
			canonical: 'https://esperancem.fr',
			languages: {
				'fr-FR': 'https://esperancem.fr',
			},
		},
		authors: [{ name: 'Espérance Masson' }],
		category: 'Literature & Fiction',
		classification: 'Dark Romance, Literature',
		creator: 'Espérance Masson',
		description: `Site officiel d'Espérance Masson, autrice française de dark romance. Découvrez "Cœurs Sombres", son roman #1 sur Wattpad avec plus de ${formattedReads.replace('+', '')} lectures. Dark romance, enemies to lovers, mafia romance.`,
		keywords: [
			'Espérance Masson',
			'autrice française',
			'dark romance',
			'Cœurs Sombres',
			'Wattpad',
			'roman français',
			'enemies to lovers',
			'mafia romance',
			'romance sombre',
			'livre français',
			'auteure dark romance',
			'esp_masson',
			'Lucas Ferrari',
			'Angèle',
			'romance française',
			'littérature française contemporaine',
		],
		metadataBase: new URL('https://esperancem.fr'),
		openGraph: {
			description: `Découvrez l'univers d'Espérance Masson, autrice française de dark romance. "Cœurs Sombres" - sur Wattpad avec plus de ${formattedReads.replace('+', '')} lectures.`,
			images: [
				{
					alt: 'Espérance Masson - Autrice de Cœurs Sombres',
					height: 630,
					url: '/images/og-image.jpg',
					width: 1200,
				},
			],
			locale: 'fr_FR',
			siteName: 'Espérance Masson - Autrice',
			title: 'Espérance Masson - Autrice de Dark Romance | Cœurs Sombres',
			type: 'website',
			url: 'https://esperancem.fr',
		},
		publisher: 'Espérance Masson',
		robots: {
			follow: true,
			googleBot: {
				follow: true,
				index: true,
				'max-image-preview': 'large',
				'max-snippet': -1,
				'max-video-preview': -1,
				noimageindex: false,
			},
			index: true,
		},
		title: {
			default: 'Espérance Masson - Autrice de Dark Romance | Cœurs Sombres',
			template: '%s | Espérance Masson - Autrice',
		},
		twitter: {
			card: 'summary_large_image',
			creator: '@esp_masson',
			description: `Découvrez l'univers d'Espérance Masson, autrice française de dark romance. "Cœurs Sombres" - #1 sur Wattpad avec plus de ${formattedReads.replace('+', '')} lectures.`,
			images: ['/images/og-image.jpg'],
			site: '@esp_masson',
			title: 'Espérance Masson - Autrice de Dark Romance | Cœurs Sombres',
		},
	}
}
