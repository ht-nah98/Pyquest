import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Package boundaries: docs/architecture/overview.md. Headless rule: AGENTS.md §3 rule 1.

const DEEP_IMPORT = {
  group: ['@pyquest/*/*', '**/packages/*/src/**', '../../*/src', '../../*/src/**'],
  message: 'Import other packages through their public index only.',
};

const SRC = '{ts,tsx,mts,cts,js,mjs,cjs}';

const BROWSER_ONLY_LIBS = [
  'react',
  'react/*',
  'react-dom',
  'react-dom/*',
  'react-router',
  'dexie',
  'dexie-react-hooks',
  'codemirror',
  '@codemirror/*',
  '@supabase/*',
];

const BROWSER_GLOBALS = [
  'window',
  'document',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'navigator',
  'self',
  'XMLHttpRequest',
  'WebSocket',
  'requestAnimationFrame',
];
const HEADLESS_MESSAGE = 'Headless packages must not touch the DOM or browser APIs (AGENTS.md §3).';
const HEADLESS_GLOBALS = BROWSER_GLOBALS.map((name) => ({ name, message: HEADLESS_MESSAGE }));
const HEADLESS_GLOBAL_THIS = BROWSER_GLOBALS.map((property) => ({
  object: 'globalThis',
  property,
  message: HEADLESS_MESSAGE,
}));

const NONDETERMINISTIC_PROPERTIES = [
  { object: 'Math', property: 'random', message: 'Runs must be deterministic: use a seeded RNG.' },
  { object: 'Date', property: 'now', message: 'Runs must be deterministic: use a frame counter.' },
];

export default defineConfig(
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    '**/coverage/',
    '**/.tsbuild/',
    '**/playwright-report/',
    '**/test-results/',
    'apps/web/public/',
    '**/.omc/',
    '**/.superpowers/',
  ]),

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-console': 'error',
      'no-restricted-imports': ['error', { patterns: [DEEP_IMPORT] }],
    },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },

  // Headless packages: plain Node, deterministic, no browser libraries.
  {
    files: [`packages/**/*.${SRC}`],
    rules: {
      'no-restricted-globals': ['error', ...HEADLESS_GLOBALS],
      'no-restricted-properties': ['error', ...NONDETERMINISTIC_PROPERTIES, ...HEADLESS_GLOBAL_THIS],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            DEEP_IMPORT,
            { group: BROWSER_ONLY_LIBS, message: 'Headless packages must run on plain Node.' },
          ],
        },
      ],
    },
  },

  // Tests index fixtures they just built.
  {
    files: [`**/*.test.{ts,tsx}`, `apps/web/e2e/**/*.ts`],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },

  // Tools may print to the terminal.
  {
    files: [`tools/**/*.${SRC}`, `apps/web/scripts/**/*.${SRC}`],
    rules: { 'no-console': 'off' },
  },

  // Web app.
  {
    files: [`apps/web/src/**/*.{ts,tsx}`],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { globals: globals.browser },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: [`apps/web/{e2e,scripts}/**/*.${SRC}`, `apps/web/*.config.ts`],
    languageOptions: { globals: globals.node },
  },
);
