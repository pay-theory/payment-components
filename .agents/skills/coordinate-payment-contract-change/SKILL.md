---
name: coordinate-payment-contract-change
description: "Coordinate a shared payment or tokenization contract change across Payment Components, Secure Tags Library, and Tags Secure Socket."
---

# Coordinate a payment contract change

Use when Payment Components work may alter shared payment or tokenization behavior across payment-components, secure-tags-lib, and tags-secure-socket.

Examples include PostMessage names or payloads, readiness, origin rules, token/session lifecycle, transaction or tokenization inputs, fees, idempotency, errors, retries, and outcome semantics.

## Procedure

1. Ground in the approved local scope, current contract, redacted evidence, and exact unknowns.
2. Describe current behavior and proposed behavior without raw payment, credential, token, merchant-secret, or production payload values.
3. Map the contract across all three repositories:
   - producer and consumer for each message or field;
   - compatibility expectations;
   - failure behavior;
   - version, feature, or rollout gate;
   - evidence owner.
4. Classify the change as backward compatible, forward compatible, dual-read/dual-write transitional, or breaking.
5. Prepare bounded questions for both peer stewards.
6. Use consult-secure-tags-lib-steward and consult-tags-secure-socket-steward only when real provisioned routes and allowlists exist; otherwise route packets through the principal.
7. Incorporate peer responses as evidence, not authority to edit or release for peers.
8. Produce an ordered rollout plan with repository changes owned by each steward, observation points, success criteria, and timing constraints.
9. Produce a rollback plan that accounts for independently deployed versions and partial rollout.
10. Define validation for each repository and end-to-end evidence. Local Payment Components tests alone are insufficient.
11. Block the local PR from shared-contract readiness until impact, compatibility, rollout, rollback, and validation are documented.
12. Record only durable non-sensitive contract decisions.

## Governance and CI

- Run bash gov-infra/verifiers/gov-verify-rubric.sh when the verifier exists.
- Inspect gov-infra/evidence/ and gov-infra/evidence/gov-rubric-report.json.
- Require report schema gov_rubric_report.v1 and the repository CI hook.
- Never weaken a test, security, compatibility, CI, or governance gate.
- If gov-infra, the report, or the CI hook is absent, report the software_repo_gov_infra gap honestly and keep remediation separate.
- TheoryMCP guidance does not replace repository CI or prove governance, merge, release, production, PCI, or customer outcomes.

## Output

A three-repository contract packet with current/proposed behavior, ownership, compatibility classification, peer evidence, rollout order, rollback, validation matrix, unresolved blockers, and next action.

## Red flags

- Peer silence treated as approval.
- A breaking big-bang cutover with no compatibility window.
- Raw payment or production payloads.
- Editing or committing in peer repositories.
- Local tests presented as end-to-end proof.
