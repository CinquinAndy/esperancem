'use client'

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react'

import type { BookType } from '@/lib/pocketbase'

export type StatsType = 'total' | BookType

interface WattpadStats {
	lastUpdated: number
	parts: string
	reads: string
	readsComplete: string
	votes: string
}

interface WattpadStatsContextType {
	error: string | null
	loading: boolean
	refresh: () => void
	stats: WattpadStats | null
}

const WattpadStatsContext = createContext<WattpadStatsContextType | null>(null)

interface WattpadStatsProviderProps {
	children: React.ReactNode
	initialStats?: WattpadStats | null
	statsType: StatsType
}

export function WattpadStatsProvider({
	children,
	initialStats,
	statsType,
}: WattpadStatsProviderProps) {
	const [stats, setStats] = useState<WattpadStats | null>(initialStats || null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchStats = useCallback(async () => {
		setLoading(true)
		setError(null)

		try {
			let url: string
			if (statsType === 'total') {
				url = '/api/wattpad-stats/total'
			} else {
				url = `/api/wattpad-stats/${statsType}`
			}

			const response = await fetch(url)
			const data = await response.json()

			if (data.success && data.data) {
				setStats(data.data)
			} else {
				setError(data.error || 'Failed to fetch stats')
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error')
		} finally {
			setLoading(false)
		}
	}, [statsType])

	const refresh = () => {
		fetchStats()
	}

	useEffect(() => {
		if (!initialStats) {
			fetchStats()
		}
	}, [fetchStats, initialStats])

	useEffect(() => {
		// Refresh stats every 5 minutes
		const interval = setInterval(fetchStats, 5 * 60 * 1000)
		return () => clearInterval(interval)
	}, [fetchStats])

	return (
		<WattpadStatsContext.Provider value={{ error, loading, refresh, stats }}>
			{children}
		</WattpadStatsContext.Provider>
	)
}

export function useWattpadStats() {
	const context = useContext(WattpadStatsContext)
	if (!context) {
		throw new Error(
			'useWattpadStats must be used within a WattpadStatsProvider'
		)
	}
	return context
}
