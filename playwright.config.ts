/**
 * Tests e2e et non-régression visuelle (Playwright).
 *
 * Les captures de référence ne valent que dans l'image Docker officielle de Playwright, la même en local
 * et en CI (polices et rendu identiques) : utiliser les scripts `bun run test:visuel` et
 * `bun run test:visuel:maj`, qui lancent tout dans ce conteneur. Voir tests/README.md.
 *
 * Le site est construit puis servi sur un faux PocketBase qui sert un instantané figé
 * (tests/donnees/pocketbase-instantane.json) : aucun accès au vrai CMS, ni à Wattpad.
 */
import { defineConfig } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3100)

export default defineConfig({
	expect: {
		// Une capture pleine page passe par le rendu logiciel (fond WebGL) : plusieurs secondes sur une machine chargée.
		timeout: 30_000,
		toHaveScreenshot: {
			animations: 'disabled',
			caret: 'hide',
			maxDiffPixels: 0,
			scale: 'css',
			threshold: 0,
		},
		toMatchSnapshot: { maxDiffPixels: 0, threshold: 0 },
	},
	forbidOnly: !!process.env.CI,
	fullyParallel: false,
	outputDir: 'test-results',
	projects: [
		{
			name: 'bureau',
			use: { deviceScaleFactor: 1, viewport: { height: 900, width: 1440 } },
		},
		{
			name: 'telephone',
			use: {
				deviceScaleFactor: 1,
				hasTouch: true,
				isMobile: true,
				viewport: { height: 844, width: 390 },
			},
		},
	],
	reporter: process.env.CI
		? [['list'], ['html', { open: 'never' }]]
		: [['list']],
	retries: 0,
	// Une seule référence par capture, sans suffixe de plateforme : elles sont toutes produites dans le conteneur.
	snapshotPathTemplate:
		'{testDir}/__captures__/{testFileName}/{arg}-{projectName}{ext}',
	testDir: 'tests/e2e',
	testMatch: '**/*.spec.ts',
	timeout: 60_000,
	use: {
		baseURL: `http://127.0.0.1:${PORT}`,
		colorScheme: 'dark',
		launchOptions: {
			// Rendu logiciel stable (fond WebGL compris) : sans ces options, le compositeur bascule au hasard
			// entre deux états qui diffèrent d'un niveau sur quelques milliers de pixels.
			args: [
				'--use-angle=swiftshader',
				'--enable-unsafe-swiftshader',
				'--ignore-gpu-blocklist',
				'--font-render-hinting=none',
				'--disable-lcd-text',
				'--disable-gpu-rasterization',
				'--disable-partial-raster',
				'--disable-skia-runtime-opts',
				'--disable-checker-imaging',
				'--force-color-profile=srgb',
				'--num-raster-threads=1',
				'--disable-threaded-animation',
				'--disable-zero-copy',
			],
		},
		locale: 'fr-FR',
		reducedMotion: 'reduce',
		serviceWorkers: 'block',
		timezoneId: 'Europe/Paris',
		trace: 'retain-on-failure',
	},
	webServer: {
		command: `node tests/e2e/serveur.mjs ${PORT}`,
		reuseExistingServer: false,
		stderr: 'pipe',
		stdout: 'ignore',
		timeout: 120_000,
		url: `http://127.0.0.1:${PORT}/api/health`,
	},
	workers: 1,
})
