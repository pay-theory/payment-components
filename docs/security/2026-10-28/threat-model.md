# Security assessment: payment-components

Assessment date: 2026-10-28. Assessed source: [`e6eb08ccf37fc72b0efb3beab853b6ffbea20ff5`](https://github.com/pay-theory/payment-components/tree/e6eb08ccf37fc72b0efb3beab853b6ffbea20ff5) on `main`.

This report records 0 reportable findings (No reportable findings). These documents propose remediation and validation work; they do not contain application fixes or claim that any issue has been remediated.

The assessment used offline static source inspection, an independent baseline audit, a separate architecture review, and source-backed validation. No production endpoint, payment, credential, application test, or exploit was executed. Deployed IAM, log filtering, external Lambda layers, and processor behavior were not observed.

The absence of findings is scoped to this assessed source. The opaque external coverage-reporter executable was not reverse engineered, and three Finder metadata files were excluded. All 138 remaining tracked entries received source/configuration review.

## Architecture and security boundaries

Browser payment SDK exposed as window.paytheory and window.PayTheoryMessenger, supporting hosted fields, transaction/tokenization, checkout popup/button/QR and a hidden messenger iframe. Browser code calls pt-token-service and embeds secure-tags-lib documents; commands/results cross window-message and MessagePort boundaries. Compiled environment values select production destinations. Local mode changes hosted fields only and keeps deployed token/checkout services (README.md:8; src/index.ts:93; src/index.ts:134; src/common/network.ts:68; src/common/network.local.ts:8).

## Protected assets

- Integrator merchant API keys, short-lived pt-tokens, session identifiers, checkout contexts, billing/payor information, payment-method identifiers and transaction-result integrity. Root token requests carry x-api-key/x-session-key; messenger initialization puts an encoded origin/session/JWT payload in its iframe URL (src/common/network.ts:20; src/messenger/pay-theory-messenger.ts:180; src/messenger/pay-theory-messenger.ts:254).
- Raw payment collection isolation relies on separately hosted iframe documents and browser origin isolation. This repository constructs field documents rather than implementing their backend (src/components/pay-theory-hosted-field/index.ts:42; src/components/pay-theory-hosted-field/index.ts:62).
- Public dist artifact/declaration integrity and release authority; npm publication is public and S3 commands explicitly grant public read (package.json:14; package.json:43; package.json:58).
- Compliance telemetry: page origin, script URLs, CSP metadata, inline-content hashes, and nonce/integrity attributes relayed to a hosted iframe (src/compliance/beacon.ts:153; src/compliance/beacon.ts:198; src/compliance/beacon.ts:344).

## Trust boundaries and effective controls

- Integrator to token service: root mode sends API/session keys over fetch/CORS; checkout mode accepts exactly one invoice/link/recurring/session identifier without API key, deliberately omitting x-session-key for hosted-session mode. Server authorization is external (src/common/network.ts:20; src/common/network.ts:39; src/common/network.ts:86; src/common/network.ts:104).
- Integrator to hosted fields: iframe URL contains encoded client configuration. Transactional messages use hostedFieldsEndpoint targetOrigin and transferred MessagePorts; shared inbound handlers check event.origin and message predicates but do not compare event.source (src/components/pay-theory-hosted-field/index.ts:42; src/common/message.ts:58; src/common/message.ts:120).
- Integrator to hosted checkout popup: opens hostedCheckoutEndpoint/hosted?sessionId=<session>; result handlers filter by checkout origin, which is separate from specific Window ownership/source binding (src/field-set/payment-button.ts:137; src/common/message.ts:71).
- Messenger iframe to parent: readiness checks allow only hostedFieldsEndpoint; channel establishment independently transfers a port to iframe.contentWindow with wildcard targetOrigin. Later replies rely on port possession and pending message IDs (src/messenger/pay-theory-messenger.ts:315; src/messenger/pay-theory-messenger.ts:384; src/messenger/messenger-channel.ts:28; src/messenger/messenger-channel.ts:104).
- Build operator to distributed code: dotenv/DefinePlugin compile environment values into dist/index.js. Local development serves repository root on port 3000 with allowedHosts=all and wildcard CORS; production bundles are optimized (webpack.config.js:27; webpack.config.js:42; webpack.config.js:94; webpack.config.js:117).
- Publication and branch preparation: npm scripts change versions, push Git, publish packages and upload S3; shell/01_prepare.sh conditionally creates/backs up/deletes deployment branches under operator Git authority. CI installs dependencies and checks lint/types using GitHub/NPM credential references (package.json:43; package.json:58; shell/01_prepare.sh:19; .github/workflows/ci.yml:10; .github/workflows/ci.yml:30).

## Attacker capabilities

- Integrator controls its page, SDK arguments, metadata/styles and payment commands; same-origin scripts share its authority. Existing page control is not itself escalation (src/index.ts:79; src/field-set/payment-button.ts:67; src/components/pay-theory-hosted-field/index.ts:42).
- Foreign-origin windows can attempt messages but must satisfy origin/type filters. Control of a hosted-fields-origin document is materially different because shared origin filters accept that origin (src/common/message.ts:48; src/common/message.ts:58; src/common/message.ts:71).
- No remote control of build environment, localhost service, Git deployment credentials, npm publishing authority or AWS upload authority is assumed; those are conditional privileged paths (webpack.config.js:94; package.json:43; package.json:58; shell/01_prepare.sh:19).

## Security objectives

- Confine raw payment collection to intended hosted documents and capability-bearing tokens/messages to expected recipients, preserving distinct origin and port-possession controls (src/components/pay-theory-hosted-field/index.ts:62; src/common/message.ts:129; src/messenger/messenger-channel.ts:47).
- Ensure outcomes correspond to intended hosted component and active interaction. Origin equality alone does not establish a particular Window identity (src/common/message.ts:58; src/common/message.ts:71; src/messenger/messenger-channel.ts:104).
- Bind compiled destinations/distributed artifacts to intended partner/stage/mode; local hosted fields intentionally coexist with deployed backend destinations (src/common/network.local.ts:8; src/common/network.local.ts:23; webpack.config.js:100).
- Protect publication authority and telemetry recipients. Public artifact publication is intentional; credentials/page telemetry need recipient controls (package.json:14; package.json:58; src/compliance/beacon.ts:344).

## Assumptions and external evidence gaps

- Architecture mapping only, not completed security-audit coverage. No application execution, network requests, trigger inputs or vulnerability validation. Supplied SECURITY.md resolver returned no guidance.
- No concrete production ENV/STAGE/TARGET_MODE, DNS/CSP, S3 policy, npm permissions or iframe server headers supplied; actual consumer formulas are symbolic.
- LOCAL_DEV changes fields to https://localhost:3001 only; token/checkout remain deployed. Absent ENV/STAGE gives https://paytheory.api.com/pt-token-service/ and https://paytheory.checkout.checkout.com, while production hosted-fields logic has no matching defaults (src/common/network.local.ts:8; src/common/network.local.ts:16; src/common/network.local.ts:23; src/common/network.local.ts:33).
- README excludes checkoutContext/resendInvoiceEmail from partner declarations and internal declarations from CDN uploads; that type-distribution guarantee does not enforce runtime authorization, because the browser global includes SDK/messenger implementation surfaces (README.md:14; src/index.ts:93).
- Readiness origin allowlist and later wildcard messenger port transfer are different effective controls; this discrepancy alone establishes no exploitability (src/messenger/pay-theory-messenger.ts:384; src/messenger/messenger-channel.ts:47).
- External hosted-fields/socket/checkout/token-service implementations and actual production configuration are prerequisites for end-to-end assurance.
