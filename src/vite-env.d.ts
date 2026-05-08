/// <reference types="vite/client" />

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
  SavedProjectDocument,
  SaveStarterTemplateRequest,
  RecentProjectEntry,
  TemplateStatusRequest,
  TemplateStatusResult,
} from '../shared/desktop';

declare global {
  interface Window {
    desktopApp: {
      generateProject: (request: GenerateProjectRequest) => Promise<GenerateProjectResult>;
      getCapabilities: () => Promise<DesktopCapabilities>;
      getRecentProjects: () => Promise<RecentProjectEntry[]>;
      inspectEmailTemplate: (request: EmailTemplateInspectionRequest) => Promise<EmailTemplateInspectionResult>;
      onGenerationProgress: (
        listener: (progress: GenerateProjectProgress) => void,
      ) => () => void;
      validateProject: (request: GenerateProjectRequest) => Promise<ProjectPreflightResult>;
      getTemplateStatus: (request: TemplateStatusRequest) => Promise<TemplateStatusResult>;
      inspectProject: (request: InspectProjectRequest) => Promise<InspectProjectResult>;
      onMenuAction: (listener: (action: MenuAction) => void) => () => void;
      openPath: (request: OpenPathRequest) => Promise<null | string>;
      openProject: (filePath?: string | null) => Promise<ProjectOpenResult | null>;
      pickPath: (request: FileDialogRequest) => Promise<string | null>;
      platform: string;
      saveStarterTemplate: (request: SaveStarterTemplateRequest) => Promise<string | null>;
      saveProject: (project: SavedProjectDocument, filePath?: string | null) => Promise<string | null>;
    };
  }
}

export {};
