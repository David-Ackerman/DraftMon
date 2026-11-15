import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import { fileURLToPath } from 'node:url'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['**/dist/**', '**/dist-server/**', '**/.turbo/**', '**/.next/**', '**/next-env.d.ts'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ['packages/engine/src/**/*.ts'],
    ignores: ['**/*.test.ts', '**/testing/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', {
        patterns: [
          { group: ['@draftmon/content', '@draftmon/content/**'], allowTypeImports: true, message: 'Inject the catalog into the engine.' },
          { regex: '^@draftmon/(?!content(?:/|$))|^(?:\\.\\.?/)+(?:packages|apps|scripts|content)/', message: 'The engine depends only on content types.' },
        ],
      }],
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    plugins: { '@next/next': nextPlugin },
    settings: { next: { rootDir: fileURLToPath(new URL('./apps/web/', import.meta.url)) } },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@typescript-eslint/no-restricted-imports': ['error', {
        patterns: [{ group: ['@draftmon/db', '@draftmon/db/**', '@draftmon/api', '@draftmon/api/**', '**/packages/**', '**/apps/**'], message: 'Use the public API client and workspace package entry points.' }],
      }],
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: 'ImportDeclaration[source.value=/\\.css$/]',
        message: 'Import global styles once, in app/layout.tsx.',
      }],
    },
  },
  {
    files: ['apps/web/src/app/layout.tsx'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: 'ImportDeclaration[source.value=/\\.css$/][source.value!="./globals.css"]',
        message: 'Use the single global stylesheet and Tailwind utilities.',
      }],
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    ignores: ['apps/web/src/services/api.ts', 'apps/web/src/services/sound.ts'],
    rules: {
      'no-restricted-globals': ['error', { name: 'fetch', message: 'Use requestApi for calls to the Draftmon API.' }],
    },
  },
)
