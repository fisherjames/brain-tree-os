# Brian For Codex

Brian is the repo memory layer. Codex is the execution engine.

## Brian Commands

Canonical workflow:
- `brian intent`
- `brian propose`
- `brian shape`
- `brian plan`
- `brian work`
- `brian brief`
- `brian decide`
- `brian status`
- `brian doctrine-lint`

Compatibility and maintenance:
- `brian next`
- `brian mission`
- `brian end`
- `brian init`
- `brian resume`
- `brian wrap-up`
- `brian notes`
- `brian migrate`
- `brian plan`
- `brian sprint`
- `brian sync`
- `brian spec`
- `brian feature` (alias)

## Codex Slash Commands

- `/init`
- `/plan`
- `/resume`
- `/status`

They are complementary:

- Codex slash commands control the current conversation.
- Brian commands control the repo memory and managed workflow.

## Managed Session Flow

Start:

```bash
brian work --role backend
```

End:

```bash
brian end --role backend
```

The managed skill pack supplies the reusable behavior. Brian notes supply the project memory.

Mission Control loop (Director Console V2):

1. Open `/brains/<id>?v2=1` and switch to `Director Console`.
2. Capture intent or use `Seed 3-Pack` for automated incremental/dream/refactor backlog generation.
3. Use stage controls (`Tick`) or explicit lifecycle actions from CLI.
4. Resolve escalations and decisions directly (`Mark Resolved`, `Approve`, bulk actions).
5. Use Playback Mode (`Run Slow/Normal/Fast`) to prove end-to-end transition behavior in UI.

Compatibility loop (Team Tracker):
- `NEXT:` items should be feature-length and include `feature=`, `worktree=`, `image=`, `breaking=`.
- `MERGE:` items should use `worktree=<branch> -> main` and include `feature=`, `image=`, `breaking=`.
- `Start Next Work` should remain blocked when hard blockers exist.

## Honest Limit

Codex skills do not provide a documented way to inject text into an already-open live Codex thread. Brian therefore uses explicit commands for session start and wrap-up instead of pretending that hidden hooks exist.
