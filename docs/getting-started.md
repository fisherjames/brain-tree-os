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

## 4. Start Work

```bash
brian work
```

Or with a role:

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

## 5. End Work

```bash
brian end
```

Or with a role:

```bash
brian end --role backend
```

This creates the next handoff and launches Codex with the managed wrap-up prompt.

## 6. Migrate An Older Repo

If a repo still has an older layout:

```bash
brian migrate
```

After migration, Brian operates on `brian/` plus `.brian/`.

## 7. Team And Parallel Work

For multi-role work:

- split tasks first
- assign owners and paths
- record dependencies and merge order
- mirror that state into `brian/commands/team-board.md`
- keep each worker in its own branch or worktree

Brian improves coordination and visibility. It does not remove the need for good task boundaries.
