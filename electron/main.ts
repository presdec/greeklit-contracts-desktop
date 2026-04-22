import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

import type * as ElectronModule from 'electron';
import type {
  FileDialogRequest,
  GenerateProjectRequest,
  GenerateProjectResult,
  InspectProjectRequest,
  InspectProjectResult,
  ProjectConfig,
} from '../shared/desktop';

const require = createRequire(import.meta.url);
const electron = require('electron') as typeof ElectronModule;
const { app, BrowserWindow, dialog, ipcMain } = electron;
const execFileAsync = promisify(execFile);

const __dirname = dirname(fileURLToPath(import.meta.url));

let mainWindow: InstanceType<typeof BrowserWindow> | null = null;

function getWorkspaceRoot() {
  return resolve(__dirname, '../../..');
}

function getPythonPath() {
  return join(app.getPath('home'), 'anaconda3', 'python.exe');
}

function getGeneratorScriptPath() {
  return resolve(getWorkspaceRoot(), 'generate_contracts.py');
}

function renderEmailTemplateText(request: GenerateProjectRequest) {
  return [
    `Subject: ${request.emailTemplate.subject}`,
    `To: ${request.emailTemplate.to}`,
    `Cc: ${request.emailTemplate.cc}`,
    '',
    request.emailTemplate.body,
  ].join('\n');
}

function parseCount(stdout: string, label: string) {
  const match = stdout.match(new RegExp(`${label}\\s+(\\d+)`));
  return match ? Number(match[1]) : 0;
}

function parsePathLine(stdout: string, prefix: string) {
  const line = stdout
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  if (!line) {
    return '';
  }

  return line.slice(prefix.length).trim();
}

function resolveWorkspacePath(pathValue?: string) {
  if (!pathValue) {
    return undefined;
  }

  return isAbsolute(pathValue) ? pathValue : resolve(getWorkspaceRoot(), pathValue);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1120,
    minHeight: 760,
    backgroundColor: '#f5efe4',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.cjs'),
    },
  });

  mainWindow.webContents.on(
    'console-message',
    (
      _event: Electron.Event,
      level: number,
      message: string,
      line: number,
      sourceId: string,
    ) => {
      console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
    },
  );

  mainWindow.webContents.on(
    'did-fail-load',
    (
      _event: Electron.Event,
      errorCode: number,
      errorDescription: string,
      validatedURL: string,
    ) => {
      console.error(
        `Renderer failed to load: ${errorCode} ${errorDescription} (${validatedURL})`,
      );
    },
  );

  mainWindow.webContents.on(
    'render-process-gone',
    (_event: Electron.Event, details: Electron.RenderProcessGoneDetails) => {
      console.error(`Renderer process gone: ${details.reason}`);
    },
  );

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Renderer finished load');
  });

  mainWindow.webContents.openDevTools({ mode: 'detach' });

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

ipcMain.handle(
  'desktop-app:pick-path',
  async (_event, request: FileDialogRequest) => {
    const properties: Electron.OpenDialogOptions['properties'] =
      request.mode === 'directory' ? ['openDirectory'] : ['openFile'];
    const browserWindow = mainWindow ?? BrowserWindow.getFocusedWindow() ?? undefined;

    const result = browserWindow
      ? await dialog.showOpenDialog(browserWindow, {
          defaultPath: request.defaultPath,
          filters: request.filters,
          properties,
          title: request.title,
        })
      : await dialog.showOpenDialog({
          defaultPath: request.defaultPath,
          filters: request.filters,
          properties,
          title: request.title,
        });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  },
);

ipcMain.handle('desktop-app:save-project', async (_event, project: ProjectConfig) => {
  const browserWindow = mainWindow ?? BrowserWindow.getFocusedWindow() ?? undefined;

  const result = browserWindow
    ? await dialog.showSaveDialog(browserWindow, {
        defaultPath: 'greeklit-project.json',
        filters: [
          {
            extensions: ['json'],
            name: 'Greeklit Project',
          },
        ],
        title: 'Save Project Setup',
      })
    : await dialog.showSaveDialog({
        defaultPath: 'greeklit-project.json',
        filters: [
          {
            extensions: ['json'],
            name: 'Greeklit Project',
          },
        ],
        title: 'Save Project Setup',
      });

  if (result.canceled || !result.filePath) {
    return null;
  }

  await writeFile(result.filePath, JSON.stringify(project, null, 2), 'utf8');
  return result.filePath;
});

ipcMain.handle('desktop-app:open-project', async () => {
  const browserWindow = mainWindow ?? BrowserWindow.getFocusedWindow() ?? undefined;

  const result = browserWindow
    ? await dialog.showOpenDialog(browserWindow, {
        filters: [
          {
            extensions: ['json'],
            name: 'Greeklit Project',
          },
        ],
        properties: ['openFile'],
        title: 'Open Project Setup',
      })
    : await dialog.showOpenDialog({
        filters: [
          {
            extensions: ['json'],
            name: 'Greeklit Project',
          },
        ],
        properties: ['openFile'],
        title: 'Open Project Setup',
      });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];

  if (!filePath) {
    return null;
  }

  const contents = await readFile(filePath, 'utf8');

  return {
    filePath,
    project: JSON.parse(contents) as ProjectConfig,
  };
});

ipcMain.handle(
  'desktop-app:inspect-project',
  async (_event, request: InspectProjectRequest) => {
    const scriptPath = join(__dirname, '../../scripts/inspect_project.py');
    const pythonPath = getPythonPath();
    const payload = JSON.stringify({
      ...request,
      contractTemplatePath: resolveWorkspacePath(request.contractTemplatePath),
      workbookPath: resolveWorkspacePath(request.workbookPath),
    });
    const { stdout } = await execFileAsync(pythonPath, [scriptPath, payload], {
      cwd: getWorkspaceRoot(),
      windowsHide: true,
    });

    return JSON.parse(stdout) as InspectProjectResult;
  },
);

ipcMain.handle(
  'desktop-app:generate-project',
  async (_event, request: GenerateProjectRequest) => {
    if (!request.generationOptions.generateDocx && !request.generationOptions.generatePdf) {
      throw new Error('Choose at least one output format before generation.');
    }

    const mappedEntries = Object.entries(request.tokenMappings)
      .map(([token, variable]) => {
        const column = variable ? request.variableColumns[variable] : '';
        return {
          column,
          token,
        };
      })
      .filter((entry) => entry.column);

    if (mappedEntries.length === 0) {
      throw new Error('No contract mappings were provided. Map at least one DOCX token before generation.');
    }

    const workspaceRoot = getWorkspaceRoot();
    const generatorScriptPath = getGeneratorScriptPath();
    const pythonPath = getPythonPath();
    const temporaryDir = await mkdtemp(join(tmpdir(), 'greeklit-run-'));
    const mappingPath = join(temporaryDir, 'field_mapping.txt');
    const emailTemplatePath = join(temporaryDir, 'email_template.txt');
    const configPath = join(temporaryDir, 'generator_config.json');
    const outputDir = resolveWorkspacePath(request.project.outputFolderPath);
    const workbookPath = resolveWorkspacePath(request.project.workbookPath);
    const contractTemplatePath = resolveWorkspacePath(request.project.contractTemplatePath);

    if (!existsSync(generatorScriptPath)) {
      throw new Error(`Generator script was not found at ${generatorScriptPath}.`);
    }

    if (!outputDir || !workbookPath || !contractTemplatePath) {
      throw new Error('Workbook, contract template, and output folder are required before generation.');
    }

    const convertToPdf = request.generationOptions.generatePdf;
    const keepDocxOutput = request.generationOptions.generateDocx;
    const mappingContents = mappedEntries
      .map((entry) => `${entry.token}=${entry.column}`)
      .join('\n');

    const config = {
      attach_contract_to_eml: true,
      combined_email_filename: 'email_drafts.txt',
      contract_output_subdir: 'contracts',
      contract_template_path: contractTemplatePath,
      convert_to_pdf: convertToPdf,
      data_start_row: request.project.dataStartRow,
      date_format: '%Y-%m-%d',
      email_output_subdir: 'emails',
      email_template_path: emailTemplatePath,
      filename_pattern: '{{APPLICATION_CODE}} - {{TITLE}} - {{LANGUAGE}}',
      header_row: request.project.headerRow,
      keep_docx_output: keepDocxOutput,
      libreoffice_path: 'C:/Program Files/LibreOffice/program/soffice.exe',
      mapping_path: mappingPath,
      output_dir: outputDir,
      pdf_conversion_workers: 4,
      pdf_output_subdir: 'contracts_pdf',
      report_filename: 'generation_report.txt',
      row_identity_placeholders: ['ID'],
      skip_if_column_contains: {
        AI: ['απορρι', 'reject'],
      },
      skip_if_row_fill_colors: ['FFFCB3B3'],
      workbook_path: workbookPath,
      worksheet_name: request.project.worksheetName,
    };

    try {
      await writeFile(mappingPath, `${mappingContents}\n`, 'utf8');
      await writeFile(emailTemplatePath, renderEmailTemplateText(request), 'utf8');
      await writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');

      const { stderr, stdout } = await execFileAsync(
        pythonPath,
        [generatorScriptPath, '--config', configPath],
        {
          cwd: workspaceRoot,
          windowsHide: true,
        },
      );

      const result: GenerateProjectResult = {
        combinedEmailPath:
          parsePathLine(stdout, 'Combined email drafts file:') || join(outputDir, 'email_drafts.txt'),
        contractsDir:
          parsePathLine(stdout, 'Contract DOCX directory:') || join(outputDir, 'contracts'),
        generatedCount: parseCount(stdout, 'Generated'),
        outputDir,
        pdfDir:
          parsePathLine(stdout, 'Contract PDF directory:') || join(outputDir, 'contracts_pdf'),
        reportPath: parsePathLine(stdout, 'Report:') || join(outputDir, 'generation_report.txt'),
        skippedCount: parseCount(stdout, 'Skipped'),
        stderr,
        stdout,
        warnings: stdout
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.startsWith('Warning:')),
      };

      return result;
    } finally {
      await rm(temporaryDir, { force: true, recursive: true });
    }
  },
);

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
