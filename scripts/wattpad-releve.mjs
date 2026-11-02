#!/usr/bin/env node
/**
 * Met à jour src/data/wattpad-releve.json, le plancher committé des chiffres Wattpad.
 * Lecture seule côté Wattpad (API publique), aucune écriture en base.
 * Refuse d'écrire si un chiffre est absent, à zéro, abrégé ou en recul : le relevé ne descend jamais.
 * Usage : node scripts/wattpad-releve.mjs        (WATTPAD_BASE_URL pour viser un autre hôte)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const fichier = join(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'src',
	'data',
	'wattpad-releve.json'
)
const base = (
	process.env.WATTPAD_BASE_URL || 'https://www.wattpad.com'
).replace(/\/$/, '')
const LIVRES = {
	'au-prix-du-silence': '395344686',
	'coeurs-sombres': '368278312',
}

const entier = v =>
	typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : null
const actuel = JSON.parse(readFileSync(fichier, 'utf8'))
const suivant = structuredClone(actuel)
const maintenant = new Date().toISOString()

for (const [livre, id] of Object.entries(LIVRES)) {
	const reponse = await fetch(
		`${base}/api/v3/stories/${id}?fields=id,readCount,voteCount,numParts`,
		{
			headers: {
				Accept: 'application/json',
				'User-Agent':
					'Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0 Safari/537.36',
			},
			signal: AbortSignal.timeout(15000),
		}
	)
	if (!reponse.ok) throw new Error(`${livre} : HTTP ${reponse.status}`)
	const d = await reponse.json()
	const neuf = {
		parts: entier(d.numParts),
		reads: entier(d.readCount),
		votes: entier(d.voteCount),
	}
	if (
		Object.values(neuf).some(v => v === null) ||
		neuf.reads === 0 ||
		neuf.parts === 0
	) {
		throw new Error(`${livre} : réponse invalide ${JSON.stringify(neuf)}`)
	}
	const ancien = actuel.books[livre]
	if (ancien && neuf.reads < ancien.reads)
		throw new Error(
			`${livre} : lectures en recul (${ancien.reads} → ${neuf.reads})`
		)
	suivant.books[livre] = { checkedAt: maintenant, ...neuf }
	console.info(
		`${livre} : ${neuf.reads} lectures, ${neuf.votes} votes, ${neuf.parts} chapitres`
	)
}

writeFileSync(fichier, `${JSON.stringify(suivant, null, '\t')}\n`)
console.info(`Relevé écrit : ${fichier}`)
