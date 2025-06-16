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

### Automatic Revalidation

Wattpad stats are automatically updated every 24h via ISR.

To trigger manual revalidation:

```bash
node scripts/revalidate-stats.js
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
SITE_URL=https://your-domain.com
REVALIDATE_SECRET=your_secret_key
GOOGLE_SITE_VERIFICATION=your_verification_code
```
