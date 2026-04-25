import { copyFile, readFile, writeFile } from 'node:fs/promises';
import type * as ElectronModule from 'electron';
import type { SavedProjectDocument, SaveStarterTemplateRequest } from '../../shared/desktop';
import { normalizeProjectDocument } from '../lib/projectDocument';
import { getStarterTemplatePath } from '../lib/runtimePaths';

type DialogDeps = {
  BrowserWindow: typeof ElectronModule.BrowserWindow;
  dialog: typeof ElectronModule.dialog;
  getMainWindow: () => InstanceType<typeof ElectronModule.BrowserWindow> | null;
};

function getActiveWindow({
  BrowserWindow,
  getMainWindow,
}: Pick<DialogDeps, 'BrowserWindow' | 'getMainWindow'>) {
  return getMainWindow() ?? BrowserWindow.getFocusedWindow() ?? undefined;
}

export async function pickPath(
  deps: DialogDeps,
  request: {
    defaultPath?: string;
    filters?: Electron.FileFilter[];
    mode: 'file' | 'directory';
    title: string;
  },
) {
  const properties: Electron.OpenDialogOptions['properties'] =
    request.mode === 'directory' ? ['openDirectory'] : ['openFile'];
  const activeWindow = getActiveWindow(deps);
  const options = {
    defaultPath: request.defaultPath,
    filters: request.filters,
    properties,
    title: request.title,
  };
  const result = activeWindow
    ? await deps.dialog.showOpenDialog(activeWindow, options)
    : await deps.dialog.showOpenDialog(options);

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
}

export async function saveProjectDocument(deps: DialogDeps, project: SavedProjectDocument) {
  const activeWindow = getActiveWindow(deps);
  const options = {
    defaultPath: 'greeklit-project.json',
    filters: [{ extensions: ['json'], name: 'Greeklit Project' }],
    title: 'Save Project Setup',
  };
  const result = activeWindow
    ? await deps.dialog.showSaveDialog(activeWindow, options)
    : await deps.dialog.showSaveDialog(options);

  if (result.canceled || !result.filePath) {
    return null;
  }

  await writeFile(result.filePath, JSON.stringify(project, null, 2), 'utf8');
  return result.filePath;
}

export async function openProjectDocument(deps: DialogDeps) {
  const activeWindow = getActiveWindow(deps);
  const options: Electron.OpenDialogOptions = {
    filters: [{ extensions: ['json'], name: 'Greeklit Project' }],
    properties: ['openFile'],
    title: 'Open Project Setup',
  };
  const result = activeWindow
    ? await deps.dialog.showOpenDialog(activeWindow, options)
    : await deps.dialog.showOpenDialog(options);

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
    projectDocument: normalizeProjectDocument(JSON.parse(contents)),
  };
}

export async function saveStarterTemplate(
  deps: DialogDeps,
  request: SaveStarterTemplateRequest,
) {
  const sourcePath = getStarterTemplatePath(request.kind);
  const activeWindow = getActiveWindow(deps);
  const options = {
    defaultPath: {
      email: 'starter-email-template.txt',
      excel: 'starter-workbook.xlsx',
      word: 'starter-contract-template.docx',
    }[request.kind],
    filters: {
      email: [{ extensions: ['txt'], name: 'Text Template' }],
      excel: [{ extensions: ['xlsx'], name: 'Excel Workbook' }],
      word: [{ extensions: ['docx'], name: 'Word Template' }],
    }[request.kind],
    title: 'Save Starter Template',
  };
  const result = activeWindow
    ? await deps.dialog.showSaveDialog(activeWindow, options)
    : await deps.dialog.showSaveDialog(options);

  if (result.canceled || !result.filePath) {
    return null;
  }

  await copyFile(sourcePath, result.filePath);
  return result.filePath;
}
