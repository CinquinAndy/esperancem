'use client'

import NumberFlow from '@number-flow/react'
import { useEffect, useState } from 'react'

import {
	useWattpadStats,
	WattpadStatsProvider,
} from '@/contexts/WattpadStatsContext'

interface StatItemProps {
	value: string
	label: string
	shouldAnimate?: boolean
}

function StatItem({ label, shouldAnimate = false, value }: StatItemProps) {
	const [displayValue, setDisplayValue] = useState(0)
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

	// Animation effect to start from 0 and animate to the real value
	useEffect(() => {
		if (shouldAnimate && numericValue > 0) {
			// Start from 0
			setDisplayValue(0)
			// After a short delay, animate to the real value
			const timer = setTimeout(() => {
				setDisplayValue(numericValue)
			}, 300) // 300ms delay before animation starts

			return () => clearTimeout(timer)
		} else {
			setDisplayValue(numericValue)
		}
	}, [numericValue, shouldAnimate])

	return (
		<div className='group flex flex-col items-center rounded-lg p-2 transition-all duration-300'>
			<div className='mb-1 text-2xl font-bold text-white'>
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
				{label}
			</div>
		</div>
	)
}

function WattpadStatsContent() {
	const { stats } = useWattpadStats()
	const [hasAnimated, setHasAnimated] = useState(false)

	// Trigger animation on first load when stats are available
	useEffect(() => {
		if (stats && !hasAnimated) {
			setHasAnimated(true)
		}
	}, [stats, hasAnimated])

	return (
		<div className='mx-auto w-full max-w-7xl'>
			{/* Stats Grid */}
			<div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
				<StatItem
					value={stats?.readsComplete ?? '0'}
					label='Lectures'
					shouldAnimate={hasAnimated}
				/>

				<StatItem
					value={stats?.votes ?? '0'}
					label={`J'aime`}
					shouldAnimate={hasAnimated}
				/>

				<StatItem
					value={stats?.parts ?? '0'}
					label='Chapitres'
					shouldAnimate={hasAnimated}
				/>
			</div>
		</div>
	)
}

export function WattpadStats() {
	return (
		<WattpadStatsProvider>
			<WattpadStatsContent />
		</WattpadStatsProvider>
	)
}
