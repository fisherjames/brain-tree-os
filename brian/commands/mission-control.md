# mission control

> Part of [[commands/index]]

## Surface Responsibilities
- CEO Mission: decision inbox, escalation inbox, pipeline, briefings.
- Tribe tab: unresolved tribe escalations and shaping queue.
- Mission Control: squad execution queue, blockers, verification, worktree merge actions.

## Interaction Rules
- Approve/Deny only when the card shows an explicit question.
- Trigger next execution work only when hard blockers are clear.
- For live demos, wait for the in-app **Live Demo Gate** ready click before starting automation.
- After start, use explicit **Approve** or **Reject** verification controls (reject requires reason and blocks step).
- Merge only after dry-run is conflict-free and verification is approved.
- Child task branches merge into `mission/<initiative-id>` first; ship merges mission branch into `main`.
- Every Mission Control action must map to a concrete MCP call and update the markdown-backed workflow state.
