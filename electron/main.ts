import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import type * as ElectronModule from 'electron';
import type {
  FileDialogRequest,
  GenerateProjectProgress,
  GenerateProjectRequest,
  InspectProjectRequest,
  OpenPathRequest,
  SavedProjectDocument,
  SaveStarterTemplateRequest,
  TemplateStatusRequest,
} from '../shared/desktop';
import { generateProject, inspectProjectInternal, runProjectPreflight } from './services/generation';
import {
  openProjectDocument,
  pickPath,
  saveProjectDocument,
  saveStarterTemplate,
} from './services/projectFiles';
import { getTemplateStatus } from './services/templateStatus';

// Electron main is built as CommonJS so runtime module resolution stays stable.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const electron = require('electron') as typeof ElectronModule;
const { app, BrowserWindow, dialog, ipcMain, shell } = electron;
const __dirname = dirname(fileURLToPath(import.meta.url));

let mainWindow: InstanceType<typeof BrowserWindow> | null = null;

function createWindow() {
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

function registerIpcHandlers() {
  const dialogDeps = {
    BrowserWindow,
    dialog,
    getMainWindow: () => mainWindow,
  };

  ipcMain.handle('desktop-app:pick-path', async (_event, request: FileDialogRequest) =>
    pickPath(dialogDeps, request),
  );

  ipcMain.handle('desktop-app:save-project', async (_event, project: SavedProjectDocument) =>
    saveProjectDocument(dialogDeps, project),
  );

  ipcMain.handle(
    'desktop-app:save-starter-template',
    async (_event, request: SaveStarterTemplateRequest) => saveStarterTemplate(dialogDeps, request),
  );

  ipcMain.handle('desktop-app:open-project', async () => openProjectDocument(dialogDeps));

  ipcMain.handle(
    'desktop-app:get-template-status',
    async (_event, request: TemplateStatusRequest) => getTemplateStatus(request),
  );

  ipcMain.handle(
    'desktop-app:inspect-project',
    async (_event, request: InspectProjectRequest) => inspectProjectInternal(app.getPath('home'), request),
  );

  ipcMain.handle(
    'desktop-app:validate-project',
    async (_event, request: GenerateProjectRequest) => runProjectPreflight(app.getPath('home'), request),
  );

  ipcMain.handle(
    'desktop-app:generate-project',
    async (event, request: GenerateProjectRequest) => generateProject(
      app.getPath('home'),
      request,
      (progress: GenerateProjectProgress) => {
        event.sender.send('desktop-app:generation-progress', progress);
      },
    ),
  );

  ipcMain.handle('desktop-app:open-path', async (_event, request: OpenPathRequest) => {
    if (!request.targetPath) {
      return 'Path is required.';
    }

    const openError = await shell.openPath(request.targetPath);
    return openError || null;
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
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
