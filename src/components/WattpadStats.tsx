'use client'

import NumberFlow from '@number-flow/react'
import { useState } from 'react'

import { useWattpadStats } from '@/hooks/useWattpadStats'

import { Button } from './Button'

interface StatItemProps {
	icon: string
	value: string
	label: string
	loading?: boolean
}

function StatItem({ icon, label, loading, value }: StatItemProps) {
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
		<div className='group flex flex-col items-center rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/20'>
			<div className='mb-2 text-2xl transition-transform duration-300 group-hover:scale-110'>
				{icon}
			</div>

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
						className='font-mono'
					/>
				)}
			</div>

			<div className='text-sm font-medium text-white/70'>{label}</div>
		</div>
	)
}

export function WattpadStats() {
	const { error, lastUpdated, loading, refreshStats, stats } = useWattpadStats()
	const [isRefreshing, setIsRefreshing] = useState(false)

	const handleRefresh = async () => {
		setIsRefreshing(true)
		await refreshStats()
		setIsRefreshing(false)
	}

	const formatLastUpdated = (date: Date | null) => {
		if (!date) return 'Never'
		const now = new Date()
		const diffInHours = Math.floor(
			(now.getTime() - date.getTime()) / (1000 * 60 * 60)
		)

		if (diffInHours < 1) return 'Just now'
		if (diffInHours === 1) return '1 hour ago'
		if (diffInHours < 24) return `${diffInHours} hours ago`

		const diffInDays = Math.floor(diffInHours / 24)
		if (diffInDays === 1) return '1 day ago'
		return `${diffInDays} days ago`
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
		<div className='mx-auto w-full max-w-4xl'>
			{/* Header */}
			<div className='mb-8 text-center'>
				<h2 className='mb-2 text-3xl font-bold text-white'>
					Wattpad Statistics
				</h2>
				<p className='text-white/60'>
					Live statistics from Esperance&apos;s Wattpad profile
				</p>

				{/* Last updated info */}
				<div className='mt-4 flex items-center justify-center gap-4 text-sm text-white/50'>
					<span>Last updated: {formatLastUpdated(lastUpdated)}</span>
					<Button
						onClick={handleRefresh}
						disabled={isRefreshing || loading}
						className='px-3 py-1 text-xs'
					>
						{isRefreshing ? (
							<div className='flex items-center gap-2'>
								<div className='h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white'></div>
								Refreshing...
							</div>
						) : (
							'Refresh'
						)}
					</Button>
				</div>
			</div>

			{/* Stats Grid */}
			<div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
				<StatItem
					icon='👁️'
					value={stats?.reads || '0'}
					label='Reads'
					loading={loading}
				/>

				<StatItem
					icon='❤️'
					value={stats?.votes || '0'}
					label='Votes'
					loading={loading}
				/>

				<StatItem
					icon='📚'
					value={stats?.parts || '0'}
					label='Chapters'
					loading={loading}
				/>
			</div>

			{/* Footer info */}
			<div className='mt-8 rounded-lg border border-white/10 bg-white/5 p-4 text-center'>
				<p className='text-sm text-white/60'>
					📊 Statistics are automatically updated every 24 hours to respect
					Wattpad&apos;s servers
				</p>
				<p className='mt-1 text-xs text-white/40'>
					Data is cached locally for better performance
				</p>
			</div>
		</div>
	)
}
