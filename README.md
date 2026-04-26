# Doc Gen Studio

[![Build](https://github.com/presdec/docgen-studio-desktop/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/presdec/docgen-studio-desktop/actions/workflows/build.yml)
[![Test](https://github.com/presdec/docgen-studio-desktop/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/presdec/docgen-studio-desktop/actions/workflows/test.yml)
[![Release](https://img.shields.io/github/v/release/presdec/docgen-studio-desktop?display_name=tag)](https://github.com/presdec/docgen-studio-desktop/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Doc Gen Studio is a desktop app for high-volume document generation from Excel data and Word templates.

It is built for teams that need to produce accurate, personalized documents quickly, without moving sensitive data to cloud services and without maintaining brittle manual workflows.

---

## Download

> Pre-built installers are published on every tagged release. Most users should download the latest release rather than build from source.

| Version | Package | Download |
|---------|---------|----------|
| **v0.2.10** *(latest)* | Windows installer | [DocGen-Studio-Setup-0.2.10.exe](https://github.com/presdec/docgen-studio-desktop/releases/download/v0.2.10/DocGen-Studio-Setup-0.2.10.exe) |
| **v0.2.10** *(latest)* | Linux AppImage | [docgen-studio-0.2.10-x86_64.AppImage](https://github.com/presdec/docgen-studio-desktop/releases/download/v0.2.10/docgen-studio-0.2.10-x86_64.AppImage) |
| **v0.2.10** *(latest)* | Linux deb | [docgen-studio-0.2.10-amd64.deb](https://github.com/presdec/docgen-studio-desktop/releases/download/v0.2.10/docgen-studio-0.2.10-amd64.deb) |
| **v0.2.10** *(latest)* | Linux rpm | [docgen-studio-0.2.10-x86_64.rpm](https://github.com/presdec/docgen-studio-desktop/releases/download/v0.2.10/docgen-studio-0.2.10-x86_64.rpm) |
| **v0.2.10** *(latest)* | Linux pacman | [docgen-studio-0.2.10-x64.pacman](https://github.com/presdec/docgen-studio-desktop/releases/download/v0.2.10/docgen-studio-0.2.10-x64.pacman) |

All releases: [github.com/presdec/docgen-studio-desktop/releases](https://github.com/presdec/docgen-studio-desktop/releases)

### Install Instructions

**Windows (`.exe`)**

1. Download `DocGen-Studio-Setup-0.2.10.exe`.
2. Double-click the installer.
3. Follow the setup wizard and launch Doc Gen Studio from the Start menu.

**Linux AppImage**

```bash
chmod +x ./docgen-studio-0.2.10-x86_64.AppImage
./docgen-studio-0.2.10-x86_64.AppImage
```

On Ubuntu or Debian, AppImage may require `libfuse2`:

```bash
sudo apt install libfuse2
```

**Ubuntu / Debian (`.deb`)**

```bash
sudo apt install ./docgen-studio-0.2.10-amd64.deb
```

If `apt` prints a warning about downloading unsandboxed as root for a local file, that is usually an `apt` local-file warning rather than a Doc Gen Studio packaging failure.

**Fedora / RHEL (`.rpm`)**

```bash
sudo dnf install ./docgen-studio-0.2.10-x86_64.rpm
```

**Arch Linux (`.pacman`)**

```bash
sudo pacman -U ./docgen-studio-0.2.10-x64.pacman
```

### Release History

| Tag | Summary |
|-----|---------|
| [v0.2.10](https://github.com/presdec/docgen-studio-desktop/releases/tag/v0.2.10) | Email output modes, filename preview and warnings, mapping UX improvements |
| [v0.2.9](https://github.com/presdec/docgen-studio-desktop/releases/tag/v0.2.9) | Render stability fixes, worksheet dropdown, first-sheet fallback, header/data row UX |
| [v0.2.8](https://github.com/presdec/docgen-studio-desktop/releases/tag/v0.2.8) | Filename token picker, Step 2 column assignment, navigation guard, worksheet preview fixes |

---

## Why This App Exists

Most document generation setups break down in one of two ways:

- They are too manual: copy/paste into templates, one document at a time.
- They are too technical: scripts and tooling that only one person on the team can safely run.

Doc Gen Studio closes that gap. It gives non-technical users a clear UI, while preserving the proven Python runtime that powers robust generation.

## Core USPs

- **Private by default** — Excel files, Word templates, email drafts, and generated outputs stay on the local machine. No cloud dependency and no SaaS lock-in.
- **Built for real-world bulk work** — Generate Word files, PDFs, and email drafts from one workbook-driven workflow instead of maintaining separate tools or manual mail merge steps.
- **Safer mapping before generation** — Preview source rows, map placeholders explicitly, build output filenames from workbook fields, and catch missing mappings before a full run.
- **Flexible delivery outputs** — Produce one combined email DOCX, separate email DOCX files, or separate EML files depending on how the team actually sends messages.
- **Desktop UX over script maintenance** — The Python runtime stays behind the scenes while non-technical users work through a guided interface.
- **Operationally practical** — Open templates, reload fields, save reusable setups, and inspect output trees directly from the app.

## Who It Is For

- Legal and contracts teams preparing high-volume document sets.
- Operations teams sending personalized notices, forms, or packs.
- Small teams replacing fragile mail-merge workflows with a repeatable process.

## What You Can Do Today

- Select an Excel workbook, DOCX template, and email template.
- Map Word placeholders to workbook columns with suggested auto-mapping.
- Click Excel column chips to build DOCX/PDF filename patterns and preview the first-row result.
- Correct column → variable assignments inline in the mapping step.
- Generate DOCX, PDF, and email drafts in bulk.
- Choose whether email drafts are exported as one DOCX, separate DOCX files, or separate EML files.
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

## Development, Source Builds, and Releasing

Contributor and maintainer workflows now live in dedicated docs:

- [Development and source builds](docs/development.md)
- [Packaging runtime contract](docs/packaging-runtime.md)
- [Release notes](docs/release-notes.md)

---

## License

[MIT](LICENSE) © Philip Prescott-Decie

## Support

See [SUPPORT.md](SUPPORT.md) for help options.
