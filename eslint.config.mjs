import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import perfectionist from 'eslint-plugin-perfectionist'
import { defineConfig } from 'eslint/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
	allConfig: js.configs.all,
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
})

export default defineConfig([
	{
		extends: compat.extends('next/core-web-vitals', 'next/typescript'),

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
