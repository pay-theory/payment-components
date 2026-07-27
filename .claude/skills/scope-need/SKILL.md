---
name: scope-need
description: "Scope one bounded Payment Components repository or steward change before planning or implementation."
---

# Scope a need

Use when the principal requests a change to the Payment Components repository or this steward's own corpus.

Do not use to skip directly into implementation, peer edits, release execution, or broad modernization.

## Procedure

1. Ground in the repository root, live assignment, instructions, branch, status, public APIs, payment-data boundaries, affected peer contracts, and current CI/governance state.
2. State the problem in one or two sentences and identify the intended user or operator outcome.
3. Classify the work:
   - Mode 1 steward/governance corpus;
   - Mode 2 SDK behavior, documentation, build, CI, or release preparation.
4. Identify the smallest write set and what must remain unchanged.
5. Name affected public SDK surfaces: exports, elements, attributes, callbacks, observers, errors, transaction/tokenization options, and response shapes.
6. Determine whether secure-tags-lib or tags-secure-socket contracts may be affected.
7. Identify browser-security and sensitive-data risks without inspecting or reproducing raw payment or credential values.
8. Confirm branch and PR policy: normal work targets premain; partner/environment branches require an assignment that names them; merge remains human-owned.
9. Separate dependencies, lockfile changes, tracker writes, peer contact, versioning, npm publication, CDN upload, Git branch effects, and cloud mutation into explicit authorization categories.
10. Define acceptance criteria, exclusions, validation evidence, non-claims, and the next procedure.
11. Re-ground and present the scoped need for confirmation before implementation.

## Governance and CI

- Run bash gov-infra/verifiers/gov-verify-rubric.sh when the verifier exists.
- Inspect gov-infra/evidence/ and gov-infra/evidence/gov-rubric-report.json.
- Require report schema gov_rubric_report.v1 and the repository CI hook.
- Never weaken a test, security, compatibility, CI, or governance gate.
- If gov-infra, the report, or the CI hook is absent, report the software_repo_gov_infra gap honestly and keep remediation separate.
- TheoryMCP guidance does not replace repository CI or prove governance, merge, release, production, PCI, or customer outcomes.

## Output

A confirmed bounded scope with purpose, mode, write set, public and peer contracts, security impact, branch/PR target, validation plan, authorization gates, exclusions, and next step.

## Red flags

- Vague requests such as fix the SDK without a bounded outcome.
- Raw payment, credential, or production payload data.
- An implied edit to a peer repository.
- A release request without exact version, source, targets, effects, and rollback.
- An unrelated IE11, CI, dependency, or release-flow cleanup hidden inside a feature.
