import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import {
	InstagramIcon,
	TikTokIcon,
	WattpadIcon,
} from '@/components/SocialIcons'
import { WattpadStats } from '@/components/WattpadStats'
import { WattpadStatsProvider } from '@/contexts/WattpadStatsContext'
import bookCover from '@/images/photos/cover_on_book.jpg'
import { fetchWattpadStats } from '@/lib/wattpad'

export const metadata: Metadata = {
	description:
		"Découvrez l'univers sombre et passionné d'Espérance Masson. Lisez \"Cœurs Sombres\", son premier roman dark romance sur Wattpad qui captive plus de 85k lecteurs. Plongez dans une histoire d'enemies to lovers avec Lucas Ferrari et Angèle.",
	keywords: [
		'Cœurs Sombres Wattpad',
		'Lucas Ferrari',
		'Angèle roman',
		'dark romance française',
		'enemies to lovers français',
		'mafia romance Wattpad',
		'roman passion sombre',
		'autrice française Wattpad',
		'livre gratuit Wattpad',
		'romance française 2025',
	],
	openGraph: {
		description:
			'Plongez dans l\'univers dark romance d\'Espérance Masson. "Cœurs Sombres" - Son premier roman dark romance sur Wattpad.',
		title: 'Espérance Masson - Autrice Dark Romance | Cœurs Sombres Wattpad',
		url: 'https://esperancem.fr',
	},
	title: 'Accueil - Espérance Masson | Autrice de Cœurs Sombres',
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

function DarkHeartsBook() {
	return (
		<div className='flex flex-col gap-y-6 rounded-2xl border border-zinc-700/40 p-6'>
			<div>
				<h2 className='text-lg font-semibold text-zinc-100'>
					Cœurs Sombres - Dark Romance Wattpad
				</h2>
				<p className='mt-2 text-sm text-zinc-400'>
					{`Fuyant un passé qui la hante, Angèle rêve de reprendre le contrôle de
					sa vie et part avec sa meilleure amie aux États-Unis pour tout
					recommencer. Mais sa quête de liberté vire au cauchemar lorsqu'elle
					tombe sous l'emprise de Lucas Ferrari, un chef de mafia aussi froid
					qu'impitoyable, prêt à tout pour assouvir une vengeance qui le
					consume.`}
				</p>
				<p className='mt-4 text-sm text-zinc-400'>
					{`Cette dark romance française explore les thèmes de l'enemies to lovers 
					et de la mafia romance. Pris dans un jeu de pouvoir et de manipulation, 
					Angèle et Lucas découvrent qu'ils sont liés par des secrets capables de tout détruire.`}
				</p>
				<p className='mt-4 text-sm text-zinc-400'>
					{`Entre haine et attirance, leur lutte pour survivre pourrait bien les
					mener à leur perte. Cette romance française intense captive les lecteurs
					Wattpad avec ses personnages complexes et son intrigue haletante. 
					Succomberont-ils aux ténèbres du désir ou trouveront-ils enfin la paix au prix de leur âme ?`}
				</p>
			</div>

			<div>
				<h3 className='text-md font-semibold text-zinc-100'>
					Succès Wattpad - Classements #1
				</h3>
				<div className='mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-zinc-400'>
					<p className='w-full'>
						#1{' '}
						<span className='font-semibold text-zinc-200'>
							ennemiestolovers
						</span>{' '}
						(24/04/2025)
					</p>
					<p className='w-full'>
						#1 <span className='font-semibold text-zinc-200'>amitiés</span>{' '}
						(28/04/2025)
					</p>
					<p className='w-full'>
						#1 <span className='font-semibold text-zinc-200'>trahisons</span>{' '}
						(26/05/2025)
					</p>
					<p className='w-full'>
						#1 <span className='font-semibold text-zinc-200'>meurtres</span>{' '}
						(30/05/2025)
					</p>
					<p className='w-full'>
						#1 <span className='font-semibold text-zinc-200'>crimes</span>{' '}
						(08/06/2025)
					</p>
					<p className='w-full'>
						#1{' '}
						<span className='font-semibold text-zinc-200'>
							proximitée forcée
						</span>{' '}
						(16/06/2025)
					</p>
					<p className='w-full text-zinc-300'>
						Plus de{' '}
						<span className='font-semibold text-zinc-200'>85k lectures</span>{' '}
						sur Wattpad
					</p>
				</div>
			</div>

			<Button
				href='https://www.wattpad.com/story/368278312-c%C5%93urs-sombres'
				variant='secondary'
				className='group mt-4 w-full'
			>
				Lire Cœurs Sombres gratuitement sur Wattpad
			</Button>
		</div>
	)
}

export default async function Home() {
	// Fetch Wattpad stats server-side for better NumberFlow performance
	const initialStats = await fetchWattpadStats()
	return (
		<WattpadStatsProvider initialStats={initialStats}>
			<Container className='mt-9'>
				<div className='max-w-2xl'>
					<h1 className='text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl'>
						Espérance Masson, autrice française de dark romance
					</h1>
					<p className='mt-6 text-base text-zinc-400'>
						Bienvenue dans l&apos;univers sombre et passionné d&apos;Espérance
						Masson. Autrice française spécialisée dans la dark romance,
						j&apos;écris des histoires d&apos;âmes tourmentées, d&apos;amours
						impossibles et de la part d&apos;ombre qui sommeille en chacun de
						nous.
					</p>
					<div className='mt-6 flex gap-6'>
						<SocialLink
							href='https://www.instagram.com/esp_masson/'
							aria-label='Suivez Espérance Masson sur Instagram esp_masson'
							icon={InstagramIcon}
						/>
						<SocialLink
							href='https://www.tiktok.com/@_esperance_masson'
							aria-label='Suivez Espérance Masson sur TikTok _esperance_masson'
							icon={TikTokIcon}
						/>
						<SocialLink
							href='https://www.wattpad.com/user/Esperancem'
							aria-label='Lisez les romans d Espérance Masson sur Wattpad'
							className='scale-150'
							icon={WattpadIcon}
						/>
					</div>
				</div>
			</Container>

			<Container className='mt-16 md:mt-20'>
				<WattpadStats />
			</Container>

			<Container className='mt-24 md:mt-28'>
				<div className='mx-auto grid max-w-xl grid-cols-1 items-start gap-y-20 lg:max-w-none lg:grid-cols-2'>
					<div className='flex flex-col gap-16'>
						<BookCover />
					</div>
					<div className='space-y-10 lg:pl-16 xl:pl-24'>
						<DarkHeartsBook />
					</div>
				</div>
			</Container>
		</WattpadStatsProvider>
	)
}
