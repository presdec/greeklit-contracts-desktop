export type FileDialogMode = 'file' | 'directory';

export type FileDialogRequest = {
  defaultPath?: string;
  filters?: Electron.FileFilter[];
  mode: FileDialogMode;
  title: string;
};

export type ProjectConfig = {
  workbookPath: string;
  contractTemplatePath: string;
  emailTemplatePath: string;
  outputFolderPath: string;
  worksheetName: string;
  headerRow: number;
  dataStartRow: number;
};

export type ProjectOpenResult = {
  filePath: string;
  project: ProjectConfig;
};

export type InspectProjectRequest = {
  contractTemplatePath?: string;
  dataStartRow: number;
  headerRow: number;
  workbookPath: string;
  worksheetName: string;
};

export type WorkbookPreviewColumn = {
  columnLetter: string;
  header: string;
  sampleValue: string;
  suggestedVariable: string | null;
};

export type WorkbookPreviewSampleRow = {
  rowNumber: number;
  values: Record<string, string>;
};

export type InspectProjectResult = {
  columns: WorkbookPreviewColumn[];
  contractTokenContexts: Record<string, string>;
  contractTokens: string[];
  dataStartRow: number;
  headerRow: number;
  sampleRows: WorkbookPreviewSampleRow[];
  worksheetName: string;
};
