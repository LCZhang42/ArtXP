module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'dist',
    'node_modules',
    'playwright-report',
    'test-results',
    'src/api/schema.d.ts',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', 'react-refresh'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'react/jsx-uses-vars': 'error',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
      plugins: ['@typescript-eslint'],
      rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_' },
        ],
      },
    },
    {
      files: [
        '*.config.js',
        '*.config.cjs',
        'e2e/**/*.js',
        'src/**/*.test.{js,jsx}',
        'src/test/**/*.js',
      ],
      env: {
        jest: true,
        node: true,
      },
    },
  ],
};