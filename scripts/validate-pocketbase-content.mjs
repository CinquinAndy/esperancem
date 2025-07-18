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

/**
 * Validation script to check that all content is coming from PocketBase
 * Run with: PB_URL=https://api.esperancem.fr PB_TOKEN=your_token node scripts/validate-pocketbase-content.mjs
 */

async function validatePocketBaseContent() {
	console.log('🔍 Validating PocketBase content...\n')

	const pb = createPocketBase()

	try {
		// Test connection
		console.log('📡 Testing PocketBase connection...')
		await pb.collections.getList()
		console.log('✅ PocketBase connection successful\n')

		// Check site content
		console.log('📝 Checking site content...')
		const siteContent = await pb.collection('site_content').getList(1, 50)
		console.log(`✅ Found ${siteContent.items.length} site content items`)

		// Check SEO metadata
		console.log('\n🔍 Checking SEO metadata...')
		const seoMetadata = await pb.collection('seo_metadata').getList(1, 10)
		console.log(`✅ Found ${seoMetadata.items.length} SEO metadata items`)

		// Check social links
		console.log('\n🔗 Checking social links...')
		const socialLinks = await pb.collection('social_links').getList(1, 10)
		console.log(`✅ Found ${socialLinks.items.length} social links`)

		// Check Wattpad stats
		console.log('\n📊 Checking Wattpad stats...')
		const wattpadStats = await pb.collection('wattpad_stats').getList(1, 5)
		console.log(`✅ Found ${wattpadStats.items.length} Wattpad stats records`)

		// Check Wattpad rankings
		console.log('\n🏆 Checking Wattpad rankings...')
		const wattpadRankings = await pb
			.collection('wattpad_rankings')
			.getList(1, 20)
		console.log(`✅ Found ${wattpadRankings.items.length} Wattpad rankings`)

		// Check site settings
		console.log('\n⚙️ Checking site settings...')
		const siteSettings = await pb.collection('site_settings').getList(1, 10)
		console.log(`✅ Found ${siteSettings.items.length} site settings`)

		// Display sample content
		console.log('\n📋 Sample content from PocketBase:')
		console.log('--- Site Content ---')
		siteContent.items.slice(0, 3).forEach(item => {
			console.log(
				`- ${item.page}/${item.section}/${item.key}: ${item.content?.substring(0, 50)}...`
			)
		})

		console.log('\n--- Social Links ---')
		socialLinks.items.forEach(item => {
			console.log(`- ${item.platform}: ${item.display_name} (${item.url})`)
		})

		console.log('\n--- Wattpad Stats ---')
		if (wattpadStats.items.length > 0) {
			const latestStats = wattpadStats.items[0]
			console.log(`- Reads: ${latestStats.reads}`)
			console.log(`- Votes: ${latestStats.votes}`)
			console.log(`- Parts: ${latestStats.parts}`)
			console.log(`- Updated: ${latestStats.updated}`)
		}

		console.log('\n--- Wattpad Rankings ---')
		wattpadRankings.items.slice(0, 5).forEach(item => {
			console.log(`- #${item.position} in ${item.category} (${item.date})`)
		})

		console.log(
			'\n✅ All PocketBase content validation completed successfully!'
		)
		console.log('\n📋 Summary:')
		console.log(`- Site Content: ${siteContent.items.length} items`)
		console.log(`- SEO Metadata: ${seoMetadata.items.length} items`)
		console.log(`- Social Links: ${socialLinks.items.length} items`)
		console.log(`- Wattpad Stats: ${wattpadStats.items.length} records`)
		console.log(`- Wattpad Rankings: ${wattpadRankings.items.length} rankings`)
		console.log(`- Site Settings: ${siteSettings.items.length} settings`)
	} catch (error) {
		console.error('❌ Error validating PocketBase content:', error)
		process.exit(1)
	}
}

// Run validation
validatePocketBaseContent()
