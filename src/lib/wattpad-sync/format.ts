/**
 * « 503k+ » : milliers entiers, arrondis vers le bas, suivis de « k+ ».
 * Même gabarit que l'ancien affichage (« 365k+ ») : seul le nombre change.
 */
export function formatThousandsPlus(value: number): string {
	if (!Number.isFinite(value) || value <= 0) return ''
	if (value >= 1_000_000) {
		const tenths = Math.floor(value / 100_000) / 10
		return `${String(tenths).replace(/\.0$/, '')}M+`
	}
	if (value >= 1000) return `${Math.floor(value / 1000)}k+`
	return `${Math.floor(value)}+`
}

/**
 * Abréviation façon Wattpad (« 366K », « 11.1K », « 6.5K ») : Wattpad tronque, il n'arrondit pas.
 * Vérifié le 02/11/2026 : 6 571 votes s'affichent « 6.5K » sur la page du roman.
 */
export function formatWattpadShort(value: number): string {
	if (!Number.isFinite(value) || value < 0) return ''
	if (value >= 1_000_000) {
		return `${String(Math.floor(value / 100_000) / 10).replace(/\.0$/, '')}M`
	}
	if (value >= 100_000) return `${Math.floor(value / 1000)}K`
	if (value >= 1000) {
		return `${String(Math.floor(value / 100) / 10).replace(/\.0$/, '')}K`
	}
	return String(Math.floor(value))
}

/**
 * Ancien champ `reads` de /api/wattpad-stats/total : la partie entière, en milliers, de l'abréviation
 * Wattpad de chaque roman (« 366K » + « 137K » = 503). Identique à l'ancien calcul sous le million ;
 * au-delà, « 1.2M » compte 1200 milliers, et non 1 comme le donnait parseInt.
 */
export function legacyThousands(value: number): number {
	if (!Number.isFinite(value) || value < 0) return 0
	return value >= 1000 ? Math.floor(value / 1000) : Math.floor(value)
}
