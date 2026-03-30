# Getting Started

## Install
```bash
npm install
npm run build
npm run install:cli
```

## Start Viewer
```bash
brian --port 3010
```
Open `http://localhost:3010/brains`.

## Initialize Workspace
```bash
brian init
brian status
```

## Run Lifecycle
```bash
brian intent "Improve checkout conversion"
brian propose "Checkout conversion initiative"
brian shape <initiative-id>
brian plan <initiative-id> --squad "Core Squad"
brian work
brian verify
brian merge
brian brief
```

## Planning Behavior
- `brian plan` opens squad discussion and emits a question set.
- Resolution flow:
  - Team Lead -> Product Owner first.
  - Product Owner resolves in-scope questions.
  - Remaining questions escalate stepwise to tribe, then director, then CEO.
- Only CEO-level escalation pauses planning.
- If CEO escalation is not required, planning auto-advances to execution.

## How Tabs Map To Workflow
- `CEO Mission`: only final escalations/strategic blockers/briefings
- `Directors`: director decisions escalated from tribe
- `Tribe`: tribe decisions escalated from squad
- `Product Owner View`: squad-context decisions (before tribe escalation)
- `Mission Control`: execution, verification, merge gates
- `Graph + Notes`: evidence + rationale source records
- `Agents + Workflow`: edit personas, skills, and workflow rules

## Governance Rules
- escalation ladder: `squad -> tribe -> director -> ceo`
- escalation is stepwise and mandatory
- escalation at one level becomes a decision at next level
- inferable decisions should auto-resolve with evidence
- CEO only handles fully escalated or explicitly CEO-required decisions
