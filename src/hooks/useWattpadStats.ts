import { useEffect, useState } from 'react'

interface WattpadStats {
	reads: string
	votes: string
	parts: string
	lastUpdated: number
}

interface WattpadStatsResponse {
	success: boolean
	data?: WattpadStats
	cached?: boolean
	error?: string
}

const CACHE_KEY = 'wattpad-stats-cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export function useWattpadStats() {
	const [stats, setStats] = useState<WattpadStats | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchStats = async (force = false) => {
		try {
			setLoading(true)
			setError(null)

			// Check local cache first (only if not forced)
			if (!force) {
				const cachedData = localStorage.getItem(CACHE_KEY)
				if (cachedData) {
					const parsed: WattpadStats = JSON.parse(cachedData)
					const now = Date.now()

					// Use cached data if it's still fresh
					if (now - parsed.lastUpdated < CACHE_DURATION) {
						setStats(parsed)
						setLoading(false)
						return parsed
					}
				}
			}

			// Fetch from API
			const response = await fetch('/api/wattpad-stats')
			const result: WattpadStatsResponse = await response.json()

			if (result.success && result.data) {
				// Update local cache
				localStorage.setItem(CACHE_KEY, JSON.stringify(result.data))
				setStats(result.data)
				return result.data
			} else {
				throw new Error(result.error || 'Failed to fetch stats')
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error'
			setError(errorMessage)
			console.error('Error fetching Wattpad stats:', err)

			// Try to use cached data as fallback
			const cachedData = localStorage.getItem(CACHE_KEY)
			if (cachedData) {
				const parsed: WattpadStats = JSON.parse(cachedData)
				setStats(parsed)
			}
		} finally {
			setLoading(false)
		}
	}

	const refreshStats = () => fetchStats(true)

	useEffect(() => {
		fetchStats()

		// Set up automatic refresh every 24 hours
		const interval = setInterval(() => {
			fetchStats()
		}, CACHE_DURATION)

		return () => clearInterval(interval)
	}, [])

	return {
		error,
		lastUpdated: stats?.lastUpdated ? new Date(stats.lastUpdated) : null,
		loading,
		refreshStats,
		stats,
	}
}
