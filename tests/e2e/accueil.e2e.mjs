#!/usr/bin/env node
/**
 * Bout en bout navigateur de l'accueil : compteurs Wattpad.
 *
 * Autonome par défaut : démarre un faux PocketBase (pocketbase-stub.mjs) et `next start` sur le build de
 * .next (prérequis : `bun run build`), avec synchro coupée et Wattpad pointé vers le faux serveur (aucun
 * accès extérieur). Les pages sont régénérées une fois sur le faux PocketBase (comme le test
 * d'intégration, cela écrit dans .next : refaire `bun run build` avant de servir ou capturer ce build).
 *   PLAYWRIGHT_PATH=/chemin/node_modules/playwright bun run test:e2e
 * Sur un serveur déjà lancé (préproduction, sans chiffres attendus connus) :
 *   E2E_BASE=http://127.0.0.1:3000 PLAYWRIGHT_PATH=… node tests/e2e/accueil.e2e.mjs
 * Lecture seule : la page testée n'émet que des GET.
 */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { CHIFFRES, demarrerPocketBase } from './pocketbase-stub.mjs'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')
const racine = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const pause = ms => new Promise(r => setTimeout(r, ms))
const chiffres = texte => Number(String(texte).replace(/\D/g, '') || 'NaN')

// Ordre d'affichage : Cœurs sombres (lectures, votes, chapitres), puis Au prix du silence.
const ATTENDUS = ['coeurs-sombres', 'au-prix-du-silence'].flatMap(b => [
	CHIFFRES[b].reads,
	CHIFFRES[b].votes,
	CHIFFRES[b].parts,
])

let base = process.env.E2E_BASE?.replace(/\/$/, '')
const autonome = !base
let pocketbase = null
let serveur = null

async function demarrer() {
	if (!existsSync(join(racine, '.next', 'BUILD_ID')))
		throw new Error('Lancer `bun run build` avant ce test')
	pocketbase = await demarrerPocketBase()
	const port = 3900 + Math.floor(Math.random() * 90)
	const secret = randomBytes(24).toString('hex')
	base = `http://127.0.0.1:${port}`
	serveur = spawn(
		join(racine, 'node_modules', '.bin', 'next'),
		['start', '-p', String(port), '-H', '127.0.0.1'],
		{
			cwd: racine,
			env: {
				...process.env,
				NEXT_TELEMETRY_DISABLED: '1',
				PB_TOKEN: '',
				PB_URL: pocketbase.url,
				PORT: String(port),
				REVALIDATE_SECRET: secret,
				WATTPAD_BASE_URL: pocketbase.url,
				WATTPAD_SYNC: 'off',
			},
			stdio: 'ignore',
		}
	)
	for (let i = 0; ; i++) {
		if (i > 60) throw new Error('Le serveur Next ne répond pas')
		try {
			if ((await fetch(`${base}/api/wattpad-stats/health`)).ok) break
		} catch {}
		await pause(500)
	}
	// La page prérendue au build porte les chiffres de ce moment-là : on la régénère sur le faux PocketBase.
	await fetch(`${base}/api/revalidate-stats`, {
		headers: { Authorization: `Bearer ${secret}` },
		method: 'POST',
	})
	for (let i = 0; i < 40; i++) {
		const html = await (await fetch(base + '/')).text()
		if (JSON.stringify(etiquettesServeur(html)) === JSON.stringify(ATTENDUS))
			return
		await pause(500)
	}
	throw new Error('La page ne reflète pas le faux PocketBase')
}

function arreter() {
	serveur?.kill()
	pocketbase?.arreter()
}

/** Valeurs des six compteurs dans le HTML serveur : étiquette du shadow DOM déclaratif. */
function etiquettesServeur(html) {
	return [
		...html.matchAll(
			/<number-flow-react[^>]*><template[^>]*>[\s\S]*?aria-label="([^"]*)"/g
		),
	].map(m => chiffres(m[1]))
}

// Chiffres visibles : `--current` une fois NumberFlow démarré, le texte du shadow DOM déclaratif sinon.
const lireCompteurs = page =>
	page.$$eval('number-flow-react', els =>
		els.map(e => {
			const r = e.getBoundingClientRect()
			const texte = [
				...(e.shadowRoot?.querySelectorAll('[part~="integer-digit"]') ?? []),
			]
				.map(d => d.style.getPropertyValue('--current').trim() || d.textContent)
				.join('')
			return {
				valeur: Number(texte.replace(/\D/g, '') || 'NaN'),
				visible: r.bottom > 0 && r.top < window.innerHeight,
			}
		})
	)
const valeurs = compteurs => compteurs.map(c => c.valeur)
const lireMasques = page =>
	page.$$eval('.sr-only', els =>
		els
			.map(e => e.textContent.replace(/\D/g, ''))
			.filter(t => /^\d+$/.test(t))
			.map(Number)
	)

async function ouvrir(
	navigateur,
	{ bloquerApi = false, hauteur = 900, js = true, reducedMotion } = {}
) {
	const contexte = await navigateur.newContext({
		javaScriptEnabled: js,
		reducedMotion,
		viewport: { height: hauteur, width: 1440 },
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
	return { contexte, nonGet, page }
}

/** Fait défiler chaque compteur à l'écran puis attend la fin du comptage (300 ms + 1 s). */
async function toutVoir(page) {
	const n = await page.locator('number-flow-react').count()
	for (let i = 0; i < n; i++) {
		await page.locator('number-flow-react').nth(i).scrollIntoViewIfNeeded()
		await pause(200)
	}
	await pause(2000)
}

const resultats = []
const verifier = async (nom, fn) => {
	try {
		await fn()
		resultats.push(`ok      ${nom}`)
	} catch (e) {
		resultats.push(`ECHEC   ${nom} : ${e.message.split('\n')[0]}`)
	}
}

let navigateur
try {
	if (autonome) await demarrer()
	navigateur = await chromium.launch()
	const html = await (await fetch(base + '/')).text()
	const attendus = autonome ? ATTENDUS : etiquettesServeur(html)

	await verifier(
		'HTML serveur : les six compteurs portent les vrais chiffres',
		() => {
			const etiquettes = etiquettesServeur(html)
			assert.equal(etiquettes.length, 6)
			assert.ok(
				etiquettes.every(n => n > 0),
				JSON.stringify(etiquettes)
			)
			assert.deepEqual(etiquettes, attendus)
			const repli = [
				...html.matchAll(
					/<\/style\s*><span>([^<]*)<\/span><\/number-flow-react>/g
				),
			].map(m => chiffres(m[1]))
			assert.deepEqual(repli, attendus)
			const masques = [
				...html.matchAll(/<span class="sr-only">([\d\s ]+)/g),
			].map(m => chiffres(m[1]))
			assert.deepEqual(masques, attendus)
		}
	)

	{
		const { contexte, page } = await ouvrir(navigateur, { js: false })
		await page.goto(base + '/', { waitUntil: 'load' })
		await verifier(
			'sans JavaScript : les compteurs affichent les vrais chiffres',
			async () => {
				assert.deepEqual(valeurs(await lireCompteurs(page)), attendus)
				assert.deepEqual(await lireMasques(page), attendus)
			}
		)
		await contexte.close()
	}

	{
		// Fenêtre assez haute pour que tout soit à l'écran dès le chargement : aucun compteur ne doit passer par 0.
		const { contexte, page } = await ouvrir(navigateur, { hauteur: 7800 })
		const releves = []
		await page.goto(base + '/', { waitUntil: 'commit' })
		const fin = Date.now() + 5000 // couvre hydratation + 300 ms + 1 s de comptage éventuel
		while (Date.now() < fin) {
			try {
				const c = await lireCompteurs(page)
				if (c.length === 6) releves.push(c)
			} catch {}
			await pause(50)
		}
		await verifier(
			'avec JavaScript, compteurs visibles au chargement : jamais 0, jamais d’autre valeur',
			() => {
				assert.ok(releves.length >= 5, `${releves.length} relevés`)
				assert.ok(
					releves.at(-1).every(c => c.visible),
					'compteurs hors écran'
				)
				for (const r of releves) assert.deepEqual(valeurs(r), attendus)
			}
		)
		await contexte.close()
	}

	let normal
	{
		const { contexte, nonGet, page } = await ouvrir(navigateur)
		await page.goto(base + '/', { waitUntil: 'load' })
		await pause(1500) // hydratation et premier passage de l'observateur
		const avant = await lireCompteurs(page)
		await toutVoir(page)
		normal = {
			apres: valeurs(await lireCompteurs(page)),
			avant,
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
	}
	await verifier(
		'avec JavaScript, compteurs hors écran au chargement : remis à 0 sans être vus, puis comptés',
		() => {
			assert.ok(
				normal.avant.some(c => !c.visible),
				'aucun compteur hors écran à 1440×900'
			)
			for (const [i, c] of normal.avant.entries())
				assert.equal(c.valeur, c.visible ? attendus[i] : 0, `compteur ${i}`)
			assert.deepEqual(normal.apres, attendus)
			assert.deepEqual(normal.masques, attendus)
		}
	)
	await verifier('phrase « Plus de …k+ lectures » suit les chiffres', () => {
		const total = attendus[0] + attendus[3]
		assert.equal(
			normal.phrase,
			`Plus de ${Math.floor(total / 1000)}k+ lectures sur Wattpad`
		)
	})
	await verifier('aucune requête d’écriture depuis la page', () =>
		assert.deepEqual(normal.nonGet, [])
	)

	{
		const { contexte, page } = await ouvrir(navigateur, { bloquerApi: true })
		await page.goto(base + '/', { waitUntil: 'load' })
		await pause(1500)
		await toutVoir(page)
		const bloque = valeurs(await lireCompteurs(page))
		await verifier(
			'appel /api/wattpad-stats bloqué : les vrais chiffres quand même',
			() => assert.deepEqual(bloque, attendus)
		)
		await contexte.close()
	}

	{
		const { contexte, page } = await ouvrir(navigateur, {
			reducedMotion: 'reduce',
		})
		await page.goto(base + '/', { waitUntil: 'load' })
		await pause(1500)
		const reduit = valeurs(await lireCompteurs(page))
		await verifier(
			'« réduire les animations » : vrais chiffres tout de suite, même hors écran',
			() => assert.deepEqual(reduit, attendus)
		)
		await contexte.close()
	}
} finally {
	await navigateur?.close()
	arreter()
}

console.log(resultats.join('\n'))
process.exit(
	resultats.length === 0 || resultats.some(r => r.startsWith('ECHEC')) ? 1 : 0
)
