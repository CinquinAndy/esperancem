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

### Statistiques Wattpad

Les chiffres (lectures, votes, chapitres) sont relevés sur Wattpad toutes les 6 heures par le serveur Next.js
lui-même (`src/instrumentation.ts`), validés, puis enregistrés dans PocketBase. Rien à installer sur la machine.
Détails, modes de panne et procédure : `docs/wattpad-stats-system.md`.

```bash
# État de fraîcheur (public, sans secret)
curl https://esperancem.fr/api/wattpad-stats/health

# Relevé immédiat (protégé)
curl -H "Authorization: Bearer $REVALIDATE_SECRET" https://esperancem.fr/api/cron/update-wattpad-stats

# Mettre à jour le plancher committé src/data/wattpad-releve.json
node scripts/wattpad-releve.mjs
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
