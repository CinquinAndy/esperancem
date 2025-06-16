'use client'

import { useFormattedWattpadStats } from '@/hooks/useFormattedWattpadStats'

interface WattpadStatsTextProps {
	type: 'reads' | 'votes' | 'parts'
	fallback?: string
	prefix?: string
	suffix?: string
}

export function WattpadStatsText({
	fallback = '85k+',
	prefix = '',
	suffix = '',
	type,
}: WattpadStatsTextProps) {
	const { formattedParts, formattedReads, formattedVotes } =
		useFormattedWattpadStats()

	const getValue = () => {
		switch (type) {
			case 'reads':
				return formattedReads
			case 'votes':
				return formattedVotes
			case 'parts':
				return formattedParts
			default:
				return fallback
		}
	}

	return (
		<span>
			{prefix}
			{getValue()}
			{suffix}
		</span>
	)
}
