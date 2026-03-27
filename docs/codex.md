# Brian For Codex

Brian is the repo memory layer. Codex is the execution engine.

## Brian Commands

- `brian init`
- `brian migrate`
- `brian resume`
- `brian work`
- `brian wrap-up`
- `brian end`
- `brian status`
- `brian notes`
- `brian next`
- `brian plan`
- `brian sprint`
- `brian sync`
- `brian spec`
- `brian mission`
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

## Honest Limit

Codex skills do not provide a documented way to inject text into an already-open live Codex thread. Brian therefore uses explicit commands for session start and wrap-up instead of pretending that hidden hooks exist.
