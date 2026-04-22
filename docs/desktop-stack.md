# Desktop MVP Stack

## Recommendation

For the first real product version, keep the app local-first and desktop-first.

Recommended stack:

- `Electron`
- `Vite`
- `React`
- `TypeScript` `5.9.2`
- `Mantine`
- `TanStack Router`
- `Sentry`
- existing `Python` generator

Tooling baseline:

- Node `24.15.0` LTS
- `pnpm` `10.15.1`
- `.nvmrc` and `.node-version` committed in `app/`

## Why this stack

This app's first job is to make a proven local workflow easier:

- choose files
- inspect placeholders
- map fields
- run generation
- review outputs

That does not require a full hosted web architecture yet. It mainly requires:

- a dependable desktop shell
- a clean UI
- access to local files
- safe orchestration of the Python generation engine

## Tool-by-tool decision

### Use now

#### `Electron`

- Needed for desktop packaging and local file access
- Best fit for a non-technical end-user workflow on Windows

#### `Vite`

- Fast dev server and straightforward frontend build pipeline
- Good fit for Electron renderer development

#### `React`

- Good ecosystem support for forms, tables, and wizard flows

#### `TypeScript`

- Helps keep the desktop app state, IPC contracts, and config models safe
- Stable TypeScript is currently `5.9.2`, so that is the version line to use now
- Do not target TypeScript `7` yet because it is not available as a stable release

#### `Mantine`

- Strong fit for admin-style UI
- Gives forms, tables, dialogs, notifications, and layout primitives quickly
- Good choice for a polished but practical desktop interface

#### `TanStack Router`

- Useful if we want a clean multi-screen desktop app structure
- Lighter and more appropriate here than adopting a full-stack framework

#### `Sentry`

- Worth adding once anyone outside internal use is testing the app
- Helpful for Electron main-process and renderer-process error tracking

#### Existing `Python` generator

- Lowest-risk path to a usable MVP
- Reuses proven logic instead of rewriting too early

### Defer for now

#### `TanStack Start`

- Better suited to a hosted full-stack web app
- Adds SSR/server-function concepts we do not need for a local-first desktop MVP
- Still documented as `RC`, so it is not the simplest foundation for this use case

#### `Clerk`

- Good auth product, but authentication is not needed for the first desktop MVP
- Adds meaningful complexity in a desktop app before we know we need accounts

#### `Resend`

- Good option if we later send emails from a backend service
- Not needed for a desktop app that currently generates drafts and files locally

#### `Recharts`

- Fine choice if we later add useful reporting or analytics
- Not necessary for the core workflow

#### `Neon`

- Only useful once we need a hosted database
- Premature if the app remains local-first

#### `Supabase`

- Strong candidate later if we need backend services
- Better fit than a database-only service if we eventually need auth, storage, and data together

## Backend decision rule

### Stay local-only while the app is:

- single-user
- file-based
- desktop-first
- generating outputs on the local machine

### Introduce backend services only when the app needs:

- accounts
- sync across machines
- shared projects or templates
- hosted processing
- sent-email tracking
- audit history across users

## If cloud features become necessary later

### Best all-in-one choice

`Supabase`

Why:

- auth
- Postgres
- storage
- edge functions
- simpler product surface for a small team

### Best composable choice

`Clerk + Neon`

Why:

- good if auth and database concerns grow separately
- good if we want more control over vendor boundaries

## Short version

Build the first app as a calm desktop product, not a mini SaaS.

Use:

- `Electron`
- `Vite`
- `React`
- `TypeScript`
- `Mantine`
- `TanStack Router`
- `Sentry`
- `Python`

Delay auth, hosted databases, email APIs, and analytics until real users clearly need them.
