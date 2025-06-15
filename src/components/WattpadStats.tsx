'use client'

import NumberFlow from '@number-flow/react'
import { useState } from 'react'

import { useWattpadStats } from '@/hooks/useWattpadStats'

import { Button } from './Button'

interface StatItemProps {
	value: string
	label: string
	loading?: boolean
}

function StatItem({ label, loading, value }: StatItemProps) {
	// Convert value to number for animation (handle K, M suffixes)
	const getNumericValue = (val: string): number => {
		if (!val || val === '0') return 0
		const num = parseFloat(val.replace(/[KMB]/i, ''))
		const suffix = val.slice(-1).toUpperCase()

		switch (suffix) {
			case 'K':
				return num * 1000
			case 'M':
				return num * 1000000
			case 'B':
				return num * 1000000000
			default:
				return parseFloat(val) || 0
		}
	}

	const numericValue = getNumericValue(value)

	return (
		<div className='group flex flex-col items-center rounded-lg p-2 transition-all duration-300'>
			<div className='mb-1 text-2xl font-bold text-white'>
				{loading ? (
					<div className='h-8 w-16 animate-pulse rounded bg-white/20'></div>
				) : (
					<NumberFlow
						value={numericValue}
						format={{
							maximumFractionDigits: 1,
							notation: numericValue >= 1000 ? 'compact' : 'standard',
						}}
						locales='en-US'
						className='font-mono text-6xl'
					/>
				)}
			</div>

			<div className='text-sm font-medium text-white/70 italic'>{label}</div>
		</div>
	)
}

export function WattpadStats() {
	const { error, loading, refreshStats, stats } = useWattpadStats()
	const [isRefreshing, setIsRefreshing] = useState(false)

	const handleRefresh = async () => {
		setIsRefreshing(true)
		await refreshStats()
		setIsRefreshing(false)
	}

	if (error && !stats) {
		return (
			<div className='p-8 text-center'>
				<div className='mb-4 text-red-400'>
					<svg
						className='mx-auto mb-2 h-12 w-12'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
						/>
					</svg>
					<p className='font-medium text-white'>Failed to load Wattpad stats</p>
					<p className='mt-1 text-sm text-white/60'>{error}</p>
				</div>
				<Button onClick={handleRefresh} disabled={isRefreshing}>
					{isRefreshing ? 'Retrying...' : 'Try Again'}
				</Button>
			</div>
		)
	}

	return (
		<div className='mx-auto w-full max-w-7xl'>
			{/* Stats Grid */}
			<div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
				<StatItem
					value={stats?.reads || '0'}
					label='Lectures'
					loading={loading}
				/>

				<StatItem
					value={stats?.votes || '0'}
					label={`J'aime`}
					loading={loading}
				/>

				<StatItem
					value={stats?.parts || '0'}
					label='Chapitres'
					loading={loading}
				/>
			</div>
		</div>
	)
}
