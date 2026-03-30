# architecture

> Part of [[engineering/index]]

## System Shape
- `packages/cli`: command layer for init, workflow, and doctrine validation.
- `packages/web`: viewer, API routes, MCP bridge, and canonical read models.
- Repo notes in `brian/` are domain state.
- Local event stream in `~/.brian/state/<brainId>/events.ndjson` is operational audit.

## Read Model
- Markdown records: initiatives, discussions, decisions, briefings, tasks.
- Projection computes pipeline, pending decisions, active escalations, blockers, and confidence.
- UI surfaces consume APIs from `/api/brains/:id/*`.

## Safety Invariants
- No stage skip across lifecycle.
- No merge before verification.
- Unresolved escalations block green status.
- Missing explicit questions in pending decisions/escalations are blockers.
