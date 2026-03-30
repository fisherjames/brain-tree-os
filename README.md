# Brian

Brian is a markdown-first company operating system for software delivery.

## Core Idea
Brian runs work through an explicit organizational ladder. Decisions are resolved at the lowest authorized layer; CEO only sees exceptions.

## Canonical Workflow
`intent -> proposal -> leadership discussion -> director decision -> tribe shaping -> squad planning -> execution -> verification -> merge -> briefing`

## Decision Governance
- Escalation chain is fixed: `squad -> tribe -> director -> ceo`
- Escalation is stepwise; no jumps
- Escalation at one level becomes a decision at the next level
- CEO inbox contains only:
  - fully escalated decisions, or
  - decisions with no inferable outcome and no delegated authority below CEO

## UI Surfaces
- `CEO Mission`: escalated decisions, strategic blockers, briefings
- `Directors`: director decision inbox
- `Tribe`: tribe decision inbox
- `Mission Control`: squad execution, verification, merge gates
- `Graph + Notes`: evidence graph and note navigation
- `Agents + Workflow`: editable personas, workflow rules, and skills

## Storage Model
- Repo memory: `brian/`
- Local workspace metadata: `.brian/brain.json`
- Global registry: `~/.brian/brains.json`, `~/.brian/server.json`
- Runtime events: `~/.brian/state/<brainId>/events.ndjson`

## CLI (Canonical)
- `brian intent <text>`
- `brian propose <title>`
- `brian shape <initiative-id>`
- `brian plan <initiative-id>`
- `brian work`
- `brian verify`
- `brian merge`
- `brian brief`
- `brian decide <initiative-id> <title>`
- `brian status`
- `brian doctrine-lint`

## API (Canonical)
- `GET /api/brains/:id/company-state`
- `GET /api/brains/:id/initiatives`
- `GET /api/brains/:id/discussions`
- `GET /api/brains/:id/decisions`
- `GET /api/brains/:id/briefings`
- `GET /api/brains/:id/worktrees`

## Quick Start
```bash
npm install
npm run build
npm run install:cli
brian --port 3010
```
Open `http://localhost:3010/brains`.

In a project workspace:
```bash
brian init
brian intent "Improve activation"
brian propose "Activation initiative"
brian shape <initiative-id>
brian plan <initiative-id>
brian work
brian verify
brian merge
brian brief
```
