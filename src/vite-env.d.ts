/// <reference types="vite/client" />

import type {
  FileDialogRequest,
  GenerateProjectRequest,
  GenerateProjectResult,
  InspectProjectRequest,
  InspectProjectResult,
  ProjectConfig,
  ProjectOpenResult,
} from '../shared/desktop';

declare global {
  interface Window {
    desktopApp: {
      generateProject: (request: GenerateProjectRequest) => Promise<GenerateProjectResult>;
      inspectProject: (request: InspectProjectRequest) => Promise<InspectProjectResult>;
      openProject: () => Promise<ProjectOpenResult | null>;
      pickPath: (request: FileDialogRequest) => Promise<string | null>;
      platform: string;
      saveProject: (project: ProjectConfig) => Promise<string | null>;
    };
  }
}

export {};
