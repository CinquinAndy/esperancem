import { type Metadata } from 'next'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'
import { TurbulentBackground } from '@/components/TurbulentBackground'
import '@/app/globals.css'

export const metadata: Metadata = {
	alternates: {
		types: {
			'application/rss+xml': `${process.env.NEXT_PUBLIC_SITE_URL}/feed.xml`,
		},
	},
	description:
		'Site officiel d\'Esperance Masson, auteure de la dark romance "Cœurs Sombres". Découvrez son travail et ses dernières actualités.',
	title: {
		default: 'Esperance Masson - Auteure de Cœurs Sombres',
		template: '%s - Esperance Masson',
	},
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang='en' className='h-full antialiased'>
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
