import PocketBase from 'pocketbase'

// PocketBase server URL - should be in environment variables
const POCKETBASE_URL = process.env.PB_URL || 'http://127.0.0.1:8090'
const PB_TOKEN = process.env.PB_TOKEN

// Create PocketBase instance for server-side operations
export const createPocketBase = () => {
	const pb = new PocketBase(POCKETBASE_URL)

	// Authenticate with admin token if available
	if (PB_TOKEN) {
		pb.authStore.save(PB_TOKEN, null)
	}

	return pb
}

// Types for PocketBase collections
export interface SiteContent {
	id: string
	page: string
	section: string
	key: string
	title?: string
	content: string
	description?: string
	order?: number
	is_active?: boolean
	created: string
	updated: string
}

export interface SeoMetadata {
	id: string
	page: string
	title?: string
	description?: string
	keywords?: string[]
	og_title?: string
	og_description?: string
	og_url?: string
	twitter_title?: string
	twitter_description?: string
	twitter_creator?: string
	twitter_site?: string
	schema_data?: Record<string, any>
	is_active?: boolean
	created: string
	updated: string
}

export interface SocialLink {
	id: string
	platform:
		| 'instagram'
		| 'tiktok'
		| 'wattpad'
		| 'email'
		| 'twitter'
		| 'facebook'
		| 'youtube'
	display_name: string
	username: string
	url: string
	icon?: string
	is_active?: boolean
	order?: number
	created: string
	updated: string
}

export interface WattpadStats {
	id: string
	reads?: string
	reads_complete?: string
	votes?: string
	parts?: string
	last_updated?: string
	is_active?: boolean
	created: string
	updated: string
}

export interface WattpadRanking {
	id: string
	category: string
	position: number
	date: string
	is_active?: boolean
	created: string
}

export interface SiteSetting {
	id: string
	key: string
	value: string
	type: 'string' | 'number' | 'boolean' | 'json'
	description?: string
	is_active?: boolean
	created: string
	updated: string
}

// PocketBase collection names
export const COLLECTIONS = {
	SEO_METADATA: 'seo_metadata',
	SITE_CONTENT: 'site_content',
	SITE_SETTINGS: 'site_settings',
	SOCIAL_LINKS: 'social_links',
	WATTPAD_RANKINGS: 'wattpad_rankings',
	WATTPAD_STATS: 'wattpad_stats',
} as const
