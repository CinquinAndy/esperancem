'use client'

import { useEffect, useState } from 'react'

import type {
	SiteContent,
	SeoMetadata,
	SocialLink,
	WattpadStats,
	WattpadRanking,
	SiteSetting,
} from '@/lib/pocketbase'

/**
 * Hook for fetching site content from PocketBase
 * This is used for client-side data fetching when needed
 */
export function useSiteContent(page: string, section?: string) {
	const [content, setContent] = useState<SiteContent[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function fetchContent() {
			try {
				setLoading(true)
				const response = await fetch(
					`/api/pocketbase/content?page=${page}${section ? `&section=${section}` : ''}`
				)

				if (!response.ok) {
					throw new Error('Failed to fetch content')
				}

				const data = await response.json()
				setContent(data)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error')
			} finally {
				setLoading(false)
			}
		}

		fetchContent()
	}, [page, section])

	return { content, error, loading }
}

/**
 * Hook for fetching SEO metadata from PocketBase
 */
export function useSeoMetadata(page: string) {
	const [metadata, setMetadata] = useState<SeoMetadata | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function fetchMetadata() {
			try {
				setLoading(true)
				const response = await fetch(`/api/pocketbase/seo?page=${page}`)

				if (!response.ok) {
					throw new Error('Failed to fetch SEO metadata')
				}

				const data = await response.json()
				setMetadata(data)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error')
			} finally {
				setLoading(false)
			}
		}

		fetchMetadata()
	}, [page])

	return { error, loading, metadata }
}

/**
 * Hook for fetching social links from PocketBase
 */
export function useSocialLinks() {
	const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function fetchSocialLinks() {
			try {
				setLoading(true)
				const response = await fetch('/api/pocketbase/social-links')

				if (!response.ok) {
					throw new Error('Failed to fetch social links')
				}

				const data = await response.json()
				setSocialLinks(data)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error')
			} finally {
				setLoading(false)
			}
		}

		fetchSocialLinks()
	}, [])

	return { error, loading, socialLinks }
}

/**
 * Hook for fetching Wattpad stats from PocketBase
 */
export function useWattpadStats() {
	const [stats, setStats] = useState<WattpadStats | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function fetchStats() {
			try {
				setLoading(true)
				const response = await fetch('/api/pocketbase/wattpad-stats')

				if (!response.ok) {
					throw new Error('Failed to fetch Wattpad stats')
				}

				const data = await response.json()
				setStats(data)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error')
			} finally {
				setLoading(false)
			}
		}

		fetchStats()
	}, [])

	return { error, loading, stats }
}

/**
 * Hook for fetching Wattpad rankings from PocketBase
 */
export function useWattpadRankings() {
	const [rankings, setRankings] = useState<WattpadRanking[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function fetchRankings() {
			try {
				setLoading(true)
				const response = await fetch('/api/pocketbase/wattpad-rankings')

				if (!response.ok) {
					throw new Error('Failed to fetch Wattpad rankings')
				}

				const data = await response.json()
				setRankings(data)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error')
			} finally {
				setLoading(false)
			}
		}

		fetchRankings()
	}, [])

	return { error, loading, rankings }
}

/**
 * Hook for fetching site settings from PocketBase
 */
export function useSiteSettings() {
	const [settings, setSettings] = useState<Record<string, SiteSetting>>({})
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function fetchSettings() {
			try {
				setLoading(true)
				const response = await fetch('/api/pocketbase/settings')

				if (!response.ok) {
					throw new Error('Failed to fetch site settings')
				}

				const data = await response.json()
				setSettings(data)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error')
			} finally {
				setLoading(false)
			}
		}

		fetchSettings()
	}, [])

	return { error, loading, settings }
}

/**
 * Hook for getting a specific setting value
 */
export function useSiteSetting(key: string) {
	const { error, loading, settings } = useSiteSettings()
	const setting = settings[key]

	return {
		error,
		loading,
		setting,
		value: setting?.value || null,
	}
}
