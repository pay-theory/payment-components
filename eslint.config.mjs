import globals from 'globals';
import js from '@eslint/js';

export default [
  // Global base configuration
  {
    ignores: [
      '**/node_modules/**',
      'dist/**',
      'lib/**',
      'coverage/**',
      'karma.conf.js',
      'karma-variables.js',
      'webpack.config.js',
      'src/polyfill.js', // This file has special polyfill code that needs different rules
      'src/**/*.ts', // Ignoring TypeScript files for now as they require a parser
      '**/*.test.js', // Ignoring old test files
      '**/createPaymentFields.test.js',
    ],
  },

  // Base configuration for all JavaScript files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },

  // Configuration for Node.js script files
  {
    files: ['sequential-test.js', 'test-safely.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },

  // Configuration for test files in the test directory
  {
    files: ['test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.mocha,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        assert: 'readonly',
        chai: 'readonly',
        sinon: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        fixture: 'readonly',
        html: 'readonly',
        fixtureCleanup: 'readonly',
        fixtureSync: 'readonly',
        aTimeout: 'readonly',
        process: 'readonly',
        Response: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'security/detect-object-injection': 'off',
    },
  },

  // Special configuration for web test files
  {
    files: ['**/test/**/*.web-test.js', '**/*.web-test.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.mocha,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        assert: 'readonly',
        chai: 'readonly',
        sinon: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        fixture: 'readonly',
        html: 'readonly',
        fixtureCleanup: 'readonly',
        fixtureSync: 'readonly',
        aTimeout: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      // Disable certain rules for test files
      'no-unused-vars': 'off',
      'security/detect-object-injection': 'off',
    },
  },

  // Configuration for web-test-runner.config.js
  {
    files: ['web-test-runner.config.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },
];
