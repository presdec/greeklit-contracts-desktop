# Greeklit Contracts Desktop

[![Build](https://github.com/presdec/greeklit-contracts-desktop/actions/workflows/build.yml/badge.svg)](https://github.com/presdec/greeklit-contracts-desktop/actions/workflows/build.yml)
[![Test](https://github.com/presdec/greeklit-contracts-desktop/actions/workflows/test.yml/badge.svg)](https://github.com/presdec/greeklit-contracts-desktop/actions/workflows/test.yml)
[![Release](https://github.com/presdec/greeklit-contracts-desktop/actions/workflows/release.yml/badge.svg)](https://github.com/presdec/greeklit-contracts-desktop/actions/workflows/release.yml)

This folder is the starting point for turning the existing Python contract generator into a cleaner desktop product built with Vite and Electron.

## Goal

Keep the proven local workflow:

- upload/select one Excel workbook
- upload/select one DOCX template
- upload/select one email template
- map placeholders to Excel columns
- generate DOCX, PDF, and email outputs

Wrap that workflow in a simple desktop UI so a non-technical user can run it without editing raw files by hand.

## Proposed stack

- `Electron`: desktop shell, local file access, packaging
- `Vite`: fast frontend dev/build tooling
- `React` + `TypeScript`: UI and app state
- `Mantine`: practical component library for the desktop UI
- `TanStack Router`: app navigation without committing to a full-stack framework
- `Sentry`: error tracking once external users begin testing
- `Python`: keep the existing generator logic at first, exposed to Electron through a small local runner layer

## Tooling requirements

- `pnpm` is the required package manager
- Node `24.15.0` is pinned in `.nvmrc` and `.node-version`
- `.npmrc` enables `engine-strict=true`
- TypeScript is pinned to the current stable line, `5.9.2`

TypeScript `7` is not available as a stable release right now, so the app baseline uses the latest stable TypeScript instead.

## Setup

From the `app/` directory:

```bash
nvm use
pnpm install
pnpm dev
```

Useful scripts:

- `pnpm dev`
- `pnpm build`
- `pnpm preview`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm lint:fix`
- `pnpm format`
- `pnpm format:check`

## CI/CD

GitHub Actions workflows are configured in `.github/workflows`:

- `build.yml`: runs on pushes to `main` and pull requests, installs dependencies, and runs `pnpm build`.
- `test.yml`: runs on pushes to `main` and pull requests, builds the app, then runs Playwright end-to-end tests with `pnpm test:e2e`.
- `release.yml`: runs on `v*` tags and manual dispatch, builds release artifacts for Windows (`pnpm dist:win`) and Linux AppImage (`pnpm dist:linux:appimage`), then uploads them as workflow artifacts.

## Initial structure

- `docs/`: product and MVP planning
- `electron/`: Electron main/preload process files
- `src/`: Vite frontend app

## Next document

See `docs/mvp-plan.md` for the rollout plan and MVP feature set.
See `docs/desktop-stack.md` for stack decisions and what to defer.
