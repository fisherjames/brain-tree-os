# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-03-23

### Changed

- Reworked the product around the Brian identity and the `brian/` plus `.brian/` layout
- Added managed Codex session commands: `work` and `end`
- Added a managed Brian Codex skill pack and richer role scaffolding in `codex-team` init
- Removed normal-operation fallbacks to the older layout and older command name
- Updated the viewer, docs, and bundled assets to Brian branding

## [0.1.3] - 2026-03-22

### Fixed

- Brains list page now shows user-created brains (was statically pre-rendered, only showing demo)

## [0.1.2] - 2026-03-22

### Fixed

- Server 500 error on `/brains/demo` caused by stale `.next/` build artifacts

## [0.1.1] - 2026-03-22

### Fixed

- `Cannot find module '../lib/local-data'` runtime error (server tsconfig was missing lib includes)
- npm package missing `packages/web/dist/lib/` directory

## [0.1.0] - 2026-03-22

### Added

- Initial open source release
- Brain viewer with graph view, file tree, markdown viewer, execution plan pane
- Real-time filesystem watching with WebSocket updates
- CLI entry point (`brian`)
- Initial brain command set and local viewer workflow
- Bundled demo brain (clsh.dev project, 43 files)
- Local-only operation (no cloud, no auth, no accounts)
