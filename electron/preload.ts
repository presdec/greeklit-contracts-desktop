import type * as ElectronModule from 'electron';
import type {
  FileDialogRequest,
  InspectProjectRequest,
  InspectProjectResult,
  ProjectConfig,
  ProjectOpenResult,
} from '../shared/desktop';

// Sandboxed preload scripts need plain CommonJS require semantics.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const electron = require('electron') as typeof ElectronModule;
const { contextBridge, ipcRenderer } = electron;

contextBridge.exposeInMainWorld('desktopApp', {
  inspectProject: (request: InspectProjectRequest) =>
    ipcRenderer.invoke('desktop-app:inspect-project', request) as Promise<InspectProjectResult>,
  openProject: () =>
    ipcRenderer.invoke('desktop-app:open-project') as Promise<ProjectOpenResult | null>,
  pickPath: (request: FileDialogRequest) =>
    ipcRenderer.invoke('desktop-app:pick-path', request) as Promise<string | null>,
  platform: process.platform,
  saveProject: (project: ProjectConfig) =>
    ipcRenderer.invoke('desktop-app:save-project', project) as Promise<string | null>,
});
