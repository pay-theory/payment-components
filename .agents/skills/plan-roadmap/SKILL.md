---
name: plan-roadmap
description: "Plan Payment Components work that exceeds one focused change into ordered, independently reviewable milestones."
---

# Plan a roadmap

Use when a confirmed need cannot be completed safely in one focused change or one agent session.

Do not use to inflate a small issue or to authorize tracker writes.

## Procedure

1. Ground in the confirmed scope, public compatibility requirements, three-repository contracts, branch policy, and current architecture.
2. Define the destination and measurable completion criteria.
3. Split work into tracer milestones that each produce reviewable behavior or evidence.
4. Make dependencies explicit. Shared-contract changes must include peer coordination before incompatible behavior lands.
5. Preserve backward and forward compatibility across rollout order whenever feasible.
6. Assign each milestone:
   - owned repository;
   - bounded write set;
   - public and peer contracts;
   - validation;
   - rollout or migration requirement;
   - rollback;
   - authorization gates;
   - blocking predecessors.
7. Keep secure-tags-lib and tags-secure-socket work as peer-owned handoffs, not Payment Components implementation tasks.
8. Separate browser-baseline changes, CI repair, gov-infra remediation, dependency upgrades, and release-flow modernization unless they are the approved roadmap subject.
9. Identify when create-linear-project is useful and confirm the actual tracker surface before writing.
10. Define final integration evidence without claiming that one repository proves the system.

## Governance and CI

- Run bash gov-infra/verifiers/gov-verify-rubric.sh when the verifier exists.
- Inspect gov-infra/evidence/ and gov-infra/evidence/gov-rubric-report.json.
- Require report schema gov_rubric_report.v1 and the repository CI hook.
- Never weaken a test, security, compatibility, CI, or governance gate.
- If gov-infra, the report, or the CI hook is absent, report the software_repo_gov_infra gap honestly and keep remediation separate.
- TheoryMCP guidance does not replace repository CI or prove governance, merge, release, production, PCI, or customer outcomes.

## Output

An ordered milestone roadmap with ownership, dependencies, acceptance criteria, contract impacts, validation, rollout/rollback, risks, and explicit authorization boundaries.

## Red flags

- Milestones that edit multiple repositories under one steward.
- A big-bang incompatible three-repository cutover without rollback.
- Tracker creation assumed from tool visibility.
- Governance or CI gaps silently folded into unrelated milestones.
