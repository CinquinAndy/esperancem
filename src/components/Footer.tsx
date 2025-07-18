import Link from 'next/link'

import { ContainerInner, ContainerOuter } from '@/components/Container'
import {
	InstagramIcon,
	TikTokIcon,
	WattpadIcon,
	EmailIcon,
} from '@/components/SocialIcons'
import { getSocialLinks, getLayoutContent } from '@/lib/content'

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

export async function Footer() {
	// Fetch social links and layout content from PocketBase
	const [socialLinks, layoutContent] = await Promise.all([
		getSocialLinks(),
		getLayoutContent(),
	])

	return (
		<footer className='mt-32 flex-none'>
			<ContainerOuter>
				<div className='border-t border-zinc-700/40 pt-10 pb-16'>
					<ContainerInner>
						<div className='flex flex-col items-center justify-between gap-6 md:flex-row'>
							{/* Social Links */}
							<div className='flex flex-col items-center gap-4 md:items-start'>
								<div className='flex flex-wrap justify-center gap-6 md:justify-start'>
									{socialLinks.map(link => {
										const Icon = getIconComponent(link.icon)
										return (
											<SocialLink
												key={link.platform}
												href={link.url}
												icon={Icon}
											>
												<span
													dangerouslySetInnerHTML={{
														__html: link.display_name,
													}}
												/>
											</SocialLink>
										)
									})}
								</div>

								{/* Email Contact */}
								<Link
									href='mailto:esperance.masson@gmail.com'
									className='group flex items-center text-sm font-medium text-zinc-400 transition hover:text-teal-400'
								>
									<EmailIcon className='h-4 w-4 flex-none fill-zinc-500 transition group-hover:fill-teal-400' />
									<span className='ml-2'>esperance.masson@gmail.com</span>
								</Link>
							</div>

							{/* Copyright */}
							<div
								className='flex flex-col items-center gap-2 text-center text-sm text-zinc-500 md:items-end md:text-right'
								dangerouslySetInnerHTML={{ __html: layoutContent.copyright }}
							/>
						</div>
					</ContainerInner>
				</div>
			</ContainerOuter>
		</footer>
	)
}
