---
name: enumerate-changes
description: "Enumerate the exact Payment Components changes, contract impacts, validation, and authorization boundaries for a confirmed scope."
---

# Enumerate changes

Use after scope-need confirms one bounded change and before editing.

## Procedure

1. Re-ground in the confirmed scope, repository instructions, branch, status, and current diff.
2. List each intended file or namespace record and why it must change.
3. List authoritative existing files that must be preserved, including CLAUDE.md and .claude/settings.local.json when relevant.
4. Map public SDK and browser surfaces touched by each change.
5. Map any PostMessage, field-lifecycle, transaction, tokenization, fee, idempotency, error, retry, or outcome contract touched.
6. Decide whether coordinate-payment-contract-change and either consultation skill are required.
7. Identify security invariants and synthetic test seams.
8. Order work into small reviewable units with tests or evidence close to behavior.
9. State dependency, package-lock, generated dist, documentation, release, partner-branch, Git, npm, CDN, and cloud effects separately.
10. Define focused checks first and broader checks second.
11. Define the branch, commit units, PR target premain, and stop-before-merge boundary.
12. Record non-runs and risks that will remain after local validation.
13. Present the enumeration for confirmation when the write set or authority changed from scope.

## Governance and CI

- Run bash gov-infra/verifiers/gov-verify-rubric.sh when the verifier exists.
- Inspect gov-infra/evidence/ and gov-infra/evidence/gov-rubric-report.json.
- Require report schema gov_rubric_report.v1 and the repository CI hook.
- Never weaken a test, security, compatibility, CI, or governance gate.
- If gov-infra, the report, or the CI hook is absent, report the software_repo_gov_infra gap honestly and keep remediation separate.
- TheoryMCP guidance does not replace repository CI or prove governance, merge, release, production, PCI, or customer outcomes.

## Output

An ordered change map with files, rationale, public and peer-contract impact, security invariants, tests, governance/CI checks, authorization gates, commit units, and handoff evidence.

## Red flags

- A file list without behavior or contract rationale.
- Peer work treated as a local write.
- Hidden dependency, lockfile, dist, version, or publication effects.
- A plan that touches partner branches without naming them.
- Validation that assumes commented-out CI tests ran.
