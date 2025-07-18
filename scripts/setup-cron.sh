#!/bin/bash

# Setup Cron Job for Coolify
# This script sets up a system cron job to update Wattpad stats

CRON_SCHEDULE="0 */6 * * *"  # Every 6 hours
APP_URL="${SITE_URL:-http://localhost:3000}"
CRON_SECRET="${REVALIDATE_SECRET:-your_revalidate_secret}"

echo "🔧 Setting up cron job for Coolify..."
echo "⏰ Schedule: $CRON_SCHEDULE"
echo "🌐 App URL: $APP_URL"

# Create the cron job command
CRON_COMMAND="$CRON_SCHEDULE curl -s -X GET $APP_URL/api/cron/update-wattpad-stats -H \"Authorization: Bearer $CRON_SECRET\" > /dev/null 2>&1"

# Add to crontab
(crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -

echo "✅ Cron job added successfully!"
echo "📋 Current crontab:"
crontab -l

echo ""
echo "🔍 To monitor cron jobs:"
echo "   tail -f /var/log/cron"
echo ""
echo "🗑️ To remove cron job:"
echo "   crontab -e" 