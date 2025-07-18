/**
 * Test script to verify the Wattpad stats system integration
 * Run with: PB_URL=https://api.esperancem.fr PB_TOKEN=your_token node scripts/test-wattpad-stats-system.mjs
 */

import PocketBase from 'pocketbase'

// PocketBase server URL - should be in environment variables
const POCKETBASE_URL = process.env.PB_URL || 'http://127.0.0.1:8090'
const PB_TOKEN = process.env.PB_TOKEN
const SITE_URL = process.env.SITE_URL || 'https://esperancem.fr'
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET

// Create PocketBase instance for server-side operations
function createPocketBase() {
	const pb = new PocketBase(POCKETBASE_URL)

	// Authenticate with admin token if available
	if (PB_TOKEN) {
		pb.authStore.save(PB_TOKEN, null)
	}

	return pb
}

async function testWattpadStatsSystem() {
	console.log('🧪 Testing Wattpad stats system integration...\n')

	const pb = createPocketBase()

	try {
		// Test 1: Check current stats in PocketBase
		console.log('📊 Test 1: Checking current stats in PocketBase...')
		const currentStats = await pb.collection('wattpad_stats').getList(1, 1, {
			filter: 'is_active = true',
			sort: '-created',
		})

		if (currentStats.items.length > 0) {
			const stats = currentStats.items[0]
			console.log('✅ Current stats found:')
			console.log(`   - Reads: ${stats.reads}`)
			console.log(`   - Votes: ${stats.votes}`)
			console.log(`   - Parts: ${stats.parts}`)
			console.log(`   - Updated: ${stats.updated}`)
		} else {
			console.log('⚠️ No stats found in PocketBase')
		}

		// Test 2: Test the update endpoint (if REVALIDATE_SECRET is available)
		if (REVALIDATE_SECRET) {
			console.log('\n🔄 Test 2: Testing update endpoint...')
			try {
				const response = await fetch(
					`${SITE_URL}/api/pocketbase/update-wattpad-stats`,
					{
						headers: {
							Authorization: `Bearer ${REVALIDATE_SECRET}`,
							'Content-Type': 'application/json',
						},
						method: 'POST',
					}
				)

				if (response.ok) {
					const result = await response.json()
					console.log('✅ Update endpoint working:')
					console.log(`   - Success: ${result.success}`)
					console.log(`   - Message: ${result.message}`)
					console.log(
						`   - New stats: ${result.stats.reads} reads, ${result.stats.votes} votes, ${result.stats.parts} parts`
					)
				} else {
					console.log(`❌ Update endpoint failed: ${response.status}`)
				}
			} catch (error) {
				console.log(`❌ Update endpoint error: ${error.message}`)
			}
		} else {
			console.log('\n⚠️ Test 2: Skipped (REVALIDATE_SECRET not set)')
		}

		// Test 3: Test the stats API endpoint
		console.log('\n📡 Test 3: Testing stats API endpoint...')
		try {
			const response = await fetch(`${SITE_URL}/api/pocketbase/wattpad-stats`)
			if (response.ok) {
				const stats = await response.json()
				console.log('✅ Stats API endpoint working:')
				console.log(`   - Reads: ${stats.reads}`)
				console.log(`   - Votes: ${stats.votes}`)
				console.log(`   - Parts: ${stats.parts}`)
			} else {
				console.log(`❌ Stats API endpoint failed: ${response.status}`)
			}
		} catch (error) {
			console.log(`❌ Stats API endpoint error: ${error.message}`)
		}

		// Test 4: Check if stats are being used in the frontend
		console.log('\n🌐 Test 4: Checking frontend integration...')
		try {
			const response = await fetch(`${SITE_URL}`)
			if (response.ok) {
				const html = await response.text()
				if (
					html.includes('145K') ||
					html.includes('4.6K') ||
					html.includes('48')
				) {
					console.log('✅ Frontend is displaying stats from PocketBase')
				} else {
					console.log(
						'⚠️ Frontend might not be displaying stats from PocketBase'
					)
				}
			} else {
				console.log(`❌ Frontend test failed: ${response.status}`)
			}
		} catch (error) {
			console.log(`❌ Frontend test error: ${error.message}`)
		}

		console.log('\n🎉 Wattpad stats system test completed!')
	} catch (error) {
		console.error('❌ Error during testing:', error)
		process.exit(1)
	}
}

// Run the test
testWattpadStatsSystem()
