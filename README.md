# Doc Gen Studio

[![Build](https://github.com/presdec/docgen-studio-desktop/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/presdec/docgen-studio-desktop/actions/workflows/build.yml)
[![Test](https://github.com/presdec/docgen-studio-desktop/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/presdec/docgen-studio-desktop/actions/workflows/test.yml)
[![Release](https://img.shields.io/github/v/release/presdec/docgen-studio-desktop?display_name=tag)](https://github.com/presdec/docgen-studio-desktop/releases)

Doc Gen Studio is a desktop app for high-volume document generation from Excel data and Word templates.

It is built for teams that need to produce accurate, personalized documents quickly, without moving sensitive data to cloud services and without maintaining brittle manual workflows.

## Why This App Exists

Most document generation setups break down in one of two ways:

- They are too manual: copy/paste into templates, one document at a time.
- They are too technical: scripts and tooling that only one person on the team can safely run.

Doc Gen Studio closes that gap. It gives non-technical users a clear UI, while preserving the proven Python runtime that powers robust generation.

## Core USPs

- Local-first and privacy-conscious
	- Your workbook, templates, and generated files stay on your machine.
	- No mandatory SaaS dependency and no per-seat document-generation subscription.

- Fast at scale
	- Turn one spreadsheet and one template into hundreds of outputs in one run.
	- Generate DOCX, PDF, and email-draft artifacts in a single workflow.

- Reliable mapping workflow
	- Explicit field mapping between template placeholders and spreadsheet columns.
	- Fewer silent errors and easier review before generation.

- Practical for real operations
	- Built as a desktop app for teams who need predictable local file access.
	- No need to ask users to run Python scripts manually.

- Hybrid architecture that is easy to evolve
	- Electron + React UI for usability.
	- Python runtime for proven document generation behavior.
	- Clean boundary between interface and generation logic.

## Who It Is For

- Legal and contracts teams preparing high-volume document sets.
- Operations teams sending personalized notices, forms, or packs.
- Small teams replacing fragile mail-merge workflows with a repeatable process.

## What You Can Do Today

- Select an Excel workbook.
- Select a DOCX template.
- Select an email template.
- Map placeholders to workbook columns.
- Generate outputs in bulk.

## Tech Stack

- Electron
- Vite
- React + TypeScript
- Python runtime tools

## Development Setup

From the app directory:

```bash
nvm use
pnpm install
pnpm dev
```

Useful scripts:

- `pnpm dev`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm lint`
- `pnpm typecheck`

## Release Artifacts

Tagged builds publish desktop release assets to GitHub Releases.

- Windows installer (`.exe`)
- Linux packages (`.AppImage`, `.deb`, `.rpm`, `.pacman`)

Note: the GitHub Packages tab is separate from GitHub Releases. Doc Gen Studio currently publishes downloadable release assets, not registry packages.
