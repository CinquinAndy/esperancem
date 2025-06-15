import Link from 'next/link'

import { ContainerInner, ContainerOuter } from '@/components/Container'
import {
	InstagramIcon,
	TikTokIcon,
	WattpadIcon,
} from '@/components/SocialIcons'

function SocialLink({
	children,
	href,
	icon: Icon,
}: {
	href: string
	icon: React.ComponentType<{ className?: string }>
	children: React.ReactNode
}) {
	return (
		<Link
			href={href}
			className='group flex items-center text-sm font-medium text-zinc-200 transition hover:text-teal-400'
		>
			<Icon className='h-5 w-5 flex-none fill-zinc-500 transition group-hover:fill-teal-400' />
			<span className='ml-3'>{children}</span>
		</Link>
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

export function Footer() {
	return (
		<footer className='mt-32 flex-none'>
			<ContainerOuter>
				<div className='border-t border-zinc-700/40 pt-10 pb-16'>
					<ContainerInner>
						<div className='flex flex-col items-center justify-between gap-6 md:flex-row'>
							{/* Social Links */}
							<div className='flex flex-col items-center gap-4 md:items-start'>
								<div className='flex flex-wrap justify-center gap-6 md:justify-start'>
									<SocialLink
										href='https://www.instagram.com/esp_masson/'
										icon={InstagramIcon}
									>
										Instagram
									</SocialLink>
									<SocialLink
										href='https://www.tiktok.com/@_esperance_masson'
										icon={TikTokIcon}
									>
										TikTok
									</SocialLink>
									<SocialLink
										href='https://www.wattpad.com/user/Esperancem'
										icon={WattpadIcon}
									>
										Wattpad
									</SocialLink>
								</div>

								{/* Email Contact */}
								<Link
									href='mailto:esperance.masson@gmail.com'
									className='group flex items-center text-sm font-medium text-zinc-400 transition hover:text-teal-400'
								>
									<MailIcon className='h-4 w-4 flex-none fill-zinc-500 transition group-hover:fill-teal-400' />
									<span className='ml-2'>esperance.masson@gmail.com</span>
								</Link>
							</div>

							{/* Copyright */}
							<div className='flex flex-col items-center gap-2 text-center text-sm text-zinc-500 md:items-end md:text-right'>
								<p>&copy; {new Date().getFullYear()} Espérance masson</p>
								<p>
									All rights reserved.{' '}
									<span className='text-red-400'>Made with ♡</span> by{' '}
									<Link
										href='https://andy-cinquin.fr'
										target='_blank'
										rel='noopener noreferrer'
										className='font-medium text-zinc-400 underline transition hover:text-teal-400'
									>
										Cinquin Andy
									</Link>
								</p>
							</div>
						</div>
					</ContainerInner>
				</div>
			</ContainerOuter>
		</footer>
	)
}
