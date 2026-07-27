---
name: release-sdk
description: "Preview and execute one explicitly authorized Payment Components npm and CDN release with aligned artifacts and bounded Git effects."
---

# Release the SDK

Use only for a specific Payment Components release after repository readiness and required peer compatibility evidence exist.

## Hard gate

Do not bump versions, create release commits or tags, push release Git state, publish npm, upload CDN assets, mutate partner branches, or perform AWS effects until the authorized operator approves this exact preview:

- source branch and exact commit;
- current and proposed package version;
- npm registry and exact dist-tag;
- exact npm and package scripts;
- build environment, partner, stage, target mode, and relevant non-secret configuration;
- generated dist artifacts and checksums;
- npm package contents and their relationship to CDN artifacts;
- CDN bucket, latest/versioned path, grants, and cache policy;
- version-bump commit, tag, and push effects;
- shell/01_prepare.sh branch creation, backup, deletion, and remote push effects if used;
- tests, type check, lint, build, CI, and peer evidence;
- publication order, monitoring, rollback, and recovery.

Any changed value or effect invalidates authorization.

## Procedure

1. Ground in instructions, status, source commit, PR/merge state, package.json, package-lock.json, Webpack configuration, publish scripts, shell scripts, and current artifact state.
2. Confirm target identities safely without printing npm tokens, AWS credentials, GitHub tokens, .env values, API/session keys, or payment data.
3. Inspect exact commands instead of inferring safety from script names.
4. Separate version, Git, dependency, build, npm, CDN/AWS, partner-branch, and cache effects.
5. Confirm a release request does not implicitly authorize dependency installation, lockfile changes, branch deletion, merge, or another environment.
6. Verify shared payment/tokenization changes have the required peer compatibility, rollout, and rollback evidence.
7. Run approved readiness checks. State non-runs.
8. Build once from the approved source where possible and establish how the npm package and CDN bundle share artifact identity. Record checksums and package contents without secrets.
9. Present the exact preview and obtain explicit authorization.
10. Execute only approved commands in order. Stop on unexpected identity, prompt, target, diff, dependency change, branch effect, artifact, or failure.
11. Never delete or recreate a partner/environment branch unless that exact branch and effect were approved.
12. Capture redacted publication receipts, versions, tags, object paths, and checksums.
13. Run approved post-release validation on both npm and CDN surfaces.
14. Report actual effects, deviations, parity evidence, validation, rollback status, gaps, and next human action.
15. Record only durable non-secret release state.

## Governance and CI

- Run bash gov-infra/verifiers/gov-verify-rubric.sh when the verifier exists.
- Inspect gov-infra/evidence/ and gov-infra/evidence/gov-rubric-report.json.
- Require report schema gov_rubric_report.v1 and the repository CI hook.
- Never weaken a test, security, compatibility, CI, or governance gate.
- If gov-infra, the report, or the CI hook is absent, report the software_repo_gov_infra gap honestly and keep remediation separate.
- TheoryMCP guidance does not replace repository CI or prove governance, merge, release, production, PCI, or customer outcomes.

## Output

A release preview awaiting authorization or a post-release report with source, version, npm/CDN targets, separated effects, parity evidence, validation, deviations, rollback, gaps, and next action.

## Red flags

- Missing source commit, version, dist-tag, build environment, CDN path, artifact identity, Git effects, or rollback.
- npm and CDN artifacts built from different unproven sources.
- Reusing approval after a change.
- Hidden partner-branch deletion, dependency installation, or lockfile mutation.
- Printing credentials or payment data.
- Claims beyond observed evidence.
