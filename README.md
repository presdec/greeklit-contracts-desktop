# Doc Gen Studio

[![Build](https://github.com/presdec/docgen-studio-desktop/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/presdec/docgen-studio-desktop/actions/workflows/build.yml)
[![Test](https://github.com/presdec/docgen-studio-desktop/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/presdec/docgen-studio-desktop/actions/workflows/test.yml)
[![Release](https://img.shields.io/github/v/release/presdec/docgen-studio-desktop?display_name=tag)](https://github.com/presdec/docgen-studio-desktop/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Doc Gen Studio is a desktop app for high-volume document generation from Excel data and Word templates.

It is built for teams that need to produce accurate, personalized documents quickly, without moving sensitive data to cloud services and without maintaining brittle manual workflows.

---

## Download

> Pre-built installers are published on every tagged release. No build step required.

| Version | Platform | Download |
|---------|----------|----------|
| **v0.2.8** *(latest)* | Windows (x64) | [DocGen Studio Setup 0.2.8.exe](https://github.com/presdec/docgen-studio-desktop/releases/download/v0.2.8/DocGen%20Studio%20Setup%200.2.8.exe) |
| **v0.2.8** *(latest)* | Linux AppImage | [docgen-studio-0.2.8-x64.AppImage](https://github.com/presdec/docgen-studio-desktop/releases/download/v0.2.8/docgen-studio-0.2.8-x64.AppImage) |
| **v0.2.8** *(latest)* | Linux deb | [docgen-studio-0.2.8-x64.deb](https://github.com/presdec/docgen-studio-desktop/releases/download/v0.2.8/docgen-studio-0.2.8-x64.deb) |
| **v0.2.8** *(latest)* | Linux rpm | [docgen-studio-0.2.8-x64.rpm](https://github.com/presdec/docgen-studio-desktop/releases/download/v0.2.8/docgen-studio-0.2.8-x64.rpm) |
| **v0.2.8** *(latest)* | Linux pacman | [docgen-studio-0.2.8-x64.pacman](https://github.com/presdec/docgen-studio-desktop/releases/download/v0.2.8/docgen-studio-0.2.8-x64.pacman) |

All releases: [github.com/presdec/docgen-studio-desktop/releases](https://github.com/presdec/docgen-studio-desktop/releases)

### Release History

| Tag | Summary |
|-----|---------|
| [v0.2.8](https://github.com/presdec/docgen-studio-desktop/releases/tag/v0.2.8) | Filename token picker, column assignment in Step 2, worksheet fallback, navigation guard, i18n fixes |
| [v0.2.7](https://github.com/presdec/docgen-studio-desktop/releases/tag/v0.2.7) | Configurable output filename pattern, first-class filename placeholders, collapsible Setup Check |
| [v0.2.6](https://github.com/presdec/docgen-studio-desktop/releases/tag/v0.2.6) | Doc Gen Studio rebrand, tag-based CI publishing, runtime build cleanup |

---

## Why This App Exists

Most document generation setups break down in one of two ways:

- They are too manual: copy/paste into templates, one document at a time.
- They are too technical: scripts and tooling that only one person on the team can safely run.

Doc Gen Studio closes that gap. It gives non-technical users a clear UI, while preserving the proven Python runtime that powers robust generation.

## Core USPs

- **Local-first and privacy-conscious** — Your workbook, templates, and generated files stay on your machine. No mandatory SaaS dependency and no per-seat document-generation subscription.
- **Fast at scale** — Turn one spreadsheet and one template into hundreds of outputs in one run. Generate DOCX, PDF, and email-draft artifacts in a single workflow.
- **Reliable mapping workflow** — Explicit field mapping between template placeholders and spreadsheet columns. Fewer silent errors and easier review before generation.
- **Practical for real operations** — Built as a desktop app for teams who need predictable local file access. No need to ask users to run Python scripts manually.
- **Hybrid architecture that is easy to evolve** — Electron + React UI for usability; Python runtime for proven document generation behavior; clean boundary between interface and generation logic.

## Who It Is For

- Legal and contracts teams preparing high-volume document sets.
- Operations teams sending personalized notices, forms, or packs.
- Small teams replacing fragile mail-merge workflows with a repeatable process.

## What You Can Do Today

- Select an Excel workbook, DOCX template, and email template.
- Map Word placeholders to workbook columns with suggested auto-mapping.
- Click Excel column chips to build DOCX/PDF filename patterns.
- Correct column → variable assignments inline in the mapping step.
- Generate DOCX, PDF, and email drafts in bulk.
- Review generated outputs and open files directly from the app.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron |
| Build tooling | electron-vite |
| UI | React 18 + TypeScript |
| Component library | Mantine v8 |
| State management | Jotai |
| i18n | Custom (EN / EL) |
| Document generation | Python (PyInstaller-bundled runtime) |
| Excel reading | openpyxl |
| Testing | Playwright (e2e) |
| Packaging | electron-builder |

---

## Building From Source

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | `>=24.15.0 <25` (use `.nvmrc` / `.node-version`) |
| pnpm | `>=10.15.1 <11` |
| Python | `>=3.10` (required only for runtime build) |

```bash
# 1. Clone the repository
git clone https://github.com/presdec/docgen-studio-desktop.git
cd docgen-studio-desktop

# 2. Pin the Node version (nvm or fnm)
nvm use        # reads .nvmrc

# 3. Install JS dependencies
pnpm install

# 4. Run the development app (hot-reloads renderer, rebuilds main on change)
pnpm dev
```

Other useful scripts:

```bash
pnpm build          # TypeScript check + electron-vite production build
pnpm typecheck      # tsc type-check only
pnpm lint           # ESLint
pnpm test:e2e       # Playwright end-to-end tests (requires a built app)
```

### Building the Python Runtime

The Python runtime (`inspect_project`, `generator`, `generate_email_drafts`) is compiled with PyInstaller and must be built before packaging a distributable. The runtime is **already included** in downloaded release installers; you only need this step when modifying the Python scripts.

```bash
# Install PyInstaller and runtime dependencies, then compile
pnpm runtime:build

# Force a clean rebuild (removes previous output first)
pnpm runtime:build:clean
```

The compiled runtime lands in `runtime/win32-x64/` (Windows) or `runtime/linux-x64/` (Linux).

---

## Building Release Installers Locally

These commands produce the same artifacts that CI publishes to GitHub Releases.

### Windows installer (`.exe`)

Run on a Windows machine:

```bash
pnpm dist:win
```

Output: `release/DocGen Studio Setup <version>.exe`

### Linux packages

Run on a Linux x64 machine (or a Linux CI runner):

```bash
# All Linux targets at once (AppImage, deb, rpm, pacman)
pnpm dist:linux

# Individual targets
pnpm dist:linux:appimage
pnpm dist:linux:deb
pnpm dist:linux:fedora   # .rpm
pnpm dist:linux:arch     # .pacman
```

Output: `release/docgen-studio-<version>-x64.<ext>`

> **Note:** `pacman` (Arch Linux) builds can be significantly slower than other targets due to the packaging toolchain.

### Unpacked directory (any platform, no installer)

Useful for quickly inspecting the packaged app without creating an installer:

```bash
pnpm dist:dir
```

Output: `release/win-unpacked/` or `release/linux-unpacked/`

---

## Releasing

Releases are published automatically by GitHub Actions when a version tag is pushed.

```bash
# Create an annotated tag and push it — CI takes care of the rest
git tag -a v0.X.Y -m "v0.X.Y - Short description"
git push origin v0.X.Y
```

The release workflow:
1. Syncs `package.json` version from the tag.
2. Builds the Python runtime on each platform.
3. Builds the Electron app.
4. Packages platform-specific installers.
5. Publishes artifacts to GitHub Releases.

---

## License

[MIT](LICENSE) © Philip Prescott-Decie

## Support

See [SUPPORT.md](SUPPORT.md) for help options.
