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
import {
	getPageMetadata,
	getContent,
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
	const metadata = await getPageMetadata('home')

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

function BookCover() {
	return (
		<div className='group relative'>
			<div className='aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900 shadow-2xl ring-1 ring-zinc-700/50'>
				<Image
					src={bookCover}
					alt="Couverture du livre Cœurs Sombres d'Espérance masson"
					className='h-full w-full object-cover transition duration-300 group-hover:scale-105'
					quality={100}
					width={1000}
					height={1500}
					priority
					placeholder='blur'
					blurDataURL='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGBkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZEYGTrHWJ2PNgHr3nz8CBAw+lFhpX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZEYGTrHWJ2PNgHr3nz8CBAw+lFhpX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZEYGTrHWJ2PNgHr3nz8CBAw+lFhpX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZ'
					unoptimized={false}
				/>
				{/* Elegant hover effect */}
				<div className='absolute inset-0 bg-gradient-to-t from-zinc-900/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
			</div>
			{/* Glow effect around the book */}
			<div className='absolute -inset-0.5 -z-10 rounded-xl bg-gradient-to-br from-red-500/20 via-purple-500/10 to-zinc-500/10 opacity-75 blur-sm' />
		</div>
	)
}

interface DarkHeartsBookProps {
	stats: Awaited<ReturnType<typeof getWattpadStats>>
}

function DarkHeartsBook({
	bookContent,
	rankings,
	stats,
}: DarkHeartsBookProps & { bookContent: any; rankings: any[] }) {
	return (
		<div className='flex flex-col gap-y-6 rounded-2xl border border-zinc-700/40 p-6'>
			<div>
				<h2 className='text-lg font-semibold text-zinc-100'>
					{bookContent.book_title || 'Cœurs Sombres'}
				</h2>
				<p className='mt-2 text-sm text-zinc-400'>
					{bookContent.book_description || '...'}
				</p>
				<p className='mt-4 text-sm text-zinc-400'>
					{bookContent.book_description_2 || '...'}
				</p>
				<p className='mt-4 text-sm text-zinc-400'>
					{bookContent.book_description_3 || '...'}
				</p>
			</div>

			<div>
				<h3 className='text-md font-semibold text-zinc-100'>
					{bookContent.rankings_title || '...'}
				</h3>
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
			</div>

			<Button
				href='https://www.wattpad.com/story/368278312-c%C5%93urs-sombres'
				variant='secondary'
				className='group mt-4 w-full'
			>
				{bookContent.wattpad_button || '...'}
			</Button>
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
	const title =
		mainTitle || '...'
	const description =
		mainDescription || '...'

	// Use Server Action for stats
	const stats = await getWattpadStats()

	return (
		<>
			<Container className='mt-9'>
				<div className='max-w-2xl'>
					<h1 className='text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl'>
						{title}
					</h1>
					<p className='mt-6 text-base text-zinc-400'>{description}</p>
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

			{/* Wattpad Stats */}
			<Container className='mt-16 md:mt-20'>
				<WattpadStats />
			</Container>

			<Container className='mt-24 md:mt-28'>
				<div className='mx-auto grid max-w-xl grid-cols-1 items-start gap-y-20 lg:max-w-none lg:grid-cols-2'>
					<div className='flex flex-col gap-16'>
						<BookCover />
					</div>
					<div className='space-y-10 lg:pl-16 xl:pl-24'>
						<DarkHeartsBook
							stats={stats}
							bookContent={{
								book_description: await getContent(
									'home',
									'book',
									'book_description'
								),
								book_description_2: await getContent(
									'home',
									'book',
									'book_description_2'
								),
								book_description_3: await getContent(
									'home',
									'book',
									'book_description_3'
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
							}}
							rankings={rankings}
						/>
					</div>
				</div>
			</Container>
		</>
	)
}
