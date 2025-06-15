'use client'

import NumberFlow from '@number-flow/react'

import { useWattpadStats } from '@/contexts/WattpadStatsContext'

interface StatItemProps {
	value: string
	label: string
}

function StatItem({ label, value }: StatItemProps) {
	// Convert value to number for animation (handle K, M suffixes)
	const getNumericValue = (val: string): number => {
		if (!val || val === '0') return 0
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

	return (
		<div className='group flex flex-col items-center rounded-lg p-2 transition-all duration-300'>
			<div className='mb-1 text-2xl font-bold text-white'>
				<NumberFlow
					value={numericValue}
					format={{
						maximumFractionDigits: 1,
						notation: 'standard',
					}}
					transformTiming={{
						duration: 1000,
						easing: 'ease-in-out',
					}}
					locales='en-US'
					className='font-alex-brush text-6xl'
				/>
			</div>
			<div className='font-mono text-lg font-medium text-white/70 italic'>
				{label}
			</div>
		</div>
	)
}

export function WattpadStats() {
	const { stats } = useWattpadStats()

	return (
		<div className='mx-auto w-full max-w-7xl'>
			{/* Stats Grid */}
			<div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
				<StatItem value={stats?.reads ?? '0'} label='Lectures' />

				<StatItem value={stats?.votes ?? '0'} label={`J'aime`} />

				<StatItem value={stats?.parts ?? '0'} label='Chapitres' />
			</div>
		</div>
	)
}
