'use client'

import NumberFlow from '@number-flow/react'
import { type RefObject, useEffect, useRef, useState } from 'react'

import {
	useWattpadStats,
	WattpadStatsProvider,
	type StatsType,
	type WattpadStatsData,
} from '@/contexts/WattpadStatsContext'

interface StatItemProps {
	value: string
	label: string
}

// « 366 177 » avec espaces insécables : identique côté serveur et navigateur (pas d'écart d'hydratation).
function formatExact(value: number): string {
	return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')
}

/** Délai avant le comptage, une fois le compteur à l'écran (comme l'ancienne animation au chargement). */
const COUNT_DELAY_MS = 300

/**
 * Valeur montrée par le compteur. Elle part de la vraie valeur : le HTML serveur porte les vrais chiffres,
 * et un compteur déjà visible au chargement ne passe jamais par 0. Un compteur hors écran au chargement
 * est remis à 0 sans animation (personne ne le voit), puis compte jusqu'à la vraie valeur quand il entre
 * à l'écran. Sans IntersectionObserver ou avec « réduire les animations » : la vraie valeur, sans plus.
 */
function useCountUp(target: number, ref: RefObject<HTMLElement | null>) {
	const [shown, setShown] = useState({ animated: true, value: target })
	// idle : rien décidé ; waiting : remis à 0 hors écran, attend d'être vu ; done : suit la vraie valeur.
	const phase = useRef<'idle' | 'waiting' | 'done'>('idle')
	const latest = useRef(target)
	latest.current = target

	useEffect(() => {
		const el = ref.current
		if (
			!el ||
			typeof IntersectionObserver === 'undefined' ||
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
		) {
			phase.current = 'done'
			return
		}
		let timer: ReturnType<typeof setTimeout> | undefined
		let first = true
		const observer = new IntersectionObserver(([entry]) => {
			if (first) {
				first = false
				if (entry.isIntersecting || latest.current <= 0) {
					phase.current = 'done'
					observer.disconnect()
					return
				}
				phase.current = 'waiting'
				setShown({ animated: false, value: 0 })
				return
			}
			if (entry.isIntersecting && phase.current === 'waiting') {
				observer.disconnect()
				timer = setTimeout(() => {
					phase.current = 'done'
					setShown({ animated: true, value: latest.current })
				}, COUNT_DELAY_MS)
			}
		})
		observer.observe(el)
		return () => {
			observer.disconnect()
			clearTimeout(timer)
		}
	}, [ref])

	// Nouveaux chiffres (rafraîchissement toutes les 5 min) : le compteur passe de l'ancienne à la nouvelle.
	useEffect(() => {
		if (phase.current === 'waiting') return
		setShown(current =>
			current.animated && current.value === target
				? current
				: { animated: true, value: target }
		)
	}, [target])

	return shown
}

function StatItem({ label, value }: StatItemProps) {
	const counter = useRef<HTMLDivElement>(null)
	// Convert value to number for animation (handle exact numbers and K, M suffixes)
	const getNumericValue = (val: string): number => {
		if (!val || val === '0') return 0

		// If value is already a plain number (exact from API), use it directly
		const plainNumber = parseInt(val.replace(/[^\d]/g, ''))
		if (!isNaN(plainNumber) && plainNumber > 0 && !/[kmb]/i.test(val)) {
			return plainNumber
		}

		// Handle K, M, B suffixes as fallback
		const num = parseFloat(val.replace(/[kmb]/i, ''))
		const suffix = val.slice(-1).toLowerCase()

		switch (suffix) {
			case 'k':
				return num * 1000
			case 'm':
				return num * 1000000
			case 'b':
				return num * 1000000000
			default:
				return parseFloat(val) || 0
		}
	}

	const numericValue = getNumericValue(value)
	const shown = useCountUp(numericValue, counter)

	return (
		<div className='group flex flex-col items-center rounded-lg p-2 transition-all duration-300'>
			{/* Le compteur animé est décoratif ; la vraie valeur est lue dans le texte masqué ci-dessous. */}
			<div
				ref={counter}
				className='mb-1 text-2xl font-bold text-white'
				aria-hidden='true'
			>
				<NumberFlow
					value={shown.value}
					animated={shown.animated}
					format={{
						maximumFractionDigits: 0,
						notation: 'standard',
						useGrouping: true,
					}}
					transformTiming={{
						duration: 1000,
						easing: 'ease-in-out',
					}}
					locales='fr-FR'
					className='font-alex-brush text-6xl'
				/>
			</div>
			<div className='font-mono text-lg font-medium text-white/70 italic'>
				{numericValue > 0 && (
					<span className='sr-only'>{formatExact(numericValue)} </span>
				)}
				{label}
			</div>
		</div>
	)
}

function WattpadStatsContent() {
	const { stats } = useWattpadStats()

	return (
		<div className='mx-auto w-full max-w-7xl'>
			{/* Stats Grid */}
			<div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
				<StatItem value={stats?.readsComplete ?? '0'} label='Lectures' />

				<StatItem value={stats?.votes ?? '0'} label={`Votes`} />

				<StatItem value={stats?.parts ?? '0'} label='Chapitres' />
			</div>
		</div>
	)
}

interface WattpadStatsProps {
	className?: string
	/** Chiffres connus côté serveur : présents dès le premier rendu, sans appel réseau. */
	initialStats?: WattpadStatsData | null
	statsType: StatsType
	title?: string
}

export function WattpadStats({
	className = '',
	initialStats,
	statsType,
	title,
}: WattpadStatsProps) {
	return (
		<div className={className}>
			{title && (
				<div className='mb-6 text-center'>
					<h2 className='text-2xl font-bold text-zinc-100'>{title}</h2>
				</div>
			)}
			<WattpadStatsProvider statsType={statsType} initialStats={initialStats}>
				<WattpadStatsContent />
			</WattpadStatsProvider>
		</div>
	)
}
