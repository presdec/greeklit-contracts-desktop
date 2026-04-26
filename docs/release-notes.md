# Release Notes

## v0.2.10 (2026-04-26)

### Added
- Email draft output modes: one combined DOCX, separate DOCX files, or separate EML files.
- Filename pattern preview using first-row sample data.
- Warning when a filename pattern token is not mapped to a selected workbook variable.

### Improved
- Mapping workflow UX across filename pattern and workbook assignment views.

### Fixed
- Workbook "Used by Email" badges no longer appear when email generation is disabled.

## v0.2.9 (2026-04-26)

### Added
- Worksheet dropdown sourced from workbook sheets.

### Improved
- Header row changes automatically move data start row to the next row, while still allowing manual override.

### Fixed
- Stabilized preview/render flow to prevent React update-depth crashes.
- Development runtime now prefers source Python scripts over stale local executables.
- Empty worksheet names now fall back to the first sheet more reliably.

## v0.2.8 (2026-04-26)

### Added
- Click-to-insert filename token chips in Step 2.
- Inline workbook column assignment panel in Step 2.

### Improved
- Added navigation warning when DOCX/PDF output is selected without a Word template.

### Fixed
- Workbook preview now resolves missing worksheet names and safer row defaults more reliably.

## v0.2.7 (2026-04-26)

### Added
- Configurable output filename pattern for DOCX/PDF generation in the mapping step.
- Filename placeholders are now treated as first-class mapping variables.

### Improved
- Renamed Step 2 and mapping panel copy to explicitly include filename mapping.
- Setup page Load Check now focuses on workbook validation even before selecting a Word template.
- Workbook mapping usage badges now clearly indicate `[WORD Field]` usage.
- Setup Check section is collapsible with compact aggregate status (for example, `10/10 Checks Pass`).

### Fixed
- Prevented installed-app crash in `inspect_project.exe` when no contract template path is provided (`TypeError: list indices must be integers or slices, not str`).

## Unreleased

## v0.2.6 (2026-04-26)

### Highlights
- Rebranded product experience to Doc Gen Studio across desktop packaging and docs.
- Stabilized tag-based release publishing in GitHub Actions.
- Improved runtime packaging behavior to keep release artifacts platform-focused.

### Changed
- CI release workflow now syncs package version from git tag (`vX.Y.Z` -> `X.Y.Z`) before packaging.
- Linux release jobs install required packaging dependency (`libarchive-tools`) for electron-builder targets.
- Runtime build now prunes non-target runtime folders during build to avoid bundling irrelevant binaries.
- README rewritten for Doc Gen Studio positioning and release behavior clarity.

### Fixed
- Resolved missing expected release-tag publication behavior caused by tag/version mismatch.
- Corrected release command path so publish behavior is consistently applied by matrix target.

