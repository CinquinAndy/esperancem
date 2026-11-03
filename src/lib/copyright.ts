/**
 * Année du copyright du pied de page : toujours l'année en cours, jamais écrite en dur.
 *
 * Le texte vient du CMS (« © 2024 Espérance Masson. Tous droits réservés. ») : on y remplace l'année
 * au rendu, sans toucher au contenu du CMS. Le jeton {annee} est aussi accepté, pour placer l'année
 * ailleurs dans le texte.
 */

/**
 * Année vue par le serveur. COPYRIGHT_ANNEE la fige : seuls les tests visuels s'en servent, pour que
 * les captures de référence ne changent pas au 1er janvier.
 */
export function anneeDuServeur(maintenant: Date = new Date()): number {
	const figee = Number(process.env.COPYRIGHT_ANNEE)
	return Number.isInteger(figee) && figee > 0 ? figee : maintenant.getFullYear()
}

/** Met l'année dans le texte : remplace {annee}, sinon l'année (ou la plage d'années) qui suit ©. */
export function avecAnnee(copyright: string, annee: number): string {
	if (copyright.includes('{annee}'))
		return copyright.replaceAll('{annee}', String(annee))
	return copyright.replace(
		/(©|&copy;)(\s*)\d{4}(?:\s*[-–]\s*\d{4})?/,
		`$1$2${annee}`
	)
}
