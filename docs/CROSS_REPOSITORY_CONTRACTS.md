# Executable consuming-application contracts

This coverage follow-up changes no owned runtime JavaScript/TypeScript relative
to prerequisite SDK PR #459 (`c20b7e3c080a286c4557aca753ece9dd1bba94f1`).
The socket follow-up similarly preserves all owned Python relative to #585
(`36d82b7a06a92f8ffe6f49bf8ed69fb529ad6682`). These are incremental guarantees,
not claims that either prerequisite is identical to current main. Merge and
revalidate those prerequisites before merging the coverage follow-ups.

`npm run test:contracts:cross-repo` executes the actual socket producer corpus,
the actual hosted-library transforms, actual SDK parser, and actual hosted React
hooks. It fails if a sibling or its installed dependencies are unavailable. It
never substitutes a fixture implementation for a missing consumer.

## Required corpus

`tools/contracts/produce_socket_messages.py` belongs to tags-secure-socket.
It executes actual handler code, JWT verification, message/history builders and
box encryption, then captures API Gateway bytes and decrypts with a synthetic
peer. Storage, provider/kernel, secret/challenge and HTTP/API boundaries are
explicit doubles. No live bank, AWS, Apple, email or notification delivery runs.

The SDK checker requires exactly 24 named cases; a missing, duplicated or extra
case requires an explicit manifest review. Case-family counts:

| Family | Cases | Actual consumer evidence |
|---|---:|---|
| Compact/expanded transfer success, decline and transport error | 6 | Hosted transforms + SDK SUCCESS/FAILED/ERROR parsing; identifiers, metadata/tags and failure codes |
| Signed confirmation | 1 | Actual hosted confirmation projection + SDK CONFIRMATION; signature/merchant preparation capabilities not relayed |
| Fee with no payment_type | 1 | Actual fee transform: fee preserved, omitted payment_type becomes null; no invented backend field |
| Compact/expanded tokenization success and failure | 4 | Actual hosted transforms + SDK TOKENIZED/FAILED/ERROR; success is TOKENIZED, not SUCCESS |
| Barcode aliases | 2 | Actual cash transform + SDK CASH; barcode URL retained |
| APPLE_PAY/GOOGLE_PAY/PAZE wallet completion | 3 | Actual transfer projection/parser and actual useMessenger callback; serialized payload strings and transaction envelope |
| Host token with/without wallet capabilities | 2 | Actual useWebSocket correlation/key installation and useMessenger initialization/reconnect callbacks |
| Button/QR checkout session | 2 | Actual useButton response handler and generateQrCheckoutUrl; encoded sessionId preserved |
| Invoice resend | 1 | Actual useMessenger correlated success response |
| Apple merchant session | 1 | Actual useMessenger success/session envelope |
| Cancel acknowledgment | 1 | Actual useWebSocket correlation retains the cancel reply |

There are also 36 hosted hook tests: each of the 24 replies traverses actual
useWebSocket correlation, plus 12 control/application callback cases. The latter
include Apple WS_ERROR and unknown-response characterizations (no correlated
reply), and reconnect failure without false READY. The Apple negative case uses
an actual generic socket error envelope; it does not claim the producer's Apple
failure path was rerun by that individual hook case. Socket handler suites cover
its domain/service failures separately.

WebSocket/EventTarget transport, SecurityProvider and communication provider
contexts are doubles in the hosted hook tests. Replies are already decrypted by
the Python producer. This does not prove JavaScript/Python cryptographic
interoperability; no such implementation changes are introduced. The QR URL
builder and shared checkout reply are exercised; the full hosted QR component
is not mounted by this supplemental corpus. Actual SDK QR/custom-element paths
are exercised by the separate browser suite. No provider token validity or
Apple-issued interoperability claim is made.

## Local reproduction

Install the SDK and hosted-library lockfiles and the socket's complete
`requirements-coverage-lock.txt` in Python 3.12. Supply actual clean source layers
at the revisions in socket `COVERAGE.md` / `tools/verify_layer_sources.py`:
Amaze `56dfadc1d7e30a802e6b68dc5e847472c4325591`, Processors
`a311e74afb425e75ff26b82e6746aa7f9c7ad7e2`, Rate Limit
`b532150e26a546d474479f9aff7cea9a7c019189`. Hosted library was verified at
`a32d41f7ed59886aa5253495a2d57ce8136bfb8c` (unmerged #523).

From this SDK checkout, replace all placeholder paths:

```sh
SOCKET_ROOT=/path/to/tags-secure-socket \
SECURE_TAGS_LIB_ROOT=/path/to/secure-tags-lib \
AMAZE_SOURCE_ROOT=/path/to/amaze/src \
PROCESSORS_SOURCE_ROOT=/path/to/processors/src \
RATE_LIMIT_SOURCE_ROOT=/path/to/rate-limit/src \
PYTHON=/path/to/python3.12 \
CONTRACT_EVIDENCE_DIR=/path/to/evidence \
  npm run test:contracts:cross-repo
```

The output includes actual socket replies, transform/parser outcomes, a dual
console/JSON hosted test report, and source revisions plus hashes of key subjects.
Local development records parent commits plus file hashes; final published
revisions must also be recorded. The supplemental job is separate from the
496-test browser coverage measurement and cannot increase its counters.

## CI and acceptance

The SDK's regular CI now executes the full browser suite, all-source and
critical-path coverage gates, declaration checks, source TypeScript checks and
actual compiled-bundle execution. The cross-repository job uses Node 22 for
hosted Vitest and Python 3.12 for socket generation; existing SDK CI remains Node
18, which was independently exercised with the new browser tests.

Private checkouts require the read-only Actions secret `COVERAGE_REPOS_TOKEN`
(or a deliberately configured replacement). Missing credentials and untrusted
fork source fail explicitly rather than produce a successful "not run" check.
Credentials are not persisted by checkout or passed to test commands. Dependency
installations need registry access; test transports then fail closed offline.
No pull_request_target execution or production credentials are required.

Review both workflow pins and sibling source revisions whenever upgrading peers.
A green result applies to those exact sources and synthetic boundaries; it cannot
establish compatibility with undisclosed consumers or unverified deployed layer
versions. Existing Apple error correlation, validation and polyfill limitations
remain documented in the implementation report. A response/function behavior
repair needs a dedicated regression and consumer review, not an expected-output
update hidden in a coverage change.
