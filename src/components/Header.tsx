'use client'

import {
	Popover,
	PopoverButton,
	PopoverBackdrop,
	PopoverPanel,
} from '@headlessui/react'
import clsx from 'clsx'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { Container } from '@/components/Container'
import avatarImage from '@/images/avatar.jpg'

function CloseIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
	return (
		<svg viewBox='0 0 24 24' aria-hidden='true' {...props}>
			<path
				d='m17.25 6.75-10.5 10.5M6.75 6.75l10.5 10.5'
				fill='none'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
		</svg>
	)
}

function ChevronDownIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
	return (
		<svg viewBox='0 0 8 6' aria-hidden='true' {...props}>
			<path
				d='M1.75 1.75 4 4.25l2.25-2.5'
				fill='none'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
		</svg>
	)
}

function MobileNavItem({
	children,
	href,
}: {
	href: string
	children: React.ReactNode
}) {
	return (
		<li>
			<PopoverButton as={Link} href={href} className='block py-2'>
				{children}
			</PopoverButton>
		</li>
	)
}

function MobileNavigation(
	props: React.ComponentPropsWithoutRef<typeof Popover>
) {
	return (
		<Popover {...props}>
			<PopoverButton className='group flex items-center rounded-full bg-zinc-800/90 px-4 py-2 text-sm font-medium text-zinc-200 ring-1 ring-white/10 backdrop-blur-sm hover:ring-white/20'>
				Menu
				<ChevronDownIcon className='ml-3 h-auto w-2 stroke-zinc-500 group-hover:stroke-zinc-400' />
			</PopoverButton>
			<PopoverBackdrop
				transition
				className='fixed inset-0 z-50 bg-black/80 backdrop-blur-xs duration-150 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in'
			/>
			<PopoverPanel
				focus
				transition
				className='fixed inset-x-4 top-8 z-50 origin-top rounded-3xl bg-zinc-900 p-8 ring-1 ring-zinc-800 duration-150 data-closed:scale-95 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in'
			>
				<div className='flex flex-row-reverse items-center justify-between'>
					<PopoverButton aria-label='Close menu' className='-m-1 p-1'>
						<CloseIcon className='h-6 w-6 text-zinc-400' />
					</PopoverButton>
					<h2 className='text-sm font-medium text-zinc-400'>Navigation</h2>
				</div>
				<nav className='mt-6'>
					<ul className='-my-2 divide-y divide-zinc-100/5 text-base text-zinc-300'>
						<MobileNavItem href='/about'>About</MobileNavItem>
						<MobileNavItem href='/articles'>Articles</MobileNavItem>
						<MobileNavItem href='/projects'>Projects</MobileNavItem>
						<MobileNavItem href='/speaking'>Speaking</MobileNavItem>
						<MobileNavItem href='/uses'>Uses</MobileNavItem>
					</ul>
				</nav>
			</PopoverPanel>
		</Popover>
	)
}

function NavItem({
	children,
	href,
}: {
	href: string
	children: React.ReactNode
}) {
	const isActive = usePathname() === href

	return (
		<li>
			<Link
				href={href}
				className={clsx(
					'relative block px-3 py-2 transition',
					isActive ? 'text-teal-400' : 'hover:text-teal-400'
				)}
			>
				{children}
				{isActive && (
					<span className='absolute inset-x-1 -bottom-px h-px bg-linear-to-r from-teal-400/0 via-teal-400/40 to-teal-400/0' />
				)}
			</Link>
		</li>
	)
}

function DesktopNavigation(props: React.ComponentPropsWithoutRef<'nav'>) {
	return (
		<nav {...props}>
			<ul className='flex rounded-full bg-zinc-800/90 px-3 text-sm font-medium text-zinc-200 shadow-lg ring-1 ring-white/10 backdrop-blur-sm'>
				<NavItem href='/about'>About</NavItem>
				<NavItem href='/articles'>Articles</NavItem>
				<NavItem href='/projects'>Projects</NavItem>
				<NavItem href='/speaking'>Speaking</NavItem>
				<NavItem href='/uses'>Uses</NavItem>
			</ul>
		</nav>
	)
}

function clamp(number: number, a: number, b: number) {
	const min = Math.min(a, b)
	const max = Math.max(a, b)
	return Math.min(Math.max(number, min), max)
}

function AvatarContainer({
	className,
	...props
}: React.ComponentPropsWithoutRef<'div'>) {
	return (
		<div
			className={clsx(
				className,
				'h-10 w-10 rounded-full bg-zinc-800/90 p-0.5 shadow-lg ring-1 ring-white/10 backdrop-blur-sm'
			)}
			{...props}
		/>
	)
}

function Avatar({
	className,
	large = false,
	...props
}: Omit<React.ComponentPropsWithoutRef<typeof Link>, 'href'> & {
	large?: boolean
}) {
	return (
		<Link
			href='/'
			aria-label='Home'
			className={clsx(className, 'pointer-events-auto')}
			{...props}
		>
			<Image
				src={avatarImage}
				alt=''
				sizes={large ? '4rem' : '2.25rem'}
				className={clsx(
					'rounded-full bg-zinc-800 object-cover',
					large ? 'h-16 w-16' : 'h-9 w-9'
				)}
				priority
			/>
		</Link>
	)
}

export function Header() {
	const isHomePage = usePathname() === '/'

	const headerRef = useRef<React.ElementRef<'div'>>(null)
	const avatarRef = useRef<React.ElementRef<'div'>>(null)
	const isInitial = useRef(true)

	useEffect(() => {
		const downDelay = avatarRef.current?.offsetTop ?? 0
		const upDelay = 64

		function setProperty(property: string, value: string) {
			document.documentElement.style.setProperty(property, value)
		}

		function removeProperty(property: string) {
			document.documentElement.style.removeProperty(property)
		}

		function updateHeaderStyles() {
			if (!headerRef.current) {
				return
			}

			const { height, top } = headerRef.current.getBoundingClientRect()
			const scrollY = clamp(
				window.scrollY,
				0,
				document.body.scrollHeight - window.innerHeight
			)

			if (isInitial.current) {
				setProperty('--header-position', 'sticky')
			}

			setProperty('--content-offset', `${downDelay}px`)

			if (isInitial.current || scrollY < downDelay) {
				setProperty('--header-height', `${downDelay + height}px`)
				setProperty('--header-mb', `${-downDelay}px`)
			} else if (top + height < -upDelay) {
				const offset = Math.max(height, scrollY - upDelay)
				setProperty('--header-height', `${offset}px`)
				setProperty('--header-mb', `${height - offset}px`)
			} else if (top === 0) {
				setProperty('--header-height', `${scrollY + height}px`)
				setProperty('--header-mb', `${-scrollY}px`)
			}

			if (top === 0 && scrollY > 0 && scrollY >= downDelay) {
				setProperty('--header-inner-position', 'fixed')
				removeProperty('--header-top')
				removeProperty('--avatar-top')
			} else {
				removeProperty('--header-inner-position')
				setProperty('--header-top', '0px')
				setProperty('--avatar-top', '0px')
			}
		}

		function updateAvatarStyles() {
			if (!isHomePage) {
				return
			}

			const fromScale = 1
			const toScale = 36 / 64
			const fromX = 0
			const toX = 2 / 16

			const scrollY = downDelay - window.scrollY

			let scale = (scrollY * (fromScale - toScale)) / downDelay + toScale
			scale = clamp(scale, fromScale, toScale)

			let x = (scrollY * (fromX - toX)) / downDelay + toX
			x = clamp(x, fromX, toX)

			setProperty(
				'--avatar-image-transform',
				`translate3d(${x}rem, 0, 0) scale(${scale})`
			)

			const borderScale = 1 / (toScale / scale)
			const borderX = (-toX + x) * borderScale
			const borderTransform = `translate3d(${borderX}rem, 0, 0) scale(${borderScale})`

			setProperty('--avatar-border-transform', borderTransform)
			setProperty('--avatar-border-opacity', scale === toScale ? '1' : '0')
		}

		function updateStyles() {
			updateHeaderStyles()
			updateAvatarStyles()
			isInitial.current = false
		}

		updateStyles()
		window.addEventListener('scroll', updateStyles, { passive: true })
		window.addEventListener('resize', updateStyles)

		return () => {
			window.removeEventListener('scroll', updateStyles)
			window.removeEventListener('resize', updateStyles)
		}
	}, [isHomePage])

	return (
		<>
			<header
				className='pointer-events-none relative z-50 flex flex-none flex-col'
				style={{
					height: 'var(--header-height)',
					marginBottom: 'var(--header-mb)',
				}}
			>
				{isHomePage && (
					<>
						<div
							ref={avatarRef}
							className='order-last mt-[calc(--spacing(16)-(--spacing(3)))]'
						/>
						<Container
							className='top-0 order-last -mb-3 pt-3'
							style={{
								position:
									'var(--header-position)' as React.CSSProperties['position'],
							}}
						>
							<div
								className='top-(--avatar-top,--spacing(3)) w-full'
								style={{
									position:
										'var(--header-inner-position)' as React.CSSProperties['position'],
								}}
							>
								<div className='relative'>
									<AvatarContainer
										className='absolute top-3 left-0 origin-left transition-opacity'
										style={{
											opacity: 'var(--avatar-border-opacity, 0)',
											transform: 'var(--avatar-border-transform)',
										}}
									/>
									<Avatar
										large
										className='block h-16 w-16 origin-left'
										style={{ transform: 'var(--avatar-image-transform)' }}
									/>
								</div>
							</div>
						</Container>
					</>
				)}
				<div
					ref={headerRef}
					className='top-0 z-10 h-16 pt-6'
					style={{
						position:
							'var(--header-position)' as React.CSSProperties['position'],
					}}
				>
					<Container
						className='top-(--header-top,--spacing(6)) w-full'
						style={{
							position:
								'var(--header-inner-position)' as React.CSSProperties['position'],
						}}
					>
						<div className='relative flex gap-4'>
							<div className='flex flex-1'>
								{!isHomePage && (
									<AvatarContainer>
										<Avatar />
									</AvatarContainer>
								)}
							</div>
							<div className='flex flex-1 justify-end md:justify-center'>
								<MobileNavigation className='pointer-events-auto md:hidden' />
								<DesktopNavigation className='pointer-events-auto hidden md:block' />
							</div>
							<div className='flex justify-end md:flex-1'>
								<div className='pointer-events-auto' />
							</div>
						</div>
					</Container>
				</div>
			</header>
			{isHomePage && (
				<div
					className='flex-none'
					style={{ height: 'var(--content-offset)' }}
				/>
			)}
		</>
	)
}
