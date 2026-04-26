# Desktop MVP Plan

## Product Goal

Build a calm Windows desktop tool that lets a non-technical user:

- choose an Excel workbook
- choose a Word contract template
- map placeholders to workbook columns
- build or load an email template
- generate DOCX files, PDFs, and combined email-draft DOCX output
- review outputs without touching a terminal

The app should stay local-first and workflow-first. It is not a SaaS product, shared workspace, CRM, online editor, or email-sending tool.

## Current Status

The product is past the shell stage. The guided workflow, local file pickers, workbook inspection, Word placeholder mapping, email editor, live preview, centralized preflight, generation orchestration, output review, starter templates, project save/open, and English/Greek UI structure are in place.

The remaining MVP work is stabilization:

- finish the packaged runtime story so a shipped Windows app does not depend on a user-managed Python install
- keep generator progress tied to real backend events
- harden PDF backend detection and packaging
- repair and expand desktop workflow tests
- polish performance and workflow friction in the existing pages

## MVP Scope

### In Scope

- local file-based workflow
- one workbook at a time
- one Word template at a time
- one email template per project
- English and Greek UI support
- DOCX output
- PDF output when a backend is available
- combined email-draft DOCX output
- project save/open
- output review inside the app

### Out Of Scope

- cloud sync
- user accounts
- team collaboration
- hosted database
- built-in email sending
- native `.eml` draft generation
- full Word template editing inside the app
- CRM, e-sign, or analytics integrations

## Workflow

The MVP workflow should stay four steps, with steps skipped only when their output type is disabled:

1. Project Setup
2. Field Mapping
3. Email Builder
4. Review And Generate

Project Setup answers the first important user question: "Did I load the correct files and rows?"

That means the setup page should keep showing:

- selected workbook, Word template, and output folder
- worksheet, header row, and first data row settings
- selected output types
- detected Word placeholders
- sample workbook rows
- starter template download actions

## Scorecard

### 1. Setup Confidence

Status: `Done`

Users can load source files, choose output options, inspect detected placeholders, and verify workbook sample rows before moving forward.

### 2. Explicit Mapping

Status: `Done`

Workbook variables, Word placeholders, and email tokens are visible. Required unmapped fields are surfaced before generation.

### 3. Safe Generation

Status: `Mostly done`

Generation is centralized behind preflight and now supports backend progress events. The remaining risk is release/runtime packaging, not the basic generation workflow.

### 4. Trustworthy Output Review

Status: `Done`

The success view shows generated counts, warnings, output folders, reports, combined email drafts, and a structured output tree.

### 5. Project Persistence

Status: `Done`

Saved projects restore setup paths, row settings, generation options, mappings, email template content, optional email-source settings, and current step.

### 6. Preflight Validation

Status: `Done`

Preflight checks output selection, runtime entrypoints, workbook access, Word template access, output folder writability, worksheet settings, mappings, required placeholders, and PDF capability.

### 7. Generation Orchestration

Status: `Mostly done`

`electron/main.ts` delegates to service modules. Payload building, preflight, generation, and progress parsing are centralized. Remaining work is packaging-grade runtime coverage and better failure-path tests.

### 8. Windows Packaging And Runtime

Status: `MVP blocker`

The app has platform-neutral runtime discovery concepts, but the release path still needs packaged generator services and validation on a clean Windows machine.

Acceptance criteria:

- packaged app does not require the user to install or manage Python
- Electron prefers packaged executables over repo scripts
- DOCX generation works on a clean Windows machine
- PDF generation works when an available backend is present
- DOCX generation still works when PDF conversion is unavailable
- temporary generation files are written into app-controlled locations
- runtime discovery can extend to Linux later without changing the service contract

### 9. i18n And Greek Support

Status: `Initial MVP done, copy cleanup needed`

The i18n structure and language persistence are in place. Some Greek strings in the source appear mojibaked and should be repaired before release.

### 10. Automated Verification

Status: `Partial`

Static checks matter, but desktop workflow coverage is still thin.

Acceptance criteria:

- `pnpm typecheck` passes
- `pnpm lint` passes
- desktop launch smoke test passes
- save/open project roundtrip has automated coverage
- setup preview flow has automated coverage
- generation happy path has automated coverage
- at least one failure-path generation test exists

## Page Review Notes

### Project Setup

Keep as the workflow anchor. It already has the right MVP controls. Improvements should stay focused on validation clarity, preview freshness, and avoiding stale workbook/template inspection results.

### Field Mapping

The page is MVP-appropriate. Keep the table and paragraph preview, but avoid adding a full Word editor. Useful improvements are faster reload feedback, clearer locked-template messaging, and focused empty states.

### Email Builder

This is the main renderer performance hot spot. Typing in the body updates shared workspace state, which can cause unrelated workbook mapping tables to rerender. The editor should keep live preview, but heavy panels should only refresh when their actual inputs change.

### Review And Generate

The review page is close to MVP-ready. Preflight should be slightly buffered so rapid edits do not trigger redundant backend validation calls, and every failed check should point back to the right page.

### Output Review

The success view is useful and should stay simple: counts, warnings, open folder/report/drafts actions, and a generated file tree. Do not expand into a document manager for MVP.

## Recommended Next Order

1. Keep typecheck, lint, and desktop launch green.
2. Finish the packaged runtime story for Windows without hardcoding Windows-only assumptions into service contracts.
3. Validate DOCX generation on a clean Windows machine.
4. Harden PDF backend detection and document the fallback behavior.
5. Expand end-to-end tests for save/open, setup preview, generation success, and generation failure.
6. Repair mojibaked Greek source strings before release.
7. Add reusable setup templates after runtime packaging is stable.

## Release Success Criteria

The MVP is successful if a non-technical user can:

- load their workbook and template files correctly
- understand what is mapped and what is missing
- use the app in English or Greek
- generate outputs without using the terminal
- recover from common mistakes without developer help
- resume a saved project without rebuilding the setup

## Short Takeaway

The product is no longer "build the shell."

The product is now:

"Stabilize the workflow, keep the bilingual UI coherent, and finish the packaging/runtime story."
