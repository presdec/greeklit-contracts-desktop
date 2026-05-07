import type * as ElectronModule from 'electron';
import type {
  DesktopCapabilities,
  FileDialogRequest,
  GenerateProjectProgress,
  GenerateProjectRequest,
  GenerateProjectResult,
  InspectProjectRequest,
  InspectProjectResult,
  MenuAction,
  OpenPathRequest,
  ProjectPreflightResult,
  ProjectOpenResult,
  SavedProjectDocument,
  SaveStarterTemplateRequest,
  TemplateStatusRequest,
  TemplateStatusResult,
} from '../shared/desktop';

// Sandboxed preload scripts need plain CommonJS require semantics.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const electron = require('electron') as typeof ElectronModule;
const { contextBridge, ipcRenderer } = electron;

contextBridge.exposeInMainWorld('desktopApp', {
  generateProject: (request: GenerateProjectRequest) =>
    ipcRenderer.invoke('desktop-app:generate-project', request) as Promise<GenerateProjectResult>,
  getCapabilities: () =>
    ipcRenderer.invoke('desktop-app:get-capabilities') as Promise<DesktopCapabilities>,
  onGenerationProgress: (listener: (progress: GenerateProjectProgress) => void) => {
    const handler = (_event: ElectronModule.IpcRendererEvent, progress: GenerateProjectProgress) => {
      listener(progress);
    };
    ipcRenderer.on('desktop-app:generation-progress', handler);
    return () => {
      ipcRenderer.removeListener('desktop-app:generation-progress', handler);
    };
  },
  validateProject: (request: GenerateProjectRequest) =>
    ipcRenderer.invoke('desktop-app:validate-project', request) as Promise<ProjectPreflightResult>,
  getTemplateStatus: (request: TemplateStatusRequest) =>
    ipcRenderer.invoke('desktop-app:get-template-status', request) as Promise<TemplateStatusResult>,
  inspectProject: (request: InspectProjectRequest) =>
    ipcRenderer.invoke('desktop-app:inspect-project', request) as Promise<InspectProjectResult>,
  onMenuAction: (listener: (action: MenuAction) => void) => {
    const handler = (_event: ElectronModule.IpcRendererEvent, action: MenuAction) => {
      listener(action);
    };
    ipcRenderer.on('desktop-app:menu-action', handler);
    return () => {
      ipcRenderer.removeListener('desktop-app:menu-action', handler);
    };
  },
  openPath: (request: OpenPathRequest) =>
    ipcRenderer.invoke('desktop-app:open-path', request) as Promise<null | string>,
  openProject: () =>
    ipcRenderer.invoke('desktop-app:open-project') as Promise<ProjectOpenResult | null>,
  pickPath: (request: FileDialogRequest) =>
    ipcRenderer.invoke('desktop-app:pick-path', request) as Promise<string | null>,
  platform: process.platform,
  saveStarterTemplate: (request: SaveStarterTemplateRequest) =>
    ipcRenderer.invoke('desktop-app:save-starter-template', request) as Promise<string | null>,
  saveProject: (project: SavedProjectDocument) =>
    ipcRenderer.invoke('desktop-app:save-project', project) as Promise<string | null>,
});
