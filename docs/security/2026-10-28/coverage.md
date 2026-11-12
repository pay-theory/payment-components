# Coverage and unresolved questions: payment-components

Assessed source: `e6eb08ccf37fc72b0efb3beab853b6ffbea20ff5`. Recorded coverage disposition: **complete**.

This is source-review coverage, not a runtime penetration test or an exhaustive third-party dependency advisory assessment. A reviewed source path does not establish deployed exposure.

## Reviewed surfaces

### Token fetching and checkout capability construction

**Disposition:** no_issue_found. **Risk area:** Session authorization.

src/common/network.ts:20-122 uses configured token endpoint, explicit checkout query cardinality/encoding and session-header rules. Backend authorization reviewed in separate token/socket scans.

### Hosted-field and checkout window messages

**Disposition:** no_issue_found. **Risk area:** Cross-origin message handling.

src/common/message.ts:48-81 applies exact origin gates; transactional sendAsyncPostMessage:120-129 targets hosted-fields origin and transfers a MessagePort. No foreign-origin spoof path established here.

### Messenger port handshake and replies

**Disposition:** no_issue_found. **Risk area:** Capability channel establishment.

src/messenger/messenger-channel.ts:28-54 transfers port to iframe.contentWindow using '*'; readiness checks configured origin in pay-theory-messenger.ts:384. No attacker navigation path established; hardening opportunity is exact target origin/source binding.

### Caller-selected hosted session condition

**Disposition:** rejected. **Risk area:** Client-side session restriction.

payment-fields-v2.ts:269 uses substring host comparison. Focused cross-repo review found no independent privilege gain: caller already controls its SDK and may select x-session-key; hosted-session token lookup binds Merchant/SessionKey and rejects expiry/completed/spent state (pt-token-service/token_service.py:432-463). External connect authorizer remains uninspected.

### Field collection, transaction formatting and fee validation

**Disposition:** no_issue_found. **Risk area:** Payment command integrity.

All current src/components, src/field-set and runtime types inspected. Current validation.ts numeric/nonnegative checks differ from obsolete fee-test descriptions; no source-backed authorization bypass established in this client repo.

### Compliance telemetry and endpoint configuration

**Disposition:** no_issue_found. **Risk area:** Recipient and deployment boundaries.

beacon.ts targets configured hosted field origin; production/local endpoints traced in network.local.ts. Local field server coexists with deployed token/checkout endpoints by design; external storage/retention not assessed.

### Examples, tests, build and publication workflows

**Disposition:** no_issue_found. **Risk area:** Credentials and privileged releases.

Baseline fully inspected product source, examples, tests, docs and scripts. SDK API key explicitly public at paytheory-sdk.ts:695; no private credential found. npm/S3/Git mutations require existing operator authority; none executed.

### Dependency lockfile metadata

**Disposition:** no_issue_found. **Risk area:** Dependency source configuration.

Parent structurally inspected all 1,228 package records: all 1,227 resolved URLs use HTTPS registry.npmjs.org without embedded credentials/nonregistry sources. Four packages have install-script metadata; their external implementations were not audited.

## Explicit exclusions

- `**/.DS_Store`: Finder metadata; not executable product source.
- `.codacy-coverage/codacy-coverage-reporter`: Checked-in external ELF coverage utility inventoried and strings checked by baseline; binary implementation not reverse engineered.

## Deferred candidates

No candidate remains awaiting validation in this repository report. External deployment and dependency questions below remain assurance limits.

## Remaining questions

- {'question': 'External connection-authorizer implementation and deployed iframe/CSP/log/recipient policies remain outside these five repository snapshots.'}
- {'question': 'Source/Window binding and explicit targetOrigin can strengthen the messenger handshake; no concrete exploit path was established in this repository.'}
