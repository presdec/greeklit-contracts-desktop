import { readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type * as ElectronModule from 'electron';
import type {
  FileDialogRequest,
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
