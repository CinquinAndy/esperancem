import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import {
	getWattpadStats,
	type WattpadStatsResult,
} from '@/app/actions/wattpad-stats'
import { Container } from '@/components/Container'
import { WattpadStats } from '@/components/WattpadStats'
import bookCover from '@/images/photos/cover_on_book.jpg'
import { getContent, getSocialLinks, getWattpadRankings } from '@/lib/content'
import { generateHomeMetadata } from '@/lib/metadata'

// Optimisation ISR : revalidate toutes les 6 heures
export const revalidate = 21600

export async function generateMetadata(): Promise<Metadata> {
	return await generateHomeMetadata()
}

function getIconComponent(iconName: string | undefined) {
	switch (iconName) {
		case 'instagram':
			return function InstagramIcon(
				props: React.ComponentPropsWithoutRef<'svg'>
			) {
				return (
					<svg viewBox='0 0 24 24' aria-hidden='true' {...props}>
						<path d='M12 3c-2.444 0-2.75.01-3.71.054-.959.044-1.613.196-2.185.418A4.412 4.412 0 0 0 4.51 4.511c-.5.5-.809 1.002-1.039 1.594a4.61 4.61 0 0 0-.418 2.185C2.01 9.25 2 9.556 2 12s.01 2.75.054 3.71c.044.959.196 1.613.418 2.185.23.592.538 1.094 1.039 1.595.5.5 1.002.808 1.594 1.038.572.222 1.226.374 2.185.418C9.25 21.99 9.556 22 12 22s2.75-.01 3.71-.054c.959-.044 1.613-.196 2.185-.419a4.412 4.412 0 0 0 1.595-1.038c.5-.5.808-1.002 1.038-1.594.222-.572.374-1.226.418-2.185.044-.959.054-1.265.054-3.71s-.01-2.75-.054-3.71c-.044-.959-.196-1.613-.419-2.185A4.412 4.412 0 0 0 19.49 4.51c-.5-.5-1.002-.809-1.594-1.039a4.61 4.61 0 0 0-2.185-.418C14.75 2.01 14.444 2 12 2zm0 1.622c2.403 0 2.688.009 3.637.052.877.04 1.354.187 1.671.31.421.163.72.358 1.036.673.315.315.51.615.673 1.035.123.318.27.795.31 1.671.043.949.052 1.234.052 3.637s-.009 2.688-.052 3.637c-.04.877-.187 1.354-.31 1.671-.163.421-.358.72-.673 1.036a2.79 2.79 0 0 1-1.035.673c-.318.123-.795.27-1.671.31-.949.043-1.234.052-3.637.052s-2.688-.009-3.637-.052c-.877-.04-1.354-.187-1.671-.31a2.79 2.79 0 0 1-1.035-.673 2.79 2.79 0 0 1-.673-1.036c-.123-.318-.27-.795-.31-1.671-.043-.949-.052-1.234-.052-3.637s.009-2.688.052-3.637c.04-.877.187-1.354.31-1.671.163-.421.358-.72.673-1.035a2.79 2.79 0 0 1 1.035-.673c.318-.123.795-.27 1.671-.31.949-.043 1.234-.052 3.637-.052zM12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0-7.622a4.622 4.622 0 1 0 0 9.244 4.622 4.622 0 0 0 0-9.244zm5.884-.182a1.08 1.08 0 1 1-2.16 0 1.08 1.08 0 0 1 2.16 0z' />
					</svg>
				)
			}
		case 'tiktok':
			return function TikTokIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
				return (
					<svg viewBox='0 0 24 24' aria-hidden='true' {...props}>
						<path d='M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' />
					</svg>
				)
			}
		case 'wattpad':
			return function WattpadIcon(
				props: React.ComponentPropsWithoutRef<'svg'>
			) {
				return (
					<svg viewBox='0 0 24 24' aria-hidden='true' {...props}>
						<path d='M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' />
					</svg>
				)
			}
		default:
			return function DefaultIcon(
				props: React.ComponentPropsWithoutRef<'svg'>
			) {
				return <svg viewBox='0 0 24 24' aria-hidden='true' {...props} />
			}
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
			<Icon className='h-6 w-6 fill-zinc-500 transition group-hover:fill-zinc-300' />
		</Link>
	)
}

interface WattpadReadsTextProps {
	stats: WattpadStatsResult | null
}

function WattpadReadsText({ stats }: WattpadReadsTextProps) {
	if (!stats || !stats.success || !stats.stats) {
		return <span>85k+ lectures</span>
	}

	const reads = stats.stats.reads
	const formattedReads = reads
		? parseInt(reads) >= 1000
			? `${(parseInt(reads) / 1000).toFixed(0)}k`
			: reads
		: '85k'

	return <span>{formattedReads}+ lectures</span>
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
			<Image
				src={src}
				alt={alt}
				className='h-auto w-80 rounded-xl shadow-2xl ring-1 ring-zinc-700/50 transition duration-300 group-hover:scale-105'
				sizes='(min-width: 1536px) 24rem, (min-width: 1024px) 20rem, (min-width: 768px) 18rem, 16rem'
				quality={100}
				priority={priority}
				placeholder='blur'
				blurDataURL='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGBkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZEYGTrHWJ2PNgHr3nz8CBAw+lFhpX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZEYGTrHWJ2PNgHr3nz8CBAw+lFhpX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZ'
				unoptimized={false}
				width={320}
				height={480}
			/>
			{/* Subtle glow effect */}
			<div className='absolute -inset-0.5 -z-10 rounded-xl bg-gradient-to-br from-red-500/10 via-purple-500/5 to-zinc-500/5 opacity-75 blur-sm' />
		</div>
	)
}

interface BookProps {
	stats: WattpadStatsResult | null
}

function Book({
	bookContent,
	rankings = [],
	stats,
}: BookProps & { bookContent: any; rankings: any[] }) {
	return (
		<div className='space-y-8'>
			<div>
				<h2
					className='text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl'
					dangerouslySetInnerHTML={{ __html: bookContent.book_title }}
				/>
				<div
					className='mt-6 space-y-6 text-base text-zinc-400'
					dangerouslySetInnerHTML={{ __html: bookContent.book_description }}
				/>
			</div>

			{/* Rankings */}
			{rankings.length > 0 && (
				<div>
					<h3
						className='text-lg font-semibold text-zinc-100'
						dangerouslySetInnerHTML={{ __html: bookContent.rankings_title }}
					/>
					<div className='mt-4 flex flex-wrap gap-2'>
						{rankings.map(ranking => (
							<span
								key={ranking.id}
								className='inline-flex items-center rounded-full bg-zinc-800 px-3 py-1 text-sm font-medium text-zinc-300'
							>
								#{ranking.position} {ranking.category}
							</span>
						))}
					</div>
				</div>
			)}

			{/* Stats */}
			<div className='flex items-center gap-4 text-sm text-zinc-400'>
				<span>
					<WattpadReadsText stats={stats} />
				</span>
				{stats && stats.success && stats.stats?.votes && (
					<span>{stats.stats.votes} votes</span>
				)}
				{stats && stats.success && stats.stats?.parts && (
					<span>{stats.stats.parts} chapitres</span>
				)}
			</div>

			{/* CTA Button */}
			<div>
				<Link
					href={bookContent.wattpad_url}
					className='inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-700'
				>
					<span
						dangerouslySetInnerHTML={{ __html: bookContent.wattpad_button }}
					/>
					<svg
						className='h-4 w-4'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
						/>
					</svg>
				</Link>
			</div>
		</div>
	)
}

export default async function Home() {
	// Optimisation : Récupérer toutes les données en parallèle avec cache
	const [stats, pageData] = await Promise.all([
		// Stats avec cache côté serveur
		getWattpadStats(),
		// Toutes les données de contenu en une seule fois
		Promise.all([
			getContent('home', 'hero', 'main_title'),
			getContent('home', 'hero', 'main_description'),
			getSocialLinks(),
			getWattpadRankings(),
			// Contenu du livre en parallèle
			Promise.all([
				getContent('home', 'book', 'book_description'),
				getContent('home', 'book', 'book_title'),
				getContent('home', 'book', 'rankings_title'),
				getContent('home', 'book', 'wattpad_button'),
				getContent('home', 'book', 'wattpad_url'),
			]),
		]),
	])

	// Destructurer les données
	const [mainTitle, mainDescription, socialLinks, rankings, bookContent] =
		pageData
	const [bookDescription, bookTitle, rankingsTitle, wattpadButton, wattpadUrl] =
		bookContent

	// Fallback to original content if PocketBase data is not available
	const title = mainTitle || '...'
	const description = mainDescription || '...'

	// Préparer les données du livre
	const bookData = {
		book_description: bookDescription,
		book_title: bookTitle,
		rankings_title: rankingsTitle,
		wattpad_button: wattpadButton,
		wattpad_url: wattpadUrl,
	}

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
							<Book stats={stats} bookContent={bookData} rankings={rankings} />
						</div>
						{/* Stats pour Cœurs sombres */}
						<div className='col-span-1 flex justify-center md:col-span-2'>
							<WattpadStats statsType='coeurs-sombres' title='Cœurs sombres' />
						</div>
					</div>

					{/* Second Book - Au Prix du Silence */}
					<div className='mx-auto grid max-w-xl grid-cols-1 items-start gap-y-20 lg:max-w-none lg:grid-cols-2'>
						<div className='flex flex-col gap-16 lg:order-2'>
							<BookCover
								src='/au_prix_du_silence_cover.png'
								alt="Couverture du livre Au Prix du Silence d'Espérance masson"
							/>
						</div>
						<div className='space-y-10 lg:order-1 lg:pr-16 xl:pr-24'>
							<Book
								stats={stats}
								bookContent={{
									book_description:
										'Un nouveau roman dark romance en préparation...',
									book_title: 'Au Prix du Silence',
									rankings_title: '',
									wattpad_button: 'Bientôt disponible',
									wattpad_url: '#',
								}}
								rankings={[]}
							/>
						</div>
						{/* Stats pour Au Prix du Silence */}
						<div className='col-span-1 flex justify-center md:col-span-2'>
							<WattpadStats
								statsType='au-prix-du-silence'
								title='Au Prix du Silence'
							/>
						</div>
					</div>
				</div>
			</Container>
		</>
	)
}
