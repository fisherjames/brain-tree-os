# Brian v2

Delegated Company OS — markdown-driven governance for AI agent workflows.

## Quick Start

```bash
npm install
npm run dev
```

This starts:
- **Server** on `http://localhost:3010` (API + WebSocket)
- **UI** on `http://localhost:5173` (Vite dev server, proxies to server)

## Architecture

```
brian/                  # Markdown brain (source of truth)
packages/
  shared/               # Zod schemas, types, governance rules
  server/               # Express + WebSocket + MCP protocol
  ui/                   # Vite + React SPA (7 tab surfaces)
  cli/                  # CLI with 17 workflow commands
```

## UI Tabs

| Tab | Purpose |
|-----|---------|
| Graph + Notes | D3 force graph of markdown links + file viewer |
| CEO View | Escalation inbox, approval queue |
| Director View | Initiative pipeline, tribe health |
| Product Owner | Backlog, task tracking |
| Tribe View | Squad status, coordination |
| Mission Control | Ready gate, start work, verify, merge, ship |
| Agents + Workflow | Squad config, skills, rules |

## CLI

```bash
brian              # Start viewer
brian init         # Initialize brain
brian sync         # Sync brain registry
brian status       # Show brain health
brian intent "..." # Capture intent
brian propose      # Generate proposal
brian shape        # Shape into squads
brian plan         # Create execution plan
brian work         # Start next task
brian verify       # Run verification gates
brian merge        # Merge completed work
brian end          # End session with handoff
brian brief        # Generate briefing
brian decide       # Record decision
brian mission      # Open Mission Control
brian codex        # Delegate to Codex
```

## Workflow

```
intent -> discussion -> proposal -> CEO review -> shaping -> planning -> execution -> verification -> merge -> briefing
```

Verification gates (all hard-blocking): format, lint, typecheck, test:unit, test:e2e, doctrine-lint.

## memU Integration

Optional memU sidecar for autonomous memory management:

```bash
docker compose up -d   # Start memU server
```

The server falls back to direct filesystem reads when memU is unavailable.

## License

MIT
