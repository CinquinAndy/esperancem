import type { BookType } from '@/lib/pocketbase'

/** Chiffres exacts d'un roman, tels que Wattpad les compte. */
export interface BookCounts {
	parts: number
	reads: number
	votes: number
}

/** D'où vient la valeur affichée. */
export type StatsSource = 'pocketbase' | 'memoire' | 'releve'

/** Dernière valeur connue bonne pour un roman. */
export interface KnownStats extends BookCounts {
	book: BookType
	/** Date (ISO) à laquelle Wattpad a confirmé ces chiffres pour la dernière fois. */
	checkedAt: string
	source: StatsSource
}
