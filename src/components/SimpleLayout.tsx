import { Container } from '@/components/Container'

export function SimpleLayout({
	children,
	intro,
	title,
}: {
	title: string
	intro: string
	children?: React.ReactNode
}) {
	return (
		<Container className='mt-16 sm:mt-32'>
			<header className='max-w-2xl'>
				<h1
					className='text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl'
					dangerouslySetInnerHTML={{ __html: title }}
				/>
				<div
					className='mt-6 text-base text-zinc-400'
					dangerouslySetInnerHTML={{ __html: intro }}
				/>
			</header>
			{children && <div className='mt-16 sm:mt-20'>{children}</div>}
		</Container>
	)
}
