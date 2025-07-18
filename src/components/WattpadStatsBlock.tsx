import { formatWattpadStatExact } from '@/lib/wattpad'

interface WattpadStatsBlockProps {
	className?: string
	parts: string
	reads: string
	title?: string
	votes: string
}

export function WattpadStatsBlock({
	className = '',
	parts,
	reads,
	title,
	votes,
}: WattpadStatsBlockProps) {
	return (
		<div
			className={`flex flex-col items-center rounded-2xl border border-zinc-700/40 bg-zinc-900/60 p-6 shadow-lg ${className}`}
		>
			{title && (
				<div className='mb-2 text-lg font-bold text-zinc-100'>{title}</div>
			)}
			<div className='flex flex-row gap-8'>
				<div className='flex flex-col items-center'>
					<div className='text-3xl font-extrabold text-orange-400'>
						{formatWattpadStatExact(reads)}
					</div>
					<div className='text-sm text-zinc-400'>Lectures</div>
				</div>
				<div className='flex flex-col items-center'>
					<div className='text-3xl font-extrabold text-purple-400'>
						{formatWattpadStatExact(votes)}
					</div>
					<div className='text-sm text-zinc-400'>Votes</div>
				</div>
				<div className='flex flex-col items-center'>
					<div className='text-3xl font-extrabold text-blue-400'>
						{formatWattpadStatExact(parts)}
					</div>
					<div className='text-sm text-zinc-400'>Chapitres</div>
				</div>
			</div>
		</div>
	)
}
