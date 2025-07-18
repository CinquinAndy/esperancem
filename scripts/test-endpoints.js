#!/usr/bin/env node

/**
 * Test script to verify all endpoints work correctly after refactoring
 * Run with: node scripts/test-endpoints.js
 */

const BASE_URL = 'http://localhost:3000'
const REVALIDATE_SECRET =
	'H9HKyb3wgxvuikh2lKOcazP3neH214H2YCmBPqTA3t2nbyQjlSVXKjYcwsatNjS'

async function testEndpoint(name, url, options = {}) {
	try {
		console.log(`\n🧪 Testing ${name}...`)

		const response = await fetch(url, {
			method: options.method || 'GET',
			headers: options.headers || {},
			...options,
		})

		const data = await response.json()

		if (response.ok) {
			console.log(`✅ ${name}: SUCCESS`)
			console.log(`   Status: ${response.status}`)
			console.log(`   Response:`, JSON.stringify(data, null, 2))
			return true
		} else {
			console.log(`❌ ${name}: FAILED`)
			console.log(`   Status: ${response.status}`)
			console.log(`   Error:`, data)
			return false
		}
	} catch (error) {
		console.log(`💥 ${name}: ERROR`)
		console.log(`   Error:`, error.message)
		return false
	}
}

async function runTests() {
	console.log('🚀 Starting endpoint tests...\n')

	const tests = [
		{
			name: 'Health Check',
			url: `${BASE_URL}/api/health`,
		},
		{
			name: 'Wattpad Stats API',
			url: `${BASE_URL}/api/wattpad-stats`,
		},
		{
			name: 'Revalidation Endpoint (GET)',
			url: `${BASE_URL}/api/revalidate-stats`,
		},
		{
			name: 'Revalidation Endpoint (POST with auth)',
			url: `${BASE_URL}/api/revalidate-stats`,
			options: {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${REVALIDATE_SECRET}`,
				},
			},
		},
		{
			name: 'Cron Update Stats (with Vercel header)',
			url: `${BASE_URL}/api/cron/update-wattpad-stats`,
			options: {
				headers: {
					'x-vercel-cron': '1',
				},
			},
		},
		{
			name: 'Cron Update Stats (with Bearer token)',
			url: `${BASE_URL}/api/cron/update-wattpad-stats`,
			options: {
				headers: {
					Authorization: `Bearer ${REVALIDATE_SECRET}`,
				},
			},
		},
		{
			name: 'Admin Endpoint (should fail without admin secret)',
			url: `${BASE_URL}/api/admin/wattpad-stats`,
			options: {
				headers: {
					Authorization: `Bearer ${REVALIDATE_SECRET}`,
				},
			},
		},
	]

	let passed = 0
	let failed = 0

	for (const test of tests) {
		const success = await testEndpoint(test.name, test.url, test.options)
		if (success) {
			passed++
		} else {
			failed++
		}

		// Small delay between tests
		await new Promise(resolve => setTimeout(resolve, 500))
	}

	console.log('\n📊 Test Results:')
	console.log(`✅ Passed: ${passed}`)
	console.log(`❌ Failed: ${failed}`)
	console.log(
		`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
	)

	if (failed === 0) {
		console.log('\n🎉 All tests passed! The refactoring was successful.')
	} else {
		console.log('\n⚠️  Some tests failed. Please check the errors above.')
	}
}

// Run tests
runTests().catch(console.error)
