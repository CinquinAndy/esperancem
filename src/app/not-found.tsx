import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { get404Content } from '@/lib/content'

export default async function NotFound() {
	const { buttonText, description, title } = await get404Content()

	return (
		<Container className='flex h-full items-center pt-16 sm:pt-32'>
			<div className='flex flex-col items-center'>
				<p className='text-base font-semibold text-zinc-500'>404</p>
				<h1
					className='mt-4 text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl'
					dangerouslySetInnerHTML={{ __html: title }}
				/>
				<div
					className='mt-4 text-base text-zinc-400'
					dangerouslySetInnerHTML={{ __html: description }}
				/>
				<Button href='/' variant='secondary' className='mt-4'>
					<span dangerouslySetInnerHTML={{ __html: buttonText }} />
				</Button>
			</div>
		</Container>
	)
}
