import { defineConfig } from 'eslint/config';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
});

export default defineConfig([{
	files: ['**/*.ts'],
	extends: compat.extends(
		'standard',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended'
	),

	plugins: {
		'@typescript-eslint': typescriptEslint
	},

	languageOptions: {
		globals: {
			...globals.browser
		},

		parser: tsParser,
		ecmaVersion: 12,
		sourceType: 'module'
	},

	rules: {
		semi: [2, 'always'],
		'no-throw-literal': 0,
		indent: ['error', 'tab'],
		'no-tabs': 0,
		'@typescript-eslint/explicit-function-return-type': 'error',
		'@typescript-eslint/explicit-module-boundary-types': 'error'
	}
},
{
	files: ['**/*.js', '**/*.mjs'],
	extends: compat.extends(
		'standard',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended'
	),

	plugins: {
		'@typescript-eslint': typescriptEslint
	},

	languageOptions: {
		globals: {
			...globals.browser
		},

		parser: tsParser,
		ecmaVersion: 12,
		sourceType: 'module'
	},

	rules: {
		semi: [2, 'always'],
		'no-throw-literal': 0,
		indent: ['error', 'tab'],
		'no-tabs': 0
	}
},
{
	files: ['towpath_walk_tracker/static/js/walk_form.js'],

	rules: {
		semi: [2, 'always'],
		'no-throw-literal': 0,
		indent: ['error', 'tab'],
		'no-tabs': 0,
		camelcase: 0,
		'no-sequences': 0,
		'@typescript-eslint/no-unused-expressions': 0
	}
}
]);
