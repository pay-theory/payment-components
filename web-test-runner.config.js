import { esbuildPlugin } from '@web/dev-server-esbuild';
import { playwrightLauncher } from '@web/test-runner-playwright';
import path from 'path';

export default {
  rootDir: process.cwd(),
  files: [
    'test/basic.web-test.js',
    'test/fee-validation.web-test.js',
    'test/improved-fee-validation.web-test.js',
    'test/credit-card.web-test.js',
    'test/createPaymentFields.web-test.js',
    'test/bank-routing-number.web-test.js',
    'test/bank-institution-number.web-test.js',
    'test/bank-account-name.web-test.js',
    'test/pay-theory-messenger.web-test.js',
  ],
  nodeResolve: true, // resolve node modules
  coverage: true, // enable coverage reporting
  coverageConfig: {
    reportDir: 'coverage', // directory to store coverage reports
    include: ['src/**/*.js', 'src/**/*.ts'], // include patterns for coverage
    exclude: [], // exclude patterns for coverage
  },
  browsers: [
    playwrightLauncher({
      product: 'chromium',
    }),
  ],
  plugins: [
    // Add esbuild plugin for TypeScript
    esbuildPlugin({
      ts: true,
      target: 'auto',
      tsconfig: './tsconfig.json',
      sourceMap: true,
    }),
  ],
  testFramework: {
    config: {
      ui: 'bdd',
      timeout: '30000', // increased timeout in milliseconds
    },
  },
  // Remove concurrency settings that may be causing issues
  // No concurrency, no timeouts, just the basics
  testRunnerHtml: testFramework => `
    <html>
      <head>
        <script type="module">
          // Set up any global variables or polyfills needed for tests
          window.process = { env: { NODE_ENV: 'test' } };
        </script>
      </head>
      <body>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>
  `,
  debug: true,
};
