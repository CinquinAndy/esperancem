import { type Metadata } from 'next'
import { Alex_Brush } from 'next/font/google'
import Script from 'next/script'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'
import { TurbulentBackground } from '@/components/TurbulentBackground'
import '@/app/globals.css'

const alexBrush = Alex_Brush({
	display: 'swap',
	subsets: ['latin'],
	variable: '--font-alex-brush',
	weight: ['400'],
})

export const metadata: Metadata = {
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
	description:
		'Site officiel d\'Espérance Masson, autrice française de dark romance. Découvrez "Cœurs Sombres", son roman #1 sur Wattpad avec des milliers de lectures. Dark romance, enemies to lovers, mafia romance.',
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
		description:
			'Découvrez l\'univers d\'Espérance Masson, autrice française de dark romance. "Cœurs Sombres" - #1 sur Wattpad avec des milliers de lectures.',
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
		},
		index: true,
	},
	title: {
		default:
			'Espérance Masson - Autrice de Dark Romance | Cœurs Sombres sur Wattpad',
		template: '%s - Espérance Masson',
	},
	twitter: {
		card: 'summary_large_image',
		creator: '@esp_masson',
		description:
			'Découvrez "Cœurs Sombres", le roman dark romance #1 sur Wattpad par Espérance Masson.',
		images: ['/images/twitter-card.jpg'],
		title: 'Espérance Masson - Autrice de Dark Romance',
	},
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang='fr' className={`h-full antialiased ${alexBrush.variable}`}>
			<head>
				<script
					type='application/ld+json'
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							'@context': 'https://schema.org',
							'@graph': [
								{
									'@id': 'https://esperancem.fr/#person',
									'@type': 'Person',
									alternateName: 'esp_masson',
									description:
										'Autrice française de dark romance, connue pour son roman "Cœurs Sombres"',
									gender: 'Female',
									jobTitle: 'Autrice',
									name: 'Espérance Masson',
									nationality: 'French',
									sameAs: [
										'https://www.instagram.com/esp_masson/',
										'https://www.tiktok.com/@_esperance_masson',
										'https://www.wattpad.com/user/Esperancem',
									],
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
									description:
										"Site officiel d'Espérance Masson, autrice de dark romance",
									inLanguage: 'fr-FR',
									name: 'Espérance Masson - Site Officiel',
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
						}),
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
