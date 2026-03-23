# Getting Started With This Fork

This guide is the canonical path for using the `fisherjames/brain-tree-os` fork with Codex.

It covers:
- installing the fork locally
- creating a brain inside an existing project
- the day-to-day Codex workflow
- what BrainTree core does versus what should live in your project

## 1. Prerequisites

- [Node.js 20+](https://nodejs.org)
- Codex installed and working locally
- a Git repository you want Codex to manage

Optional but useful:
- a GitHub token if you plan to push fork changes upstream
- project-local Codex skills for domain-specific workflows

## 2. Clone and Build the Fork

```bash
git clone https://github.com/fisherjames/brain-tree-os.git
cd brain-tree-os
npm install
npm run install:cli
```

That builds the fork and installs the `brain-tree-os` command globally via `npm link`.

From this point on, the CLI entrypoint is simply:

```bash
brain-tree-os
```

## 3. Start the BrainTree Viewer

```bash
brain-tree-os --port 3010
```

Use `--port 3000` if it is free, or any other port if you already have something running there.

The viewer gives you:
- the note graph
- the file tree
- rendered markdown
- the execution-plan pane
- session history from `Handoffs/`
- optional team-progress rows if the project maintains `Commands/Team-Board.md`

## 4. Initialize an Existing Project

In a second terminal:

```bash
cd /path/to/your-project
brain-tree-os init
```

That creates a Codex-first scaffold and registers the project in:

```text
~/.braintree-os/brains.json
```

The scaffold includes:
- `.braintree/brain.json`
- `BRAIN-INDEX.md`
- `AGENTS.md`
- `Execution-Plan.md`
- `01_Product/`
- `02_Engineering/`
- `03_Operations/`
- `Agents/`
- `Handoffs/`
- `Templates/`
- `Assets/`

If you run `init` in a normal terminal, it now opens a small wizard that lets you confirm:
- name
- description
- preset: `core` or `codex-team`
- whether to link existing markdown docs
- whether to add package.json helper scripts

`codex-team` is the richer preset. It adds:
- `Commands/` workflow notes
- `Commands/Team-Board.md`
- a fuller set of role notes under `Agents/`
- optional `pnpm brain:*` helper scripts if the repo has `package.json`

## 5. Start the First Codex Session

Still in the project:

```bash
brain-tree-os resume
codex
```

Use the files listed by `resume` as the session entrypoint. In most projects this means:

1. `BRAIN-INDEX.md`
2. `AGENTS.md`
3. `Execution-Plan.md`
4. the latest handoff in `Handoffs/`
5. the relevant folder index for the area you are touching

## 6. Daily Workflow

At the start of each later session:

```bash
cd /path/to/your-project
brain-tree-os resume
codex
```

During the session, use BrainTree commands when they match the work:

```bash
brain-tree-os plan EP-3
brain-tree-os sprint
brain-tree-os feature "merchant withdrawals"
brain-tree-os notes "Product"
brain-tree-os sync
brain-tree-os status
```

Before ending a meaningful session:

```bash
brain-tree-os wrap-up
```

Then have Codex fill the newest handoff, update the relevant notes, and adjust `Execution-Plan.md` if progress changed.

## 7. Codex Commands vs BrainTree Commands

Codex slash commands and BrainTree shell commands do different jobs.

Codex handles session-level behavior:
- `/init`
- `/plan`
- `/resume`
- `/status`

BrainTree handles project-brain behavior:
- `brain-tree-os init`
- `brain-tree-os resume`
- `brain-tree-os wrap-up`
- `brain-tree-os status`
- `brain-tree-os notes`
- `brain-tree-os plan`
- `brain-tree-os sprint`
- `brain-tree-os sync`
- `brain-tree-os feature`

The important distinction is:
- Codex slash commands manage the conversation
- BrainTree commands manage the project memory layer

## 8. What This Fork Does Not Fake

This fork does not claim features Codex does not currently expose in a documented way.

That means:
- no fake hidden hook format
- no fake built-in team-spawning primitive
- no pretending that BrainTree shell commands are native Codex slash commands

If you need richer repo-local automation, add it in the managed project rather than bloating BrainTree core.

## 9. Recommended Project-Local Layer

BrainTree core should stay generic. Project-specific workflow should live inside the managed repo.

A strong pattern is:
- keep BrainTree core responsible for the viewer and scaffold
- add repo-local `pnpm brain:*` wrappers for your actual working routine
- add repo-local Codex skills for domain roles such as mobile, web, backend, product, or ops
- mirror any local machine state that matters into committed markdown notes so the viewer can display it

This keeps the fork reusable while still letting a project build a richer Codex operating system on top.

## 10. Troubleshooting

### Viewer starts but the project does not appear

Run:

```bash
brain-tree-os status
```

If the project is not registered, re-run `init` inside that repo.

### Notes exist but the graph looks broken

Run:

```bash
brain-tree-os sync
```

Fix broken wikilinks or missing parent-note links before assuming the viewer is wrong.

### Port 3000 is already in use

Run the viewer on another port:

```bash
brain-tree-os --port 3010
```

### Codex starts without useful repo context

That is usually a project-workflow issue, not a BrainTree-core issue. The fix is to:
- make `AGENTS.md` explicit
- keep `BRAIN-INDEX.md` current
- keep the latest handoff accurate
- use project-local wrappers or skills if you want a one-command start flow
