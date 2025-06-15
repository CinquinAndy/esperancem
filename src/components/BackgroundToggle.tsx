'use client'

import { useState, useEffect } from 'react'

export function BackgroundToggle() {
	const [animationEnabled, setAnimationEnabled] = useState(true)

	useEffect(() => {
		// Check for user preference or reduced motion preference
		const prefersReducedMotion = window.matchMedia(
			'(prefers-reduced-motion: reduce)'
		).matches
		const savedPreference = localStorage.getItem('turbulent-background-enabled')

		if (savedPreference !== null) {
			setAnimationEnabled(JSON.parse(savedPreference))
		} else if (prefersReducedMotion) {
			setAnimationEnabled(false)
		}
	}, [])

	const toggleAnimation = () => {
		const newState = !animationEnabled
		setAnimationEnabled(newState)
		localStorage.setItem(
			'turbulent-background-enabled',
			JSON.stringify(newState)
		)

		// Toggle visibility of the canvas
		const canvas = document.querySelector(
			'[data-turbulent-background]'
		) as HTMLCanvasElement
		if (canvas) {
			canvas.style.display = newState ? 'block' : 'none'
		}
	}

	return (
		<button
			onClick={toggleAnimation}
			className='fixed right-4 bottom-4 z-50 rounded-full bg-zinc-900/80 p-2 text-zinc-400 ring-1 ring-zinc-700/50 backdrop-blur-sm transition-all hover:bg-zinc-800/80 hover:text-zinc-300'
			title={
				animationEnabled ? "Désactiver l'animation" : "Activer l'animation"
			}
		>
			<svg
				className='h-5 w-5'
				fill='none'
				stroke='currentColor'
				viewBox='0 0 24 24'
			>
				{animationEnabled ? (
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth={2}
						d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
					/>
				) : (
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth={2}
						d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
					/>
				)}
			</svg>
		</button>
	)
}
