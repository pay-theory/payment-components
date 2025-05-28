import globals from 'globals';
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import securityPlugin from 'eslint-plugin-security';
import noUnsanitizedPlugin from 'eslint-plugin-no-unsanitized';
import noWildcardPostmessagePlugin from 'eslint-plugin-no-wildcard-postmessage';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';

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
      'polyfill.js',
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
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'no-unsanitized': noUnsanitizedPlugin,
      security: securityPlugin,
      'no-wildcard-postmessage': noWildcardPostmessagePlugin,
      react: reactPlugin,
      prettier: prettierPlugin,
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'space-before-function-paren': 0,

      // Security rules
      'no-unsanitized/method': 'error',
      'no-unsanitized/property': 'error',
      'no-wildcard-postmessage/no-wildcard-postmessage': 1,

      // React rules
      'react/boolean-prop-naming': 'error',
      'react/button-has-type': 'error',
      'react/default-props-match-prop-types': 'error',
      'react/destructuring-assignment': 'error',
      'react/display-name': 'error',
      'react/forbid-component-props': 'warn',
      'react/forbid-dom-props': 'error',
      'react/forbid-elements': 'error',
      'react/forbid-foreign-prop-types': 'error',
      'react/no-access-state-in-setstate': 'error',
      'react/no-array-index-key': 'error',
      'react/no-children-prop': 'error',
      'react/no-danger': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'error',
      'react/no-did-mount-set-state': 'error',
      'react/no-did-update-set-state': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-multi-comp': 'error',
      'react/no-redundant-should-component-update': 'error',
      'react/no-render-return-value': 'error',
      'react/no-set-state': 'error',
      'react/no-typos': 'error',
      'react/no-string-refs': 'error',
      'react/no-this-in-sfc': 'error',
      'react/no-unescaped-entities': 'error',
      'react/no-unknown-property': 'error',
      'react/no-unsafe': 'error',
      'react/no-unused-prop-types': 'error',
      'react/no-unused-state': 'error',
      'react/no-will-update-set-state': 'error',
      'react/prefer-es6-class': 'error',
      'react/prefer-stateless-function': 'error',
      'react/prop-types': 'error',
      'react/react-in-jsx-scope': 'error',
      'react/require-default-props': 'error',
      'react/require-optimization': 'error',
      'react/require-render-return': 'error',
      'react/self-closing-comp': 'error',
      'react/sort-comp': 'error',
      'react/sort-prop-types': 'error',
      'react/style-prop-object': 'error',
      'react/void-dom-elements-no-children': 'error',
      'react/jsx-boolean-value': 'error',
      'react/jsx-child-element-spacing': 'error',
      'react/jsx-closing-bracket-location': 'error',
      'react/jsx-closing-tag-location': 'error',
      'react/jsx-curly-spacing': 'error',
      'react/jsx-equals-spacing': 'error',
      'react/jsx-key': 'error',
      'react/jsx-max-depth': ['warn', { max: 4 }],
      'react/jsx-no-bind': 'error',
      'react/jsx-no-comment-textnodes': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-literals': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-curly-brace-presence': 'error',
      'react/jsx-fragments': 'error',
      'react/jsx-pascal-case': 'error',
      'react/jsx-props-no-multi-spaces': 'error',
      'react/jsx-sort-default-props': 'error',
      'react/jsx-sort-props': 'error',
      'react/jsx-tag-spacing': 'error',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
    },
    settings: {
      react: {
        version: 'latest',
      },
    },
  },

  // TypeScript configuration
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'no-unsanitized': noUnsanitizedPlugin,
      security: securityPlugin,
      'no-wildcard-postmessage': noWildcardPostmessagePlugin,
      react: reactPlugin,
      prettier: prettierPlugin,
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...securityPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'import/export': 0,

      // Include the same security and React rules as in JS config
      // Security rules
      'no-unsanitized/method': 'error',
      'no-unsanitized/property': 'error',
      'no-wildcard-postmessage/no-wildcard-postmessage': 1,

      // React rules
      'react/boolean-prop-naming': 'error',
      'react/button-has-type': 'error',
      'react/default-props-match-prop-types': 'error',
      'react/destructuring-assignment': 'error',
      'react/display-name': 'error',
      'react/forbid-component-props': 'warn',
      'react/forbid-dom-props': 'error',
      'react/forbid-elements': 'error',
      'react/forbid-foreign-prop-types': 'error',
      'react/no-access-state-in-setstate': 'error',
      'react/no-array-index-key': 'error',
      'react/no-children-prop': 'error',
      'react/no-danger': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'error',
      'react/no-did-mount-set-state': 'error',
      'react/no-did-update-set-state': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-multi-comp': 'error',
      'react/no-redundant-should-component-update': 'error',
      'react/no-render-return-value': 'error',
      'react/no-set-state': 'error',
      'react/no-typos': 'error',
      'react/no-string-refs': 'error',
      'react/no-this-in-sfc': 'error',
      'react/no-unescaped-entities': 'error',
      'react/no-unknown-property': 'error',
      'react/no-unsafe': 'error',
      'react/no-unused-prop-types': 'error',
      'react/no-unused-state': 'error',
      'react/no-will-update-set-state': 'error',
      'react/prefer-es6-class': 'error',
      'react/prefer-stateless-function': 'error',
      'react/prop-types': 'error',
      'react/react-in-jsx-scope': 'error',
      'react/require-default-props': 'error',
      'react/require-optimization': 'error',
      'react/require-render-return': 'error',
      'react/self-closing-comp': 'error',
      'react/sort-comp': 'error',
      'react/sort-prop-types': 'error',
      'react/style-prop-object': 'error',
      'react/void-dom-elements-no-children': 'error',
      'react/jsx-boolean-value': 'error',
      'react/jsx-child-element-spacing': 'error',
      'react/jsx-closing-bracket-location': 'error',
      'react/jsx-closing-tag-location': 'error',
      'react/jsx-curly-spacing': 'error',
      'react/jsx-equals-spacing': 'error',
      'react/jsx-key': 'error',
      'react/jsx-max-depth': ['warn', { max: 4 }],
      'react/jsx-no-bind': 'error',
      'react/jsx-no-comment-textnodes': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-literals': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-curly-brace-presence': 'error',
      'react/jsx-fragments': 'error',
      'react/jsx-pascal-case': 'error',
      'react/jsx-props-no-multi-spaces': 'error',
      'react/jsx-sort-default-props': 'error',
      'react/jsx-sort-props': 'error',
      'react/jsx-tag-spacing': 'error',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
    },
    settings: {
      react: {
        version: 'latest',
      },
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
