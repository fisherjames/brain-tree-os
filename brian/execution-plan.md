# execution plan

> Part of [[index]]

## Phase 1 - Mission Control UI Fresh Tasks

### EP-1 Mission Control hero visual polish
- **Status**: not_started
- **Goal**: Ship one obvious visual improvement in Mission Control so collaborators can immediately confirm a fresh release.
- [ ] NEXT: feature="Mission Control hero border + background refinement" lane=incremental worktree=feature/ui-mission-hero-refinement image=pending breaking=none
- [ ] VERIFY: Human verifies the Mission Control hero card visual update at `/brains/<brainId>?tab=mission-control` on desktop.
- [ ] MERGE: feature="Mission Control hero border + background refinement" branch=feature/ui-mission-hero-refinement -> main image=pending breaking=none

### EP-2 Queue readability pass
- **Status**: not_started
- **Goal**: Improve scannability of Next Queue and Worktrees cards with a visible typography/spacing tweak.
- [ ] NEXT: feature="Queue cards readability update" lane=incremental worktree=feature/ui-queue-readability image=pending breaking=none
- [ ] VERIFY: Human verifies queue card spacing/typography changes are visible in Mission Control.
- [ ] MERGE: feature="Queue cards readability update" branch=feature/ui-queue-readability -> main image=pending breaking=none

### EP-3 Workflow ribbon contrast touch-up
- **Status**: not_started
- **Goal**: Increase stage-chip contrast in Workflow Contract ribbon for easier current-stage scanning.
- [ ] NEXT: feature="Workflow ribbon stage contrast improvement" lane=incremental worktree=feature/ui-workflow-ribbon-contrast image=pending breaking=none
- [ ] VERIFY: Human verifies active stage chip is visually clearer in the ribbon.
- [ ] MERGE: feature="Workflow ribbon stage contrast improvement" branch=feature/ui-workflow-ribbon-contrast -> main image=pending breaking=none

## Phase 2 - Mission Control Workflow Reliability

### EP-4 Core squad execution flow reliability
- **Status**: in_progress
- **Goal**: Confirm Mission Control can run NEXT -> VERIFY -> MERGE -> SHIP for Core Squad without stale queue artifacts.
