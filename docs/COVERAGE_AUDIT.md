# Independent coverage implementation audit

Date: 2026-10-29. A reviewer separate from the implementation author reproduced the evidence before PR submission. Claude additionally reviewed source and evidence read-only. Claude's verdict was **Publish, no blockers**. It did not execute tests.

The independent reviewer clean-installed dependencies and passed 496 tests under Node 26 and Node 18.20.8 with identical 52-file counters/maps, all global/critical gates, unchanged runtime/public declarations, types, TypeScript, lint, build, actual browser bundle and sibling checks. Negative coverage/corpus probes failed as intended.

Both reviewers verified the separate 24-producer / 24-parser-check / 36-hosted-hook corpus or its complementary source/evidence. The complete actual consumer pipeline was independently executed by the SDK reviewer. See CROSS_REPOSITORY_CONTRACTS.md for boundaries: already-decrypted hosted inputs, mocked SecurityProvider, synthetic provider/transport/storage, no Apple-issued or live-payment guarantee.

Coverage/provenance and workflow pins were reviewed. Runtime identity is relative to the prerequisite coverage/remediation commits, not current main. Missing private repository credentials explicitly fail CI; the user will configure COVERAGE_REPOS_TOKEN after publication. No remote pass is claimed before that step.

Claude's detailed static review follows. Its optional recommendations are not implementation guarantees. Documentation clarifications about baseline-relative floors, legacy helpers and the separate test lock were incorporated before publication.

---

## Verdict: Publish. I found no blockers.

I didn't run any commands or tests. This verdict comes from reading the four docs, the workflow, the gate and instrumentation tooling, the fixtures, all nine new browser test files, the cross-repo runner, checker and Vitest config, and the matching source. I checked that against the independent agents' saved artifacts (`AUDIT.md`, `measurement-verification.json`, `final-peer-pin-verification.json`).

## What I verified

**The tests exercise the real code, not copies or mocks**
- `test/support/real-fields-fixture.js` only replaces `fetch` and wraps `MessageChannel` in a Proxy that records each channel without changing it. It then mounts the actual registered card, bank and cash elements. No SDK method is stubbed.
- `test/support/hosted-peer.html` only relays messages and sends back set replies. Origin filtering, `postMessage` targets and real channel transfer stay active in the SDK.
- In the HF18 lifecycle test, `element.removeEventListeners = …` looks like a method replacement but isn't. It uses the public setter (`pay-theory-hosted-field-transactional/index.ts:617`), which is how `payment-fields-v2.ts:113` passes in the cleanup callback.
- I compared the transaction test (`hosted-field-transaction.web-test.js`) line by line with `transact`, `capture`, `cancel`, `tokenize` and `sendTokenAsync` (`index.ts:175-386`). The expected messages, defaults, error strings and changes to the caller's input all match the source.
- The negative checks prove something:
  - The HF18 check that a removed listener no longer fires is real, because `generateiFrameWindowListener` (`message.ts:63`) filters only on origin. A synthetic event with the right origin would have been handled if the listener were still attached.
  - The HF03 wrong-origin case is likewise a real rejection.
  - Tests count sends to rule out a second charge, and cover public CONFIRMATION → confirm and tokenize → cancel with no payment message sent.

**Coverage measurement and gates**
- `test/static-coverage.cjs` instruments the original source with standard Istanbul and starts all 52 files at zero.
- The two tests that load code in a separate document (`constructor-document-lifecycle.web-test.js:12`, `polyfill-fallback.web-test.js:320`) only point the child at the parent's coverage object. Istanbul's own counters do the counting, and nothing is synthesized or remapped. There are no new ignore comments, and `exclude: []`.
- `check-coverage-gates.cjs` covers what was asked:
  - It recomputes totals from the raw counters and checks them against the summary, both overall and per file.
  - It checks the file list against `src/` and against the baseline.
  - It checks each file's SHA-256 against the baseline.
  - It fails if any file's denominator changes or its coverage drops.
  - It applies rounded-up overall and critical-path minimums, and treats a zero total as a failure.
  - It allows only two named blocked URLs; any other blocked request fails.
- The audit's deliberately broken reports were all rejected (dropped critical-path coverage, a missing file, a forged summary, an unexpected network request), and the unaltered control passed.

**Timers, cleanup and the compiled bundle**
- Waits in the fixture time out after 5 s and are cleared at teardown. Teardown also removes window listeners and closes both ends of every channel. Fake clocks are used only in the timeout tests. The one test that leaves a message unanswered on purpose releases it so the promise settles.
- `test/check-bundle-browser.cjs` runs the real built `dist/index.js` and requires zero page errors and zero requests that leave localhost.

**CI**
- Every action is pinned to a commit SHA, and every checkout sets `persist-credentials: false`.
- Each sibling repo is checked out at an exact commit. The pins match the docs and `final-peer-pin-verification.json`.
- With no `COVERAGE_REPOS_TOKEN`, or with a PR from a fork, the first step fails the job (`ci.yml:79-86`), so it can't show green. The token is only used by the checkout steps.
- Setting `shell: bash` as the default gives `-eo pipefail`, so piping tests through `tee` can't hide a failure. There's no `pull_request_target`.
- The JS side blocks network calls in both Vitest hook suites and in the checker (`fetch` throws).

## Optional improvements (not blockers)
1. **Per-file floors only stop drops below the #459 baseline, not below today's numbers.** Overall and critical-path minimums would catch large regressions, but a non-critical file (polyfill, messenger, handler) could lose part of its new coverage silently. Consider adding a floor at the final per-file counts, or making `TEST_COVERAGE_IMPLEMENTATION.md:16` say "non-regression vs #459" explicitly.
2. **An empty network ledger passes** (`check-coverage-gates.cjs:33`). That could only happen if no browser context closed, but asserting at least one locally served request would close the gap.
3. `fixture().command()` awaits the peer's acknowledgement with no deadline of its own, so it falls back on Mocha's 30 s timeout. Failures would be clearer with one.
4. The handshake tests in `messenger-edge-contract.web-test.js` use a plain-object stand-in for the iframe with real channel ports. That's a fair boundary, but the doc's "real native channels" applies to the ports only.
5. CI stays on Node 18, which is end-of-life. Playwright 1.61 passed on 18.20.8 in the audit, but that may be outside Playwright's supported Node range, so keep an eye on it.
6. I couldn't see the socket repo, so I couldn't check whether `requirements-coverage-lock.txt` uses `--require-hashes` or whether the Python producer blocks the network. I'm relying on the socket review for those.

## Scope and limits
- **Dependency disclosure:** every result applies to unmerged prerequisite PR #459 (`c20b7e3c`), not to current main (`e6eb08cc`). The PR must say so and be measured again once #459 is merged.
- **Cross-repo scope:** the hosted hook tests use an already-decrypted corpus and a mocked SecurityProvider. That supports no claims about crypto compatibility between the Python and JS sides, Apple interoperability, the full hosted QR UI, or live providers. The docs already say this.
- **Existing bugs stay documented, not fixed.** These include the ACH/EFT layout errors, initialization that waits forever in the interactive state, the polyfill Request/fetch faults, the QR listener leak and the common helper having no timeout. Their tests describe current behaviour and don't present it as correct, which is right for a tests-only PR.
- **Before submitting,** compare the final commit against `reviewed-file-hashes.json`. The audit notes that later doc and workflow edits need that check.
## Post-publication CI lint correction

The first GitHub run exposed a lint-discovery mismatch: the exact repository CI
command includes `.ts`, but the new supplemental hook tests contained TypeScript
syntax while the configured parser is JavaScript. The earlier targeted lint
command had skipped those files. They were converted to `.contract-spec.js`, a
name that also avoids the existing legacy `*.test.js` ignore rule. Only erased
type syntax and the Vitest include/comment paths changed; all assertions remain.

A separate agent verified byte-identical executable output after standard type
erasure, confirmed both files are actually included by ESLint, reran the exact
`npm run lint:eslint` command successfully and reproduced all 24 producer cases,
24 parser checks and 36 hosted tests. Claude's targeted read-only review returned
Publish with no blockers before the correction was pushed. No owned runtime,
public API, WTR test, coverage map or coverage gate changed. GitHub core CI is
rerun; private CI still requires the separately deferred secret configuration.
