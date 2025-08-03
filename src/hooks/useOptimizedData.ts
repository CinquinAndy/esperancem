'use client'

import { useEffect, useState } from 'react'

interface OptimizedData {
	stats: any
	socialLinks: any[]
	rankings: any[]
	content: {
		home: {
			hero: {
				main_title: string
				main_description: string
			}
			book: {
				book_description: string
				book_title: string
				rankings_title: string
				wattpad_button: string
				wattpad_url: string
			}
		}
		about: {
			hero: {
				main_title: string
				biography: string
			}
			book: {
				book_title: string
				book_description: string
			}
			contact: {
				email: string
			}
			book2: {
				book_title: string
				book_description: string
			}
		}
	}
	success: boolean
	cached?: boolean
	timestamp: string
}

interface UseOptimizedDataReturn {
	data: OptimizedData | null
	loading: boolean
	error: string | null
	refresh: () => void
}

/**
 * Optimized hook that fetches all data in one request
 * Reduces API calls and improves performance
 */
export function useOptimizedData(): UseOptimizedDataReturn {
	const [data, setData] = useState<OptimizedData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchData = async (forceRefresh = false) => {
		try {
			setLoading(true)
			setError(null)

			const url = '/api/data'
			const response = await fetch(url, {
				// Force refresh if requested
				cache: forceRefresh ? 'no-cache' : 'default',
				headers: {
					'Content-Type': 'application/json',
				},
				method: 'GET',
			})

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			const result = await response.json()

			if (result.success) {
				setData(result)
			} else {
				throw new Error(result.error || 'Failed to fetch data')
			}
		} catch (err) {
			console.error('Error fetching optimized data:', err)
			setError(err instanceof Error ? err.message : 'Unknown error')
		} finally {
			setLoading(false)
		}
	}

	const refresh = () => fetchData(true)

	useEffect(() => {
		fetchData()
	}, [])

	return {
		data,
		error,
		loading,
		refresh,
	}
}

/**
 * Hook for getting specific content from optimized data
 */
export function useContent(
	page: 'home' | 'about',
	section: string,
	key: string
) {
	const { data, error, loading } = useOptimizedData()

	if (loading || error || !data) {
		return { content: '', error, loading }
	}

	const pageContent = data.content[page] as any
	const content = pageContent?.[section]?.[key] || ''
	return { content, error: null, loading: false }
}

/**
 * Hook for getting stats from optimized data
 */
export function useStats() {
	const { data, error, loading } = useOptimizedData()

	if (loading || error || !data) {
		return { error, loading, stats: null }
	}

	return { error: null, loading: false, stats: data.stats }
}

/**
 * Hook for getting social links from optimized data
 */
export function useSocialLinks() {
	const { data, error, loading } = useOptimizedData()

	if (loading || error || !data) {
		return { error, loading, socialLinks: [] }
	}

	return { error: null, loading: false, socialLinks: data.socialLinks }
}

/**
 * Hook for getting rankings from optimized data
 */
export function useRankings() {
	const { data, error, loading } = useOptimizedData()

	if (loading || error || !data) {
		return { error, loading, rankings: [] }
	}

	return { error: null, loading: false, rankings: data.rankings }
}
