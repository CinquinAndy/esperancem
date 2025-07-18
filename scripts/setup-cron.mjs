#!/usr/bin/env node

/**
 * Script to setup cron job for automatic Wattpad stats updates
 * This script helps you configure a cron job to run the stats update automatically
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const SCRIPT_PATH = path.resolve('./scripts/update-wattpad-stats.mjs')
const PROJECT_PATH = process.cwd()

function generateCronCommand() {
	// Update every 6 hours (at 00:00, 06:00, 12:00, 18:00)
	const cronExpression = '0 */6 * * *'

	return `${cronExpression} cd ${PROJECT_PATH} && PB_URL=${process.env.PB_URL || 'https://api.esperancem.fr'} PB_TOKEN=${process.env.PB_TOKEN || 'YOUR_TOKEN'} SITE_URL=${process.env.SITE_URL || 'https://esperancem.fr'} REVALIDATE_SECRET=${process.env.REVALIDATE_SECRET || 'YOUR_SECRET'} node ${SCRIPT_PATH} >> logs/wattpad-stats.log 2>&1`
}

function generateSystemdService() {
	return `[Unit]
Description=Wattpad Stats Update Service
After=network.target

[Service]
Type=oneshot
User=${process.env.USER || 'www-data'}
WorkingDirectory=${PROJECT_PATH}
Environment=PB_URL=${process.env.PB_URL || 'https://api.esperancem.fr'}
Environment=PB_TOKEN=${process.env.PB_TOKEN || 'YOUR_TOKEN'}
Environment=SITE_URL=${process.env.SITE_URL || 'https://esperancem.fr'}
Environment=REVALIDATE_SECRET=${process.env.REVALIDATE_SECRET || 'YOUR_SECRET'}
ExecStart=/usr/bin/node ${SCRIPT_PATH}

[Install]
WantedBy=multi-user.target`
}

function generateDockerCron() {
	return `# Wattpad Stats Update - Every 6 hours
0 */6 * * * cd ${PROJECT_PATH} && PB_URL=${process.env.PB_URL || 'https://api.esperancem.fr'} PB_TOKEN=${process.env.PB_TOKEN || 'YOUR_TOKEN'} SITE_URL=${process.env.SITE_URL || 'https://esperancem.fr'} REVALIDATE_SECRET=${process.env.REVALIDATE_SECRET || 'YOUR_SECRET'} node ${SCRIPT_PATH} >> logs/wattpad-stats.log 2>&1`
}

function main() {
	console.log('🔧 Setting up automatic Wattpad stats updates...\n')

	// Create logs directory if it doesn't exist
	if (!fs.existsSync('./logs')) {
		fs.mkdirSync('./logs')
		console.log('✅ Created logs directory')
	}

	// Generate cron command
	const cronCommand = generateCronCommand()

	console.log('📋 Cron Job Configuration:')
	console.log('========================')
	console.log('Add this line to your crontab (crontab -e):')
	console.log('')
	console.log(cronCommand)
	console.log('')
	console.log('📝 To edit your crontab, run: crontab -e')
	console.log('📋 To view your crontab, run: crontab -l')
	console.log('')

	// Generate systemd service file
	const systemdService = generateSystemdService()
	fs.writeFileSync('./wattpad-stats-update.service', systemdService)
	console.log('✅ Generated systemd service file: wattpad-stats-update.service')
	console.log('📝 To install systemd service:')
	console.log('   sudo cp wattpad-stats-update.service /etc/systemd/system/')
	console.log('   sudo systemctl daemon-reload')
	console.log('   sudo systemctl enable wattpad-stats-update.timer')
	console.log('   sudo systemctl start wattpad-stats-update.timer')
	console.log('')

	// Generate Docker cron file
	const dockerCron = generateDockerCron()
	fs.writeFileSync('./docker-cron', dockerCron)
	console.log('✅ Generated Docker cron file: docker-cron')
	console.log('📝 To use with Docker:')
	console.log(
		'   docker run -v $(pwd)/docker-cron:/etc/cron.d/wattpad-stats -d your-image'
	)
	console.log('')

	// Generate timer file for systemd
	const timerContent = `[Unit]
Description=Run Wattpad Stats Update every 6 hours
Requires=wattpad-stats-update.service

[Timer]
OnCalendar=*-*-* 00/6:00:00
Persistent=true

[Install]
WantedBy=timers.target`

	fs.writeFileSync('./wattpad-stats-update.timer', timerContent)
	console.log('✅ Generated systemd timer file: wattpad-stats-update.timer')
	console.log('')

	console.log('🎯 Recommended Setup Options:')
	console.log('============================')
	console.log('1. 🐧 Linux/Unix with cron: Use the cron command above')
	console.log('2. 🐧 Linux with systemd: Use the .service and .timer files')
	console.log('3. 🐳 Docker: Use the docker-cron file')
	console.log('4. ☁️  Cloud platforms: Use their built-in cron/scheduler')
	console.log('')
	console.log('📊 The script will:')
	console.log('   - Fetch fresh stats from Wattpad')
	console.log('   - Update PocketBase with new stats')
	console.log('   - Trigger Next.js revalidation')
	console.log('   - Log results to logs/wattpad-stats.log')
	console.log('')
	console.log('⚠️  Remember to:')
	console.log(
		'   - Set your environment variables (PB_TOKEN, REVALIDATE_SECRET, etc.)'
	)
	console.log(
		'   - Test the script manually first: node scripts/update-wattpad-stats.mjs'
	)
	console.log("   - Monitor the logs to ensure it's working correctly")
	console.log('')
	console.log('🎉 Setup complete! Choose your preferred method above.')
}

// Run the setup
main()
