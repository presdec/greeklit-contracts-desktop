import { Alert, Checkbox, Group, Paper, Select, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import type { StarterTemplateKind } from '../../shared/desktop';
import type { ProjectConfig } from '../../shared/desktop';
import type { WorkflowValidationIssue } from '../features/workspace/workflowValidation';
import type { GenerationOptions } from '../types/template';
import { useI18n } from '../i18n';
import { FileField } from './FileField';

type Props = {
  activePicker: keyof ProjectConfig | null;
  generationOptions: GenerationOptions;
  isLoading: boolean;
  onClearPath: (
    field: keyof Pick<
      ProjectConfig,
      'workbookPath' | 'contractTemplatePath' | 'emailTemplatePath' | 'outputFolderPath'
    >,
  ) => void;
  onOpenEmailPreview: () => void;
  onOpenWorkbookSetup: () => void;
  onOpenWordPreview: () => void;
  outlookMsgDraftsAvailable: boolean;
  onPickPath: (
    field: keyof Pick<
      ProjectConfig,
      'workbookPath' | 'contractTemplatePath' | 'emailTemplatePath' | 'outputFolderPath'
    >,
  ) => void | Promise<string | null>;
  onSaveStarterTemplate: (kind: StarterTemplateKind) => void;
  project: ProjectConfig;
  setGenerationOption: <K extends keyof GenerationOptions>(
    key: K,
    value: GenerationOptions[K],
  ) => void;
  setProject: React.Dispatch<React.SetStateAction<ProjectConfig>>;
  summaries: {
    emailTemplate?: string;
    outputFolder?: string;
    workbook?: string;
    wordTemplate?: string;
  };
  validationIssues: WorkflowValidationIssue[];
};

export function ProjectSetupPanel({
  activePicker,
  generationOptions,
  isLoading,
  onClearPath,
  onOpenEmailPreview,
  onOpenWorkbookSetup,
  onOpenWordPreview,
  outlookMsgDraftsAvailable,
  onPickPath,
  onSaveStarterTemplate,
  project,
  setGenerationOption,
  setProject,
  summaries,
  validationIssues,
}: Props) {
  const { copy } = useI18n();
  const wantsDocumentOutput = generationOptions.generateDocx || generationOptions.generatePdf;
  const wantsEmailOutput = generationOptions.generateEmailDrafts;
  const emailOutputModes = [
    { label: copy.projectSetup.emailOutputModeCombinedDocx, value: 'combined_docx' },
    { label: copy.projectSetup.emailOutputModeSeparateDocx, value: 'separate_docx' },
    { label: copy.projectSetup.emailOutputModeSeparateEml, value: 'separate_eml' },
    ...(outlookMsgDraftsAvailable
      ? [
          { label: copy.projectSetup.emailOutputModeSeparateMsg, value: 'separate_msg' },
          { label: copy.projectSetup.emailOutputModeSeparateMsgWithDocx, value: 'separate_msg_with_docx' },
          { label: copy.projectSetup.emailOutputModeSeparateMsgWithPdf, value: 'separate_msg_with_pdf' },
        ]
      : []),
  ];
  const issueFor = (id: WorkflowValidationIssue['id']) =>
    validationIssues.find((issue) => issue.id === id)?.detail;

  return (
    <Paper className="panel-card" p="lg" radius="lg">
      <Stack gap="lg">
        <div>
          <Title order={3}>{copy.projectSetup.title}</Title>
          <Text c="dimmed" size="sm">
            {copy.projectSetup.subtitle}
          </Text>
        </div>
        <Paper p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Text fw={600}>{copy.projectSetup.whatGenerate}</Text>
            <Text c="dimmed" size="sm">
              {copy.projectSetup.whatGenerateDesc}
            </Text>
            {issueFor('outputs') ? (
              <Alert color="red" radius="md" variant="light">
                {issueFor('outputs')}
              </Alert>
            ) : null}
            <Group gap="xl">
              <Checkbox
                checked={generationOptions.generateDocx}
                label={copy.projectSetup.wordFiles}
                onChange={(event) =>
                  setGenerationOption('generateDocx', event.currentTarget.checked)
                }
              />
              <Checkbox
                checked={generationOptions.generatePdf}
                label={copy.projectSetup.pdfFiles}
                onChange={(event) =>
                  setGenerationOption('generatePdf', event.currentTarget.checked)
                }
              />
              <Checkbox
                checked={generationOptions.generateEmailDrafts}
                label={copy.projectSetup.emailDrafts}
                onChange={(event) =>
                  setGenerationOption('generateEmailDrafts', event.currentTarget.checked)
                }
              />
            </Group>
            {generationOptions.generateEmailDrafts ? (
              <Select
                data={emailOutputModes}
                description={
                  outlookMsgDraftsAvailable
                    ? copy.projectSetup.emailOutputModeDesc
                    : copy.projectSetup.emailOutputModeDescNoMsg
                }
                label={copy.projectSetup.emailOutputModeLabel}
                onChange={(value) =>
                  setGenerationOption(
                    'emailOutputMode',
                    (value as GenerationOptions['emailOutputMode'] | null) ?? 'combined_docx',
                  )}
                value={generationOptions.emailOutputMode}
              />
            ) : null}
          </Stack>
        </Paper>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" verticalSpacing="lg">
          <FileField actionLabel={copy.projectSetup.setupWorkbook} description={copy.projectSetup.excelDesc} error={issueFor('workbook')} isBusy={activePicker === 'workbookPath' || isLoading} label={copy.projectSetup.excelLabel} onBrowse={() => onPickPath('workbookPath')} onClear={() => onClearPath('workbookPath')} onDownloadExample={() => onSaveStarterTemplate('excel')} onSecondaryAction={onOpenWorkbookSetup} placeholder={copy.projectSetup.excelPlaceholder} exampleTooltip={copy.projectSetup.downloadExcelExample} summary={summaries.workbook} value={project.workbookPath} />
          {wantsDocumentOutput ? (
            <FileField actionLabel={copy.projectSetup.previewFields} description={copy.projectSetup.wordDesc} error={issueFor('contract-template')} isBusy={activePicker === 'contractTemplatePath'} label={copy.projectSetup.wordLabel} onBrowse={() => onPickPath('contractTemplatePath')} onClear={() => onClearPath('contractTemplatePath')} onDownloadExample={() => onSaveStarterTemplate('word')} onSecondaryAction={onOpenWordPreview} placeholder={copy.projectSetup.wordPlaceholder} exampleTooltip={copy.projectSetup.downloadWordExample} summary={summaries.wordTemplate} value={project.contractTemplatePath} />
          ) : null}
          <FileField description={copy.projectSetup.outputFolderDesc} error={issueFor('output-directory')} isBusy={activePicker === 'outputFolderPath'} label={copy.projectSetup.outputFolderLabel} onBrowse={() => onPickPath('outputFolderPath')} onClear={() => onClearPath('outputFolderPath')} placeholder={copy.projectSetup.outputFolderPlaceholder} summary={summaries.outputFolder} value={project.outputFolderPath} />
          {wantsEmailOutput ? (
            <Stack gap="sm">
              <Checkbox
                checked={project.useOptionalEmailSource}
                label={copy.projectSetup.optionalEmailSource}
                onChange={(event) =>
                  setProject((current) => ({
                    ...current,
                    useOptionalEmailSource: event.currentTarget.checked,
                  }))
                }
              />
              <Text c="dimmed" size="sm">
                {copy.projectSetup.optionalEmailSourceDesc}
              </Text>
              {project.useOptionalEmailSource ? (
                <FileField
                  description={copy.projectSetup.emailFileDesc}
                  error={issueFor('email-template-file') ?? issueFor('email-template-load')}
                  isBusy={activePicker === 'emailTemplatePath'}
                  label={copy.projectSetup.emailFileLabel}
                  onBrowse={() => onPickPath('emailTemplatePath')}
                  onClear={() => onClearPath('emailTemplatePath')}
                  onDownloadExample={() => onSaveStarterTemplate('email')}
                  onSecondaryAction={onOpenEmailPreview}
                  placeholder={copy.projectSetup.emailFilePlaceholder}
                  actionLabel={copy.projectSetup.previewFields}
                  exampleTooltip={copy.projectSetup.downloadEmailExample}
                  summary={summaries.emailTemplate}
                  value={project.emailTemplatePath}
                />
              ) : null}
            </Stack>
          ) : null}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}
