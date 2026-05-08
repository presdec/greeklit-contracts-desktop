import { basename, join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import type * as ElectronModule from 'electron';
import type {
  DesktopCapabilities,
  EmailTemplateInspectionRequest,
  FileDialogRequest,
  GenerateProjectProgress,
  GenerateProjectRequest,
  InspectProjectRequest,
  MenuAction,
  OpenPathRequest,
  RecentProjectEntry,
  SavedProjectDocument,
  SaveStarterTemplateRequest,
  TemplateStatusRequest,
} from '../shared/desktop';
import {
  checkOutlookInstalledCapability,
  checkWordPdfCapability,
  generateProject,
  hasLibreOfficePdfCapability,
  inspectProjectInternal,
  runProjectPreflight,
} from './services/generation';
import {
  openProjectDocument,
  pickPath,
  inspectEmailTemplate,
  saveProjectDocument,
  saveStarterTemplate,
} from './services/projectFiles';
import { getTemplateStatus } from './services/templateStatus';
import type { RuntimeEnvironment } from './lib/runtimePaths';
import { resolveRuntime } from './lib/runtimePaths';

// Electron main is built as CommonJS so runtime module resolution stays stable.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const electron = require('electron') as typeof ElectronModule;
const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = electron;
const __dirname = dirname(fileURLToPath(import.meta.url));

let mainWindow: InstanceType<typeof BrowserWindow> | null = null;
const maxRecentProjects = 8;

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('ozone-platform-hint', 'auto');

  // AppImage mounts the bundled chrome-sandbox from a temporary filesystem,
  // so the setuid helper cannot be configured correctly on many Linux systems.
  // Falling back to Chromium's no-sandbox mode avoids a hard startup crash.
  if (process.env.APPIMAGE) {
    app.commandLine.appendSwitch('no-sandbox');
  }
}

function getRuntimeEnvironment(): RuntimeEnvironment {
  return {
    appDataPath: app.getPath('userData'),
    homePath: app.getPath('home'),
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    tempPath: app.getPath('temp'),
  };
}

function sendMenuAction(action: MenuAction) {
  const targetWindow = mainWindow ?? BrowserWindow.getFocusedWindow();
  targetWindow?.webContents.send('desktop-app:menu-action', action);
}

function recentProjectsPath() {
  return join(app.getPath('userData'), 'recent-projects.json');
}

function readRecentProjectPaths() {
  try {
    const parsed = JSON.parse(readFileSync(recentProjectsPath(), 'utf8')) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  } catch {
    return [];
  }
}

function recentProjectEntries(): RecentProjectEntry[] {
  return readRecentProjectPaths().map((filePath) => ({
    filePath,
    label: basename(filePath),
  }));
}

function writeRecentProjectPaths(filePaths: string[]) {
  mkdirSync(app.getPath('userData'), { recursive: true });
  writeFileSync(recentProjectsPath(), JSON.stringify(filePaths.slice(0, maxRecentProjects), null, 2), 'utf8');
}

function rememberRecentProject(filePath: string) {
  const normalizedPath = filePath.trim();
  if (!normalizedPath) {
    return;
  }

  const nextPaths = [
    normalizedPath,
    ...readRecentProjectPaths().filter((currentPath) => currentPath !== normalizedPath),
  ];
  writeRecentProjectPaths(nextPaths);
  buildApplicationMenu();
}

function clearRecentProjects() {
  writeRecentProjectPaths([]);
  buildApplicationMenu();
}

function buildRecentProjectsMenu(): ElectronModule.MenuItemConstructorOptions[] {
  const recentProjects = recentProjectEntries();
  if (recentProjects.length === 0) {
    return [{ enabled: false, label: 'No Recent Projects' }];
  }

  return [
    ...recentProjects.map((project) => ({
      click: () => sendMenuAction({ filePath: project.filePath, type: 'open-recent-project' }),
      label: project.label,
      toolTip: project.filePath,
    })),
    { type: 'separator' as const },
    {
      click: clearRecentProjects,
      label: 'Clear Recent Projects',
    },
  ];
}

function buildApplicationMenu() {
  const isMac = process.platform === 'darwin';
  const macAppMenu: ElectronModule.MenuItemConstructorOptions[] = isMac
    ? [{
          label: app.name,
          submenu: [
            { role: 'about' as const },
            { type: 'separator' },
            { role: 'services' as const },
            { type: 'separator' },
            { role: 'hide' as const },
            { role: 'hideOthers' as const },
            { role: 'unhide' as const },
            { type: 'separator' },
            { role: 'quit' as const },
          ],
        }]
    : [];
  const template: ElectronModule.MenuItemConstructorOptions[] = [
    ...macAppMenu,
    {
      label: 'File',
      submenu: [
        {
          accelerator: 'CmdOrCtrl+O',
          click: () => sendMenuAction('open-project'),
          label: 'Open Project',
        },
        {
          accelerator: 'F9',
          click: () => {
            const [filePath] = readRecentProjectPaths();
            if (filePath) {
              sendMenuAction({ filePath, type: 'open-recent-project' });
              return;
            }

            sendMenuAction('open-last-project');
          },
          label: 'Open Last Project',
        },
        {
          label: 'Open Recent',
          submenu: buildRecentProjectsMenu(),
        },
        { type: 'separator' },
        {
          accelerator: 'F5',
          click: () => sendMenuAction('save-project'),
          label: 'Save Project',
        },
        {
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => sendMenuAction('save-project-as'),
          label: 'Save Project As',
        },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },
    {
      label: 'Project',
      submenu: [
        {
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => sendMenuAction('open-contract-template'),
          label: 'Open Word Template',
        },
        {
          accelerator: 'CmdOrCtrl+R',
          click: () => sendMenuAction('reload-template-fields'),
          label: 'Reload Fields',
        },
        { type: 'separator' },
        {
          accelerator: 'CmdOrCtrl+Enter',
          click: () => sendMenuAction('generate-project'),
          label: 'Generate Now',
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' },
        { role: 'togglefullscreen' as const },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          click: () => {
            void shell.openExternal('https://github.com/presdec/docgen-studio-desktop/releases');
          },
          label: 'Releases',
        },
        {
          click: () => {
            void shell.openExternal('https://github.com/presdec/docgen-studio-desktop/issues/new/choose');
          },
          label: 'Report Issue',
        },
        {
          click: () => {
            void shell.openExternal('mailto:presdec+docgen@gmail.com');
          },
          label: 'Support',
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

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

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

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
    getRuntimeEnvironment,
    getMainWindow: () => mainWindow,
  };

  ipcMain.handle('desktop-app:pick-path', async (_event, request: FileDialogRequest) =>
    pickPath(dialogDeps, request),
  );

  ipcMain.handle('desktop-app:save-project', async (
    _event,
    project: SavedProjectDocument,
    filePath?: string | null,
  ) => {
    const savedPath = await saveProjectDocument(dialogDeps, project, filePath);
    if (savedPath) {
      rememberRecentProject(savedPath);
    }
    return savedPath;
  });

  ipcMain.handle(
    'desktop-app:save-starter-template',
    async (_event, request: SaveStarterTemplateRequest) => saveStarterTemplate(dialogDeps, request),
  );

  ipcMain.handle('desktop-app:open-project', async (_event, filePath?: string | null) => {
    const result = await openProjectDocument(dialogDeps, filePath);
    if (result) {
      rememberRecentProject(result.filePath);
    }
    return result;
  });

  ipcMain.handle('desktop-app:get-recent-projects', async () => recentProjectEntries());

  ipcMain.handle(
    'desktop-app:inspect-email-template',
    async (_event, request: EmailTemplateInspectionRequest) => inspectEmailTemplate(
      getRuntimeEnvironment(),
      request,
    ),
  );

  ipcMain.handle('desktop-app:get-capabilities', async (): Promise<DesktopCapabilities> => {
    const runtime = await resolveRuntime(getRuntimeEnvironment());
    const pdfBackend = hasLibreOfficePdfCapability(runtime)
      ? 'libreoffice'
      : await checkWordPdfCapability()
        ? 'word'
        : 'none';

    return {
      outlookMsgDrafts: await checkOutlookInstalledCapability(),
      pdfBackend,
      platform: process.platform,
    };
  });

  ipcMain.handle(
    'desktop-app:get-template-status',
    async (_event, request: TemplateStatusRequest) => getTemplateStatus(
      getRuntimeEnvironment(),
      request,
    ),
  );

  ipcMain.handle(
    'desktop-app:inspect-project',
    async (_event, request: InspectProjectRequest) => inspectProjectInternal(
      getRuntimeEnvironment(),
      request,
    ),
  );

  ipcMain.handle(
    'desktop-app:validate-project',
    async (_event, request: GenerateProjectRequest) => runProjectPreflight(
      getRuntimeEnvironment(),
      request,
    ),
  );

  ipcMain.handle(
    'desktop-app:generate-project',
    async (event, request: GenerateProjectRequest) => generateProject(
      getRuntimeEnvironment(),
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
  buildApplicationMenu();
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
