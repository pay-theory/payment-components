---
name: investigate-issue
description: "Investigate a Payment Components defect or regression with redacted evidence and without converting diagnosis into unapproved implementation."
---

# Investigate an issue

Use for uncertainty, a failing test, browser regression, public API defect, payment/tokenization discrepancy, CI failure, or release anomaly.

## Procedure

1. Ground in the symptom, expected behavior, repository instructions, branch, status, recent changes, public and peer contracts, and evidence level.
2. Define a falsifiable question and the smallest safe reproduction.
3. Use synthetic payment data and redact merchant, credential, token, session, and production payload details.
4. Trace the behavior through public API, field orchestration, PostMessage, formatting, network endpoint selection, and result handling only as needed.
5. Determine whether the likely owner is payment-components, secure-tags-lib, tags-secure-socket, merchant integration, build/release configuration, or unknown.
6. Do not edit a peer repository. Use a consultation skill or principal-routed packet for peer-owned unknowns.
7. Run the narrowest relevant test or diagnostic first. Avoid publish, release, partner-branch, and cloud scripts during diagnosis.
8. Distinguish code defect, contract mismatch, compatibility regression, environment/configuration issue, test defect, CI gap, and insufficient evidence.
9. Record competing hypotheses, evidence for and against each, and the next discriminating check.
10. If a fix is clear, stop with a scoped recommendation unless implementation was separately authorized.
11. Report non-runs and the evidence level honestly.

## Governance and CI

- Run bash gov-infra/verifiers/gov-verify-rubric.sh when the verifier exists.
- Inspect gov-infra/evidence/ and gov-infra/evidence/gov-rubric-report.json.
- Require report schema gov_rubric_report.v1 and the repository CI hook.
- Never weaken a test, security, compatibility, CI, or governance gate.
- If gov-infra, the report, or the CI hook is absent, report the software_repo_gov_infra gap honestly and keep remediation separate.
- TheoryMCP guidance does not replace repository CI or prove governance, merge, release, production, PCI, or customer outcomes.

## Output

A diagnosis with reproduction, redacted evidence, likely owner, hypotheses considered, checks run, conclusion confidence, compatibility and security impact, and recommended next scope.

## Red flags

- Raw payment or secret data in logs.
- Debugging by weakening origin or iframe boundaries.
- Treating peer behavior as known without evidence.
- Running release or branch-maintenance scripts to reproduce a local defect.
- Implementing an adjacent fix without scope.
