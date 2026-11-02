'use client'

import NumberFlow from '@number-flow/react'
import { useEffect, useRef, useState } from 'react'

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

function StatItem({ label, value }: StatItemProps) {
	const [displayValue, setDisplayValue] = useState(0)
	const revealed = useRef(false)
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

	// Même animation qu'avant : le compteur part de 0 et monte vers la vraie valeur après 300 ms.
	// Les chiffres arrivent maintenant avec la page (plus d'attente d'un appel réseau) et ne
	// redescendent jamais à 0 ensuite.
	useEffect(() => {
		if (numericValue <= 0) return
		if (revealed.current) {
			setDisplayValue(numericValue)
			return
		}
		const timer = setTimeout(() => {
			revealed.current = true
			setDisplayValue(numericValue)
		}, 300) // 300ms delay before animation starts
		return () => clearTimeout(timer)
	}, [numericValue])

	return (
		<div className='group flex flex-col items-center rounded-lg p-2 transition-all duration-300'>
			{/* Le compteur animé est décoratif ; la vraie valeur est lue dans le texte masqué ci-dessous. */}
			<div className='mb-1 text-2xl font-bold text-white' aria-hidden='true'>
				<NumberFlow
					value={displayValue}
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
