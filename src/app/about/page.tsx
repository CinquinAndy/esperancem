import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/Container'
import {
	InstagramIcon,
	TikTokIcon,
	WattpadIcon,
} from '@/components/SocialIcons'
import { WattpadStatsText } from '@/components/WattpadStatsText'
import { WattpadStatsProvider } from '@/contexts/WattpadStatsContext'
import portraitImage from '@/images/avatar.jpeg'
import bookCover from '@/images/photos/cover_on_book.jpg'
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

export const metadata: Metadata = {
	description:
		'Découvrez Espérance Masson, autrice française passionnée de dark romance. Créatrice du bestseller "Cœurs Sombres" sur Wattpad, elle explore les profondeurs de l\'âme humaine à travers des histoires intenses et captivantes. Suivez esp_masson sur Instagram et TikTok.',
	keywords: [
		'Espérance Masson biographie',
		'autrice française dark romance',
		'esp_masson Instagram',
		'écrivaine française Wattpad',
		'auteure Cœurs Sombres',
		'romancière française',
		'dark romance France',
		'@_esperance_masson TikTok',
		'autrice française 2024',
		'écrivaine romance sombre',
		'littérature française contemporaine',
		'romance française indépendante',
	],
	openGraph: {
		description:
			'Rencontrez Espérance Masson, l\'autrice derrière le phénomène "Cœurs Sombres". Une plume française qui excelle dans la dark romance et les romances sombres.',
		images: [
			{
				alt: "Portrait d'Espérance Masson, autrice de dark romance",
				height: 630,
				url: '/images/esperance-masson-portrait.jpg',
				width: 1200,
			},
		],
		title: "À propos d'Espérance Masson - Autrice de Cœurs Sombres",
		url: 'https://esperancem.fr/about',
	},
	title: "À propos d'Espérance Masson - Autrice Dark Romance | Cœurs Sombres",
}

export default async function About() {
	const initialStats = await fetchWattpadStats()

	return (
		<WattpadStatsProvider initialStats={initialStats}>
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
						<h1 className='text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl'>
							Je suis Espérance Masson, autrice française de dark romance
						</h1>
						<div className='mt-6 space-y-7 text-base text-zinc-400'>
							<p>Salut tout le monde ! J&apos;espère que vous allez bien.</p>
							<p>
								Bienvenue dans mon univers où j&apos;explore les profondeurs de
								l&apos;âme humaine à travers des dark romances françaises,
								intenses et captivantes. En tant qu&apos;autrice française
								spécialisée dans la romance sombre, je crée des histoires qui
								questionnent les limites entre l&apos;amour et l&apos;obsession.
							</p>
							<p>
								Mon roman &quot;Cœurs Sombres&quot; a conquis plus de{' '}
								<WattpadStatsText type='reads' suffix=' lecteurs' /> sur Wattpad
								et atteint la première place dans plusieurs catégories. Cette
								enemies to lovers mafia romance suit l&apos;histoire troublante
								d&apos;Angèle et Lucas Ferrari, deux âmes brisées liées par des
								secrets destructeurs.
							</p>
							<p>
								N&apos;hésitez pas à venir me retrouver sur mes réseaux sociaux
								(@esp_masson sur Instagram, @_esperance_masson sur TikTok) pour
								découvrir les coulisses de l&apos;écriture de mes romans et
								échanger avec d&apos;autres passionnés de dark romance
								française.
							</p>
						</div>
					</div>
					<div className='lg:pl-20'>
						<ul role='list'>
							<SocialLink
								href='https://www.instagram.com/esp_masson/'
								icon={InstagramIcon}
								className='mt-4'
							>
								Suivez-moi sur Instagram
							</SocialLink>
							<SocialLink
								href='https://www.tiktok.com/@_esperance_masson'
								icon={TikTokIcon}
								className='mt-4'
							>
								Suivez-moi sur TikTok
							</SocialLink>
							<SocialLink
								href='https://www.wattpad.com/user/Esperancem'
								icon={WattpadIcon}
								className='mt-4'
							>
								Découvrez mes écrits sur Wattpad
							</SocialLink>
							<li className='mt-8 border-t border-zinc-700/40 pt-8'>
								<SocialLink
									href='mailto:esperance.masson@gmail.com'
									icon={MailIcon}
									className='items-center'
								>
									esperance.masson@gmail.com
								</SocialLink>
							</li>
						</ul>
					</div>
				</div>
			</Container>

			{/* Book section */}
			<Container className='mt-24 sm:mt-32'>
				<div className='mx-auto max-w-2xl lg:max-w-5xl'>
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
									blurDataURL='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGBkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZEYGTrHWJ2PNgHr3nz8CBAw+lFhpX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZEYGTrHWJ2PNgHr3nz8CBAw+lFhpX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZEYGTrHWJ2PNgHr3nz8CBAw+lFhpX2HaH9bcfaSXWGaRmknyLli2A4Haw6gZ'
									unoptimized={false}
									width={320}
									height={480}
								/>
								{/* Subtle glow effect */}
								<div className='absolute -inset-0.5 -z-10 rounded-xl bg-gradient-to-br from-red-500/10 via-purple-500/5 to-zinc-500/5 opacity-75 blur-sm' />
							</div>
						</div>
						<div className='lg:pl-8'>
							<h2 className='text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl'>
								Cœurs Sombres - Mon bestseller Wattpad
							</h2>
							<div className='mt-6 space-y-6 text-base text-zinc-400'>
								<p>
									<span className='text-zinc-200 italic'>Cœurs Sombres</span>{' '}
									est né d&apos;une passion pour les histoires complexes où
									l&apos;amour et la violence s&apos;entremêlent dans une dark
									romance française captivante.
								</p>
								<p>
									Cette dark romance explore les zones grises de l&apos;âme
									humaine, là où la rédemption et la destruction se côtoient
									dans un équilibre fragile. L&apos;histoire d&apos;Angèle et
									Lucas Ferrari plonge les lecteurs dans un univers de mafia
									romance où l&apos;enemies to lovers prend une dimension
									particulièrement intense.
								</p>
								<p>
									Disponible gratuitement sur Wattpad, ce livre a déjà conquis
									plus de <WattpadStatsText type='reads' suffix=' lecteurs' />{' '}
									et obtenu plusieurs classements #1 dans les catégories enemies
									to lovers, trahisons, meurtres et amitiés. Cette romance
									française sombre continue de captiver de nouveaux lecteurs
									chaque jour.
								</p>
								<p>
									<strong>Suivez-moi :</strong> @esp_masson sur Instagram et
									@_esperance_masson sur TikTok pour découvrir les coulisses de
									l&apos;écriture et mes prochains projets de dark romance.
								</p>
							</div>
						</div>
					</div>
				</div>
			</Container>
		</WattpadStatsProvider>
	)
}
