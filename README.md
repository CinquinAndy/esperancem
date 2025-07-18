# Espérance Masson Official Website

Official website for Espérance Masson, French dark romance author.

**Cœurs Sombres** - Her first dark romance novel on Wattpad captivating thousands of readers.

## Development

This website is made with love by Andy Cinquin.

### Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- SSG + ISR architecture for optimal performance

### Getting Started

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
npm start
```

### Automatic Updates

Wattpad stats are automatically updated every 6 hours via Coolify cron jobs.

To trigger manual updates:

```bash
# Using the cron endpoint (requires REVALIDATE_SECRET)
curl -X GET http://localhost:3000/api/cron/update-wattpad-stats \
  -H "Authorization: Bearer H9HKyb3wgxvuikh2lKOcazP3neH214H2YCmBPqTA3t2nbyQjlSVXKjYcwsatNjS"

# Using the script directly
node scripts/update-wattpad-stats.mjs

# Using the cron runner (for Coolify)
node scripts/cron-runner.mjs
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
SITE_URL=https://your-domain.com
REVALIDATE_SECRET=your_secret_key
GOOGLE_SITE_VERIFICATION=your_verification_code
```

### Deployment

#### Coolify (Recommended)

```bash
# Using Docker Compose with cron service
docker-compose up -d

# Or using the Node.js cron runner
docker-compose --profile cron-node up -d
```

#### Manual Setup

```bash
# Setup system cron job
chmod +x scripts/setup-cron.sh
./scripts/setup-cron.sh

# Or run the cron runner manually
node scripts/cron-runner.mjs
```

#### Vercel

```bash
vercel --prod
```

Cron jobs run automatically on Vercel.
