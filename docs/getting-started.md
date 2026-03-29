# Getting Started With Brian

## 1. Install

```bash
git clone <your fork url>
cd <your fork directory>
npm install
npm run build
npm run install:cli
```

Verify:

```bash
brian help
```

## 2. Start The Viewer

```bash
brian --port 3010
```

Open [http://localhost:3010/brains](http://localhost:3010/brains).

## 3. Initialize A Repo

```bash
cd /absolute/path/to/project
brian init
```

The wizard asks for:

- name
- description
- preset
- whether to link existing docs
- whether to add package scripts
- whether to install the managed Brian Codex skill pack

For a fully managed setup, choose `codex-team`.

## 4. Start V2 Work

```bash
brian intent "Improve checkout conversion"
brian propose "Checkout conversion initiative"
brian shape initiative-xxxx
brian plan initiative-xxxx
brian work
brian brief
brian decide initiative-xxxx "Approve rollout"
```

This drives the canonical initiative lifecycle.

Legacy compatibility still exists:

```bash
brian next
brian mission "Feature Name"
```

Or launch with a role directly:

```bash
brian work --role frontend
brian work --role backend
brian work --role product
```

This launches Codex with:

- `AGENTS.md`
- `brian/index.md`
- `brian/execution-plan.md`
- the latest handoff
- the relevant role note

## 5. Use Company OS (V2 Default)

Open:

- `http://localhost:3010/brains/<brainId>`

In Company OS:

- use `Capture Intent` for one initiative
- use `Seed 3-Pack` for incremental + dream + refactor backlog generation
- resolve escalations and decisions in the CEO inbox (`Resolve All Escalations`, `Approve All`)
- use `Tick` and `Generate Briefing` to drive and summarize lifecycle progress
- legacy graph/files workspace remains available at `?legacy=1`

In Team Tracker:

- `Start Next Work` marks the selected `NEXT:` item and auto-creates a paired `MERGE:` queue item with branch/image/breaking metadata.
- `Dry Run Queue` validates merge metadata, verification status, and conflict risk before any merge.
- every run completion writes a new handoff in `brian/handoffs/` and pushes it to the live Handoffs panel.
- `Start Observer` auto-seeds a 3-pack backlog (`incremental`, `dream_feature`, `refactor`) when queue is empty.

## 6. Start A Spec-First Feature (Compatibility)

```bash
brian mission "Feature Name"
```

This creates:

- `brian/specs/spec-<feature>/index.md`
- `spec.md`, `plan.md`, `tasks.md`, `review.md`
- a linked execution-plan step
- a linked team-board step

## 7. End Work

```bash
brian end
```

Or with a role:

```bash
brian end --role backend
```

This creates the next handoff and launches Codex with the managed wrap-up prompt.

## 8. Migrate An Older Repo

If a repo still has an older layout:

```bash
brian migrate
```

After migration, Brian operates on `brian/` plus `.brian/`.

## 9. Team And Parallel Work

For multi-role work:

- split tasks first
- assign owners and paths
- record dependencies and merge order
- mirror that state into `brian/commands/team-board.md`
- keep each worker in its own branch or worktree

Brian improves coordination and visibility. It does not remove the need for good task boundaries.
