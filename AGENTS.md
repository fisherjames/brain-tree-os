# Brian Agent Doctrine

Brian is a markdown-first company operating system.

## Workflow Contract
- intent -> proposal -> leadership discussion -> director decision -> tribe shaping -> squad planning -> execution -> verification -> merge -> briefing
- no execution without a context packet
- no unresolved discussion without an escalation record
- every interaction must emit one of: answer | decision | task | risk | escalation

## Decision Delegation Contract
- Decision authority escalates only in this order: squad -> tribe -> director -> ceo
- Escalation is stepwise and mandatory; no skipping levels
- Escalation at one level becomes a decision at the next level
- CEO receives decisions only when they have fully escalated or no delegated authority exists below CEO
- If decision policy allows inference with sufficient confidence, auto-resolve and log evidence instead of escalating

## Context Ladder
- Squad: implementation and local delivery context
- Tribe: cross-squad product/technical context
- Director: portfolio and business tradeoff context
- CEO: strategic and irreversible risk context

## Governance
- Markdown under `brian/` is source of truth
- Runtime transitions are logged in `~/.brian/state/<brainId>/events.ndjson`
- Merge requires recorded verification evidence
- Blockers are explicit:
  - `hard_blocker`: progression halts
  - `advisory`: warning only
