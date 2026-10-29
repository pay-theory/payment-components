# SDK coverage plan implementation and compatibility evidence

Assessment date: 2026-10-29. Implements the test/measurement work in [planning PR #460](https://github.com/pay-theory/payment-components/pull/460). The measured dependency is unmerged [PR #459](https://github.com/pay-theory/payment-components/pull/459), exact commit `c20b7e3c080a286c4557aca753ece9dd1bba94f1`. Main is still `e6eb08ccf37fc72b0efb3beab853b6ffbea20ff5`; these measurements are not attributed to current main. The implementation branch incorporates that dependency and the planning document. Reproduce the full baseline on the actual eventual merge result before accepting drift.

## Outcome

The complete browser suite passes **496 tests across 27 files**, compared with 206 tests across 18 files at the audited dependency: **290 new executable cases in nine files**. All 52 `.ts`/`.js` files under `src/` remain in the denominator, including the polyfill and zero-counter type modules. **Every source file is byte-identical to #459**; this implementation changes no production function, response, public declaration, enum or callback implementation. Source-hash comparison and coverage maps are retained in review/CI evidence. No files were removed, excluded or ignored to raise coverage.

| Metric | Baseline #459 | Final implementation | Additional covered |
|---|---:|---:|---:|
| lines | 1232/2517 (48.94%) | 2252/2517 (89.47%) | 1020 |
| statements | 1258/2626 (47.9%) | 2330/2626 (88.72%) | 1072 |
| functions | 210/529 (39.69%) | 449/529 (84.87%) | 239 |
| branches | 498/1400 (35.57%) | 1098/1400 (78.42%) | 600 |

Original-source Istanbul instrumentation runs before TypeScript erasure and seeds every owned source with zero counters. Summary/raw counter reconciliation, same inventory/source hashes/denominators, non-regression of every file metric relative to the #459 baseline, whole-source **80% lines / 70% branches**, and all named critical-path gates pass. The runner's single aggregate percentage is not line coverage. Tests never synthesize or edit counters. Child documents share the same standard Istanbul coverage object before importing unchanged, instrumented modules; final raw maps are independently auditable. Compiled-bundle execution is separate and contributes no counters.

## Critical-path gates

| Actual path | Final lines | Final branches | Required gate |
|---|---:|---:|---|
| `src/components/pay-theory-hosted-field-transactional/index.ts` | 199/204 (97.54%) | 95/103 (92.23%) | 90% lines / 80% branches |
| `src/components/pay-theory-hosted-field/index.ts` | 39/39 (100%) | 4/4 (100%) | 90% lines |
| `src/field-set/payment-fields-v2.ts` | 89/90 (98.88%) | 51/57 (89.47%) | 90% lines / 80% branches |
| `src/field-set/validation.ts` | 290/291 (99.65%) | 267/268 (99.62%) | 95% lines / 90% branches |
| `src/field-set/payment-qr.ts` | 38/39 (97.43%) | 29/29 (100%) | 85% lines / 75% branches |
| `src/components/pay-theory-checkout-qr/index.ts` | 26/26 (100%) | 10/10 (100%) | 85% lines / 75% branches |

## Plan case traceability

Case IDs are families, not one assertion per row. Parameter alternatives are independent Mocha cases; no skip/xfail was added. Existing 206 tests are retained and are not reclassified as real component assurance when they exercise old mocks.

| Plan family | Executable evidence | Real subject, assertions and boundaries |
|---|---|---|
| HF01–HF04 | `test/hosted-field-lifecycle.web-test.js` | Registers actual card, bank and cash components; mounts actual DOM; checks native iframe origin/names and decoded configuration, styles/defaults/placeholders/amount/country; ignores wrong-origin/unrelated readiness; all four checkout selectors and exact credential headers. Fetch is the boundary double. |
| HF05–HF09 | same file | Real token send/reset, missing token, thrown fetch with deterministic retry clock, absent iframe, explicit peer error, readiness gate across card/bank and native ready port, idempotent ready, amount zero, reset-before-update and no update on reset error. The peer is an actual cross-origin browser iframe fulfilled locally at the configured origin. |
| HF10–HF12 | same file | Dirty/clean, error clear/dedup behavior, required-field permutations, combined-card expansion, USA/CAN bank/cash cases, real state/valid messages, bank→ACH alias, owning zero fee and current sibling-zero omission, cash fee omission, absent sibling defaults. Protected-state inspection supplements observable native messages; methods under test are not replaced. |
| HF13–HF17 | `test/hosted-field-transaction.web-test.js` | Actual methods and native ports check billing-before-payment, default precedence and current input mutation, SUCCESS/FAILED/ERROR/CASH/CONFIRMATION raw envelopes, capture, tokenize success/failure and no charge, initial handshake failure, cancel-before-reset and failure states. Public mounted `actions.transact({confirmation:true})`→CONFIRMATION observer→`actions.confirm()`→capture observer asserts exact public fields, one payment/one confirm and false/zero metadata. Public tokenization→TOKENIZED observer→skipValidation reset→public cancel asserts no charge. |
| HF18 | lifecycle file and constructor-document file | Native append/remove/reappend exercises cleanup, token/fee/reconnect listener removal; tests current shared group cleanup. Fixture teardown removes all tracked platform listeners, closes both ends of created native channels and removes owned frames. |
| FC01–FC05 / FC07 | `test/real-field-construction.web-test.js` | Actual v2 constructor mounts combined/separate card, ACH, EFT, cash and multiple groups, default/custom containers where supported, shared UUID session, exact ready-channel response, no-fields and first initial-param errors, incomplete/conflicting layouts, explicit partial-mount and custom-separate-ID misclassification characterizations, all four checkout contexts, UUID platform/fallback, real legacy mount and initTransaction entry. |
| FC06 / FC08 | `test/constructor-document-lifecycle.web-test.js` | Fresh same-origin documents own module graphs/registries; document-ready state is controlled only in the disposable document. Complete initializes now, loading waits for DOMContentLoaded, interactive remains pending until a synthetic second event (existing defect), post-validation/no-fields listener installation and shared cleanup are explicitly characterized. Fixture channels and documents are closed. A local merchant session is not reused as a hosted-checkout session. |
| FC09 / entry | `test/browser-entry.web-test.js` and legacy constructor test | Actual `src/index.ts` installs global identities, canonical function/constants and all registrations; genuine `document.createElement` instances; deprecated wrapper warning/controller signatures; actual legacy controller mount. Source entry's CSS import uses a test-only empty JS shim; compiled-bundle evidence below separately verifies real stylesheet injection. |
| VA01–VA06 | `test/validation-implementation.web-test.js` | Real API-key/stage/migration, auth XOR and all checkout selectors, fee/amount/styles/metadata/country, registered card/ACH/EFT/cash layouts with malformed/missing/default/false/zero alternatives. Exact errors and current broken ACH/EFT missing-field behavior are asserted, not repaired. |
| VA07–VA14 | same file; constructor/public action cases; strict declaration fixtures | Payor/normalization/ID exclusivity, invoice/recurring, billing, Level3, health enums, hosted CTA/payment methods and QR number-truthiness boundary, full pipeline first-error ordering/immutability. Runtime defensive cases coexist with compile-time invalid country/QR callback tests and existing exact input/return contracts and auth/checkout XOR/selector fixtures. Current zero/truthiness/error-name oddities are characterized. |
| QR | `test/qr-implementation.web-test.js` | Real constructor and custom element; fixed container, 127/128/300/301 and fractional/negative clamp cases, token payload, optional callbacks, native hosted-origin ready/success/error, resize, early teardown guard, validation/no-token/fetch/missing-container behavior, duplicate token append and existing validation error-listener leak. Early never-connected teardown is an explicit unit call to the real callback; normal teardown is native DOM removal. |
| Polyfill | `test/polyfill-fallback.web-test.js` | Actual exported Headers/Response/Request/fetch with deterministic fake XHR and real Blob/FormData/array buffers where supported. Normal APIs run in the primary instrumented realm; conditional native-present/fallback installs run in disposable same-origin realms with standard shared coverage maps. No live XHR. Known Request/fetch defects are negative characterizations, not claimed successful fallback networking. |
| Async/message packet E | `test/messenger-edge-contract.web-test.js` plus existing real-subject messenger contracts | Real native channels: negative/wrong handshake acknowledgment behavior, malformed primitive/null input, stale/duplicate IDs, out-of-order correlation, timeout cleanup, serialization failure pending-entry characterization, absent window and disconnect. Common helper's distinct no-deadline behavior is observed, then its controlled held peer is released so the test's promise settles. Existing actual wallet callback/retry tests and four persistent command/all-wallet-enum checks remain. |
| Actual compiled bundle | `test/check-bundle-browser.cjs`, `npm run test:bundle:browser` | Serves the built `dist/index.js` on ephemeral localhost, launches locked Chromium, executes bundle globals/registrations/constructors/styles and invalid API error. Requires zero browser page errors and zero attempted nonlocal requests. Supplemental behavior evidence, not extra source coverage. |

## Fixture architecture and isolation

`test/support/hosted-peer.html` is a finite transport peer served by Playwright `route.fulfill` only at the exact configured test hosted origin and explicit known field/QR paths. The real source origin filters, postMessage targets, iframe navigation, native MessageChannel transfer and SDK handlers remain active. The fixture does not copy the SDK or replace its methods. Parent records a received-message ledger and acknowledges it before the peer releases a native port response, giving deterministic observability without sleeps or altered SDK behavior. Field/session/correlation payloads are synthetic. All other remote requests are aborted. Service workers are blocked.

Each WTR invocation resets `coverage/network-guard.jsonl`; browser-context close appends local-fixture and blocked-attempt records. The gate permits exactly two intentional legacy fixture URLs: `https://example.com/secure-iframe` from copied old payment-fields mocks, and `https://cdn.example/late.js` from the late compliance-script test. Any other blocked remote attempt fails the gate, even if application error handling swallows its abort. No remote URL is allowed through. The final measured run had 194 recorded remote-origin attempts: 25 expected synthetic blocked URLs, zero unexpected blocked attempts; the remainder were fulfilled locally. These are run-specific diagnostic counts, not a stable request-count contract: early iframe teardown can change how many navigation attempts are observed. Independent reproduction saw 200 total attempts / 27 expected blocked rows; both runs had zero unexpected blocked endpoints and no remote request was allowed through.

`test/support/real-fields-fixture.js` records actual platform listener registrations and native channels, filters ledger sources to its owned frames, and closes/removes them during teardown. A Proxy constructor records native MessageChannel instances without replacing their methods or payload behavior. Source methods are never stubbed. `constructor-document.html` supplies true disposable same-origin documents; tests do not mutate the shared test document's readiness/global registry.

## Compatibility conclusion and boundaries

The strongest no-drift evidence is that all 52 source files, including `src/paytheory-sdk.ts`, are byte-for-byte unchanged from the audited dependency. Runtime tuples, enums, response/event serializers, promise/error behavior, defaults and signed/capability forwarding cannot have been changed by a test-only implementation diff. Public declaration builds, standalone imports, exact input/output contract checks and the unchanged actual sibling validator/constants check pass. Native mounted-field public workflows additionally execute the actual response parser and observers with independently specified expected objects and exact call counts.

This is a conclusion about this follow-up relative to #459, not an endorsement that every preexisting behavior is desirable or every consuming application has been run. #459's Apple retry correction is inherited and separately reviewed there. Cross-repository producer/hosted-transform/SDK corpus uses pinned sibling revisions and is validated separately; synthetic tokens prove forwarding/type, not provider decryption, authorization by a bank or successful settlement. Any new response/function correction discovered during testing must be a separately described runtime change with red/green regressions and consumer review.

## Preexisting behavior exposed, unchanged

- ACH/EFT layout helpers discard errors returned inside `forEach`; incomplete layouts can pass. Custom separate-card container IDs can be classified as combined-card input by hardcoded ID comparisons.
- `formatPayorObject` nullifies top-level empty strings but discards nested recursive clone results; some financial/Level3 checks use truthiness, and error names can identify the wrong field.
- Interactive document initialization can wait indefinitely for a DOMContentLoaded event that already fired. Removing one transacting group invokes shared group cleanup. Invalid construction/QR validation can leave listeners unless the external fixture disposes them.
- Common postMessage helper has no timeout. Channel null input throws in destructuring; negative acknowledgment success is not inspected; serialization failure leaves a pending entry until timeout/disconnect. These are explicit characterizations, not repairs or desired contracts.
- Polyfill Request GET/HEAD, cloning, typed-array handling and fallback fetch have concrete preexisting ReferenceError/TypeError paths; successful downstream native-network behavior is not claimed. Every unexecuted branch remains in the denominator. See focused polyfill tests for exact source-level failures.
- QR fetch rejection/missing container/Unicode btoa behavior may throw; repeated token assignment appends another iframe. First-attempt negative Apple validation and hosted-peer failure correlation remain prior limitations; no new envelope is invented.

No skip, relaxed validation, new coverage ignore, production API narrowing, threshold reduction or automatic second charge was introduced to make these cases pass.

## Reproduction and evidence

Use the lockfile, install the browser expected by the directly declared Playwright tool, and execute tests before gates. Node 26.7.0/npm11.19.0 were used for the primary run; new packets also passed under Node 18.20.8, matching the existing CI runtime family. Chromium149.0.7827.55 / Playwright1.61.1 were used. Versions are actual recorded values, not an assertion that older supported engines/browser variants have all been tested.

```sh
npm ci --ignore-scripts --include=optional
npx playwright install chromium
npm run test:coverage
npm run test:coverage:gates
npm run test:types
npm run check-ts
npm run lint
npm run build:local
npm run test:bundle:browser
SECURE_TAGS_LIB_ROOT=/absolute/path/to/pinned/secure-tags-lib npm run test:contracts:sibling
```

`test/coverage-baseline.json` records immutable #459 file counters and source hashes. `test/check-coverage-gates.cjs` recomputes standard summary metrics from raw Istanbul data, reconciles the supplied summary, compares all-source membership/source hashes/denominators, rejects per-file regression and enforces ceiling-based global/path targets. It fails on missing reports or unreviewed runtime drift; legitimate production changes require explicit baseline/contract review, not silent threshold reduction. Counterexamples exercised outside the repository prove nonzero exit for missing source, zero source, forged summary, critical QR branch loss while global coverage remains sufficient, and unexpected blocked endpoint. Positive control exits zero.

Every new packet passed five focused repetitions; the final public mounted packet was repeated five times after adding the requested confirmation/tokenization flows. A full test-file order randomized with seed 20261029 passed; independent final audit must reproduce final source/report counters and the exact final test count. There are no new skipped tests. Full types, TypeScript, lint, local bundle/declarations and actual sibling checks passed; the compiled bundle browser test has zero external requests/page errors. Existing ESLint configuration excludes TypeScript source; TypeScript checks are separate and passing, not TS ESLint assurance.

Retain CI artifacts: full log with exit status/test count, `coverage-final.json`, `coverage-summary.json`, LCOV, `coverage-gates.json`, `network-guard.jsonl`, dependency/toolchain versions and baseline/final source/lockfile hashes. Independent agent and Claude review are required before implementation PR publication; publication status belongs in the PR description, not inferred from an implementation author's own green run. No live payment, provider token, deployment or package publication is part of validation.

## Complete final source ledger

All denominators are unchanged from #459. Counts are covered/total; imports/type-only zero files remain visible. These figures are evidence, not manually editable coverage inputs.

| Source | Lines | Functions | Branches |
|---|---:|---:|---:|
| `src/index.ts` | 7/7 | 2/2 | 0/0 |
| `src/paytheory-sdk.ts` | 0/0 | 0/0 | 0/0 |
| `src/polyfill.js` | 301/364 | 80/100 | 169/224 |
| `src/common/data.ts` | 70/75 | 2/4 | 3/14 |
| `src/common/dom.ts` | 49/49 | 8/8 | 23/24 |
| `src/common/format.ts` | 53/53 | 12/12 | 34/34 |
| `src/common/index.ts` | 1/1 | 0/0 | 0/0 |
| `src/common/message.ts` | 116/125 | 35/43 | 54/72 |
| `src/common/network.local.ts` | 22/24 | 4/5 | 13/14 |
| `src/common/network.ts` | 59/59 | 17/17 | 17/18 |
| `src/common/observe.ts` | 20/26 | 11/17 | 0/0 |
| `src/common/retry-utils.ts` | 21/21 | 5/5 | 14/16 |
| `src/common/sdk-runtime-values.ts` | 4/4 | 0/0 | 0/0 |
| `src/compliance/beacon.ts` | 115/130 | 25/29 | 55/73 |
| `src/components/bank-account-name/index.ts` | 4/4 | 1/1 | 0/0 |
| `src/components/bank-account-number/index.ts` | 4/4 | 1/1 | 0/0 |
| `src/components/bank-account-type/index.ts` | 4/4 | 1/1 | 0/0 |
| `src/components/bank-institution-number/index.ts` | 4/4 | 1/1 | 0/0 |
| `src/components/bank-routing-number/index.ts` | 4/4 | 1/1 | 0/0 |
| `src/components/bank-transit-number/index.ts` | 4/4 | 1/1 | 0/0 |
| `src/components/card-present/index.js` | 1/4 | 0/1 | 0/0 |
| `src/components/cash-contact/index.ts` | 4/4 | 1/1 | 0/0 |
| `src/components/cash-name/index.ts` | 4/4 | 1/1 | 0/0 |
| `src/components/credit-card/index.ts` | 5/5 | 1/1 | 1/2 |
| `src/components/credit-card-account-name/index.ts` | 4/4 | 1/1 | 0/0 |
| `src/components/credit-card-address-1/index.ts` | 4/4 | 1/1 | 0/0 |
| `src/components/credit-card-address-2/index.ts` | 4/4 | 1/1 | 0/0 |
| `src/components/credit-card-city/index.ts` | 4/4 | 1/1 | 0/0 |
| `src/components/credit-card-cvv/index.ts` | 4/4 | 1/1 | 0/0 |
| `src/components/credit-card-exp/index.ts` | 4/4 | 1/1 | 0/0 |
| `src/components/credit-card-number/index.ts` | 5/5 | 1/1 | 1/2 |
| `src/components/credit-card-region/index.ts` | 4/4 | 1/1 | 0/0 |
| `src/components/credit-card-zip/index.ts` | 4/4 | 1/1 | 0/0 |
| `src/components/pay-theory-checkout-button/index.ts` | 26/33 | 10/17 | 6/12 |
| `src/components/pay-theory-checkout-qr/index.ts` | 26/26 | 8/8 | 10/10 |
| `src/components/pay-theory-hosted-field/index.ts` | 39/39 | 12/12 | 4/4 |
| `src/components/pay-theory-hosted-field-transactional/index.ts` | 199/204 | 52/53 | 95/103 |
| `src/components/pay-theory-overlay/index.ts` | 18/24 | 7/9 | 4/12 |
| `src/field-set/actions.ts` | 136/145 | 8/10 | 69/90 |
| `src/field-set/handler.ts` | 17/45 | 4/10 | 8/34 |
| `src/field-set/payment-button.ts` | 85/105 | 9/14 | 20/48 |
| `src/field-set/payment-fields-v2.ts` | 89/90 | 15/15 | 51/57 |
| `src/field-set/payment-fields.ts` | 7/8 | 3/4 | 1/6 |
| `src/field-set/payment-qr.ts` | 38/39 | 3/4 | 29/29 |
| `src/field-set/validation.ts` | 290/291 | 39/39 | 267/268 |
| `src/messenger/constants.ts` | 19/19 | 0/0 | 0/0 |
| `src/messenger/index.ts` | 0/0 | 0/0 | 0/0 |
| `src/messenger/messenger-channel.ts` | 47/51 | 11/12 | 17/20 |
| `src/messenger/pay-theory-messenger.ts` | 235/313 | 37/49 | 104/182 |
| `src/messenger/state-manager.ts` | 28/29 | 5/5 | 7/8 |
| `src/messenger/token-manager.ts` | 40/40 | 7/7 | 22/24 |
| `src/messenger/types.ts` | 0/0 | 0/0 | 0/0 |

## Final independent acceptance

A separate agent independently clean-installed the lockfile and reproduced all 496 browser tests under Node 26 and Node 18.20.8, exact raw maps and summaries for all 52 source entries, all coverage gates, source/public declaration identity, and types/lint/build/actual bundle/sibling checks. Deliberately damaged reports and corpus inventories failed as expected. Claude completed a read-only source/evidence audit with a Publish verdict and no blockers; Claude did not execute tests.

The versioned cross-repository pipeline independently passed 24 actual producer cases, 24 transform/parser checks and 36 actual hosted-consumer hook cases. See CROSS_REPOSITORY_CONTRACTS.md for commands, exact scope and limitations. Existing baseline protection is relative to #459; the minimum global and critical gates do not freeze every new non-critical hit at its final count.

Both workflow files pass actionlint and use reviewed immutable peer inputs. The user will configure COVERAGE_REPOS_TOKEN after publication; private CI jobs fail explicitly until that external step is done. No green remote private-integration result is claimed in advance. Merge and revalidate prerequisite #459 first.
