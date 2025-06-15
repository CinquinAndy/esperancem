'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface WattpadStats {
	reads: string
	votes: string
	parts: string
	lastUpdated: number
}

interface WattpadStatsContextType {
	stats: WattpadStats | null
	loading: boolean
	error: string | null
	refreshStats: () => Promise<void>
	lastUpdated: Date | null
}

const WattpadStatsContext = createContext<WattpadStatsContextType | undefined>(
	undefined
)

interface WattpadStatsProviderProps {
	children: React.ReactNode
	initialStats?: WattpadStats | null
}

const CACHE_KEY = 'wattpad-stats-cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export function WattpadStatsProvider({
	children,
	initialStats = null,
}: WattpadStatsProviderProps) {
	const [stats, setStats] = useState<WattpadStats | null>(initialStats)
	const [loading, setLoading] = useState(!initialStats)
	const [error, setError] = useState<string | null>(null)

	const fetchStats = async (force = false) => {
		try {
			setLoading(true)
			setError(null)

			// Check local cache first (only if not forced and no initial stats)
			if (!force && !initialStats) {
				const cachedData = localStorage.getItem(CACHE_KEY)
				if (cachedData) {
					const parsed: WattpadStats = JSON.parse(cachedData)
					const now = Date.now()

					if (now - parsed.lastUpdated < CACHE_DURATION) {
						setStats(parsed)
						setLoading(false)
						return
					}
				}
			}

			// Fetch from API
			const response = await fetch('/api/wattpad-stats')
			const result = await response.json()

			if (result.success && result.data) {
				// Update local cache
				if (typeof window !== 'undefined') {
					localStorage.setItem(CACHE_KEY, JSON.stringify(result.data))
				}
				setStats(result.data)
			} else {
				throw new Error(result.error || 'Failed to fetch stats')
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error'
			setError(errorMessage)

			// Try to use cached data as fallback
			if (typeof window !== 'undefined') {
				const cachedData = localStorage.getItem(CACHE_KEY)
				if (cachedData) {
					const parsed: WattpadStats = JSON.parse(cachedData)
					setStats(parsed)
				}
			}
		} finally {
			setLoading(false)
		}
	}

	const refreshStats = () => fetchStats(true)

	useEffect(() => {
		// Only fetch if we don't have initial stats
		if (!initialStats) {
			fetchStats()
		}

		// Set up automatic refresh every 24 hours
		const interval = setInterval(() => {
			fetchStats()
		}, CACHE_DURATION)

		return () => clearInterval(interval)
	}, [initialStats])

	return (
		<WattpadStatsContext.Provider
			value={{
				error,
				lastUpdated: stats?.lastUpdated ? new Date(stats.lastUpdated) : null,
				loading,
				refreshStats,
				stats,
			}}
		>
			{children}
		</WattpadStatsContext.Provider>
	)
}

export function useWattpadStats() {
	const context = useContext(WattpadStatsContext)
	if (context === undefined) {
		throw new Error(
			'useWattpadStats must be used within a WattpadStatsProvider'
		)
	}
	return context
}
