# Using BrainTree OS with Codex

BrainTree's viewer and file format are agent-agnostic. The Claude-specific part of upstream BrainTree OS is the slash-command installer. Codex can still use the same brain structure effectively, but the workflow is based on repository files rather than Claude slash commands.

## Start the viewer in Codex mode

```bash
npx brain-tree-os --agent codex
```

This skips the Claude slash-command install and starts the viewer normally.

## Initialize a brain in your project

Open Codex in the project directory where you want the brain to live and ask it to scaffold a BrainTree brain. A good starting prompt is:

```text
Initialize a BrainTree OS brain for this project. Create .braintree/brain.json, BRAIN-INDEX.md, AGENTS.md, CLAUDE.md, Execution-Plan.md, Handoffs/, Templates/, Assets/, and tailored department notes. Link every note with wikilinks and finish with an initial handoff.
```

## Recommended root files for Codex

- `BRAIN-INDEX.md` - the main entry point and link hub
- `AGENTS.md` - Codex-specific working rules for the repository
- `CLAUDE.md` - compatibility file for BrainTree and other agents that expect it
- `Execution-Plan.md` - roadmap, status, and dependencies
- `Handoffs/` - session continuity notes

## Daily Codex workflow

1. Read `BRAIN-INDEX.md`, `AGENTS.md`, and the latest handoff.
2. Open the relevant folder index before editing code.
3. Make the smallest real change that moves the project forward.
4. Update the brain notes if architecture, priorities, or risks changed.
5. End the session by writing a new handoff and adjusting the execution plan status.

## Why this works

The viewer only cares about the filesystem brain: markdown files, wikilinks, folder indexes, handoffs, and the brain registry. Codex can read and maintain those files directly, so the core BrainTree workflow remains intact even without Claude slash commands.
