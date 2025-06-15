import { type Metadata } from 'next'
import { The_Nautigal } from 'next/font/google'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'
import { TurbulentBackground } from '@/components/TurbulentBackground'
import '@/app/globals.css'

const nautigal = The_Nautigal({
	display: 'swap',
	subsets: ['latin'],
	variable: '--font-nautigal',
	weight: ['400', '700'],
})

export const metadata: Metadata = {
	alternates: {
		types: {
			'application/rss+xml': `${process.env.NEXT_PUBLIC_SITE_URL}/feed.xml`,
		},
	},
	description:
		'Site officiel d\'Esperance Masson, autrice de la dark romance "Cœurs Sombres". Découvrez son travail et ses dernières actualités.',
	title: {
		default: 'Esperance Masson - Autrice de Cœurs Sombres',
		template: '%s - Esperance Masson',
	},
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang='en' className={`h-full antialiased ${nautigal.variable}`}>
			<body className='flex h-full'>
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
