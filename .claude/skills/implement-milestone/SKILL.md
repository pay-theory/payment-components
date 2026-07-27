---
name: implement-milestone
description: "Implement one approved Payment Components milestone with public-contract, browser-security, peer, and PR-ready evidence."
---

# Implement a milestone

Use for one approved Payment Components product milestone or focused repository assignment.

## Procedure

1. Ground in the issue, repository instructions, branch, status, existing state, public compatibility, payment-data boundaries, and affected peer contracts.
2. Confirm a safe branch using <ticket-id>-<short-slug> or agent/<short-slug>; never work directly on premain or main.
3. Restate acceptance criteria, write set, exclusions, and validation plan.
4. If shared payment or tokenization behavior is affected, run coordinate-payment-contract-change before landing incompatible behavior.
5. Add or update a focused test first when practical, using synthetic payment data.
6. Make the smallest repository-owned behavior change. Prefer TypeScript where neighboring architecture supports it without broad migration.
7. Preserve public exports, custom elements, attributes, callbacks, observers, errors, and payload semantics unless the approved scope changes them.
8. Preserve exact PostMessage destinations and source checks, iframe isolation, sanitization, token lifecycle, and sensitive-data confinement.
9. Add high-signal comments and JSDoc for public or tricky behavior, intent, invariants, edge cases, and business rules.
10. Do not add dependencies or rewrite package-lock.json without explicit authorization.
11. Keep payment values, production payloads, secrets, credentials, and tokens out of logs, fixtures, snapshots, errors, commits, consultations, and PR text.
12. Run focused Web Test Runner tests, then relevant broader checks: npm test, npm run test:coverage, npm run lint, npm run check-ts, and an appropriate build as risk requires. Inspect any script with network, Git, package, or cloud effects before running it.
13. Review the diff for scope creep, peer-repository changes, compatibility regressions, stale comments, unrelated state, dependency/lockfile changes, generated dist changes, and hidden release effects.
14. Commit in small imperative units with the ticket ID when available.
15. Push and open or update a PR targeting premain only within confirmed authority. Stop before merge.
16. Re-ground and hand off files, evidence, non-runs, security and peer impact, governance/CI status, dependency/lockfile status, risks, and next action.

## Governance and CI

- Run bash gov-infra/verifiers/gov-verify-rubric.sh when the verifier exists.
- Inspect gov-infra/evidence/ and gov-infra/evidence/gov-rubric-report.json.
- Require report schema gov_rubric_report.v1 and the repository CI hook.
- Never weaken a test, security, compatibility, CI, or governance gate.
- If gov-infra, the report, or the CI hook is absent, report the software_repo_gov_infra gap honestly and keep remediation separate.
- TheoryMCP guidance does not replace repository CI or prove governance, merge, release, production, PCI, or customer outcomes.

## Output

A review-ready branch or PR handoff with scope, diff, validation evidence, public and peer-contract assessment, governance/CI status, dependency/lockfile status, risks, and human next step.

## Red flags

- Origin, iframe, sanitization, token, or payment-data boundary weakening.
- An uncoordinated shared-contract change.
- Hidden dependency, lockfile, dist, version, or publication effects.
- Direct premain/main work or self-merge.
- Release execution as an implementation side effect.
