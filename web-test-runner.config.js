/* global module, require */
const { transform: esbuildTransform } = require('esbuild');
const fs = require('fs');
const path = require('path');
const { playwrightLauncher } = require('@web/test-runner-playwright');
const staticCoverage = require('./test/static-coverage.cjs')(process.cwd());
const hostedPeerHtml = fs.readFileSync(path.join(__dirname, 'test/support/hosted-peer.html'), 'utf8');
const networkLedgerPath = path.join(process.cwd(), 'coverage/network-guard.jsonl');
fs.mkdirSync(path.dirname(networkLedgerPath), { recursive: true });
fs.writeFileSync(networkLedgerPath, '');

const tsconfigRaw = fs.readFileSync(path.join(process.cwd(), 'tsconfig.json'), 'utf8');

const resolveExtensionlessImportsPlugin = {
  name: 'resolve-extensionless-imports',
  async resolveImport({ source, context }) {
    if (!source.startsWith('.') || path.extname(source)) {
      return;
    }

    const importerPath = path.join(process.cwd(), context.path.replace(/^\//, ''));
    const importerDir = path.dirname(importerPath);

    for (const suffix of ['.ts', '.js', '/index.ts', '/index.js']) {
      const candidate = path.resolve(importerDir, `${source}${suffix}`);

      if (fs.existsSync(candidate)) {
        return `${source}${suffix}`.replace(/\\/g, '/');
      }
    }
  },
};

const cssModulesPlugin = {
  name: 'test-css-modules',
  resolveMimeType(context) { if (context.path.endsWith('.css')) return 'js'; },
  transform(context) { if (context.path.endsWith('.css')) return 'export default {};'; },
};

const typeScriptModulesPlugin = {
  name: 'typescript-modules',
  resolveMimeType(context) {
    if (context.path.endsWith('.ts')) {
      return 'js';
    }
  },
  async transform(context) {
    if (!context.path.endsWith('.ts')) {
      return;
    }

    const sourcefile = path.join(process.cwd(), context.path.replace(/^\//, ''));
    const { code } = await esbuildTransform(String(context.body), {
      loader: 'ts',
      format: 'esm',
      target: 'es2020',
      sourcefile,
      sourcemap: 'inline',
      tsconfigRaw,
    });

    return code;
  },
};

module.exports = {
  rootDir: process.cwd(),
  browsers: [
    playwrightLauncher({
      product: 'chromium',
      launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
      createBrowserContext: async ({ browser }) => {
        const context = await browser.newContext({ serviceWorkers: 'block' });
        const outbound = [];
        context.on('close', () => {
          fs.appendFileSync(networkLedgerPath, JSON.stringify(outbound) + '\n');
        });
        // The runner and synthetic frames are local. Never contact provider endpoints.
        await context.route('**/*', route => {
          const url = new URL(route.request().url());
          // Fulfill only fixture-owned hosted-field documents; never allow a remote request through.
          if (url.origin === 'https://testundefined.tags.static.api.com' &&
              /^\/(?:card-number|card-exp|card-cvv|card-name|billing-line[12]|billing-city|billing-state|billing-zip|account-number|account-name|account-type|routing-number|institution-number|transit-number|cash-name|cash-contact|checkout_qr)$/.test(url.pathname)) {
            outbound.push({ url: url.origin + url.pathname, disposition: 'local-fixture-fulfill' });
            return route.fulfill({ status: 200, contentType: 'text/html', body: hostedPeerHtml });
          }
          if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return route.continue();
          outbound.push({ url: url.origin + url.pathname, disposition: 'blocked' });
          return route.abort('blockedbyclient');
        });
        return context;
      },
    }),
  ],
  mimeTypes: {
    '**/*.ts': 'js',
  },
  files: ['test/**/*.web-test.js'],
  nodeResolve: true,
  coverage: true,
  coverageConfig: {
    reportDir: 'coverage',
    // Playwright 0.11 only collects coverage when native instrumentation is enabled.
    // Its collector prefers our static Istanbul __coverage__ map over the V8 result.
    nativeInstrumentation: true,
    reporters: ['lcov', 'json', 'json-summary', 'text-summary'],
    include: ['src/**/*.js', 'src/**/*.ts'],
    exclude: [],
  },
  plugins: [resolveExtensionlessImportsPlugin, staticCoverage.plugin, typeScriptModulesPlugin, cssModulesPlugin],
  testFramework: {
    config: {
      ui: 'bdd',
      timeout: '30000',
    },
  },
  testRunnerHtml: testFramework => `
    <html>
      <head>
        <script type="module">
          window.__coverage__ = ${staticCoverage.initialCoverage};
          window.process = {
            env: { NODE_ENV: 'test', ENV: 'test', STAGE: 'api' },
          };
        </script>
      </head>
      <body>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>
  `,
  debug: false,
};
