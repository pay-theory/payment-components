const { transform: esbuildTransform } = require('esbuild');
const fs = require('fs');
const path = require('path');

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
  mimeTypes: {
    '**/*.ts': 'js',
  },
  files: [
    'test/basic.web-test.js',
    'test/fee-validation.web-test.js',
    'test/improved-fee-validation.web-test.js',
    'test/credit-card.web-test.js',
    'test/createPaymentFields.web-test.js',
    'test/bank-routing-number.web-test.js',
    'test/bank-institution-number.web-test.js',
    'test/bank-account-name.web-test.js',
    'test/compliance-beacon.web-test.js',
    'test/pay-theory-messenger.web-test.js',
  ],
  nodeResolve: true,
  coverage: true,
  coverageConfig: {
    reportDir: 'coverage',
    include: ['src/**/*.js', 'src/**/*.ts'],
    exclude: [],
  },
  plugins: [resolveExtensionlessImportsPlugin, typeScriptModulesPlugin],
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
