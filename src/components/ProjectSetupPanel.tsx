import { Badge, Checkbox, Group, NumberInput, Paper, Select, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import type { StarterTemplateKind } from '../../shared/desktop';
import type { ProjectConfig } from '../../shared/desktop';
import type { GenerationOptions } from '../types/template';
import { useI18n } from '../i18n';
import { FileField } from './FileField';

type Props = {
  activePicker: keyof ProjectConfig | null;
  generationOptions: GenerationOptions;
  onPickPath: (
    field: keyof Pick<
      ProjectConfig,
      'workbookPath' | 'contractTemplatePath' | 'emailTemplatePath' | 'outputFolderPath'
    >,
  ) => void;
  onSaveStarterTemplate: (kind: StarterTemplateKind) => void;
  project: ProjectConfig;
  setGenerationOption: <K extends keyof GenerationOptions>(
    key: K,
    value: GenerationOptions[K],
  ) => void;
  setProject: React.Dispatch<React.SetStateAction<ProjectConfig>>;
  worksheetOptions: string[];
};

export function ProjectSetupPanel({
  activePicker,
  generationOptions,
  onPickPath,
  onSaveStarterTemplate,
  project,
  setGenerationOption,
  setProject,
  worksheetOptions,
}: Props) {
  const { copy } = useI18n();
  const wantsDocumentOutput = generationOptions.generateDocx || generationOptions.generatePdf;
  const wantsEmailOutput = generationOptions.generateEmailDrafts;

  return (
    <Paper className="panel-card" p="lg" radius="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={3}>{copy.projectSetup.title}</Title>
            <Text c="dimmed" size="sm">
              {copy.projectSetup.subtitle}
            </Text>
          </div>
          <Badge color="teal" variant="light">{copy.projectSetup.badge}</Badge>
        </Group>
        <Paper p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Text fw={600}>{copy.projectSetup.whatGenerate}</Text>
            <Text c="dimmed" size="sm">
              {copy.projectSetup.whatGenerateDesc}
            </Text>
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
                data={[
                  { label: copy.projectSetup.emailOutputModeCombinedDocx, value: 'combined_docx' },
                  { label: copy.projectSetup.emailOutputModeSeparateDocx, value: 'separate_docx' },
                  { label: copy.projectSetup.emailOutputModeSeparateEml, value: 'separate_eml' },
                ]}
                description={copy.projectSetup.emailOutputModeDesc}
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
          <FileField description={copy.projectSetup.excelDesc} isBusy={activePicker === 'workbookPath'} label={copy.projectSetup.excelLabel} onBrowse={() => onPickPath('workbookPath')} onDownloadExample={() => onSaveStarterTemplate('excel')} placeholder={copy.projectSetup.excelPlaceholder} exampleTooltip={copy.projectSetup.downloadExcelExample} value={project.workbookPath} />
          {wantsDocumentOutput ? (
            <FileField description={copy.projectSetup.wordDesc} isBusy={activePicker === 'contractTemplatePath'} label={copy.projectSetup.wordLabel} onBrowse={() => onPickPath('contractTemplatePath')} onDownloadExample={() => onSaveStarterTemplate('word')} placeholder={copy.projectSetup.wordPlaceholder} exampleTooltip={copy.projectSetup.downloadWordExample} value={project.contractTemplatePath} />
          ) : null}
          <FileField description={copy.projectSetup.outputFolderDesc} isBusy={activePicker === 'outputFolderPath'} label={copy.projectSetup.outputFolderLabel} onBrowse={() => onPickPath('outputFolderPath')} placeholder={copy.projectSetup.outputFolderPlaceholder} value={project.outputFolderPath} />
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
                  isBusy={activePicker === 'emailTemplatePath'}
                  label={copy.projectSetup.emailFileLabel}
                  onBrowse={() => onPickPath('emailTemplatePath')}
                  onDownloadExample={() => onSaveStarterTemplate('email')}
                  placeholder={copy.projectSetup.emailFilePlaceholder}
                  exampleTooltip={copy.projectSetup.downloadEmailExample}
                  value={project.emailTemplatePath}
                />
              ) : null}
            </Stack>
          ) : null}
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          <Select
            data={worksheetOptions}
            description={copy.projectSetup.worksheetDesc}
            label={copy.projectSetup.worksheet}
            onChange={(value) => setProject((current) => ({
              ...current,
              worksheetName: value ?? '',
            }))}
            placeholder={copy.projectSetup.worksheetPlaceholder}
            searchable
            value={project.worksheetName || worksheetOptions[0] || null}
          />
          <NumberInput
            description={copy.projectSetup.headerRowDesc}
            label={copy.projectSetup.headerRow}
            min={1}
            onChange={(value) => setProject((current) => {
              const headerRow = Number(value) || 1;

              return {
                ...current,
                dataStartRow: headerRow + 1,
                headerRow,
              };
            })}
            value={project.headerRow}
          />
          <NumberInput description={copy.projectSetup.dataStartRowDesc} label={copy.projectSetup.dataStartRow} min={1} onChange={(value) => setProject((current) => ({ ...current, dataStartRow: Number(value) || 1 }))} value={project.dataStartRow} />
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}
