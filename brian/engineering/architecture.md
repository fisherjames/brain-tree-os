# Architecture

## System Design

Brian v2 is a clean monorepo with four packages:

### packages/shared
Zod schemas and TypeScript types for all workflow records. Governance transition map and policy validation.

### packages/server
Standalone Express + WebSocket server. No framework coupling. Handles MCP protocol, file watching, memU integration, and governance enforcement.

### packages/ui
Vite + React SPA with 7 tab surfaces. Communicates with server via WebSocket (MCP calls) and HTTP (REST API).

### packages/cli
TypeScript CLI with 17 commands covering the full workflow lifecycle.

## Data Flow

```
Markdown Files -> Server (fs watch / memU) -> WebSocket -> React UI
React UI -> MCP calls -> Server -> Markdown Files / Git
```

## Key Principles

1. Markdown is source of truth
2. Every UI action maps to an MCP call
3. Governance transitions are enforced server-side
4. Verification gates are hard-blocking
5. memU provides autonomous memory with filesystem fallback
