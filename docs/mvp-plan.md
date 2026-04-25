# Desktop MVP Plan

## Product goal

Build a calm Windows desktop tool that lets a non-technical user:

- choose an Excel workbook
- choose a Word contract template
- map placeholders to workbook columns
- build or load an email template
- generate DOCX files, PDFs, and combined email-draft DOCX output
- review outputs without touching a terminal

The product should stay local-first and workflow-first. It is not a SaaS platform, shared workspace, or online document editor.

The MVP release target is Windows, but the implementation should avoid unnecessary platform lock-in. Runtime discovery, file access, generator orchestration, and PDF conversion should be designed so future Linux packaging is an extension of the same architecture rather than a rewrite.

## Current summary

The product is well past the shell stage.

What is now clearly in place:

- Electron + Vite + React desktop shell
- four-step guided workflow
- file pickers and project save/open
- workbook inspection through Python
- DOCX placeholder detection
- setup preview with sample workbook rows
- Word placeholder mapping
- email template builder with token insertion
- live email preview from workbook sample values
- centralized generation and preflight services in Electron
- output review with open-folder and open-file actions
- starter template downloads for Excel, Word, and email
- i18n support in the renderer
- Greek UI copy added alongside English

What is still the main MVP risk:

- runtime still depends on local Python assumptions
- progress is not truly streamed from the generator yet
- packaging for Windows distribution is not solved yet
- end-to-end coverage is still light and at least one smoke test needs repair

## Actual workflow

The current product flow should stay close to this:

1. Project setup
2. Contract field mapping
3. Email builder
4. Review and generate

Project setup should answer one question first:

"Did I load the correct files and rows?"

That is why the setup step should keep showing:

- detected Word placeholders
- a few Excel sample rows
- worksheet, header row, and data row settings
- example template download actions

## Scope

### In scope

- local file-based workflow
- one workbook at a time
- one Word template at a time
- one email template per project
- English and Greek UI support
- DOCX output
- PDF output when available
- combined email-draft DOCX output
- project save/open
- output review inside the app

### Out of scope

- cloud sync
- user accounts
- team collaboration
- hosted database
- built-in email sending
- native `.eml` draft generation
- full Word template editing inside the app
- CRM integrations
- e-sign integrations
- analytics dashboard

## MVP scorecard

### 1. Setup confidence

Status: `Done`

The user can already load a workbook and Word template, inspect detected placeholders, and verify sample workbook rows before proceeding.

Acceptance criteria:

- user can choose workbook, Word template, and output folder from the desktop UI
- user can set worksheet name, header row, and first data row
- app shows detected Word placeholders
- app shows sample workbook rows from the selected worksheet
- user can tell whether the chosen workbook/template pair is the intended one before generation

### 2. Explicit mapping

Status: `Done`

The current flow makes mapping visible across workbook columns, Word placeholders, and email tokens, and it blocks forward progress when required mappings are still missing.

Acceptance criteria:

- workbook column to variable assignment is visible in the UI
- Word placeholder to variable mapping is visible in the UI
- email token to variable usage is visible in the UI
- duplicate workbook-variable assignments are resolved or surfaced clearly
- missing mappings are visible before generation
- user cannot reach generate-ready state with unresolved required mappings

### 3. Safe generation

Status: `Partial`

Generation is gated behind centralized preflight validation and returns a readable result, but progress is still stage-based rather than true streamed progress.

Acceptance criteria:

- app validates required files and settings before generation starts
- app blocks runs with obviously invalid inputs
- app reports whether PDF output is available
- app returns readable success and failure feedback
- app shows generation state while work is running
- generator progress is streamed from the backend rather than simulated

### 4. Trustworthy output review

Status: `Done`

The success panel already exposes the output folder, report, combined email-draft DOCX when present, and a structured list of generated artifacts.

Native `.eml` output remains a later option if mail-client behavior becomes reliable enough for the target workflow.

Acceptance criteria:

- user can open the output folder from the app
- user can open the report from the app
- user can open the combined email-draft DOCX when present
- user can inspect generated files in a structured list
- generated counts and skipped counts are shown after completion

### 5. Project persistence

Status: `Done`

Project save/open now restores more than just setup paths. The saved document includes project settings, generation options, mappings, email content, and step state.

Acceptance criteria:

- saved project restores workbook path, template path, email template path, and output folder
- saved project restores worksheet, header row, and first data row
- saved project restores generation options
- saved project restores workbook column assignments
- saved project restores Word placeholder mappings
- saved project restores email template content
- saved project restores optional email-source settings
- saved project restores the current wizard step

### 6. Preflight validation

Status: `Done`

Preflight has been centralized in Electron and already checks the major file, mapping, worksheet, output-folder, and PDF-backend conditions.

Acceptance criteria:

- workbook existence is validated
- Word template existence is validated when document output is selected
- output folder exists or can be created
- worksheet and row settings are validated through inspection
- required Word placeholders are mapped
- required email placeholders are mapped
- PDF backend availability is checked when PDF is enabled
- preflight results are shown in the review step before generation

### 7. Generation orchestration

Status: `Partial`

This area has improved a lot. Generator orchestration is no longer living directly in `electron/main.ts`, and payload building is more structured now. The main remaining gap is richer runtime progress and harder-edged error handling.

Acceptance criteria:

- `electron/main.ts` stays thin and delegates generation work to service modules
- payload building is standardized in one place
- preflight and generation share the same core request shape
- user-facing generation failures are readable
- stdout and stderr parsing is consistent enough for reliable summaries
- progress updates come from the running generator instead of only UI stage text

### 8. Windows packaging and runtime story

Status: `Not started` for the real MVP release path

This is still the main release blocker. The app currently depends on a local Python runtime assumption and direct script execution. The release target is still Windows, but the runtime contract should be made platform-neutral while we solve Windows packaging.

Acceptance criteria:

- final packaged app does not require the user to install or manage Python
- Electron prefers packaged executables over repo scripts or user-specific paths
- packaged app can perform DOCX generation on a clean Windows machine
- packaged app can perform PDF generation when PDF output is enabled and a supported backend is available
- DOCX generation still works when PDF conversion is unavailable
- packaged app writes temporary generation files into app-controlled locations
- packaged build is tested outside the dev environment
- runtime path discovery is expressed in a platform-neutral way rather than hardcoded for Windows only
- file open and file access behaviors are routed through cross-platform Electron and Node patterns

### 9. i18n and Greek support

Status: `Done` for initial MVP scope

The renderer now has an i18n layer with English and Greek copy, plus language selection and persisted language preference. This should be treated as shipped MVP scope, not future exploration.

Acceptance criteria:

- app supports at least English and Greek UI copy
- user can switch languages from the desktop UI
- selected language persists across app restarts
- core workflow screens are translated, not only the shell
- adding future languages follows the same translation structure

### 10. Automated verification

Status: `Partial`

Static checks are green, which matters, but automated workflow coverage is still thin and the current desktop smoke test needs repair.

Acceptance criteria:

- `pnpm typecheck` passes
- `pnpm lint` passes
- desktop launch smoke test passes
- save/open project roundtrip has automated coverage
- setup preview flow has automated coverage
- generation happy path has automated coverage
- at least one failure-path generation test exists

## Biggest remaining work

### 1. Finish the runtime story

The highest-priority MVP gap is replacing machine-specific Python assumptions with a packaged runtime contract. This should be done in a platform-neutral way even though Windows is the only release target for MVP.

Acceptance criteria:

- no dependency on `~/anaconda3/python.exe` for the shipped app
- packaged generator executables or equivalent packaged services are discoverable at runtime
- runtime path resolution works in packaged mode and dev mode
- runtime path resolution does not assume Windows-only directory layouts
- executable discovery can be extended to future Linux targets without changing the service contract

### 2. Stream real generation progress

The current UI progress is useful, but it is not yet trustworthy enough for a polished MVP.

Acceptance criteria:

- backend emits structured progress events during generation
- renderer shows real stage and progress updates from the generator
- long runs do not look stalled when work is still in progress

### 3. Harden packaging for PDF generation

LibreOffice and PDF capability still need a final distribution plan. The preferred direction is to make LibreOffice the primary cross-platform PDF backend, with any Windows-specific fallback treated as optional rather than foundational.

Acceptance criteria:

- app detects a usable local LibreOffice install when present
- bundled or managed fallback is used only when needed
- PDF backend status is visible before generation
- final installer does not duplicate unnecessary payload when local LibreOffice is already available
- PDF generation is built around a backend abstraction that can work on Windows first and Linux later
- Microsoft Word automation, if kept, is treated as an optional Windows fallback rather than the core PDF path

### 4. Repair and expand integration coverage

The test story should match the importance of the workflow.

Acceptance criteria:

- Playwright desktop smoke test launches the app successfully
- smoke test assertions match the current UI copy
- generation output summary path is covered by an automated test
- save/open project path is covered by an automated test

## Recommended next order

1. Keep the app green and remove local-machine fragility.
2. Finish the packaged runtime story for Windows in a platform-neutral way.
3. Make file access and runtime discovery cross-compatible while staying Windows-first for release.
4. Add true streamed generation progress.
5. Repair and expand end-to-end coverage.
6. Harden LibreOffice-backed PDF detection and fallback packaging.
7. Add more packaged-app validation on clean machines.

## Packaging note

The app should be packaged as a local Windows desktop application.

That means:

- no Docker dependency
- no server dependency
- no user-managed Python dependency for the final distributed version
- no separate manual LibreOffice install requirement for the final distributed version if PDF output is part of MVP

It also means the MVP should avoid unnecessary Windows-only assumptions in:

- runtime path discovery
- file open and file access behavior
- bundled executable lookup
- PDF backend orchestration

The final product should bring its own runtime story.

## Release success criteria

The MVP is successful if a non-technical user can:

- load their workbook and template files correctly
- understand what is mapped and what is missing
- use the app in English or Greek
- generate outputs without using the terminal
- recover from common mistakes without developer help
- resume a saved project without rebuilding the setup

## Short takeaway

The product is no longer "build the shell."

The product is now:

"Stabilize the workflow, keep the bilingual UI coherent, and finish the packaging/runtime story."
