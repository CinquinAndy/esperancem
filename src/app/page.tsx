import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { getWattpadStats } from '@/app/actions/wattpad-stats'
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import {
	InstagramIcon,
	TikTokIcon,
	WattpadIcon,
	EmailIcon,
} from '@/components/SocialIcons'
import { WattpadStats } from '@/components/WattpadStats'
import bookCover from '@/images/photos/cover_on_book.jpg'
// Import for the new book cover
const newBookCover = '/au_prix_du_silence_cover.png'
import {
	getContent,
	getSeoMetadata,
	getSocialLinks,
	getWattpadRankings,
} from '@/lib/content'
import { formatWattpadStat } from '@/lib/wattpad'

// Helper function to get icon component by name
function getIconComponent(iconName: string | undefined) {
	switch (iconName) {
		case 'InstagramIcon':
			return InstagramIcon
		case 'TikTokIcon':
			return TikTokIcon
		case 'WattpadIcon':
			return WattpadIcon
		case 'EmailIcon':
			return EmailIcon
		default:
			return InstagramIcon
	}
}

export async function generateMetadata(): Promise<Metadata> {
	const metadata = await getSeoMetadata('home')

	if (!metadata) {
		return {
			description: '...',
			title: '...',
		}
	}

	return {
		description: metadata.description,
		keywords: metadata.keywords,
		openGraph: {
			description: metadata.og_description,
			title: metadata.og_title,
			url: metadata.og_url,
		},
		title: metadata.title,
		twitter: {
			card: 'summary_large_image',
			creator: metadata.twitter_creator,
			description: metadata.twitter_description,
			site: metadata.twitter_site,
			title: metadata.twitter_title,
		},
	}
}

function SocialLink({
	icon: Icon,
	...props
}: React.ComponentPropsWithoutRef<typeof Link> & {
	icon: React.ComponentType<{ className?: string }>
}) {
	return (
		<Link className='group -m-1 p-1' {...props}>
			<Icon className='h-6 w-6 fill-zinc-400 transition group-hover:fill-zinc-300' />
		</Link>
	)
}

interface WattpadReadsTextProps {
	stats: Awaited<ReturnType<typeof getWattpadStats>>
}

function WattpadReadsText({ stats }: WattpadReadsTextProps) {
	const formattedReads =
		stats?.success && stats.stats?.reads
			? formatWattpadStat(stats.stats.reads)
			: '...'
	return (
		<span className='font-semibold text-zinc-200'>
			{formattedReads} lectures
		</span>
	)
}

function BookCover({
	alt,
	priority = false,
	src,
}: {
	src: any
	alt: string
	priority?: boolean
}) {
	return (
		<div className='group relative'>
			<div className='aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900 shadow-2xl ring-1 ring-zinc-700/50'>
				<Image
					alt={alt}
					blurDataURL='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGBkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZEYGTrHWJ2PNgHr3nz8CBAw+lFhpX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZ'
					className='h-full w-full object-cover transition duration-300 group-hover:scale-105'
					height={1500}
					placeholder='blur'
					priority={priority}
					quality={100}
					src={src}
					unoptimized={false}
					width={1000}
				/>
				{/* Elegant hover effect */}
				<div className='absolute inset-0 bg-gradient-to-t from-zinc-900/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
			</div>
			{/* Glow effect around the book */}
			<div className='absolute -inset-0.5 -z-10 rounded-xl bg-gradient-to-br from-red-500/20 via-purple-500/10 to-zinc-500/10 opacity-75 blur-sm' />
		</div>
	)
}

interface BookProps {
	stats: Awaited<ReturnType<typeof getWattpadStats>>
}

function Book({
	bookContent,
	rankings = [],
	stats,
}: BookProps & { bookContent: any; rankings: any[] }) {
	return (
		<div className='flex flex-col gap-y-6 rounded-2xl border border-zinc-700/40 p-6'>
			<div>
				<h2
					className='text-lg font-semibold text-zinc-100'
					dangerouslySetInnerHTML={{
						__html: bookContent.book_title || '...',
					}}
				/>
				<div
					className='mt-2 text-sm text-zinc-400 [&>p]:mt-4'
					dangerouslySetInnerHTML={{
						__html: bookContent.book_description || '...',
					}}
				/>
			</div>

			{bookContent.rankings_title && rankings.length > 0 && (
				<div>
					<h3
						className='text-md font-semibold text-zinc-100'
						dangerouslySetInnerHTML={{
							__html: bookContent.rankings_title || '...',
						}}
					/>
					{rankings.length > 0 && (
						<div className='mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-zinc-400'>
							{rankings.map(ranking => (
								<p key={ranking.category} className='w-full'>
									#{ranking.position}{' '}
									<span className='font-semibold text-zinc-200'>
										{ranking.category}
									</span>{' '}
									({new Date(ranking.date).toLocaleDateString('fr-FR')})
								</p>
							))}
							<p className='w-full text-zinc-300'>
								Plus de <WattpadReadsText stats={stats} /> sur Wattpad
							</p>
						</div>
					)}
				</div>
			)}

			{bookContent.wattpad_button && (
				<Button
					href={bookContent.wattpad_url.replace(/<[^>]*>?/g, '')}
					variant='secondary'
					className='group mt-4 w-full'
				>
					<span
						dangerouslySetInnerHTML={{
							__html: bookContent.wattpad_button || '...',
						}}
					/>
				</Button>
			)}
		</div>
	)
}

export default async function Home() {
	// Fetch data from PocketBase
	const [mainTitle, mainDescription, socialLinks, rankings] = await Promise.all(
		[
			getContent('home', 'hero', 'main_title'),
			getContent('home', 'hero', 'main_description'),
			getSocialLinks(),
			getWattpadRankings(),
		]
	)

	// Fallback to original content if PocketBase data is not available
	const title = mainTitle || '...'
	const description = mainDescription || '...'

	// Use Server Action for stats (for Book components)
	const stats = await getWattpadStats()

	return (
		<>
			<Container className='mt-9'>
				<div className='max-w-2xl'>
					<h1
						className='text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl'
						dangerouslySetInnerHTML={{ __html: title }}
					/>
					<div
						className='mt-6 text-base text-zinc-400'
						dangerouslySetInnerHTML={{ __html: description }}
					/>
					<div className='mt-6 flex gap-6'>
						{socialLinks.map(link => {
							const Icon = getIconComponent(link.icon)
							return (
								<SocialLink
									key={link.platform}
									href={link.url}
									aria-label={`Suivez Espérance Masson sur ${link.display_name}`}
									icon={Icon}
									className={link.platform === 'wattpad' ? 'scale-150' : ''}
								/>
							)
						})}
					</div>
				</div>
			</Container>

			{/* Bloc Total */}
			<div className='my-10 flex justify-center'>
				<WattpadStats statsType='total' title='Total (tous livres Wattpad)' />
			</div>

			{/* Books Section */}
			<Container className='mt-24 md:mt-28'>
				<div className='space-y-20'>
					{/* First Book - Cœurs Sombres */}
					<div className='mx-auto grid max-w-xl grid-cols-1 items-start gap-y-20 lg:max-w-none lg:grid-cols-2'>
						<div className='flex flex-col gap-16'>
							<BookCover
								src={bookCover}
								alt="Couverture du livre Cœurs Sombres d'Espérance masson"
								priority={true}
							/>
						</div>
						<div className='space-y-10 lg:pl-16 xl:pl-24'>
							<Book
								stats={stats}
								bookContent={{
									book_description: await getContent(
										'home',
										'book',
										'book_description'
									),
									book_title: await getContent('home', 'book', 'book_title'),
									rankings_title: await getContent(
										'home',
										'book',
										'rankings_title'
									),
									wattpad_button: await getContent(
										'home',
										'book',
										'wattpad_button'
									),
									wattpad_url: await getContent('home', 'book', 'wattpad_url'),
								}}
								rankings={rankings}
							/>
						</div>
						{/* Stats pour Cœurs sombres */}
						<div className='col-span-2 flex justify-center'>
							<WattpadStats statsType='coeurs-sombres' title='Cœurs sombres' />
						</div>
					</div>

					{/* Second Book - Au Prix du Silence */}
					<div className='mx-auto grid max-w-xl grid-cols-1 items-start gap-y-20 lg:max-w-none lg:grid-cols-2'>
						<div className='space-y-10 lg:pr-16 xl:pr-24'>
							<Book
								stats={stats}
								bookContent={{
									book_description: await getContent(
										'home',
										'book',
										'book_description_2'
									),
									book_title: await getContent('home', 'book', 'book_title_2'),
									// rankings_title: await getContent(
									// 	'home',
									// 	'book',
									// 	'rankings_title_2'
									// ),
									wattpad_button: await getContent(
										'home',
										'book',
										'wattpad_button_2'
									),
									wattpad_url: await getContent(
										'home',
										'book',
										'wattpad_url_2'
									),
								}}
								rankings={[]}
							/>
						</div>
						<div className='flex flex-col gap-16'>
							<BookCover
								src={newBookCover}
								alt="Couverture du livre Au Prix du Silence d'Espérance masson"
								priority={false}
							/>
						</div>
						{/* Stats pour Au prix du silence */}
						<div className='col-span-2 flex justify-center'>
							<WattpadStats
								statsType='au-prix-du-silence'
								title='Au prix du silence'
							/>
						</div>
					</div>
				</div>
			</Container>
		</>
	)
}
