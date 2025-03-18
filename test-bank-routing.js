import { playwrightLauncher } from '@web/test-runner-playwright';
import { esbuildPlugin } from '@web/dev-server-esbuild';

// Script that only runs the bank-routing-number test
// Simple config with minimal options to avoid hanging

export default {
  files: ['test/bank-routing-number.web-test.js'],
  concurrency: 1,
  browsers: [
    playwrightLauncher({
      product: 'chromium',
    }),
  ],
  nodeResolve: true,
  preserveSymlinks: true,
  plugins: [
    esbuildPlugin({
      ts: true,
      target: 'auto',
    }),
  ],
  testFramework: {
    config: {
      ui: 'bdd',
      timeout: 15000,
    },
  },
  // Avoid resource-intensive operations
  coverageConfig: false,
  watch: false,
};
