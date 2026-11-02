#!/usr/bin/env node
/**
 * Bout en bout navigateur sur un serveur déjà lancé (build local ou préproduction).
 * Playwright n'est pas une dépendance du projet : indiquer où le trouver.
 *   PLAYWRIGHT_PATH=/chemin/node_modules/playwright E2E_BASE=http://127.0.0.1:3000 node tests/e2e/accueil.e2e.mjs
 * Optionnel : E2E_BASE_AVANT=<build de main> montre l'ancien comportement (compteurs à 0 si l'appel échoue).
 * Lecture seule : aucune requête autre que GET n'est émise par la page testée.
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')
const base = (process.env.E2E_BASE || 'http://127.0.0.1:3000').replace(
	/\/$/,
	''
)
const avant = process.env.E2E_BASE_AVANT?.replace(/\/$/, '')

const lireCompteurs = page =>
	page.$$eval('number-flow-react', els =>
		els.map(e =>
			Number(
				[...e.shadowRoot.querySelectorAll('[part~="integer-digit"]')]
					.map(d => d.style.getPropertyValue('--current').trim())
					.join('') || '0'
			)
		)
	)
const lireMasques = page =>
	page.$$eval('.sr-only', els =>
		els
			.map(e => e.textContent.replace(/[\s ]/g, ''))
			.filter(t => /^\d+$/.test(t))
			.map(Number)
	)

async function visiter(
	navigateur,
	url,
	{ bloquerApi = false, js = true } = {}
) {
	const contexte = await navigateur.newContext({
		javaScriptEnabled: js,
		viewport: { height: 900, width: 1440 },
	})
	const page = await contexte.newPage()
	const nonGet = []
	await page.route('**/*', route => {
		const req = route.request()
		if (req.method() !== 'GET' && req.method() !== 'HEAD')
			nonGet.push(req.url())
		if (/umami/.test(req.url())) return route.abort()
		if (bloquerApi && req.url().includes('/api/wattpad-stats'))
			return route.abort()
		return route.continue()
	})
	await page.goto(url + '/', { waitUntil: 'load' })
	await page.waitForTimeout(2500) // 300 ms de délai + 1 s d'animation NumberFlow
	const resultat = {
		compteurs: js ? await lireCompteurs(page) : null,
		masques: await lireMasques(page),
		nonGet,
		phrase:
			(
				await page
					.locator('text=/Plus de .* lectures sur Wattpad/')
					.first()
					.textContent()
					.catch(() => null)
			)?.trim() ?? null,
	}
	await contexte.close()
	return resultat
}

const navigateur = await chromium.launch()
const resultats = []
const verifier = (nom, fn) => {
	try {
		fn()
		resultats.push(`ok      ${nom}`)
	} catch (e) {
		resultats.push(`ECHEC   ${nom} : ${e.message.split('\n')[0]}`)
	}
}

const normal = await visiter(navigateur, base)
verifier('compteurs animés jusqu’aux vrais chiffres', () => {
	assert.equal(normal.compteurs.length, 6)
	assert.ok(
		normal.compteurs.every(n => n > 0),
		JSON.stringify(normal.compteurs)
	)
	assert.deepEqual(normal.compteurs, normal.masques)
})
verifier('phrase « Plus de …k+ lectures » suit les chiffres', () => {
	assert.match(normal.phrase ?? '', /^Plus de \d+k\+ lectures sur Wattpad$/)
	const total = normal.masques[0] + normal.masques[3]
	assert.equal(
		normal.phrase,
		`Plus de ${Math.floor(total / 1000)}k+ lectures sur Wattpad`
	)
})
verifier('aucune requête d’écriture depuis la page', () =>
	assert.deepEqual(normal.nonGet, [])
)

const bloque = await visiter(navigateur, base, { bloquerApi: true })
verifier(
	'appel /api/wattpad-stats bloqué : les compteurs affichent quand même les vrais chiffres',
	() => {
		assert.deepEqual(bloque.compteurs, normal.compteurs)
	}
)

const sansJs = await visiter(navigateur, base, { js: false })
verifier(
	'sans JavaScript (moteurs) : les vrais chiffres sont dans le HTML',
	() => {
		assert.equal(sansJs.masques.length, 6)
		assert.ok(sansJs.masques.every(n => n > 0))
	}
)

if (avant) {
	const ancien = await visiter(navigateur, avant, { bloquerApi: true })
	resultats.push(
		`info    build de main, appel bloqué : compteurs ${JSON.stringify(ancien.compteurs)}`
	)
}

await navigateur.close()
console.log(resultats.join('\n'))
process.exit(resultats.some(r => r.startsWith('ECHEC')) ? 1 : 0)
