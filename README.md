# Site Officiel d'Espérance Masson

Site officiel d'Espérance Masson, autrice française de dark romance.

**Cœurs Sombres** - Son premier roman dark romance sur Wattpad qui captive des milliers de lecteurs.

## Développement

Ce site est développé avec amour par Andy Cinquin.

### Technologies

- Next.js 15 avec App Router
- TypeScript
- Tailwind CSS
- Architecture SSG + ISR pour des performances optimales

### Installation

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
npm start
```

### Revalidation automatique

Les statistiques Wattpad sont mises à jour automatiquement toutes les 24h via ISR.

Pour déclencher manuellement :

```bash
node scripts/revalidate-stats.js
```
