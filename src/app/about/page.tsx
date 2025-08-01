import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/Container'
import {
	InstagramIcon,
	TikTokIcon,
	WattpadIcon,
} from '@/components/SocialIcons'
import { WattpadStatsProvider } from '@/contexts/WattpadStatsContext'
import portraitImage from '@/images/avatar.jpeg'
import bookCover from '@/images/photos/cover_on_book.jpg'
// Import for the new book cover
const newBookCover = '/au_prix_du_silence_cover.png'
import { getContentWithFallback, getSocialLinks } from '@/lib/content'
import { generateAboutMetadata } from '@/lib/metadata'
import { fetchWattpadStats } from '@/lib/wattpad'

function SocialLink({
	children,
	className,
	href,
	icon: Icon,
}: {
	className?: string
	href: string
	icon: React.ComponentType<{ className?: string }>
	children: React.ReactNode
}) {
	return (
		<li className={className}>
			<Link
				href={href}
				className='group flex text-sm font-medium text-zinc-200 transition hover:text-teal-500'
			>
				<Icon className='h-6 w-6 flex-none fill-zinc-500 transition group-hover:fill-teal-500' />
				<span className='ml-4'>{children}</span>
			</Link>
		</li>
	)
}

function MailIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
	return (
		<svg viewBox='0 0 24 24' aria-hidden='true' {...props}>
			<path
				fillRule='evenodd'
				d='M6 5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6Zm.245 2.187a.75.75 0 0 0-.99 1.126l6.25 5.5a.75.75 0 0 0 .99 0l6.25-5.5a.75.75 0 0 0-.99-1.126L12 12.251 6.245 7.187Z'
			/>
		</svg>
	)
}

export async function generateMetadata(): Promise<Metadata> {
	return await generateAboutMetadata()
}

export default async function About() {
	// Fetch content and social links from PocketBase
	const [
		initialStats,
		socialLinks,
		mainTitle,
		mainContent,
		bookTitle,
		bookContent,
		email,
	] = await Promise.all([
		fetchWattpadStats(),
		getSocialLinks(),
		getContentWithFallback('about', 'hero', 'main_title', '...'),
		getContentWithFallback('about', 'hero', 'biography', '...'),
		getContentWithFallback('about', 'book', 'book_title', '...'),
		getContentWithFallback('about', 'book', 'book_description', `...`),
		getContentWithFallback('about', 'contact', 'email', '...'),
	])

	return (
		<WattpadStatsProvider
			statsType='coeurs-sombres'
			initialStats={initialStats}
		>
			<Container className='mt-16 sm:mt-32'>
				<div className='grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-y-12'>
					<div className='lg:pl-20'>
						<div className='max-w-xs px-2.5 lg:max-w-none'>
							<Image
								src={portraitImage}
								alt=''
								sizes='(min-width: 1024px) 64rem, 50rem'
								className='aspect-square rotate-3 rounded-2xl bg-zinc-800 object-cover'
							/>
						</div>
					</div>
					<div className='lg:order-first lg:row-span-2'>
						<h1
							className='text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl'
							dangerouslySetInnerHTML={{ __html: mainTitle }}
						/>
						<div
							className='mt-6 space-y-7 text-base text-zinc-400'
							dangerouslySetInnerHTML={{ __html: mainContent }}
						/>
					</div>
					<div className='lg:pl-20'>
						<ul role='list'>
							{socialLinks.map(link => (
								<SocialLink
									key={link.platform}
									href={link.url}
									icon={
										link.platform === 'instagram'
											? InstagramIcon
											: link.platform === 'tiktok'
												? TikTokIcon
												: WattpadIcon
									}
									className='mt-4'
								>
									<span
										dangerouslySetInnerHTML={{ __html: link.display_name }}
									/>
								</SocialLink>
							))}
							<div className='mt-8 border-t border-zinc-700/40 pt-8'>
								<SocialLink
									href={`mailto:${email.replace(/<[^>]*>?/g, '')}`}
									icon={MailIcon}
									className='items-center'
								>
									{email.replace(/<[^>]*>?/g, '')}
								</SocialLink>
							</div>
						</ul>
					</div>
				</div>
			</Container>

			{/* Books section */}
			<Container className='mt-24 sm:mt-32'>
				<div className='mx-auto max-w-2xl lg:max-w-5xl'>
					<div className='space-y-20'>
						{/* First Book - Cœurs Sombres */}
						<div className='mx-auto grid max-w-xl grid-cols-1 gap-y-20 lg:max-w-none lg:grid-cols-2'>
							<div className='flex justify-center lg:justify-start'>
								<div className='group relative'>
									<Image
										src={bookCover}
										alt="Couverture du livre Cœurs Sombres d'Espérance masson"
										className='h-auto w-80 rounded-xl shadow-2xl ring-1 ring-zinc-700/50 transition duration-300 group-hover:scale-105'
										sizes='(min-width: 1536px) 24rem, (min-width: 1024px) 20rem, (min-width: 768px) 18rem, 16rem'
										quality={100}
										placeholder='blur'
										blurDataURL='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGBkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZEYGTrHWJ2PNgHr3nz8CBAw+lFhpX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZEYGTrHWJ2PNgHr3nz8CBAw+lFhpX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZ'
										unoptimized={false}
										width={320}
										height={480}
									/>
									{/* Subtle glow effect */}
									<div className='absolute -inset-0.5 -z-10 rounded-xl bg-gradient-to-br from-red-500/10 via-purple-500/5 to-zinc-500/5 opacity-75 blur-sm' />
								</div>
							</div>
							<div className='lg:pl-8'>
								<h2
									className='text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl'
									dangerouslySetInnerHTML={{ __html: bookTitle }}
								/>
								<div
									className='mt-6 space-y-6 text-base text-zinc-400'
									dangerouslySetInnerHTML={{ __html: bookContent }}
								/>
							</div>
						</div>

						{/* Second Book - Au Prix du Silence */}
						<div className='mx-auto grid max-w-xl grid-cols-1 gap-y-20 lg:max-w-none lg:grid-cols-2'>
							<div className='flex justify-center lg:order-2 lg:justify-end'>
								<div className='group relative'>
									<Image
										src={newBookCover}
										alt="Couverture du livre Au Prix du Silence d'Espérance masson"
										className='h-auto w-80 rounded-xl shadow-2xl ring-1 ring-zinc-700/50 transition duration-300 group-hover:scale-105'
										sizes='(min-width: 1536px) 24rem, (min-width: 1024px) 20rem, (min-width: 768px) 18rem, 16rem'
										quality={100}
										placeholder='blur'
										blurDataURL='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGBkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZEYGTrHWJ2PNgHr3nz8CBAw+lFhpX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZEYGTrHWJ2PNgHr3nz8CBAw+lFhpX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZ'
										unoptimized={false}
										width={320}
										height={600}
									/>
									{/* Subtle glow effect */}
									<div className='absolute -inset-0.5 -z-10 rounded-xl bg-gradient-to-br from-red-500/10 via-purple-500/5 to-zinc-500/5 opacity-75 blur-sm' />
								</div>
							</div>
							<div className='lg:order-1 lg:pr-8'>
								<h2
									className='text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl'
									dangerouslySetInnerHTML={{
										__html: await getContentWithFallback(
											'about',
											'book',
											'book_title_2',
											'Au Prix du Silence'
										),
									}}
								/>
								<div
									className='mt-6 space-y-6 text-base text-zinc-400'
									dangerouslySetInnerHTML={{
										__html: await getContentWithFallback(
											'about',
											'book',
											'book_description_2',
											'...'
										),
									}}
								/>
							</div>
						</div>
					</div>
				</div>
			</Container>
		</WattpadStatsProvider>
	)
}
