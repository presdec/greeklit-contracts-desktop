import type { ProjectConfig } from '../../../shared/desktop';
import type { GenerationOptions, WizardStepId } from '../../types/template';

export type WorkflowValidationIssueId =
  | 'contract-template'
  | 'email-template-file'
  | 'email-template-load'
  | 'outputs'
  | 'output-directory'
  | 'required-placeholders'
  | 'workbook';

export type WorkflowValidationIssue = {
  detail: string;
  id: WorkflowValidationIssueId;
  targetStep: WizardStepId;
};

export type WorkflowValidationCopy = {
  emailTemplateLoadError: (error: string) => string;
  emailTemplateRequired: string;
  mapRequiredFields: (wordFields: string[], emailFields: string[]) => string;
  outputRequired: string;
  outputsRequired: string;
  wordTemplateRequired: string;
  workbookRequired: string;
};

type BuildWorkflowValidationInput = {
  copy: WorkflowValidationCopy;
  externalEmailTemplateLoadError: string | null;
  generationOptions: GenerationOptions;
  project: ProjectConfig;
  unmappedContractTokens: string[];
  unmappedEmailVariables: string[];
};

export function stepForPreflightCheck(
  checkId: string,
  generationOptions: GenerationOptions,
): WizardStepId | null {
  if ([
    'outputs',
    'workbook',
    'output-directory',
    'worksheet',
    'pdf-backend',
    'python-runtime',
    'runtime-services',
    'payload',
    'outlook-msg',
    'email-template-file',
  ].includes(checkId)) {
    return 1;
  }

  if (checkId === 'contract-template') {
    return 1;
  }

  if (['mappings', 'required-placeholders'].includes(checkId)) {
    return generationOptions.generateDocx || generationOptions.generatePdf ? 2 : 3;
  }

  return null;
}

export function buildWorkflowValidation({
  copy,
  externalEmailTemplateLoadError,
  generationOptions,
  project,
  unmappedContractTokens,
  unmappedEmailVariables,
}: BuildWorkflowValidationInput) {
  const issues: WorkflowValidationIssue[] = [];
  const wantsDocumentOutput = generationOptions.generateDocx || generationOptions.generatePdf;
  const wantsEmailOutput = generationOptions.generateEmailDrafts;

  if (!generationOptions.generateDocx && !generationOptions.generatePdf && !generationOptions.generateEmailDrafts) {
    issues.push({
      detail: copy.outputsRequired,
      id: 'outputs',
      targetStep: 1,
    });
  }

  if (!project.workbookPath.trim()) {
    issues.push({
      detail: copy.workbookRequired,
      id: 'workbook',
      targetStep: 1,
    });
  }

  if (!project.outputFolderPath.trim()) {
    issues.push({
      detail: copy.outputRequired,
      id: 'output-directory',
      targetStep: 1,
    });
  }

  if (wantsDocumentOutput && !project.contractTemplatePath.trim()) {
    issues.push({
      detail: copy.wordTemplateRequired,
      id: 'contract-template',
      targetStep: 1,
    });
  }

  if (wantsEmailOutput && project.useOptionalEmailSource && !project.emailTemplatePath.trim()) {
    issues.push({
      detail: copy.emailTemplateRequired,
      id: 'email-template-file',
      targetStep: 1,
    });
  }

  if (wantsEmailOutput && project.useOptionalEmailSource && externalEmailTemplateLoadError) {
    issues.push({
      detail: copy.emailTemplateLoadError(externalEmailTemplateLoadError),
      id: 'email-template-load',
      targetStep: 1,
    });
  }

  if (unmappedContractTokens.length > 0 || (wantsEmailOutput && unmappedEmailVariables.length > 0)) {
    issues.push({
      detail: copy.mapRequiredFields(
        unmappedContractTokens,
        wantsEmailOutput ? unmappedEmailVariables : [],
      ),
      id: 'required-placeholders',
      targetStep: wantsDocumentOutput ? 2 : 3,
    });
  }

  return {
    canReview: issues.length === 0,
    firstIssueForStep: (step: WizardStepId) => issues.find((issue) => issue.targetStep === step) ?? null,
    firstIssueForStepBefore: (step: WizardStepId) =>
      issues.find((issue) => issue.targetStep < step) ?? null,
    issues,
    step3Issues: issues.filter((issue) => issue.targetStep === 2 || issue.targetStep === 3),
  };
}
