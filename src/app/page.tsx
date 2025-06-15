import Link from 'next/link'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import {
	InstagramIcon,
	TikTokIcon,
	WattpadIcon,
} from '@/components/SocialIcons'

function MailIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
	return (
		<svg
			viewBox='0 0 24 24'
			fill='none'
			strokeWidth='1.5'
			strokeLinecap='round'
			strokeLinejoin='round'
			aria-hidden='true'
			{...props}
		>
			<path
				d='M2.75 7.75a3 3 0 0 1 3-3h12.5a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3H5.75a3 3 0 0 1-3-3v-8.5Z'
				className='fill-zinc-100/10 stroke-zinc-500'
			/>
			<path
				d='m4 6 6.024 5.479a2.915 2.915 0 0 0 3.952 0L20 6'
				className='stroke-zinc-500'
			/>
		</svg>
	)
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

function Newsletter() {
	return (
		<form
			action='/thank-you'
			className='rounded-2xl border border-zinc-700/40 p-6'
		>
			<h2 className='flex text-sm font-semibold text-zinc-100'>
				<MailIcon className='h-6 w-6 flex-none' />
				<span className='ml-3'>Restez informé</span>
			</h2>
			<p className='mt-2 text-sm text-zinc-400'>
				Recevez une notification à chaque nouvelle publication. Vous pouvez vous
				désinscrire à tout moment.
			</p>
			<div className='mt-6 flex'>
				<input
					type='email'
					placeholder='Adresse e-mail'
					aria-label='Email address'
					required
					className='min-w-0 flex-auto appearance-none rounded-md border border-zinc-700 bg-zinc-800 px-3 py-[calc(theme(spacing.2)-1px)] shadow-md shadow-zinc-800/5 placeholder:text-zinc-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10 focus:outline-none sm:text-sm'
				/>
				<Button type='submit' className='ml-4 flex-none'>
					Rejoindre
				</Button>
			</div>
		</form>
	)
}

function BookCoverPlaceholder() {
	return (
		<div className='group relative'>
			<div className='aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-800 shadow-lg'>
				{/* Placeholder for the book cover */}
				<div className='flex h-full w-full items-center justify-center'>
					<div className='text-center text-zinc-400'>
						<p className='text-2xl font-bold'>Cœurs Sombres</p>
						<p className='mt-2 text-lg'>Esperance Masson</p>
					</div>
				</div>
			</div>
		</div>
	)
}

function CoeursSombres() {
	return (
		<div className='flex flex-col gap-y-6 rounded-2xl border border-zinc-700/40 p-6'>
			<div>
				<h2 className='text-lg font-semibold text-zinc-100'>Cœurs Sombres</h2>
				<p className='mt-2 text-sm text-zinc-400'>
					Fuyant un passé qui la hante, Angèle rêve de reprendre le contrôle de
					sa vie et part avec sa meilleure amie aux États-Unis pour tout
					recommencer. Mais sa quête de liberté vire au cauchemar lorsqu'elle
					tombe sous l'emprise de Lucas Ferrari, un chef de mafia aussi froid
					qu'impitoyable, prêt à tout pour assouvir une vengeance qui le
					consume.
				</p>
				<p className='mt-4 text-sm text-zinc-400'>
					Pris dans un jeu de pouvoir et de manipulation, tous deux découvrent
					qu'ils sont liés par des secrets capables de tout détruire.
				</p>
				<p className='mt-4 text-sm text-zinc-400'>
					Entre haine et attirance, leur lutte pour survivre pourrait bien les
					mener à leur perte. Succomberont-ils aux ténèbres du désir ou
					trouveront-ils enfin la paix au prix de leur âme ?
				</p>
			</div>

			<div>
				<h3 className='text-md font-semibold text-zinc-100'>
					Classements #1 sur Wattpad
				</h3>
				<div className='mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-zinc-400'>
					<p>
						#1{' '}
						<span className='font-semibold text-zinc-200'>
							ennemiestolovers
						</span>{' '}
						(24/04/2025)
					</p>
					<p>
						#1 <span className='font-semibold text-zinc-200'>amitiés</span>{' '}
						(28/04/2025)
					</p>
					<p>
						#1 <span className='font-semibold text-zinc-200'>trahisons</span>{' '}
						(26/05/2025)
					</p>
					<p>
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
							icon={WattpadIcon}
						/>
					</div>
				</div>
			</Container>

			<Container className='mt-24 md:mt-28'>
				<div className='mx-auto grid max-w-xl grid-cols-1 items-start gap-y-20 lg:max-w-none lg:grid-cols-2'>
					<div className='flex flex-col gap-16'>
						<BookCoverPlaceholder />
					</div>
					<div className='space-y-10 lg:pl-16 xl:pl-24'>
						<CoeursSombres />
						<Newsletter />
					</div>
				</div>
			</Container>
		</>
	)
}
