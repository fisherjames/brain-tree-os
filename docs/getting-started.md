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
brian plan <initiative-id>
brian work
brian verify
brian merge
brian brief
```

## How Tabs Map To Workflow
- `CEO Mission`: only final escalations/strategic blockers/briefings
- `Directors`: director decisions escalated from tribe
- `Tribe`: tribe decisions escalated from squad
- `Mission Control`: execution, verification, merge gates
- `Graph + Notes`: evidence + rationale source records
- `Agents + Workflow`: edit personas, skills, and workflow rules

## Governance Rules
- escalation ladder: `squad -> tribe -> director -> ceo`
- escalation is stepwise and mandatory
- escalation at one level becomes a decision at next level
- inferable decisions should auto-resolve with evidence
- CEO only handles fully escalated or explicitly CEO-required decisions
