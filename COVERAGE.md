# Coverage and application contracts — 2026-10-29

This change measures the complete `src/**/*.ts` and `src/**/*.js` inventory and
adds implementation-level browser, public API and wire-contract tests. The
baseline is `e6eb08ccf37fc72b0efb3beab853b6ffbea20ff5`; source inclusion covers all
52 files with no exclusions. The original 129 tests were rerun with the same
static instrumentation used for the final 206 tests.

| Metric | Original tests on final source | Final |
|---|---:|---:|
| Lines | 755/2517 (29.99%) | 1232/2517 (48.94%) |
| Statements | 769/2626 (29.28%) | 1258/2626 (47.90%) |
| Functions | 114/529 (21.55%) | 210/529 (39.69%) |
| Branches | 232/1400 (16.57%) | 498/1400 (35.57%) |
| Browser tests | 129 passing | 206 passing |

## Measurement and reproduction

`test/static-coverage.cjs` uses standard Istanbul instrumentation of original
TypeScript/JavaScript before esbuild transpilation. Zero counters are inventoried
for every source file, including unloaded modules. It does not execute imports
to inflate coverage. The original 129-test filename set was also run against the
final source/configuration: every static map and denominator matches the final
comparison. The original-source baseline was 755/2515 lines, 769/2624
statements, 114/529 functions and 232/1396 branch outcomes. Figures above were
measured with an SDK retry-failure guard that was later dropped in favor of
premain's PRD-779 behavior; rerun `npm run test:coverage` for current counts. A legacy polyfill remains
entirely uncovered and included in the totals.

Use the committed lockfile and an installed Playwright Chromium or local Chrome:

```sh
npm ci --ignore-scripts --include=optional
npx playwright install chromium
npm test
npm run test:types
npm run check-ts
npm run lint
npm run build:local
SECURE_TAGS_LIB_ROOT=../secure-tags-lib npm run test:contracts:sibling
```

`CHROME_PATH` can select an existing local Chrome executable. The runner blocks
external browser requests and service workers. JSON, JSON-summary, LCOV and HTML
reports are written under `coverage/`. The runner's aggregate console percentage
is not the line percentage; use the separate standard summary metrics.
`test:contracts:sibling` requires the actual sibling source and dependencies and
fails if they are absent, rather than silently using a copied validator.

## Added assertions and actual consumers

- Actual `MessengerChannel`: native transferred ports, handshake and command
  correlation IDs, all four persistent commands, three wallet enums, concurrent
  reply ordering, unknown IDs, expiry, disconnect and cleanup.
- Actual SDK initialization and public wallet methods: real token/state/channel
  logic with fetch and iframe transport boundaries; exact camelCase-to-snake_case
  fields, false/zero preservation, invoice responses, transaction events and no
  automatic second charge after a socket error.
- Actual network/TokenManager/retry code: all checkout selectors, headers,
  URL encoding, selector rejection, coalescing, cache/expiry/fallback, bounded
  retries, deadlines and original-error preservation.
- Actual formatters, observers, field relay and public actions: compact/expanded
  success/failure, tokenize failures, legacy `tags` plus `metadata`, service-fee
  confirmation, cash/error shapes, unsubscribe/origin filtering, field readiness,
  action guards, request mapping and reset/error behavior.
- Compile-time tests: exact public input tuples and Apple/wallet return types;
  invalid lowercase wallet and missing-amount inputs; implementation/public
  declarations, standalone declarations, internal stripping and bundle globals.
- The sibling check executes the real hosted-library validator and compares all
  fourteen messenger literals, four command shapes and uppercase wallet values.

## Runtime compatibility decisions

`getApplePaySession()` behavior is owned by premain (PRD-779): after a
TOKEN_EXPIRED refresh retry it returns the same public shape as an initial
request, `{type:'SUCCESS', session:body}`, whether or not the retried body
reports success. This branch adds no runtime change; its tests pin that shape,
including a failed retry body (`{success:false, error}`) being passed through
under SUCCESS exactly as a first-attempt negative body is.

`wallet-test/wallet.js:170–185` requires SUCCESS plus session before calling
`completeMerchantValidation`. Tests execute that actual local callback, extracted
verbatim from its source, to document that repeated expiry hands the failed
retry body to `completeMerchantValidation` (as a first-attempt failure does) and
that a successful legacy retry still completes validation. There is still only
one refresh and two validation sends. The current hosted peer does not emit
every supported failure envelope, so this is not proof of end-to-end
expired-token recovery.

Positive Apple/Google wallet fixtures use serialized synthetic JSON strings;
Paze uses an opaque synthetic string. Exact passthrough is asserted, matching the
sample application's JSON.stringify boundary and the backend string expectation.
No runtime serialization or public type narrowing was added. These fixtures do
not validate provider payload schemas, real wallet acceptance or Paze decryption.

No-field `cancel()` still resolves `undefined`, as the public SDK declaration
already permits `void`. Neither its runtime behavior nor its internal annotation
is changed here. Public declarations are unchanged.

## Validation, audit and remaining limits

The 206-test offline suite, public/internal type tests, source TypeScript check,
lint, local bundle/declaration build, bundle surface and sibling check pass.
An independent read-only agent reviewed the preceding patch. Final semantic
review then required the payload-fixture corrections described above. The implementer reran all checks and the immutable-base filename suite
with identical final-source maps. Independent agent audit and the final Claude delta audit passed before publication.

Substantial misses remain: root/custom-element lifecycles, QR/hosted flows and
the polyfill. Some legacy tests import mock SDK implementations; they are retained
but do not establish production implementation coverage. The new tests exercise
real subjects and substitute only stated boundaries. Real payment acceptance,
deployed providers, third-party application releases and a complete live iframe
stack were not tested.

The current hosted messenger only sends Apple validation replies for its success
response; other responses can time out. Its connection/reconnect callbacks also
have a preexisting rejected-promise handling gap. These are disclosed sibling
limitations, not changes introduced by this branch.
