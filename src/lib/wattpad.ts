// Anciennes mises en forme, gardées pour les composants qui les importent encore.
// Les chiffres du site viennent de src/lib/wattpad-sync (aucune lecture de Wattpad au rendu).

// Utility function to format stats value, rounding down to nearest hundred
export function formatWattpadStat(value: string): string {
	if (!value || value === '0') return '85k+'

	// Convert value to number (handle K, M suffixes)
	const getNumericValue = (val: string): number => {
		const num = parseFloat(val.replace(/[kmb]/i, ''))
		const suffix = val.slice(-1).toLowerCase()

		switch (suffix) {
			case 'k':
				return num * 1000
			case 'm':
				return num * 1000000
			case 'b':
				return num * 1000000000
			default:
				return parseFloat(val) || 0
		}
	}

	const numericValue = getNumericValue(value)

	// Round down to nearest hundred
	const roundedDown = Math.floor(numericValue / 100) * 100

	// Format back to K/M notation
	if (roundedDown >= 1000000) {
		const millions = Math.floor(roundedDown / 1000000)
		const thousands = Math.floor((roundedDown % 1000000) / 1000)
		return thousands > 0
			? `${millions}.${Math.floor(thousands / 100)}M+`
			: `${millions}M+`
	} else if (roundedDown >= 1000) {
		const thousands = Math.floor(roundedDown / 1000)
		const hundreds = Math.floor((roundedDown % 1000) / 100)
		return hundreds > 0 ? `${thousands}.${hundreds}k+` : `${thousands}k+`
	} else {
		return `${roundedDown}+`
	}
}

// Utility function to display exact stats for landing page
export function formatWattpadStatExact(value: string): string {
	if (!value || value === '0') return '85,000'

	// If value is already a plain number (exact from API), format it directly
	const plainNumber = parseInt(value.replace(/[^\d]/g, ''))
	if (!isNaN(plainNumber) && plainNumber > 0) {
		return plainNumber.toLocaleString('fr-FR')
	}

	// Convert value to number (handle K, M suffixes as fallback)
	const getNumericValue = (val: string): number => {
		const num = parseFloat(val.replace(/[kmb]/i, ''))
		const suffix = val.slice(-1).toLowerCase()

		switch (suffix) {
			case 'k':
				return num * 1000
			case 'm':
				return num * 1000000
			case 'b':
				return num * 1000000000
			default:
				return parseFloat(val) || 0
		}
	}

	const numericValue = getNumericValue(value)

	// Return exact number with commas
	return numericValue.toLocaleString('fr-FR')
}
