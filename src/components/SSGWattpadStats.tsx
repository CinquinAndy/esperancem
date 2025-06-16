import { formatWattpadStatExact } from '@/lib/wattpad'

interface WattpadStats {
	reads: string
	votes: string
	parts: string
	lastUpdated: number
}

interface SSGWattpadStatsProps {
	stats: WattpadStats | null
}

interface StatItemProps {
	value: string
	label: string
	isExact?: boolean
}

function StatItem({ isExact = false, label, value }: StatItemProps) {
	// Format the display value
	const getDisplayValue = (val: string): string => {
		if (!val || val === '0') return isExact ? '85,000' : '85'

		if (isExact) {
			return formatWattpadStatExact(val)
		}

		return val
	}

	const displayValue = getDisplayValue(value)

	return (
		<div className='group flex flex-col items-center rounded-lg p-2 transition-all duration-300'>
			<div className='mb-1 text-2xl font-bold text-white'>
				<span className='font-alex-brush text-6xl'>{displayValue}</span>
			</div>
			<div className='font-mono text-lg font-medium text-white/70 italic'>
				{label}
			</div>
		</div>
	)
}

export function SSGWattpadStats({ stats }: SSGWattpadStatsProps) {
	return (
		<div className='mx-auto w-full max-w-7xl'>
			{/* Stats Grid */}
			<div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
				<StatItem
					value={stats?.reads ?? '85k'}
					label='Lectures'
					isExact={true}
				/>

				<StatItem
					value={stats?.votes ?? '5k'}
					label={`J'aime`}
					isExact={true}
				/>

				<StatItem
					value={stats?.parts ?? '50'}
					label='Chapitres'
					isExact={false}
				/>
			</div>
		</div>
	)
}
