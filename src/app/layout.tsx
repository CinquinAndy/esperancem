import { type Metadata } from 'next'
import { Alex_Brush } from 'next/font/google'
import Script from 'next/script'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'
import { TurbulentBackground } from '@/components/TurbulentBackground'
import { getLayoutContent, getSocialLinks } from '@/lib/content'
import { generateLayoutMetadata } from '@/lib/metadata'
import '@/app/globals.css'

const alexBrush = Alex_Brush({
	display: 'swap',
	subsets: ['latin'],
	variable: '--font-alex-brush',
	weight: ['400'],
})

// Generate metadata dynamically with real Wattpad stats
export async function generateMetadata(): Promise<Metadata> {
	return await generateLayoutMetadata()
}

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	// Fetch layout content and social links from PocketBase
	const [layoutContent, socialLinks] = await Promise.all([
		getLayoutContent(),
		getSocialLinks(),
	])

	// Generate JSON-LD schema dynamically
	const jsonLd = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@id': 'https://esperancem.fr/#person',
				'@type': 'Person',
				alternateName: 'esp_masson',
				description:
					layoutContent.siteDescription ||
					'Autrice française de dark romance, connue pour son roman "Cœurs Sombres"',
				gender: 'Female',
				jobTitle: 'Autrice',
				name: layoutContent.siteName || 'Espérance Masson',
				nationality: 'French',
				sameAs: socialLinks.map(link => link.url),
				url: 'https://esperancem.fr',
				worksFor: {
					'@type': 'Organization',
					name: 'Indépendante',
				},
			},
			{
				'@id': 'https://esperancem.fr/#book-coeurs-sombres',
				'@type': 'Book',
				aggregateRating: {
					'@type': 'AggregateRating',
					bestRating: '5',
					ratingCount: '3000',
					ratingValue: '5',
				},
				author: {
					'@id': 'https://esperancem.fr/#person',
				},
				datePublished: '2025',
				description:
					"Roman dark romance suivant Angèle qui tombe sous l'emprise de Lucas Ferrari, un chef de mafia. Entre haine et attirance, leur lutte pour survivre pourrait bien les mener à leur perte.",
				genre: ['Dark Romance', 'Romance', 'Fiction'],
				inLanguage: 'fr-FR',
				keywords:
					'dark romance, enemies to lovers, mafia, romance française, Wattpad',
				name: 'Cœurs Sombres',
				publisher: {
					'@type': 'Organization',
					name: 'Wattpad',
					url: 'https://www.wattpad.com',
				},
				url: 'https://www.wattpad.com/story/368278312-c%C5%93urs-sombres',
			},
			{
				'@id': 'https://esperancem.fr/#website',
				'@type': 'WebSite',
				description: `Site officiel de ${layoutContent.siteName || 'Espérance Masson'}, ${layoutContent.siteDescription || 'autrice de dark romance'}`,
				inLanguage: 'fr-FR',
				name: `${layoutContent.siteName || 'Espérance Masson'} - Site Officiel`,
				potentialAction: {
					'@type': 'SearchAction',
					'query-input': 'required name=search_term_string',
					target: 'https://esperancem.fr/?s={search_term_string}',
				},
				publisher: {
					'@id': 'https://esperancem.fr/#person',
				},
				url: 'https://esperancem.fr',
			},
		],
	}

	return (
		<html lang='fr' className={`h-full antialiased ${alexBrush.variable}`}>
			<head>
				<script
					type='application/ld+json'
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(jsonLd),
					}}
				/>
			</head>
			<body className='flex h-full'>
				<Script
					src='https://umami.wadefade.fr/script.js'
					data-website-id='aee78575-7896-44d1-adf5-fedd348d5210'
					strategy='afterInteractive'
				/>
				<TurbulentBackground />
				<Providers>
					<div className='flex w-full'>
						<Layout>{children}</Layout>
					</div>
				</Providers>
			</body>
		</html>
	)
}
