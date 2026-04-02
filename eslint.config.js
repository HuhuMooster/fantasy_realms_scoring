import js from '@eslint/js'
import noBarrelFiles from 'eslint-plugin-no-barrel-files'
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    '.output',
    '.claude',
    '.tanstack',
    'coverage',
    '**/.local/*',
    '__mocks__/*',
    '__tests__/*',
    'stylelint.config.js',
    '.dependency-cruiser.cjs',
  ]),
  noBarrelFiles.flat,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: {
      js,
    },
    extends: ['js/recommended'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  tseslint.configs.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat.recommended,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      'no-relative-import-paths': noRelativeImportPaths,
      react: react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: 'detect',
      },
      reactHooks: {
        version: 'detect',
      },
    },
    rules: {
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        { allowSameFolder: false, rootDir: 'src', prefix: '@' },
      ],
      'react/no-unescaped-entities': 'off',
      'react/jsx-no-literals': 'error',
      // #region TYPESCRIPT ------------------------------------------------------------
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // Naming Conventions for Types, Interfaces and Enums
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
          prefix: ['T'],
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
          prefix: ['I'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
          prefix: ['E'],
        },
      ],
      // #endregion TYPESCRIPT ---------------------------------------------------------
    },
  },
])
