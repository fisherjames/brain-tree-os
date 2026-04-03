# Workflow

## Canonical Lifecycle

```
intent -> discussion -> proposal -> CEO review -> shaping -> planning -> execution -> verification -> merge -> briefing
```

### Rejection Loop

If CEO rejects a proposal, the workflow rewinds to `discussion` with CEO feedback preserved:

```
CEO review -> reject (with feedback) -> discussion -> proposal -> CEO review
```

## Verification Gates

All gates are hard-blocking. No gate can be skipped.

1. **format** — Prettier check
2. **lint** — ESLint
3. **typecheck** — tsc --noEmit
4. **test:unit** — Vitest with coverage
5. **test:e2e** — Playwright (retries once)
6. **doctrine-lint** — Markdown schema validation

## Branch Policy

- Initiative branches: `mission/<initiative-id>`
- All work happens on mission branches
- Merge requires passing all verification gates
- Dry-run merge check before actual merge
- Ship pushes merged main to remote
