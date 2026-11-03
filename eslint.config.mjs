import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import perfectionist from 'eslint-plugin-perfectionist'
import { defineConfig } from 'eslint/config'

export default defineConfig([
	{
		extends: [...nextCoreWebVitals, ...nextTypescript],

		plugins: {
			perfectionist,
		},

		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'no-console': [
				'error',
				{
					allow: ['warn', 'error', 'info'],
				},
			],
			'perfectionist/sort-enums': 'error',
			'perfectionist/sort-imports': ['error'],
			'perfectionist/sort-objects': 'error',
			'perfectionist/sort-variable-declarations': 'error',
			// Règles du React Compiler arrivées avec eslint-config-next 16 : elles signalent du code existant
			// (TurbulentBackground, WattpadStats, hooks de stats). Avertissement seulement, le temps de corriger
			// ces composants à part, sans changer leur rendu dans la mise à jour des paquets.
			'react-hooks/purity': 'warn',
			'react-hooks/refs': 'warn',
			'react-hooks/set-state-in-effect': 'warn',
		},

		settings: {
			perfectionist: {
				partitionByComment: false,
				partitionByNewLine: false,
				type: 'alphabetical',
			},
		},
	},
])
