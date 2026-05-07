import type { ProjectConfig, SavedProjectDocument } from '../../shared/desktop';
import type { EmailTemplateState, GenerationOptions, WizardStep } from '../types/template';

export const wizardSteps: WizardStep[] = [
  {
    id: 1,
    title: 'Project Setup',
    description: 'Choose your workbook, Word template, and output folder.',
  },
  {
    id: 2,
    title: 'Field Mapping',
    description: 'Map Word placeholders to workbook variables and choose output format.',
  },
  {
    id: 3,
    title: 'Email Builder',
    description: 'Compose an email template with click-to-insert workbook fields.',
  },
  {
    id: 4,
    title: 'Review And Generate',
    description: 'Check preview and mapping coverage, then generate outputs.',
  },
];

export const initialProject: ProjectConfig = {
  workbookPath: '',
  contractTemplatePath: '',
  emailTemplatePath: '',
  outputFilenamePattern: '',
  rejectionColumn: '',
  rejectionValue: '',
  useOptionalEmailSource: false,
  outputFolderPath: '',
  worksheetName: '',
  headerRow: 1,
  dataStartRow: 2,
};

export const initialEmailTemplate: EmailTemplateState = {
  subject: '',
  to: '',
  cc: '',
  body: '',
};

export const defaultGenerationOptions: GenerationOptions = {
  emailOutputMode: 'combined_docx',
  generateDocx: true,
  generateEmailDrafts: true,
  generatePdf: true,
};

export const initialSavedProjectDocument: SavedProjectDocument = {
  activeStep: 1,
  emailTemplate: initialEmailTemplate,
  generationOptions: defaultGenerationOptions,
  project: initialProject,
  tokenMappings: {},
  variableColumns: {},
  version: 1,
};
