import type { ProjectConfig } from '../../shared/desktop';
import type { EmailTemplateState, GenerationOptions, WizardStep } from '../types/template';

export const wizardSteps: WizardStep[] = [
  {
    id: 1,
    title: 'Project Setup',
    description: 'Choose the workbook, contract template, and output path.',
  },
  {
    id: 2,
    title: 'Contract Mapping',
    description: 'Map DOCX placeholders to workbook variables and choose output format.',
  },
  {
    id: 3,
    title: 'Email Builder',
    description: 'Compose the email template with click-to-insert workbook fields.',
  },
  {
    id: 4,
    title: 'Review And Generate',
    description: 'Check the preview, warnings, and final generation summary.',
  },
];

export const initialProject: ProjectConfig = {
  workbookPath: 'input/GLF-GR-EN-8th (1).xlsx',
  contractTemplatePath: 'Files/FULL OLD.docx',
  emailTemplatePath: 'Built in app',
  outputFolderPath: 'output/',
  worksheetName: '8TH PERIOD',
  headerRow: 2,
  dataStartRow: 3,
};

export const initialEmailTemplate: EmailTemplateState = {
  subject:
    'GreekLit | 8th Period Full Grant | {{APPLICATION_CODE}} | {{TITLE}} | {{AUTHOR}}',
  to: '{{EMAIL_TO}}',
  cc: '{{EMAIL_CC}}',
  body: `Dear {{PUBLISHER}},

Please find attached a copy of your Contract.

Please complete the required details directly in the attached editable PDF and return the signed Contract within one (1) week.

Please reply directly to this email and keep the same subject line, including your application code and the grant period.

Together with the signed Contract, please also send the official invoice for {{FIRST_INSTALLMENT}} EUR and the supporting bank document.

Best regards,

The GreekLit Team`,
};

export const canonicalVariables = [
  'APPLICATION_CODE',
  'ID',
  'TITLE',
  'AUTHOR',
  'LANGUAGE',
  'EMAIL_TO',
  'EMAIL_CC',
  'PUBLISHER',
  'AMOUNT',
  'FIRST_INSTALLMENT',
];

export const defaultGenerationOptions: GenerationOptions = {
  generateDocx: true,
  generatePdf: true,
};
