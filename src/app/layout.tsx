import { type Metadata } from 'next'
import { Alex_Brush } from 'next/font/google'

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
		<html lang='en' className={`h-full antialiased ${alexBrush.variable}`}>
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
