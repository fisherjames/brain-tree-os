# Execution Plan

## Dogfood Loop

Every iteration follows the canonical lifecycle:
`intent -> discussion -> proposal -> CEO review -> shaping -> planning -> execution -> verification -> merge -> briefing`

## Active Intents

- intent-451b2a3c: Bootstrap self-enforcing governance (IN PROGRESS)

## Verification Gates (all passing)

- [x] format (prettier --check)
- [x] lint (eslint)
- [x] typecheck (tsc --noEmit)
- [x] test:unit (vitest - 24 tests)
- [x] doctrine-lint (markdown schema validation)

## Completed

- [x] Greenfield v2 scaffold (all 4 packages)
- [x] Shared types, Zod schemas, governance engine
- [x] Server with MCP protocol + WebSocket
- [x] All 7 UI tab surfaces
- [x] CLI with 18 commands
- [x] Doctrine-lint, squad persistence, skill/rule scanning
- [x] Playwright e2e test scaffold
- [x] Verification gate wiring + 24 seed unit tests
- [x] Brain registry sync + first self-hosted intent
