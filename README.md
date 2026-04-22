# Desktop App Workspace

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

## Initial structure

- `docs/`: product and MVP planning
- `electron/`: Electron main/preload process files
- `src/`: Vite frontend app

## Next document

See `docs/mvp-plan.md` for the rollout plan and MVP feature set.
See `docs/desktop-stack.md` for stack decisions and what to defer.
