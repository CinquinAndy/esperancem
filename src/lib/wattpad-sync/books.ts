import type { BookType } from '@/lib/pocketbase'

export interface BookConfig {
	id: string
	title: string
	type: BookType
}

// Les deux romans suivis. L'identifiant Wattpad est stable, contrairement au titre et à l'adresse.
export const BOOKS: readonly BookConfig[] = [
	{ id: '368278312', title: 'Cœurs sombres', type: 'coeurs-sombres' },
	{ id: '395344686', title: 'Au prix du silence', type: 'au-prix-du-silence' },
]

export const BOOK_TYPES: readonly BookType[] = BOOKS.map(book => book.type)

export function isBookType(value: string): value is BookType {
	return (BOOK_TYPES as readonly string[]).includes(value)
}
