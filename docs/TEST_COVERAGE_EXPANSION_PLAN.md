# Payment Components test coverage expansion plan

Planning date: 2026-10-29. Status: proposed implementation plan; this documentation PR adds no tests, changes no runtime behavior and claims no new coverage. Intended owner: SDK maintainers, with a separate test author and independent reviewer for each slice. Repository: `pay-theory/payment-components`.

## 1. Decision requested and dependency order

Approve the staged work below to exercise real SDK field/component lifecycles and protect applications consuming SDK functions, messages and events. The target is **at least 80% whole-source line coverage and 70% whole-source branch coverage**, plus stricter gates for payment-critical paths. Those are proposed acceptance targets, not measurements or a guaranteed forecast.

This plan PR targets `main` independently. Its main source base is `e6eb08ccf37fc72b0efb3beab853b6ffbea20ff5`. The measured starting point for future implementation is **unmerged [PR #459](https://github.com/pay-theory/payment-components/pull/459), commit `c20b7e3c080a286c4557aca753ece9dd1bba94f1`**, which supplies the static coverage tooling, 206-test suite and Apple merchant-validation retry correction. Do not represent its measurements as main's current coverage. Merge #459 first, or explicitly base an implementation branch on that audited commit and document the temporary dependency. Reproduce baseline on the actual merge result before evaluating gains. This plan can merge before #459 because it contains documentation only; implementation gates cannot assume #459's scripts are present until its source is included.

The related hosted peer is `secure-tags-lib`, and backend producer is `tags-secure-socket`. Cross-repository changes need coordinated reviews; this SDK plan does not authorize silently editing those applications. Existing socket/hosted coverage work is useful evidence, not a guarantee that deployed versions match local source.

## 2. Evidence baseline and what the numbers mean

#459 final evidence uses original-source Istanbul instrumentation before TypeScript erasure, seeded zero counters for every `src/**/*.ts` and `src/**/*.js` file, no runtime-file exclusions, and 52 source-file entries. Test count is 206 passing browser tests in 18 files. All-source totals at its audited head:

| Metric | Covered / total | Percentage |
|---|---:|---:|
| Lines | 1232 / 2517 | 48.94% |
| Statements | 1258 / 2626 | 47.90% |
| Functions | 210 / 529 | 39.69% |
| Branch outcomes | 498 / 1400 | 35.57% |

The original 129 tests measured on original main source yielded 755/2515 lines (30.01%) and 232/1396 branches (16.61%). #459 adds a retry-only guard, changing those denominators. Running the original 129 tests (13 browser test files) against #459's final source yielded 755/2517 lines (29.99%) and 232/1400 branches (16.57%). Future comparisons must preserve this distinction: a source change can change counter maps/denominators even if test tooling does not change. Do not compare a loaded-module percentage to these whole-source figures or use the runner's single aggregate display as line coverage.

The independent audit reproduced #459 counters, full inventory and maps; it did not conclude that the breadth of testing was sufficient. Existing tests named for field construction often import copied mocks. New public-action tests exercise an explicit hosted-element adapter and therefore leave the real component internals untouched. Passing those tests is not evidence that a merchant's actual mounted fields work.

### Prioritized measured gaps

| Owned path (under `src/`) | Lines | Branch outcomes | Why it matters |
|---|---:|---:|---|
| `components/pay-theory-hosted-field-transactional/index.ts` | 0/204 | 0/103 | Actual token, ready, fee, state, charge, confirmation, cancellation and tokenization lifecycle |
| `components/pay-theory-hosted-field/index.ts` | 0/39 | 0/4 | Real iframe creation, configuration token and sanitized DOM container |
| `field-set/payment-fields-v2.ts` | 5/90 | 1/57 | Current public constructor, country/field selection, mounting and readiness |
| `field-set/validation.ts` | 114/291 | 55/268 | Public input acceptance, rejection, defaults and financial field constraints |
| `field-set/payment-qr.ts` | 0/39 | 0/29 | QR creation, encoded payload, callbacks and token failure |
| `components/pay-theory-checkout-qr/index.ts` | 0/26 | 0/10 | Actual QR custom element behavior |
| `field-set/handler.ts` | 17/45 | 8/34 | Relay/state/error handling observed by applications |
| `messenger/pay-theory-messenger.ts` | 235/313 | 104/182 | Public lifecycle, wallet/validation errors and credential refresh |
| `messenger/messenger-channel.ts` | 47/51 | 17/20 | Untrusted frame replies, correlation and teardown |
| `index.ts` | 0/7 | 0/0 | Browser globals, legacy adapters and side-effect registration |
| `polyfill.js` | 0/364 | 0/224 | Compatibility fallbacks shipped in the browser bundle |

These are baseline counters, not promised final results. Most small individual component registration wrappers are also zero-covered. The full baseline inventory appears in Appendix A. File source line numbers can move; cite method names and reviewed SHA in test work items.

## 3. Quantitative targets and feasibility

Proposed cumulative whole-source milestones on #459's fixed denominators:

| Gate | Minimum lines | Minimum branches | New covered vs #459 | Intended work slices |
|---|---:|---:|---|---|
| M0 baseline | 1232/2517 | 498/1400 | None; independently reproduce first | 0 |
| M1 | 60% = at least 1511/2517 | 45% = at least 630/1400 | +279 lines, +132 branch outcomes | Real component harness + core lifecycle + first validation cases |
| M2 | 70% = at least 1762/2517 | 60% = at least 840/1400 | +530 lines, +342 branch outcomes | Full constructor/validation/QR/consumer matrix |
| M3 acceptance | 80% = at least 2014/2517 | 70% = at least 980/1400 | +782 lines, +482 branch outcomes | Edge paths, registration and supported polyfill cases |

Percentages are minimum gates using ceiling arithmetic. They are planning allocations, not predictions that a given slice alone reaches its gate. Recalculate with `ceil(actual_total * target)` when runtime changes legitimately move denominators; publish both original and new inventory, maps, counters and reasons. A slice can pass its own behavioral acceptance while the cumulative gate remains open. Do not declare the entire effort complete until M3 and all critical contract cases pass.

The legacy polyfill is 364/2517 executable lines (14.46%) and 224/1400 branch outcomes (16%). Even covering every non-polyfill line would cap whole-source line coverage at 85.54%; reaching 80% without any polyfill coverage would require 2014/2153 = 93.54% of non-polyfill lines. Reaching 70% branches without any polyfill coverage would require 980/1176 = 83.33% of non-polyfill branches. Therefore the plan includes real fallback tests, and does not assume easy UI gains alone solve the total. A supplemental modern-code breakdown may help diagnosis but must never replace the authoritative all-source number. Do not remove the polyfill solely to meet the gate. A separately reviewed support-policy/bundle-removal decision would be a different change with consumer impact analysis.

Proposed per-path gates by M3: transactional element >=90% lines and >=80% branches; base hosted element >=90% lines; fields-v2 >=90% lines and >=80% branches; validation >=95% lines and >=90% branches; QR constructor/custom-element pair each >=85% lines and >=75% branches; existing messenger/channel/state/token metrics must not regress. These percentages are proposed and require measured results; reachable untested financial/error branches cannot be waived just because a file crosses a percentage. No numerical per-polyfill target substitutes for the whole-source M3 gate; inventory each supported fallback and record both native-present and fallback-active evidence.

## 4. Harness architecture and isolation rules

### 4.1 Real subjects

Import real production modules and register real custom elements. Exercise `document.createElement`/append/remove and public constructors/actions. Do not replace `transact`, `tokenize`, `sendTokenAsync`, validators, formatters, field constructors or registered custom-element classes with copied implementations. A minimal subclass is allowed only when needed to supply the real base constructor's required type-specific configuration; prefer real credit-card/bank/cash subclasses. Document any protected-state setup and pair it with public event/method assertions. Do not count artificially invoking getters as lifecycle assurance.

Use real `MessageChannel` ports for SDK↔synthetic-peer behavior, with a synthetic peer script served at the exact configured hosted origin through Playwright request interception. Production handlers and origin filtering remain active. A harness may intercept the browser's iframe/platform transport or provide a local peer endpoint; it may not stub the production message method under test. The synthetic peer provides scripted connection, fee and payment responses; all unmatched requests fail closed. The production listener compares `event.origin` to `hostedFieldsEndpoint`, and outgoing posts target that origin; an ordinary localhost iframe cannot impersonate it. #459 currently blocks every non-localhost request before it reaches the network. Extend that test-only route handler with a narrow explicit allowlist that fulfills only fixture-owned hosted-origin paths from local content, never `route.continue()` for those remote URLs. Keep production origin checks and bundled defaults unchanged. Assert zero unmatched outbound requests; inspect the actual origin seen on both frame and parent messages. Any alternative test configuration seam needs separate review proving defaults are unchanged. Avoid exporting private runtime APIs solely for tests when a real public path is practical.

### 4.2 Proposed support files

- `test/support/hosted-peer.js`: finite scripted peer with received-message ledger, actual transferred-port replies, explicit manual release of pending responses, expected target origin and exactly-once assertions.
- `test/support/real-fields-fixture.js`: merchant container IDs, actual element registration, matching token fetch fixtures and cleanup registry; no copied SDK constructor.
- `test/support/browser-observers.js`: subscribe to actual public observers/window messages, record payload+order, unsubscribe and fail on unexpected delivery.
- `test/support/assert-no-leaks.js`: track ports/listeners/requests created by fixture, fail for residual callbacks, pending fake timers or unhandled rejections.
- Proposed test filenames in the following work packets use existing `*.web-test.js` discovery. Names are suggestions; implementation reviews must map every case ID to an executable assertion.

Reset merchant DOM and listeners after each case. Close both ports, remove iframes, restore browser globals and fetch/clock replacements, unsubscribe observers and settle/cancel fixture-owned tasks. Keep native scheduling unless a timeout test explicitly controls the clock; advance one deadline and drain microtasks before asserting. Avoid elapsed-time sleeps and global module-cache dependence. Use unique element IDs and avoid registering the same custom-element name repeatedly in one realm. For incompatible registration/native-patching cases use a fresh iframe/browser realm; never try to undefine a registered custom element.

## 5. Work packet A — real hosted-field lifecycle (highest priority)

Proposed files: `test/hosted-field-lifecycle.web-test.js`, `test/hosted-field-transaction.web-test.js`, `test/hosted-field-state.web-test.js`. Real subjects: base hosted element, transactional superclass, actual card/bank/cash registrations, real common message helpers and parsers. Platform doubles: fetch response, peer frame and controlled clock only.

| ID | Trigger / arrangement | Required observable assertions |
|---|---|---|
| HF01 | Mount actual card, US bank and cash elements in merchant containers | Sanitized container, correct iframe IDs/names/URL paths; decode configuration token and compare origin/styles/placeholders/amount/country exactly; no private token value in error text |
| HF02 | Default vs explicit empty styles/placeholders | Preserve existing defaults versus empty object behavior and input immutability where declared; do not silently sanitize/change contract as test repair |
| HF03 | `pt-static:pt_token_ready` for matching and unrelated field | Matching element triggers one actual fetch and token command; unrelated field does nothing; reject wrong-origin message using actual listener |
| HF04 | API-key token vs checkout-context token | Exact existing header/query rules, session handling and fields array; checkout selectors each exercised; never send both credential modes |
| HF05 | Token response, missing token, thrown fetch, missing transacting iframe and error peer reply | Existing READY or typed NO_TOKEN shape and exact public error category; no false-ready/connected transition on failure; promise resolves/rejects according to present contract |
| HF06 | First connection then reset/reconnection | `connection_token` vs `reset_host` envelope, no duplicate initial ready event on already-ready element, connected state, new token used once |
| HF07 | Mount second transacting element not yet ready | `pay-theory:ready` and ready-port acknowledgment only when all present types are ready; absent types do not block; each observer payload stays `{type, data}` |
| HF08 | Set amount before/after ready; fee update with own/unrelated field | Update-amount sends only after readiness; exact amount including zero/undefined characterization; fee state retains zero; unrelated field ignored |
| HF09 | Fee reconnect succeeds/fails | Reset precedes update amount; failed reset sends no update; correct iframe ID and unchanged financial amount |
| HF10 | Change clean/dirty/valid/invalid state and unknown field | Actual state-group update and emitted state; first dirty error, clear dirty valid error, unchanged error produces no duplicate; unknown field ignored |
| HF11 | Combined credit card and separate number/expiry/CVV plus required ZIP | Dirty/error status controls `valid`; combined field expands required components; field-presence permutations; no unexpected valid event when value unchanged |
| HF12 | Card+bank+cash validity/service fees | Preserve bank→ACH compatibility alias, field ordering and cash fee omission; own zero fee versus sibling zero fee behavior characterized separately; default state for absent types |
| HF13 | Actual `transact` with fee/metadata omitted and supplied | Default precedence and exact `pt-static:payment-detail` data; real initial transacting/billing command; input mutation, if existing, recorded explicitly rather than pretending immutability |
| HF14 | Initial transacting failure; payment SUCCESS/FAILED/ERROR/CASH/CONFIRMATION | Correct promise result and observer routing; no second payment send; flags reset on current failure path; no lost IDs, fees, metadata or tags |
| HF15 | `capture()` after confirmation | Exact confirm envelope, original confirmation context retained by peer and public capture result shape; invalid order characterized before proposed rejection behavior |
| HF16 | `tokenize()` success/failure/initial transacting error | Exact tokenize-detail body, initialized/transacting flags and public success/failure envelope; no accidental charge command |
| HF17 | Cancel: iframe present+reset READY, reset failure, iframe missing | Target origin, one cancel send, reset ordering, true vs CANCEL_FAILED, initialized/transacting state; distinguish element cancel from public no-fields action's allowed void |
| HF18 | Remove/reappend real element; callbacks arrive after removal | All four existing cleanup registrations invoked; no stale listener delivery; characterize whether outstanding promises settle before proposing lifecycle change |

HF01–HF18 are case families, not a promise of eighteen tests. Expand each financial/branch alternative into explicit independent assertions. For concurrency (two calls, disconnect during fetch, fee reply after amount change), build controlled reply order rather than race the machine. Test current state semantics first; any discovered stale-fee, duplicate-send or rejection leak becomes a separately described runtime fix with a red-before/green-after regression and consumer review.

## 6. Work packet B — current and legacy field construction

Proposed `test/real-field-construction.web-test.js` imports actual `payment-fields-v2.ts`; `test/legacy-field-construction.web-test.js` exercises actual deprecated wrappers, not `test/mocks/payment-fields.js`.

| ID | Matrix | Assertions |
|---|---|---|
| FC01 | Complete US ACH, Canadian EFT, combined card, separate card and cash layouts | Exactly selected country types mounted into configured/default IDs; correct siblings vs transactional element; configured amount/metadata/placeholders/styles/country/session propagated |
| FC02 | Multiple supported groups at once | One session for the group, each real element configured, ready waits for all, valid/state aliases stable, no cross-group contamination |
| FC03 | Empty layout; sibling-only group; missing transacting field; incomplete card/ACH/EFT/cash | Existing NO_FIELDS/FIELD_ERROR type/text, correct validation order, no token fetch/payment send; characterize listener cleanup: listeners are added after initial-parameter validation but before later NO_FIELDS/FIELD_ERROR returns |
| FC04 | API key vs each checkout selector; both/neither | Correct discriminator and exact public response; explicitly characterize partial mounting when a later group fails, since the mount loop can return after earlier groups were appended; record resulting DOM/listener/network state before proposing any change |
| FC05 | Existing hosted-checkout session on matching/nonmatching location | Same-session reuse only under existing predicate; otherwise UUID; use deterministic platform UUID, test fallback when unavailable in isolated realm; capture substring-origin concern for separate assessment rather than changing it in tests |
| FC06 | Document complete, loading and interactive states | Complete initializes immediately; loading initializes after DOMContentLoaded. Characterize interactive state where DOMContentLoaded has already fired: current code never initializes and leaves the promise pending. Use a bounded harness observation, not an assertion that current code resolves. Audit handler cleanup and duplicate DOMContentLoaded without depending on test-page load timing |
| FC07 | Successful readiness port vs initialization error | `{type:'READY',body:true}` through actual channel, compliance beacon called only appropriate path, no external beacon transport; no hanging test if input returns error |
| FC08 | Remove one real mounted field; remove all; build again | Characterize that removing one transacting element invokes shared group listener cleanup, potentially affecting surviving groups. Assert current impact on surviving fields, rebuild behavior and duplicate callbacks; cover real fixture teardown and separate any proposed lifecycle fix |
| FC09 | `create` and deprecated `createPaymentFields` globals | Preserve argument mapping, return type, deprecated warning and MERCHANT_FEE default; no new network calls on validation error |

Case FC06 needs a true fresh document, not a global `readyState` mutation shared with unrelated suites. Beacon fetch/image transport is a platform boundary, not permission to contact an external endpoint. Preserve checkout context semantics shared with token-service tests; assert exact query names and session header behavior.

## 7. Work packet C — validation decision tables

Proposed `test/validation-implementation.web-test.js`; use actual exported validation functions and also feed representative cases through real constructor/action entry points. Table-driven pure-function tests alone cannot prove caller ordering and emitted public errors. Explicitly record `null`, `undefined`, empty string, false and zero separately. Never loosen production acceptance merely to satisfy fixtures.

| ID | Subject | Required alternatives and contracts |
|---|---|---|
| VA01 | API key/checkInitialParams | Wrong type, empty, malformed key parts, wrong partner/stage, legacy/new stage handling; each valid deployment-format fixture; key/context mutual exclusion |
| VA02 | Checkout context | Exactly one of invoiceId/linkId/recurringHash/sessionId; zero/two selectors; wrong type, empty strings, unknown extra keys; match token query behavior |
| VA03 | Amount/fee mode/fee | Positive integer, zero, negative, fractional, NaN, Infinity, string, null/missing; default mode and both supported modes; fee null/undefined/zero/positive/negative/fraction/string with current semantics characterized, including integer-message inconsistency if present |
| VA04 | Metadata/styles/country | Object/array/primitive, missing/default/empty, unsupported country and exact supported enums; preserve error order and avoid implicit coercion |
| VA05 | Card layouts | Combined/separate conflicts, missing CVV/expiry/number, complete layouts and optional fields; mounted-ID conflicts through actual DOM |
| VA06 | ACH/EFT/cash layouts | Each required field removed singly, transacting-only/sibling-only/none, optional-field presence; country maps and error category preserved |
| VA07 | Payor details | Same-as-billing true/false, names/addresses optionality, valid/invalid email and phone normalization, international formatting, empty-string→null handling, caller object mutation checks |
| VA08 | Payor ID and payor info | Only ID, only details, both, neither; exact rejection and no transport after invalid data |
| VA09 | Invoice/recurring IDs | Each separately valid, both forbidden, wrong type and empty values; exact snake_case mapping |
| VA10 | Billing info | Missing vs object and required fields, malformed shape and false-like values; assert actual contract, not assumed future schema |
| VA11 | Level 3 summary | null/undefined, wrong type, tax/freight/duty/discount amounts including zero and malformed values, purchaser/order/postal strings, product description allowed/length constraints, tax indicator enum; inspect source for exact limits before writing boundary values. Characterize current truthiness-based zero handling and error-field naming mismatches (including purch_idfr reporting ship_from_zip); do not silently correct them in tests |
| VA12 | Health expense | Missing/null, every declared enum and invalid casing/type; preserve existing error |
| VA13 | Hosted checkout options / QR size | All declared CTA/payment-method enums; invalid enum, payment name missing/empty/wrong type; QR validator rejects non-numbers and falsy 0; it has no min/max rule. Separately test constructor clamp boundaries 127/128/300/301, plus fraction, NaN and negative-number characterization |
| VA14 | Full validTransactionParams pipeline | Fail one stage at a time in source order, assert first error stable and no transport; valid payload unchanged through real common parser and constructor/action |

Use compile-time fixtures alongside runtime rejection cases: valid public overloads, exact argument tuples and result unions; invalid country/selector/input typing using expected compile errors. Runtime tests may cast malformed values for defensive-path coverage without changing public types. Add first-error assertions so application-facing error messages do not drift under validator refactors. Existing acceptance of odd values should be marked characterization; decide financial/schema hardening explicitly with maintainers and peer consumers rather than pinning it forever without explanation.

## 8. Work packet D — QR, browser entry and supported fallback behavior

Proposed `test/qr-implementation.web-test.js`: real `payment-qr.ts` and checkout-QR element. Assert invalid transaction/options/size short-circuit before token fetch; valid create uses the fixed `common.checkoutQRField` container ID, real element and encoded payload; synthetic token success/missing/throw paths; onReady/onSuccess/onError delivery count and exact payload; callback listener cleanup; repeated create behavior; amount/fee/merchant metadata forwarding. Decode the URL/token and compare exact data rather than trusting a snapshot blob. Exercise Unicode payment name/metadata through current btoa path and characterize any exception as a potential bug; do not silently replace encoding and change backend decoding in a test-only slice. Check missing QR container behavior and report whether thrown/returned error matches declared public API before choosing a fix. Characterize the existing errorObserver registration before validation: rejected input can leave a listener registered. Measure that leak with actual observer delivery and separate any cleanup fix from test-only work.

Proposed `test/browser-entry.web-test.js` and an actual compiled-bundle fixture: import browser entry in fresh realm using the build's CSS/module path support; verify `window.paytheory`, `window.PayTheoryMessenger`, exported default identity, all declared function/observer/constants, custom-element registration and actual instantiability. Existing bundle test scans textual side-effect markers; retain it but add execution because marker presence does not prove functioning registration. Direct WTR import of `src/index.ts` includes CSS; choose supported CSS transformation or bundle-based local fixture deliberately, validate original-source coverage mapping and do not count a second uninstrumented bundle run as coverage. Repeated load/registration exceptions are characterization until intended load-once behavior is documented. Assert deprecated wrapper warning and argument/default mapping against actual implementation.

Proposed `test/polyfill-fallback.web-test.js`: import the actual exported `Headers`, `Request`, `Response` and `fetch` implementations directly in the normal instrumented test realm; use fake XHR at the platform boundary to execute their behavior without requiring native global removal. Those implementations use their own exported classes internally, so most fallback lines can be covered through this path with the existing collector. Use fresh isolated realms specifically for conditional global installation checks, such as absent/present String methods or fetch, where global descriptors must differ. Inventory actual conditional shims and helpers first; Blob body-handling support is not a claim that the source installs a Blob constructor shim. Do not assume browser support policy or copy a polyfill into tests. Compare observable standards behavior for relevant supported cases: boundary positions/lengths, negative indices where implemented, header normalization/repeated values/invalid names, request/response clone/body-used guards, text/JSON body handling, XHR success/network/error/abort. XHR itself is a platform double, with no real outbound request. Preserve/restore descriptors by discarding the realm; do not delete platform prototypes on shared test window. Native-present case asserts existing native identity unchanged. Direct exported-implementation coverage uses normal original-source maps. Additional coverage from isolated global-install realms must be collected/merged by the real instrumentation pipeline with identical file hash/maps; if collector misses subframes, implement and independently verify proper counter aggregation rather than declare uncovered fallback lines covered by an unrelated Node run. Test supported fallbacks in Chromium first, then document browser matrix separately; modified globals are not proof of a legacy browser's complete behavior.

## 9. Work packet E — remaining async/message and peer contract risks

Proposed expansion of existing actual-subject messenger contracts and `test/consumer-contract-roundtrip.web-test.js`:

- Null/primitive/malformed frame payload, wrong origin/source/command/correlation ID, negative handshake acknowledgment, late response after timeout, duplicate reply, transferred-port failure and iframe disappearance during initialization.
- Calls before initialize, during refresh, after destroy; concurrent refresh and teardown; failed token refresh; deterministic pending-promise cleanup and no unhandled rejection. Preserve existing retry budget and promise/event ordering. A messenger-channel timeout test must assert pending-map removal and the promise outcome, not merely that the clock advanced. Distinguish that API from the separate common `sendAsyncPostMessage` helper, which currently has no timeout: characterize its pending behavior using a bounded fixture, and raise any new deadline as a separately reviewed consumer-visible behavior change.
- Run the actual local `wallet-test/wallet.js` validation callback with successful first attempt, successful retry, legacy retry without success property and repeated-expiry ERROR. Retain #459 regression; assert no `completeMerchantValidation` on explicit retry failure, one abort, bounded sends and no automatically retried charge.
- Hosted peer currently only sends correlated Apple validation replies for success. Define, with secure-tags-lib maintainers, what WS_ERROR/unknown/rejection should produce. Test the actual peer handler and SDK consumer together in a companion change before proposing a new envelope. Do not mistake the synthetic TOKEN_EXPIRED fixture for proof current backend emits it. First-attempt negative body still follows prior SDK handling; document intended consumer behavior and require a separate compatibility decision if changing it.
- Extend existing real sibling validator/constants check with registered handler/relay execution: exact all fourteen literals, four persistent commands, response discriminator and error shapes, APPLE_PAY/GOOGLE_PAY/PAZE serialized payload string bytes, amount/metadata/false/zero mapping. Build actual consumer code from reviewed pinned revisions; fail if unavailable, never silently skip and call integration green.
- Reuse eight producer/consumer scenario categories from the prior cross-repo audit (compact/expanded success, decline, transport error, confirmation and fee without payment_type), but commit reproducible fixtures/generator commands and consumers in the relevant follow-up repos. An external processor stub proves orchestration only, not bank acceptance/decryption/settlement.

Consumer contract table to complete in each slice: source function/message → actual consumer path/revision → input → exact successful and failed result → side effects/call count/order → optionality/default compatibility → test ID. Preserve `SUCCESS`/`FAILED`/`ERROR`/`CONFIRMATION` shapes, IDs, metadata/tags, fee totals and bank/ACH aliases. Compare generated public declarations and standalone import fixtures before/after; no signature, overload or enum rename may hide inside a test-maintenance change. Test both a current consumer and documented legacy aliases where supported.

## 10. Proposed implementation slices and review gates

| Slice | Scope / deliverables | Exit gate | Effort estimate |
|---|---|---|---|
| 0 | Incorporate #459; immutable baseline capture; per-file coverage diff/gates; actual-component fixture proof; inspect support policy | Exact 206 pass and current counters reproduced on chosen base, no excluded runtime files; harness runs one real connection offline | 1–2 engineer days |
| 1 | HF01–HF12 real base/transactional lifecycle, readiness/state/fee/cleanup | Critical positive+negative lifecycle cases; no leak/unhandled rejection; M1 evaluated | 2–4 days |
| 2 | HF13–HF18 real transact/capture/tokenize/cancel and FC01–FC09 constructors | Actual mounted-field path through public action and peer response; type/event compatibility; M2 progress recorded | 2–4 days |
| 3 | VA01–VA14 exhaustive validation decisions and actual caller ordering | Per-path validation gate and table completeness, input/response contract audit | 2–3 days |
| 4 | QR, entry/bundle execution and fallback realm harness | QR per-path gate, public global/declaration parity, supported shims inventoried and exercised | 2–4 days |
| 5 | Async/message adversarial cases and real peer producer/consumer integration; cumulative gaps | M3 >=80% lines/>=70% branches AND critical-path gates, no open blocking audit findings | 2–4 days |

Estimated total is 11–21 engineering days before review/CI queue time, with overlap possible after stable fixtures. This is a planning estimate, not a deadline or guaranteed test count. Realm coverage merging, origin constraints, newly discovered behavioral defects and cross-repository API agreement can add work. Assign named owners and reviewer at scheduling; do not invent ownership from this plan. Each slice should be an independently reviewable PR; split runtime fixes out of test-only changes whenever possible, linking red/green evidence and migration implications. No slice may merge a known regression merely to meet the numeric gate.

## 11. Reproduction, CI changes and evidence retention

The commands below are existing scripts at #459; some are absent on main until that PR is incorporated. The audited final suite was run with `npm test`; #459 turns coverage on in configuration, so `npm run test:coverage` is comparable there. On current main that script exists but still uses the old loaded-module measurement; comparable whole-source results require #459’s configuration first. Use a clean checkout/lockfile installation, record exact Node/npm/Chromium and sibling revisions; current main CI requests Node 18. The historical #459 evidence does not establish the local Node/npm versions sufficiently to cite them here. Record exact future local and CI versions and demonstrate compatibility, or deliberately update the supported runtime in a tooling PR. Do not silently assume a locally installed browser or developer absolute path exists in CI.

```sh
npm ci --ignore-scripts --include=optional
# Install the Chromium version expected by the locked Playwright tooling,
# using the appropriate package-local Playwright command; record version.
npm run test:coverage
npm run test:types
npm run check-ts
npm run lint
npm run build:local
SECURE_TAGS_LIB_ROOT=/absolute/path/to/secure-tags-lib npm run test:contracts:sibling
```

Sibling check requires actual secure-tags-lib source and dependencies; the existing runner reads `SECURE_TAGS_LIB_ROOT` (default `../secure-tags-lib`), and the explicit example path above must identify the actual installed sibling checkout. Pin and record its source revision before wiring CI. Test code must fail with a clear setup error if absent. Browser installation may require OS libraries in CI; pin browser/runtime action setup in a dedicated tooling change. Dependency-install lifecycle scripts are disabled above; if any future package needs them, document and narrowly enable that requirement rather than weakening test setup silently.

Current main `.github/workflows` runs dependency installation, lint, check-ts and public type checks; the browser-test step is commented out. It does **not** currently run full browser coverage. Slice 0/1 should propose enabling deterministic browser coverage, uploaded raw/summary/LCOV artifacts and a coverage gate once compatible setup is demonstrated. A green existing `ci` status alone is not acceptance evidence for this plan. Require the new job on implementation PRs once reliable. Do not run npm publish, CDN deployment or credentialed provider calls as test validation.

Add a small reviewed coverage checker reading standard `coverage/coverage-summary.json` and `coverage/coverage-final.json`: enumerate source inventory, verify total counters, compute ceil targets, report per-path deltas and uncovered branches, fail for decrease or inventory loss unless explicitly reviewed. The checker is test infrastructure, not a hand-edited counter generator. Missing reports/zero tests/zero source entries/error exit must fail. Always check process exit status as well as report status; do not pipe away failures. Retain no-ignore default reporter logs alongside machine JSON where supported.

For every implementation PR retain: base/head SHAs, lockfile hash, environment/browser versions, complete command/exit status, original and final raw maps/summaries/LCOV, test discovery/count, per-file counters, inventory additions/removals, unexpected outbound-request ledger, known skips, red/green logs for fixes and audit disposition. Artifacts should use ordinary CI retention and synthetic values; no live API keys/payment tokens or provider payloads. Evidence links must be durable repo/CI references, not another developer's absolute local paths.

## 12. Independent audit and acceptance checklist

The reviewer must be different from the implementing agent/engineer. If Claude is used as additional audit, record its scope and limits; model review does not substitute for independently executed tests. Review the exact commit intended for submission and re-audit source changes after feedback.

- [ ] Exact starting dependency and source inventory reproduced; main versus #459 clearly distinguished.
- [ ] New tests import real production subjects; no copied function under test, internal-method replacement or imported-source-only smoke assertions used as behavioral evidence.
- [ ] HF/FC/VA/QR/entry/message cases have executable mappings, meaningful outcome and negative side-effect assertions.
- [ ] All-source >=80% lines and >=70% branches reached on the actual final denominator; critical-path gates also reached; no deletion, new coverage exclusions, ignore pragmas or lowered thresholds used to inflate gains.
- [ ] Transaction/confirmation/cancel/tokenize tests cover valid and invalid states and assert no unexpected double send/charge.
- [ ] Exact errors, return unions, event names, aliases, IDs, optional fields, callback counts/order and input mutation assumptions reviewed against actual consumers and public declarations.
- [ ] Native port/browser lifecycle executed; fake clock/platform boundaries are explicit; no external transport; no pending task/port/listener/unhandled rejection after teardown.
- [ ] Pure validation table includes false/zero/empty/null/undefined and exact source boundary values; accepted oddities separated from approved behavior corrections.
- [ ] Root browser entry and actual bundle side effects exercised; native-present and supported polyfill fallbacks executed in isolated realms; cross-realm coverage aggregation independently validated.
- [ ] Full browser suite, type/declaration fixtures, TypeScript, lint, local bundle and actual sibling checks pass on clean environment. Existing ESLint config's TypeScript exclusions are disclosed; TypeScript passing is not a claim of TS lint coverage.
- [ ] Targeted new tests repeated at least five times with controlled order, then full suite in normal and randomized order with recorded seed; no blanket retries or increased timeouts to hide flakes. Runtime budget regression reviewed against measured CI baseline rather than an invented limit.
- [ ] Defects found have separate disposition: confirmed fix with red/green and consumer audit, product compatibility decision, or documented unresolved blocker. No knowingly incorrect contract test approved as desired behavior solely because code currently behaves that way.
- [ ] Independent reviewer reproduces a meaningful subset from each packet plus full final suite, examines raw source coverage maps and checks report arithmetic; audit findings closed and exact reviewed SHA attached.

## 13. Explicit residual limitations and decisions

80%/70% is an engineering gate, not proof of security/correctness. Real Apple/Google/Paze token validity, provider decryption, issuer acceptance, bank settlement, production iframe/CDN deployment, browser permissions and AWS concurrency are outside this offline unit/contract plan. Any end-to-end environment work needs its own fixtures, credentials, approval scope and pass criteria. Existing hosted-peer Apple failure handling and unawaited reconnect callbacks require cross-repo attention; this SDK-only plan cannot claim to resolve them. Clarify supported legacy browsers before making bundle/polyfill removal decisions. If a supported path is genuinely unreachable, provide source/caller proof and a separately reviewed removal proposal, not an exclusion.

The plan's completion means measured critical-path tests, full-suite gates and peer-contract evidence are delivered and independently audited. It does not mean merely that this planning PR merged or every row acquired a test filename.

## Appendix A — full #459 measured source inventory

Counts below are preserved from the audited #459 report. Zero-counter type-only modules are included in the inventory but add no executable denominator. Re-measure after any runtime/source/tooling change; do not treat this appendix as a mutable source of counters.

| Source file | Lines covered/total | Functions covered/total | Branches covered/total |
|---|---:|---:|---:|
| `src/index.ts` | 0/7 | 0/2 | 0/0 |
| `src/paytheory-sdk.ts` | 0/0 | 0/0 | 0/0 |
| `src/polyfill.js` | 0/364 | 0/100 | 0/224 |
| `src/common/data.ts` | 70/75 | 2/4 | 3/14 |
| `src/common/dom.ts` | 21/49 | 3/8 | 8/24 |
| `src/common/format.ts` | 53/53 | 12/12 | 34/34 |
| `src/common/index.ts` | 1/1 | 0/0 | 0/0 |
| `src/common/message.ts` | 103/125 | 28/43 | 44/72 |
| `src/common/network.local.ts` | 22/24 | 4/5 | 13/14 |
| `src/common/network.ts` | 44/59 | 9/17 | 17/18 |
| `src/common/observe.ts` | 18/26 | 9/17 | 0/0 |
| `src/common/retry-utils.ts` | 21/21 | 5/5 | 14/16 |
| `src/common/sdk-runtime-values.ts` | 4/4 | 0/0 | 0/0 |
| `src/compliance/beacon.ts` | 105/130 | 21/29 | 52/73 |
| `src/components/bank-account-name/index.ts` | 0/4 | 0/1 | 0/0 |
| `src/components/bank-account-number/index.ts` | 0/4 | 0/1 | 0/0 |
| `src/components/bank-account-type/index.ts` | 0/4 | 0/1 | 0/0 |
| `src/components/bank-institution-number/index.ts` | 0/4 | 0/1 | 0/0 |
| `src/components/bank-routing-number/index.ts` | 0/4 | 0/1 | 0/0 |
| `src/components/bank-transit-number/index.ts` | 0/4 | 0/1 | 0/0 |
| `src/components/card-present/index.js` | 0/4 | 0/1 | 0/0 |
| `src/components/cash-contact/index.ts` | 0/4 | 0/1 | 0/0 |
| `src/components/cash-name/index.ts` | 0/4 | 0/1 | 0/0 |
| `src/components/credit-card/index.ts` | 0/5 | 0/1 | 0/2 |
| `src/components/credit-card-account-name/index.ts` | 0/4 | 0/1 | 0/0 |
| `src/components/credit-card-address-1/index.ts` | 0/4 | 0/1 | 0/0 |
| `src/components/credit-card-address-2/index.ts` | 0/4 | 0/1 | 0/0 |
| `src/components/credit-card-city/index.ts` | 0/4 | 0/1 | 0/0 |
| `src/components/credit-card-cvv/index.ts` | 0/4 | 0/1 | 0/0 |
| `src/components/credit-card-exp/index.ts` | 0/4 | 0/1 | 0/0 |
| `src/components/credit-card-number/index.ts` | 0/5 | 0/1 | 0/2 |
| `src/components/credit-card-region/index.ts` | 0/4 | 0/1 | 0/0 |
| `src/components/credit-card-zip/index.ts` | 0/4 | 0/1 | 0/0 |
| `src/components/pay-theory-checkout-button/index.ts` | 26/33 | 10/17 | 6/12 |
| `src/components/pay-theory-checkout-qr/index.ts` | 0/26 | 0/8 | 0/10 |
| `src/components/pay-theory-hosted-field/index.ts` | 0/39 | 0/12 | 0/4 |
| `src/components/pay-theory-hosted-field-transactional/index.ts` | 0/204 | 0/53 | 0/103 |
| `src/components/pay-theory-overlay/index.ts` | 18/24 | 7/9 | 4/12 |
| `src/field-set/actions.ts` | 136/145 | 8/10 | 69/90 |
| `src/field-set/handler.ts` | 17/45 | 4/10 | 8/34 |
| `src/field-set/payment-button.ts` | 85/105 | 9/14 | 20/48 |
| `src/field-set/payment-fields-v2.ts` | 5/90 | 1/15 | 1/57 |
| `src/field-set/payment-fields.ts` | 0/8 | 0/4 | 0/6 |
| `src/field-set/payment-qr.ts` | 0/39 | 0/4 | 0/29 |
| `src/field-set/validation.ts` | 114/291 | 18/39 | 55/268 |
| `src/messenger/constants.ts` | 19/19 | 0/0 | 0/0 |
| `src/messenger/index.ts` | 0/0 | 0/0 | 0/0 |
| `src/messenger/messenger-channel.ts` | 47/51 | 11/12 | 17/20 |
| `src/messenger/pay-theory-messenger.ts` | 235/313 | 37/49 | 104/182 |
| `src/messenger/state-manager.ts` | 28/29 | 5/5 | 7/8 |
| `src/messenger/token-manager.ts` | 40/40 | 7/7 | 22/24 |
| `src/messenger/types.ts` | 0/0 | 0/0 | 0/0 |
