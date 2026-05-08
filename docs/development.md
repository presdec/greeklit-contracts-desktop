# Development

This document is for contributors and maintainers working from source.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron |
| Build tooling | electron-vite |
| UI | React + TypeScript |
| Component library | Mantine v8 |
| State management | Jotai |
| i18n | Custom (EN / EL) |
| Document generation | Python (PyInstaller-bundled runtime) |
| Excel reading | openpyxl |
| Testing | Playwright (e2e), pytest |
| Packaging | electron-builder |

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | `>=24.15.0 <25` |
| pnpm | `>=10.15.1 <11` |
| Python | `>=3.10` |

Use the repo-pinned Node version where possible:

```bash
nvm use
```

## Run From Source

```bash
git clone https://github.com/presdec/docgen-studio-desktop.git
cd docgen-studio-desktop/app
pnpm install
pnpm dev
```

Useful commands:

```bash
pnpm typecheck
pnpm lint
pnpm test:e2e
pnpm build
```

## Build The Python Runtime

The desktop app ships Python-based runtime services for workbook inspection, document generation, and email draft generation.

```bash
pnpm runtime:build
```

Clean rebuild:

```bash
pnpm runtime:build:clean
```

Build-time Python dependencies are listed in `scripts/requirements-runtime-build.txt`.

## Build Local Packages

### Windows

```bash
pnpm dist:win
```

Artifacts:

- `release/DocGen-Studio-Setup-<version>.exe`
- `release/win-unpacked/`

### Linux

Build on Linux x64 (or CI) so the Python runtime is built for Linux rather than Windows.

```bash
pnpm dist:linux
```

Individual targets:

```bash
pnpm dist:linux:appimage
pnpm dist:linux:deb
pnpm dist:linux:fedora
pnpm dist:linux:arch
```

Artifacts are written to `release/`.

## Releasing

Tagged releases are published by GitHub Actions.

```bash
git tag -a v0.X.Y -m "v0.X.Y - Short description"
git push origin v0.X.Y
```

The release workflow:

1. Syncs `package.json` version from the tag.
2. Builds the Python runtime for each target platform.
3. Builds the Electron app.
4. Packages platform-specific installers.
5. Publishes assets to GitHub Releases.
6. Updates the GitHub release body from the matching section in [release-notes.md](./release-notes.md).

## Packaging Notes

For runtime layout, packaged resource paths, and Linux packaging behavior, see [packaging-runtime.md](./packaging-runtime.md).
