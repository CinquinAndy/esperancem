'use client'

import { useWattpadStats } from '@/contexts/WattpadStatsContext'
import { formatWattpadStat } from '@/lib/wattpad'

export function useFormattedWattpadStats() {
	const { error, loading, stats } = useWattpadStats()

	const formattedReads = stats?.reads ? formatWattpadStat(stats.reads) : '85k+'
	const formattedVotes = stats?.votes ? formatWattpadStat(stats.votes) : '5k+'
	const formattedParts = stats?.parts || '50+'

	return {
		error,
		formattedParts,
		formattedReads,
		formattedVotes,
		loading,
		rawStats: stats,
	}
}
