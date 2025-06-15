import { type Metadata } from 'next'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'
import '@/app/globals.css'

export const metadata: Metadata = {
	alternates: {
		types: {
			'application/rss+xml': `${process.env.NEXT_PUBLIC_SITE_URL}/feed.xml`,
		},
	},
	description: `I'm Spencer, a software designer and entrepreneur based in New York City. I'm the founder and CEO of Planetaria, where we develop technologies that empower regular people to explore space on their own terms.`,
	title: {
		default:
			'Spencer Sharp - Software designer, founder, and amateur astronaut',
		template: '%s - Spencer Sharp',
	},
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html
			lang='en'
			className='dark h-full antialiased'
			suppressHydrationWarning
		>
			<body className='flex h-full bg-zinc-50 dark:bg-black'>
				<Providers>
					<div className='flex w-full'>
						<Layout>{children}</Layout>
					</div>
				</Providers>
			</body>
		</html>
	)
}
