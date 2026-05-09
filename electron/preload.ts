import type * as ElectronModule from 'electron';
import type {
  DesktopCapabilities,
  EmailTemplateInspectionRequest,
  EmailTemplateInspectionResult,
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
  RecentProjectEntry,
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
  cancelGeneration: () =>
    ipcRenderer.invoke('desktop-app:cancel-generation') as Promise<void>,
  generateProject: (request: GenerateProjectRequest) =>
    ipcRenderer.invoke('desktop-app:generate-project', request) as Promise<GenerateProjectResult>,
  getCapabilities: () =>
    ipcRenderer.invoke('desktop-app:get-capabilities') as Promise<DesktopCapabilities>,
  getRecentProjects: () =>
    ipcRenderer.invoke('desktop-app:get-recent-projects') as Promise<RecentProjectEntry[]>,
  inspectEmailTemplate: (request: EmailTemplateInspectionRequest) =>
    ipcRenderer.invoke('desktop-app:inspect-email-template', request) as Promise<EmailTemplateInspectionResult>,
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
  notifySaved: () => ipcRenderer.send('desktop-app:save-complete'),
  onMenuAction: (listener: (action: MenuAction) => void) => {
    const handler = (_event: ElectronModule.IpcRendererEvent, action: MenuAction) => {
      listener(action);
    };
    ipcRenderer.on('desktop-app:menu-action', handler);
    return () => {
      ipcRenderer.removeListener('desktop-app:menu-action', handler);
    };
  },
  onSaveRequested: (listener: () => void) => {
    const handler = () => listener();
    ipcRenderer.on('desktop-app:save-requested', handler);
    return () => {
      ipcRenderer.removeListener('desktop-app:save-requested', handler);
    };
  },
  syncDirty: (dirty: boolean) => ipcRenderer.send('desktop-app:sync-dirty', dirty),
  openPath: (request: OpenPathRequest) =>
    ipcRenderer.invoke('desktop-app:open-path', request) as Promise<null | string>,
  openProject: (filePath?: string | null) =>
    ipcRenderer.invoke('desktop-app:open-project', filePath) as Promise<ProjectOpenResult | null>,
  pickPath: (request: FileDialogRequest) =>
    ipcRenderer.invoke('desktop-app:pick-path', request) as Promise<string | null>,
  platform: process.platform,
  saveStarterTemplate: (request: SaveStarterTemplateRequest) =>
    ipcRenderer.invoke('desktop-app:save-starter-template', request) as Promise<string | null>,
  saveProject: (project: SavedProjectDocument, filePath?: string | null) =>
    ipcRenderer.invoke('desktop-app:save-project', project, filePath) as Promise<string | null>,
});
