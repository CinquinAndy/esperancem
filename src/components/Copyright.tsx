'use client'

import { useSyncExternalStore } from 'react'

import { avecAnnee } from '@/lib/copyright'

// L'année ne change pas pendant la visite : aucun abonnement.
const sAbonner = () => () => {}

/**
 * Copyright avec l'année en cours.
 *
 * Le serveur calcule l'année à chaque rendu (pages régénérées toutes les heures). Pendant l'hydratation,
 * React reprend l'année du serveur : le HTML est identique, donc ni erreur d'hydratation ni flash.
 * Après l'hydratation, si le navigateur est déjà dans une année plus récente (page prérendue l'an passé,
 * comme la 404 qui n'est générée qu'au build), l'année est corrigée sans rebuild. Jamais d'année plus
 * ancienne que celle du serveur, même si l'horloge du visiteur retarde.
 */
export function Copyright({
	anneeServeur,
	className,
	html,
}: {
	anneeServeur: number
	className?: string
	html: string
}) {
	const annee = useSyncExternalStore(
		sAbonner,
		() => Math.max(anneeServeur, new Date().getFullYear()),
		() => anneeServeur
	)
	return (
		<div
			className={className}
			dangerouslySetInnerHTML={{ __html: avecAnnee(html, annee) }}
		/>
	)
}
