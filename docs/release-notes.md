# Release Notes

## v0.4.1 (2026-05-10)

### Added
- **Generation cancel**: Cancel button in the progress panel now kills the Python subprocess immediately via `AbortController`. Button is styled as a destructive action and placed outside the progress block for easy access.
- **Unsaved changes guard**: dirty state is synced to the main process; closing the window while unsaved triggers a native Save / Discard / Cancel dialog.
- **Skipped rows detail**: per-row rejection reasons are parsed from the generation report and shown in a collapsible section in the success panel.
- **Keyboard shortcuts modal**: a `?` icon in the sidebar opens a modal listing all shortcuts (F5, F9, Ctrl+O, Ctrl+Shift+S, Ctrl+R, Ctrl+Enter, ?).
- **Email address validation**: To and Cc fields show an inline error when a value is static text that is not a valid email address (tokens are exempt).
- **Bilingual**: all new strings translated to Greek (EL).

## v0.4.0 (2026-05-09)

### Improved
- **Inline validation per component**: `ContractMappingPanel` and `EmailTemplateEditor` now render their own validation feedback inline rather than relying on alerts injected from `App.tsx`. Each component receives only the issues relevant to its step.
- **Step indicator for validation issues**: the sidebar `StepList` now highlights steps that have unresolved validation issues with a yellow filled badge, so you can see at a glance which steps need attention without navigating to them.
- **Clearer copy throughout**: setup field descriptions, mapping subtitle, email builder field hints, workbook preview subtitle, and the review panel subtitle have all been rewritten to be more direct and actionable.
- **Review panel renamed**: "Ready To Generate" heading renamed to "Review & Generate" to match the step label and reduce confusion.
- **Linux no-sandbox mode**: `--no-sandbox` is now applied unconditionally on Linux (previously only when running as an AppImage), fixing startup crashes in WSL and other non-AppImage Linux environments.

### Fixed
- E2e test suite now passes on WSL: `localStorage` write and page reload separated to avoid a `SecurityError`; assertion timeouts increased for slower Linux IPC.

## v0.3.0 (2026-05-09)

### Added
- **Workbook setup modal**: workbook configuration (worksheet, header row, data start row, rejection filter) now opens in a dedicated modal triggered automatically after picking an Excel file, or manually via a settings button on the file field.
- **Template inspection modal**: after picking a Word or email template, a preview modal shows detected tokens/variables so you can verify the template before proceeding.
- **FileField clear button**: every file field now has an ✕ clear button to remove a selected file without needing to re-browse.
- **FileField secondary action**: file fields support a configurable secondary action button (e.g. open settings, inspect) rendered alongside the browse button.
- **Rich workbook preview rows from Python**: the inspector now returns structured `previewRows` (header row, suggested header, first data rows, and a rejected row example) with role metadata, gap indicators, and populated-cell counts — used to drive the setup modal table.
- **Header analysis in inspection**: `analyze_header_rows` scans the first 10 rows to suggest the likely header row when the selected row looks wrong.
- **`maxColumn` in inspection result**: the inspector now returns `max_column` so the UI can cap preview columns correctly.
- **Word template inspection without a workbook**: `inspect_project.py` now accepts a contract template path alone (no workbook required) and returns token/context data with empty workbook fields.
- **Validation alerts per step**: step 2 and step 3 now render their own targeted validation alerts inline instead of a single generic block.
- **Sidebar step navigation**: clicking a step in the sidebar now navigates directly to it (with the same validation guard as Continue).
- **Filename pattern live preview** (restored): the DOCX/PDF filename pattern field on step 2 shows a rendered preview using the first data row's sample values, so you can verify the pattern before generating.

### Improved
- **Step 1 layout**: project setup panel is now leaner — workbook row/worksheet settings, template inspection, and output folder are exposed via modals and action buttons rather than inline expanded panels. `SetupSourcePreviewPanel` removed.
- **Step 2 layout**: `ContractMappingPanel` and `WorkbookPreviewPanel` are now stacked vertically (full width) instead of a side-by-side grid, giving each panel more room.
- **Workbook mapping default mode** changed from `half` to `compact` on step 2.
- **Step 2 header bar**: mapping badge count and Open Template / Reload Fields actions moved into the step header, removing the need for those controls inside the mapping panel itself.
- **Save/load project moved to sidebar**: the Open Project and Save Project icon buttons now live in the sidebar header alongside the language switcher, freeing the main content header.
- **Content area scrolling**: the main content pane now scrolls independently of the sidebar via a dedicated `.content-scroll` container; `scrollToTop` targets it correctly.
- **Footer navigation**: the Back / Continue / Generate bar is now a sticky `<footer>` element outside the scrollable content, always visible at the bottom of the card.
- **Permission-denied error messaging**: when the Python inspector fails with a file-lock or permission error (Excel still open, OneDrive syncing), the error message is normalised into a clear, human-readable instruction.
- **`inspect_project.py` argument handling**: `workbookPath`, `headerRow`, and `dataStartRow` are now optional in the CLI entry point, matching the relaxed requirement to support template-only inspection.

### Fixed
- `output-filename-pattern` validation issue no longer triggers a navigation warning when clicking Continue from step 2 (it is shown inline instead).
- `inspectProjectInternal` no longer throws "Choose an Excel workbook" when only a contract template is present; it proceeds with template-only inspection.
- Raw Python `PermissionError` stack traces are no longer surfaced to the user; they are replaced with a friendly workbook-locked message.

## v0.2.15 (2026-05-08)

### Added
- Quick project save and reload workflow:
  - `F5` saves the current project setup.
  - `F9` opens the most recent project.
  - File menu now includes Open Project, Open Last Project, Open Recent, Save Project, and Save Project As.
- Real persisted recent-projects list in the native File menu, including Clear Recent Projects.
- External email template files now support both `.txt` and `.docx`.
- External email template placeholders are inspected and included in workbook mapping/preflight checks.
- Focused regression coverage for quick save, recent projects, external `.txt`/`.docx` email templates, mapping UI, review summary, and centralized workflow validation.
- GitHub Actions now runs the direct workflow-validation unit tests.

### Improved
- Workbook mapping now uses a docked mapping panel with Compact, Half, and Full modes.
- Workbook mapping table has internal scrolling, sticky headers, usage filters, required/missing filters, and usage badges for Word, Email, and Filename.
- Suggested workbook variables can be applied directly from the table.
- Required mapping coverage is shown directly in the mapping dock and review page.
- Final review page is grouped into Output plan, Mapping coverage, Workbook source, and Email source.
- Navigation validation and review/preflight step targeting now share centralized validation logic.
- Word template field reload now forces DOCX re-inspection.
- Conservative auto-mapping now fills matching required fields from workbook header suggestions without overwriting manual choices.
- Greek workbook headers are recognized locally for common contract fields, and unknown Greek headers produce shorter Greeklish field suggestions.
- Suggested fallback field names are capped to field-sized values instead of long sentence-sized identifiers.

### Fixed
- Workbook mapping column order now follows Excel order (`A, B, C ... Z, AA`) instead of string ordering.
- Prevented broad aliases like `to` from incorrectly suggesting `EMAIL_TO` for unrelated Greek headers.
- Review no longer flashes a red "Needs attention" state while preflight is still pending.
- Release workflow now writes the matching `docs/release-notes.md` section into the GitHub release body, so release pages show descriptions.
- PowerShell/VS Code workspace settings now avoid double Python environment activation in the integrated terminal.

## v0.2.14 (2026-05-08)

### Added
- Searchable + creatable variable selectors in workbook and contract mapping tables. You can now type to find variables or create a new one directly from the mapping control.

### Improved
- Mapping model is now variable-first and template-driven: fields come from Word/email/filename tokens plus user-created mapping values.
- DOCX/PDF filename token chips now show variable names (not column headers), and newly created variables appear in the chip list.

### Changed
- Removed automatic pre-population of mappings from hardcoded workbook-header aliases.
- Default project setup now starts with an empty filename pattern and an empty email template to avoid implied placeholder assumptions.

## v0.2.13 (2026-05-08)

### Added
- **Rejected row count on Review page**: the workbook inspection call now counts rows excluded by the rejection filter and shows the count as a "Rejected rows" stat tile before generation — no extra Python call, computed in the same scan pass.

### Improved
- **Navigation UX**: clicking Continue or Back now instantly scrolls to the top of the page.
- **Step 1 validation**: Continue is blocked until an Excel workbook, output folder, and (when DOCX/PDF is enabled) a Word template have all been selected. Validation warnings appear inline just above the navigation buttons, not mid-page.
- **Compact sidebar**: step cards are tighter (smaller icon, less padding, no description text). Step titles shortened to Setup, Template & Mapping, Email Builder, Review & Generate.
- **Outlook MSG recipient robustness**: `undefined` tokens and empty values are stripped from To/Cc strings before being written to MSG drafts, preventing COM errors on missing placeholders.

### Fixed
- Navigation warning alert was showing "Word template required" as its title even when the message was about the output folder or Excel workbook — alert now has no hardcoded title.
- Navigation warning was rendered mid-page (far from the Continue button); it now renders directly above the navigation buttons.

## v0.2.12 (2026-05-07)

### Added
- Outlook MSG draft output: email generator now creates `.msg` files via Outlook COM automation, with proper recipient handling using the Recipients collection (bypasses GAL name resolution).
- Outlook capability detection: a new `getCapabilities` IPC call checks at startup whether Outlook automation is available; the MSG output mode option is only shown when it is.
- Row rejection filter (`skip_if_column_equals`): configure a column and value to exclude matching rows from both contract and email generation, with a dedicated rejection column/value setup in the UI.
- `DesktopCapabilities` type exposed to the renderer, covering platform, PDF backend, and Outlook MSG availability.
- Column values from the workbook are now returned by `inspect_project` and used to populate the rejection value picker in the UI.

### Fixed
- Email template Subject, To, and Cc fields are now extracted from the rendered HTML and set as actual metadata on `.eml` and `.msg` files instead of appearing in the message body.
- Undefined email template fields (Subject/To/Cc) no longer serialise as the literal string `"undefined"` in generated HTML.
- Outlook MSG To/Cc fields are only set when non-empty, preventing Outlook from rejecting messages with empty recipient strings.
- Values containing `undefined` tokens (from unresolved placeholders) are cleaned before being used as recipients or subject lines.
- Document output modes (combined and separate DOCX/HTML) correctly include Subject/To/Cc header lines for human review, while `.eml`/`.msg` formats strip them from the body.
- Generate button no longer shows as loading while preflight checks run.

## v0.2.10 (2026-04-26)

### Added
- Email draft output modes: one combined DOCX, separate DOCX files, separate EML files, or Outlook MSG files.
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

