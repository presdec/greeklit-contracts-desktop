export type FileDialogMode = 'file' | 'directory';

export type FileDialogRequest = {
  defaultPath?: string;
  filters?: Electron.FileFilter[];
  mode: FileDialogMode;
  title: string;
};

export type StarterTemplateKind = 'email' | 'excel' | 'word';

export type SaveStarterTemplateRequest = {
  kind: StarterTemplateKind;
};

export type MenuAction =
  | { filePath: string; type: 'open-recent-project' }
  | 'generate-project'
  | 'open-last-project'
  | 'open-contract-template'
  | 'open-project'
  | 'reload-template-fields'
  | 'save-project'
  | 'save-project-as';

export type ProjectConfig = {
  workbookPath: string;
  contractTemplatePath: string;
  emailTemplatePath: string;
  outputFilenamePattern: string;
  rejectionColumn: string;
  rejectionValue: string;
  useOptionalEmailSource: boolean;
  outputFolderPath: string;
  worksheetName: string;
  headerRow: number;
  dataStartRow: number;
};

export type ProjectOpenResult = {
  filePath: string;
  projectDocument: SavedProjectDocument;
};

export type RecentProjectEntry = {
  filePath: string;
  label: string;
};

export type DesktopCapabilities = {
  outlookMsgDrafts: boolean;
  pdfBackend: 'libreoffice' | 'none' | 'word';
  platform: NodeJS.Platform;
};

export type GenerationOptionsInput = {
  emailOutputMode: 'combined_docx' | 'separate_docx' | 'separate_eml' | 'separate_msg' | 'separate_msg_with_docx' | 'separate_msg_with_pdf';
  generateDocx: boolean;
  generateEmailDrafts: boolean;
  generatePdf: boolean;
};

export type EmailTemplateInput = {
  body: string;
  cc: string;
  subject: string;
  to: string;
};

export type EmailTemplateInspectionRequest = {
  templatePath?: string;
};

export type EmailTemplateInspectionResult = {
  content: string;
  exists: boolean;
  templatePath: string;
  variables: string[];
};

export type SavedProjectDocument = {
  activeStep?: number;
  emailTemplate: EmailTemplateInput;
  generationOptions: GenerationOptionsInput;
  project: ProjectConfig;
  tokenMappings: Record<string, string>;
  variableColumns: Record<string, string>;
  version: number;
};

export type GenerateProjectRequest = {
  emailTemplate: EmailTemplateInput;
  generationOptions: GenerationOptionsInput;
  project: ProjectConfig;
  tokenMappings: Record<string, string>;
  variableColumns: Record<string, string>;
};

export type GenerateProjectProgress = {
  docxCount?: number;
  emailDraftCount?: number;
  expectedDocxCount?: number;
  expectedEmailDraftCount?: number;
  expectedPdfCount?: number;
  generatedCount?: number;
  current: number;
  message: string;
  pdfCount?: number;
  percent?: number;
  rowsFound?: number;
  stage: string;
  skippedCount?: number;
  total: number;
};

export type ProjectPreflightCheck = {
  detail: string;
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warn';
};

export type ProjectPreflightResult = {
  canGenerate: boolean;
  checks: ProjectPreflightCheck[];
  errors: string[];
  pdfBackend: 'libreoffice' | 'none' | 'word';
  warnings: string[];
};

export type OutputTreeEntry = {
  absolutePath: string;
  kind: 'directory' | 'file';
  relativePath: string;
};

export type SkippedRowDetail = {
  reason: string;
  row: number;
};

export type GenerateProjectResult = {
  emailDraftsPath: string | null;
  contractsDir: string;
  createdEntries: OutputTreeEntry[];
  docxCount: number;
  emailDraftCount: number;
  generatedCount: number;
  outputDir: string;
  pdfCount: number;
  pdfDir: string;
  reportPath: string;
  rowsFound: number;
  skippedCount: number;
  skippedRowDetails: SkippedRowDetail[];
  stderr: string;
  stdout: string;
  warnings: string[];
};

export type OpenPathRequest = {
  targetPath: string;
};

export type InspectProjectRequest = {
  contractTemplatePath?: string;
  dataStartRow: number;
  headerRow: number;
  rejectionColumn?: string;
  rejectionValue?: string;
  workbookPath?: string;
  worksheetName?: string;
};

export type TemplateStatusRequest = {
  templatePath?: string;
};

export type TemplateStatusResult = {
  exists: boolean;
  isLocked: boolean;
  lastModifiedMs: number | null;
  templatePath: string;
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

export type WorkbookPreviewRawCell = {
  columnLetter: string;
  value: string;
};

export type WorkbookPreviewRawRow = {
  cells: WorkbookPreviewRawCell[];
  hasLeadingGap: boolean;
  populatedCells: number;
  role: 'data' | 'rejected-data' | 'selected-header' | 'suggested-header';
  rowNumber: number;
};

export type WorkbookHeaderAnalysis = {
  scannedRows: number;
  selectedHeaderCount: number;
  suggestedHeaderCount: number;
  suggestedHeaderRow: number | null;
};

export type InspectProjectResult = {
  columnValues: Record<string, string[]>;
  columns: WorkbookPreviewColumn[];
  contractTokenContexts: Record<string, string>;
  contractTokens: string[];
  dataStartRow: number;
  headerAnalysis: WorkbookHeaderAnalysis;
  headerRow: number;
  maxColumn: number;
  previewRows: WorkbookPreviewRawRow[];
  sampleRows: WorkbookPreviewSampleRow[];
  skippedRows: number;
  totalRows: number;
  worksheetName: string;
  worksheetNames: string[];
};
