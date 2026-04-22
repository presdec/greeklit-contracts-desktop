# Vite + Electron MVP Plan

## Product framing

The strongest first version is not a generic "document automation platform". It is a focused desktop tool for operations/admin users who already work in Excel and Word and need to generate contracts plus ready-to-send emails quickly and safely.

## Core user promise

"Load your spreadsheet and template files, check the field mappings, and generate all contracts, PDFs, and email drafts from one guided desktop workflow."

## Why desktop first

- Matches the current local/private workflow
- Avoids early SaaS complexity: auth, storage, multi-tenancy, billing
- Lets us reuse the current Python generator with minimal risk
- Better fit for users handling sensitive contract and payment data

## Chosen stack

- `Electron`
- `Vite`
- `React`
- `TypeScript` `5.9.2`
- `Mantine`
- `TanStack Router`
- `Sentry` after internal alpha
- existing `Python` generator

Tooling baseline:

- Node `24.15.0` LTS via `.nvmrc`
- `pnpm` `10.15.1`
- `engine-strict=true`

For the first version, do not build around:

- `TanStack Start`
- `Clerk`
- `Neon`
- `Supabase`
- `Resend`
- `Recharts`

Those can be revisited once the app clearly needs hosted features or analytics.

## Architecture plan

### Phase 1: Wrap the existing script

- Keep `generate_contracts.py` as the generation engine
- Add a thin Electron main-process service that handles file pickers, project config save/load, Python invocation, and progress/log streaming
- Use a preload bridge so the frontend never gets unrestricted Node access

### Phase 2: Move from script-shaped config to app-shaped config

- Replace manual editing of `generator_config.json`, `field_mapping.txt`, and `email_template.txt` with forms in the UI
- Save a per-project app config in a structured JSON format
- Generate the legacy config files behind the scenes while the Python engine remains unchanged

### Phase 3: Extract shared business logic

- Move validation and placeholder inspection into reusable modules
- Decide later whether to keep Python as the long-term engine or port parts of the workflow into Node if packaging and maintenance justify it

## Desktop app flow

The first-run experience should be a guided 5-step wizard:

1. Choose workbook
2. Choose DOCX contract template
3. Choose email template
4. Review placeholder mappings
5. Generate outputs

After generation, show:

- total rows processed
- skipped rows with reasons
- generated contracts count
- generated PDFs count
- output folder shortcut
- report/log summary

## MVP features

These are the first features worth building because they remove the current friction without expanding scope too early.

### 1. Guided project setup

- Select workbook, DOCX template, and email template using file pickers
- Select output folder
- Save/reopen a project configuration
- Show clear file validity checks before generation starts

### 2. Placeholder detection and mapping UI

- Parse placeholders from DOCX and email template
- Show detected placeholders in one table
- Let the user map each placeholder to an Excel column
- Auto-suggest mappings from header names when possible
- Highlight unmapped or duplicate/problematic fields

### 3. Safe generation run

- One "Generate" action
- Progress indicator by row and by stage
- Cancel protection so partial output is clearly labeled if a run stops
- Run summary with warnings and skipped rows

### 4. Output review

- Open output folder from the app
- Show generated file groups for contracts, PDFs, email drafts, and the report

### 5. Simple settings

- date format
- filename pattern
- worksheet name
- header row
- data start row
- PDF conversion toggle

## Explicitly not MVP

These are tempting, but they should wait until people outside your wife's workflow are using the tool.

- cloud sync
- user accounts
- auth providers
- team collaboration
- online editor for DOCX templates
- built-in email sending
- hosted email delivery APIs
- CRM integrations
- e-sign integrations
- template marketplace
- multi-workbook batching
- analytics dashboard
- hosted database dependencies

## Ease-of-use priorities

The app should be friendlier than the script in very concrete ways.

### Priority A: Remove file-editing

Users should not touch raw config files, mapping text files, or command lines.

### Priority B: Prevent bad runs

Before generation starts, the app should block or clearly warn on:

- missing files
- invalid worksheet name
- missing placeholder mappings
- invalid output folder
- PDF conversion tool not available

### Priority C: Make errors understandable

Use plain-language messages like:

- "The template uses `{{AUTHOR}}`, but it is not mapped to an Excel column."
- "LibreOffice was not found, so PDF export is unavailable."
- "Row 17 was skipped because `EMAIL_TO` is empty."

### Priority D: Preserve trust

Show exactly where files are written, what was skipped, and why. For admin workflows, predictability matters more than visual polish.

## Suggested frontend structure

```text
app/
  electron/
    main.ts
    preload.ts
    pythonRunner.ts
  src/
    main.tsx
    App.tsx
    features/
      project/
      mapping/
      generation/
      settings/
    components/
      FilePickerField.tsx
      MappingTable.tsx
      RunSummary.tsx
      StepWizard.tsx
    lib/
      sentry.ts
      types.ts
      validation.ts
```

## Technical rollout

### Milestone 1: Working shell

- Initialize Vite React TypeScript app
- Add Mantine provider and base theme
- Add TanStack Router for app screens
- Add Electron main and preload process
- Launch desktop window in dev mode
- Add file picker bridge

### Milestone 2: Project setup UI

- Build the wizard shell
- Store selected paths and basic settings in app state
- Save/load project config

### Milestone 3: Mapping UI

- Detect placeholders from DOCX and email template
- Read worksheet headers
- Build manual mapping table
- Validate all required mappings

### Milestone 4: Generator integration

- Invoke the Python generator from Electron
- Stream logs/progress to UI
- Surface result summary and output folder link

### Milestone 5: Packaging

- Bundle Python runtime strategy
- Add Sentry for renderer and main process before external testing
- Build signed Windows installer first
- Test on a clean non-dev machine

## Packaging note

The biggest implementation risk is bundling Python plus PDF conversion dependencies cleanly for non-technical users. That is why the MVP should target:

- Windows first
- local installed Python allowed during internal alpha, if needed
- a later packaging pass once the workflow is validated

## Success criteria for MVP

The MVP is successful if a non-technical user can:

- create a project without editing text files
- understand missing mappings immediately
- run generation without touching a terminal
- recover from common mistakes on their own

## Recommended first build order

1. Vite + Electron shell
2. File pickers and project save/load
3. Placeholder/mapping screen
4. Python generator runner
5. Run summary and output explorer

## What Could Be Improved Next (Priority Order)

1. Complete end-to-end generation from the desktop UI

- Wire one Generate action from renderer to Electron to Python.
- Stream plain progress and logs per stage so users can trust the run.
- Return a clear summary with processed rows, skipped rows, and output counts.

2. Add preflight checks that block bad runs

- Validate selected files, worksheet, header/data rows, and output folder before run.
- Warn or block when required placeholders are unmapped.
- If PDF is enabled, check conversion capability before starting.

3. Package Python and libraries cleanly for distribution (no backend required)

- Keep Python local-first for MVP.
- Freeze helper scripts into Windows executables (for example, with PyInstaller) and bundle them in Electron resources.
- Version-lock Python dependencies and build per target architecture.
- Keep backend out of scope unless the product needs accounts, sync, collaboration, or hosted processing.

4. Persist full project state, not just setup paths

- Save/reopen mappings, generation options, and email template content in app-shaped project config.
- Keep legacy text config generation behind the scenes while Python remains the execution engine.

5. Add output review and recovery tools

- Open output folder from the app.
- Show generated files grouped by type and skipped rows with reasons.
- Make partial runs clearly labeled when interrupted.

6. Prepare packaging and release readiness

- Add Sentry in renderer and main process before broader testing.
- Produce signed Windows installer and test on a clean non-dev machine.
- Verify startup diagnostics for missing local dependencies.

## Implementation Plan

### Phase A: Generator path to green (1-2 days)

1. Add `generate` IPC contract and handler in Electron main.
2. Convert current in-memory UI state into generator payload/config.
3. Execute generator process and return structured run result.

Exit criteria:

- A non-technical user can click Generate and receive contracts/PDFs/emails without terminal use.

### Phase B: Safety and clarity (1-2 days)

1. Implement preflight validator and user-facing error messages.
2. Add progress UI (row and stage), cancel protection messaging, and run logs.
3. Add run summary panel with skipped reasons and counts.

Exit criteria:

- Users understand why a run is blocked or why rows were skipped.

### Phase C: Python packaging strategy (2-4 days)

1. Choose distribution mode for internal alpha:

- Option A (fastest): require local Python with robust detection.
- Option B (better UX): bundle frozen Python executables in app resources.

2. Lock dependencies and create reproducible Windows build script.
3. Add runtime capability checks (Python runtime and PDF conversion tooling).

Exit criteria:

- Installer works on a clean machine with predictable runtime behavior.

### Phase D: Project persistence and output UX (1-2 days)

1. Extend project config model to include mappings/template/output options.
2. Implement output explorer links and grouped file review.
3. Confirm save/open roundtrip restores the full working state.

Exit criteria:

- Users can stop and resume projects without redoing setup and mapping.

### Phase E: Release hardening (1-2 days)

1. Add Sentry in both processes.
2. Smoke-test critical flows on clean Windows machine.
3. Create release checklist for signing and internal rollout.

Exit criteria:

- Internal alpha can be installed and used without developer intervention.

## Short product takeaway

Do not widen scope yet. The winning first version is a calm, reliable desktop assistant for one repetitive admin workflow, not a full online document platform.
