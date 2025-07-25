import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

export async function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<div className='fixed inset-0 flex justify-center sm:px-8'>
				<div className='flex w-full max-w-7xl px-1 lg:px-8'>
					<div className='w-full bg-zinc-900/5 px-1 ring-1 ring-zinc-300/20 xl:bg-zinc-900/75 xl:px-0' />
				</div>
			</div>
			<div className='relative flex w-full flex-col'>
				<Header />
				<main className='flex-auto'>{children}</main>
				<Footer />
			</div>
		</>
	)
}
