---
id: bootstrap-prop
type: proposal
status: approved
created: 2026-04-03T20:41:00.000Z
---

# Proposal: Bootstrap Governance Loop

## Summary
Wire all verification gates, add seed unit tests, sync the brain registry,
and capture the first self-hosted intent to prove the loop works end-to-end.

## Rationale
Brian cannot enforce governance on its own development until the gates
actually run. This bootstrap makes the tool eat its own dog food.

## Risks
- Verification gates may be too strict initially, blocking rapid iteration
- Mitigation: passWithNoTests allows packages to have zero tests initially
