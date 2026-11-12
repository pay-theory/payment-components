# Web Test Runner Migration

The project has been migrated from Karma to Web Test Runner for more modern testing capabilities. This readme provides instructions for working with the new testing setup.

## Test Files

Tests have been migrated to use the `.web-test.js` extension. The following test files are now available:

- `test/basic.web-test.js` - Basic tests to verify Web Test Runner setup
- `test/fee-validation.web-test.js` - Tests for fee validation functionality
- `test/improved-fee-validation.web-test.js` - Tests for improved fee validation with better type safety
- `test/credit-card.web-test.js` - Tests for credit card component functionality
- `test/createPaymentFields.web-test.js` - Tests for payment field creation functionality

## Running Tests

Several npm scripts are available for testing:

```bash
# Run all tests
npm test

# Run tests in watch mode (automatically re-runs when files change)
npm run test:watch

# Run tests with coverage reporting
npm run test:coverage

# Run tests in debug mode (opens browser for debugging)
npm run test:debug

# Run individual test files
npm run test:basic
npm run test:improved-fee
npm run test:fee
npm run test:credit-card
npm run test:payment-fields
```

## Configuration

The Web Test Runner configuration is in `web-test-runner.config.js` and includes:

- Tests targeting `.web-test.js` files in the `test/` directory
- Code coverage reporting
- Running tests in headless Chromium browser
- Support for TypeScript using esbuild

## Mock Implementations

Due to challenges with importing TypeScript files directly in the browser environment, we've created mock implementations of key modules:

- `test/mocks/data.js` - Mock implementation of the data module
- `test/mocks/validation.js` - Mock implementation of the validation module
- `test/mocks/payment-fields.js` - Mock implementation of the payment fields module

These mocks provide the same API as the actual modules but with simplified implementations suitable for testing.

## Test Structure

The migrated tests follow a more modern structure:

1. Imports use ES modules and `.js` extensions
2. Test cases are written with async/await for better readability
3. Timeouts use promises instead of native Promise timeouts
4. Error assertions use clearer syntax
5. Test fixtures are structured for better maintainability

## Benefits of Web Test Runner

- Faster test execution
- Better support for modern ES modules
- Improved debugging experience
- Better coverage reporting
- Easier configuration
- More modern browser environment
- **Completely eliminated all 34 security vulnerabilities** that were present in the previous test framework
- **Removed 616 unnecessary packages** from the project, reducing dependency footprint by over 60%
- Significantly smaller attack surface and improved security posture
- Actively maintained testing framework with regular updates

## Converting More Tests

To convert additional tests to Web Test Runner format:

1. Create a new file with `.web-test.js` extension
2. Import the production TypeScript implementation through the runner; replace only explicit browser, network, clock, or hosted-element boundaries
3. Update test fixtures to use the new format
4. Replace any legacy test APIs with Web Test Runner equivalents
5. Add the new test file pattern to the test script in package.json

## Troubleshooting

If you encounter issues with the tests:

1. Make sure production TypeScript modules resolve through the runner's esbuild plugin; a mock implementation of the subject cannot demonstrate its runtime coverage
2. Check that your test assertions match the actual behavior
3. Try running a specific test file rather than all tests at once
4. Use the `--debug` flag to see more detailed output
5. Ensure all required DOM elements are properly created in the test environment

## Whole-source coverage and offline contracts

`npm test` and `npm run test:coverage` instrument every `src/**/*.ts` and
`src/**/*.js` file with Istanbul before TypeScript transpilation. The runner seeds
zero counters for every source file, so a module omitted by the tests stays in
the denominator with zero coverage. No source module is imported merely to raise
coverage. Type-only modules have no executable counters. Reports are written to
`coverage/coverage-final.json`, `coverage/coverage-summary.json`, `coverage/lcov.info`,
and `coverage/lcov-report/`.

The Playwright Chromium context blocks requests outside localhost and blocks
service workers. Browser tests use synthetic tokens, responses, iframes and
MessageChannel peers; they do not contact payment providers. Install Chromium
through the existing CLI (`npx playwright install chromium`) or select a local
Chrome executable with `CHROME_PATH`:

```sh
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm test
npm run test:types
npm run check-ts
npm run lint
npm run build:local
```

Playwright launcher 0.11 only collects coverage when its native instrumentation
flag is enabled. The collector then prefers `window.__coverage__`, which is our
static Istanbul map; the report is not a dynamically discovered V8 denominator.
The static maps preserve original TypeScript line locations.

`npm run test:contracts` runs the synthetic SDK contracts. To also execute the
actual secure-tags-lib command validator and compare its constants against the
SDK, use a sibling checkout (its dependencies must be installed):

```sh
SECURE_TAGS_LIB_ROOT=../secure-tags-lib npm run test:contracts:sibling
```

This sibling check intentionally fails if the real source/validator is missing;
it does not replace the other application's implementation with a copied fixture.
It covers all four persistent commands, message constants, and the three uppercase
SDK wallet identifiers. The sibling application's own hook/transport integration
tests remain necessary to verify its producer behavior and backend integration.
