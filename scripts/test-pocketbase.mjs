import PocketBase from 'pocketbase'

// PocketBase server URL - should be in environment variables
const POCKETBASE_URL = process.env.PB_URL || 'http://127.0.0.1:8090'
const PB_TOKEN = process.env.PB_TOKEN

// Create PocketBase instance for server-side operations
function createPocketBase() {
	const pb = new PocketBase(POCKETBASE_URL)

	// Authenticate with admin token if available
	if (PB_TOKEN) {
		pb.authStore.save(PB_TOKEN, null)
	}

	return pb
}

// PocketBase collection names
const COLLECTIONS = {
	SITE_CONTENT: 'site_content',
	SEO_METADATA: 'seo_metadata',
	SOCIAL_LINKS: 'social_links',
	WATTPAD_STATS: 'wattpad_stats',
	WATTPAD_RANKINGS: 'wattpad_rankings',
	SITE_SETTINGS: 'site_settings',
}

/**
 * Test script to verify PocketBase connection and basic functionality
 * Run with: node scripts/test-pocketbase.mjs
 */
async function testPocketBaseConnection() {
	console.log('🔍 Testing PocketBase connection...')

	try {
		const pb = createPocketBase()

		// Test basic connection
		console.log('📡 Testing connection to PocketBase...')
		const health = await pb.health.check()
		console.log('✅ PocketBase connection successful:', health)

		// Test collections existence
		console.log('\n📚 Testing collections...')
		for (const [name, collectionName] of Object.entries(COLLECTIONS)) {
			try {
				const collection = await pb.collection(collectionName).getList(1, 1)
				console.log(
					`✅ Collection "${collectionName}" exists (${collection.totalItems} items)`
				)
			} catch (error) {
				console.log(
					`❌ Collection "${collectionName}" not found or accessible:`,
					error.message
				)
			}
		}

		console.log('\n🎉 PocketBase test completed successfully!')
	} catch (error) {
		console.error('❌ PocketBase test failed:', error.message)
		process.exit(1)
	}
}

// Run the test
testPocketBaseConnection()
