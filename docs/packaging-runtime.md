# Packaging Runtime Contract

The desktop app resolves generation services through a platform-neutral runtime layout:

```text
runtime/
  win32-x64/
    generate_contracts.exe
    generate_email_drafts.exe
    inspect_project.exe
    manifest.json
  linux-x64/
    generate_contracts
    generate_email_drafts
    inspect_project
    manifest.json
```

The key is `<process.platform>-<process.arch>`, matching Electron/Node values such as `win32-x64`, `linux-x64`, `darwin-arm64`, and `darwin-x64`.

## Build Runtime Executables

From `app/`:

```powershell
pnpm runtime:build
```

or clean the current platform output first:

```powershell
pnpm runtime:build:clean
```

The script uses PyInstaller from the active Python environment and writes executables to `app/runtime/<platform>-<arch>/`.
Build-time Python dependencies are listed in `scripts/requirements-runtime-build.txt`.

## Build The Desktop App

Create an unpacked runnable app folder:

```powershell
pnpm dist:dir
```

This writes the app executable to:

```text
release/win-unpacked/DocGen Studio.exe
```

Create the Windows installer:

```powershell
pnpm dist:win
```

This writes:

```text
release/DocGen-Studio-Setup-<version>.exe
release/win-unpacked/DocGen Studio.exe
```

## Linux Release Targets

Linux packages need Linux runtime executables in `app/runtime/linux-x64/`.
Build these artifacts on Linux, WSL, or a Linux CI runner so PyInstaller produces Linux binaries instead of Windows `.exe` files.

The configured Linux targets are:

- Ubuntu/Debian: `.deb`
- Fedora/RHEL: `.rpm`
- Arch Linux: `pacman`
- Portable fallback: `AppImage`

From `app/`, build all Linux release artifacts:

```bash
pnpm dist:linux
```

Before the first Linux build, install the Python runtime build dependencies in the active Python environment:

```bash
python -m pip install -r scripts/requirements-runtime-build.txt
```

Or build one family:

```bash
pnpm dist:linux:ubuntu
pnpm dist:linux:fedora
pnpm dist:linux:arch
pnpm dist:linux:appimage
```

Equivalent target-name aliases are also available:

```bash
pnpm dist:linux:deb
pnpm dist:linux:rpm
pnpm dist:linux:pacman
```

The scripts run `pnpm runtime:assert:linux-x64` before packaging. If `runtime/linux-x64/` is missing, packaging stops instead of creating a Linux app that cannot run generation services.

Artifacts are named from the configured Linux artifact template and will be similar to:

```text
release/docgen-studio-0.1.0-x86_64.AppImage
release/docgen-studio_0.1.0_amd64.deb
release/docgen-studio-0.1.0.x86_64.rpm
release/docgen-studio-0.1.0-x64.pacman
```

Exact architecture text can vary by target because Debian, RPM, AppImage, and pacman use different naming conventions.

## Packaged App Behavior

In packaged mode, Electron looks for generator services in packaged resources:

- `resources/runtime/<platform>-<arch>/`
- `resources/runtime/`
- `resources/bin/<platform>-<arch>/`
- `resources/bin/`

Packaged mode does not fall back to repo `.py` scripts. This keeps the shipped app independent from user-managed Python.

Development mode still supports:

- `app/runtime/<platform>-<arch>/` executables
- source Python scripts as a fallback

## Resources To Include

Any packaging tool should include:

- `dist-electron/`
- production `node_modules/`
- `runtime/`
- `templates/`

`electron-builder.yml` already declares `runtime/` and `templates/` as `extraResources`.

Starter templates are resolved from packaged `resources/templates/` first and from source `app/templates/` in development.

## PDF Backend

PDF generation remains backend-based:

- bundled or local LibreOffice is preferred
- Microsoft Word automation is a Windows fallback
- DOCX generation remains available when PDF capability is absent

LibreOffice can be packaged under one of the runtime/resource paths, or discovered from the system.
