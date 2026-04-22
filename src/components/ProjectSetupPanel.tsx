import { Badge, Group, NumberInput, Paper, SimpleGrid, Stack, Text, TextInput, Title } from '@mantine/core';
import type { ProjectConfig } from '../../shared/desktop';
import { FileField } from './FileField';

type Props = {
  activePicker: keyof ProjectConfig | null;
  onPickPath: (
    field: keyof Pick<
      ProjectConfig,
      'workbookPath' | 'contractTemplatePath' | 'emailTemplatePath' | 'outputFolderPath'
    >,
  ) => void;
  project: ProjectConfig;
  setProject: React.Dispatch<React.SetStateAction<ProjectConfig>>;
};

export function ProjectSetupPanel({ activePicker, onPickPath, project, setProject }: Props) {
  return (
    <Paper className="panel-card" p="lg" radius="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={3}>Project Setup</Title>
            <Text c="dimmed" size="sm">
              Keep workbook and output settings next to the template editor.
            </Text>
          </div>
          <Badge color="teal" variant="light">Foundation</Badge>
        </Group>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" verticalSpacing="lg">
          <FileField description="Choose the Excel workbook containing the contract rows." isBusy={activePicker === 'workbookPath'} label="Workbook" onBrowse={() => onPickPath('workbookPath')} placeholder="Select workbook (.xlsx)" value={project.workbookPath} />
          <FileField description="Keep the current DOCX contract file while email editing moves in-app." isBusy={activePicker === 'contractTemplatePath'} label="Contract Template" onBrowse={() => onPickPath('contractTemplatePath')} placeholder="Select contract template (.docx)" value={project.contractTemplatePath} />
          <FileField description="A legacy text template can still be imported later if needed." isBusy={activePicker === 'emailTemplatePath'} label="Legacy Email Template" onBrowse={() => onPickPath('emailTemplatePath')} placeholder="Optional legacy email template" value={project.emailTemplatePath} />
          <FileField description="Choose where the app should write contracts, PDFs, and draft files." isBusy={activePicker === 'outputFolderPath'} label="Output Folder" onBrowse={() => onPickPath('outputFolderPath')} placeholder="Select output folder" value={project.outputFolderPath} />
        </SimpleGrid>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          <TextInput description="Name of the sheet to read from the workbook." label="Worksheet Name" onChange={(event) => setProject((current) => ({ ...current, worksheetName: event.currentTarget.value }))} value={project.worksheetName} />
          <NumberInput description="Row containing the column headers." label="Header Row" min={1} onChange={(value) => setProject((current) => ({ ...current, headerRow: Number(value) || 1 }))} value={project.headerRow} />
          <NumberInput description="First row containing real contract data." label="Data Start Row" min={1} onChange={(value) => setProject((current) => ({ ...current, dataStartRow: Number(value) || 1 }))} value={project.dataStartRow} />
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}
