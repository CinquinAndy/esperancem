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
import bookCover from '@/images/photos/cover_on_book.jpg'

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
					alt="Couverture du livre Cœurs Sombres d'Esperance Masson"
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
				<h2 className='text-lg font-semibold text-zinc-100'>Cœurs Sombres</h2>
				<p className='mt-2 text-sm text-zinc-400'>
					{`Fuyant un passé qui la hante, Angèle rêve de reprendre le contrôle de
					sa vie et part avec sa meilleure amie aux États-Unis pour tout
					recommencer. Mais sa quête de liberté vire au cauchemar lorsqu'elle
					tombe sous l'emprise de Lucas Ferrari, un chef de mafia aussi froid
					qu'impitoyable, prêt à tout pour assouvir une vengeance qui le
					consume.`}
				</p>
				<p className='mt-4 text-sm text-zinc-400'>
					{`Pris dans un jeu de pouvoir et de manipulation, tous deux découvrent
					qu'ils sont liés par des secrets capables de tout détruire.`}
				</p>
				<p className='mt-4 text-sm text-zinc-400'>
					{`Entre haine et attirance, leur lutte pour survivre pourrait bien les
					mener à leur perte. Succomberont-ils aux ténèbres du désir ou
					trouveront-ils enfin la paix au prix de leur âme ?`}
				</p>
			</div>

			<div>
				<h3 className='text-md font-semibold text-zinc-100'>
					Classements #1 sur Wattpad
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
				</div>
			</div>

			<Button
				href='https://www.wattpad.com/story/368278312-c%C5%93urs-sombres'
				variant='secondary'
				className='group mt-4 w-full'
			>
				Lire sur Wattpad
			</Button>
		</div>
	)
}

export default async function Home() {
	return (
		<>
			<Container className='mt-9'>
				<div className='max-w-2xl'>
					<h1 className='text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl'>
						Esperance Masson, auteure de dark romance.
					</h1>
					<p className='mt-6 text-base text-zinc-400'>
						Bienvenue dans mon univers. J&apos;écris des histoires d&apos;âmes
						tourmentées, d&apos;amours impossibles et de la part d&apos;ombre
						qui sommeille en chacun de nous.
					</p>
					<div className='mt-6 flex gap-6'>
						<SocialLink
							href='https://www.instagram.com/esp_masson/'
							aria-label='Follow on Instagram'
							icon={InstagramIcon}
						/>
						<SocialLink
							href='https://www.tiktok.com/@_esperance_masson'
							aria-label='Follow on TikTok'
							icon={TikTokIcon}
						/>
						<SocialLink
							href='https://www.wattpad.com/user/Esperancem'
							aria-label='Follow on Wattpad'
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
		</>
	)
}
