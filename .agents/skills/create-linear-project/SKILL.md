---
name: create-linear-project
description: "Create approved Linear structure for a confirmed Payment Components roadmap without inventing team, project, or write authority."
---

# Create a Linear project

Use only when an approved roadmap needs tracked structure and a real Linear surface is provisioned.

## Preconditions

- The roadmap is confirmed.
- The owning Linear team, project or parent issue, naming convention, and principal authorization are explicit.
- Tool visibility alone is not write authority.

## Procedure

1. Ground in the confirmed roadmap, current tracker state, and exact authorized destination.
2. Search for an existing overlapping project, parent, or issues before creating duplicates.
3. Prepare a preview containing:
   - proposed project or parent title;
   - objective and exclusions;
   - milestone issues;
   - blocking relationships;
   - repository owner for every issue;
   - acceptance criteria and evidence;
   - labels, cycle, assignee, and state only when known.
4. Keep secure-tags-lib and tags-secure-socket work assigned to their owning repositories and stewards.
5. Include three-repository coordination, rollout, rollback, and validation tasks where the contract is shared.
6. Include governance and CI evidence expectations without claiming the gaps are fixed.
7. Obtain confirmation if the preview, team, project, issue count, or relationships differ from the approved roadmap.
8. Create only the approved records.
9. Read back identifiers and relationships; report partial failures honestly.
10. Do not start implementation, change repository files, or close work as a side effect.

## Governance and CI

- Run bash gov-infra/verifiers/gov-verify-rubric.sh when the verifier exists.
- Inspect gov-infra/evidence/ and gov-infra/evidence/gov-rubric-report.json.
- Require report schema gov_rubric_report.v1 and the repository CI hook.
- Never weaken a test, security, compatibility, CI, or governance gate.
- If gov-infra, the report, or the CI hook is absent, report the software_repo_gov_infra gap honestly and keep remediation separate.
- TheoryMCP guidance does not replace repository CI or prove governance, merge, release, production, PCI, or customer outcomes.

## Output

A preview awaiting approval or a read-back list of created tracker records, ownership, dependencies, and next human or agent action.

## Red flags

- Invented Linear team, project, status, label, or assignee.
- Duplicate or overlapping project creation.
- Cross-repository issues assigned to Payment Components by convenience.
- Tracker creation treated as implementation approval.
