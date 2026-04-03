---
id: bootstrap-disc
type: discussion
status: resolved
created: 2026-04-03T20:41:00.000Z
---

# Discussion: How to bootstrap self-enforcing governance

## Question
How do we get to a state where Brian enforces its own workflow on its own development?

## Resolution
1. Wire all verification gates so they actually run (format, lint, typecheck, unit, doctrine-lint)
2. Add real unit tests for schemas, governance, and squads-store
3. Register the brain and sync the registry
4. Capture the first intent via CLI, advance through lifecycle
5. Every subsequent change goes through the canonical loop
6. If the workflow blocks you, fix the workflow as part of the iteration
