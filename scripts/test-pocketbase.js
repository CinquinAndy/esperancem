const { createPocketBase, COLLECTIONS } = require('../src/lib/pocketbase.ts')

/**
 * Test script to verify PocketBase connection and basic functionality
 * Run with: node scripts/test-pocketbase.js
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
				console.log(`❌ Collection "${collectionName}" not found or accessible`)
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
