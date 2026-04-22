import { Badge, Group, Paper, Stack, Text, Title } from '@mantine/core';
import type { EmailTemplateState, GenerationOptions, WorkbookPreviewRow } from '../types/template';

type Props = {
  generationOptions: GenerationOptions;
  mappedContractFields: number;
  totalContractFields: number;
  emailTemplate: EmailTemplateState;
  rows: WorkbookPreviewRow[];
};

export function ReviewSummaryPanel({
  generationOptions,
  mappedContractFields,
  totalContractFields,
  emailTemplate,
  rows,
}: Props) {
  const mappedRows = rows.filter((row) => row.selectedVariable);
  const outputLabel = generationOptions.generateDocx && generationOptions.generatePdf
    ? 'DOCX + PDF'
    : generationOptions.generatePdf
      ? 'PDF only'
      : 'DOCX only';

  return (
    <Paper className="panel-card" p="lg" radius="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={3}>Ready To Commit</Title>
            <Text c="dimmed" size="sm">
              Final review before generation wiring: template coverage, mapped fields, and row preview.
            </Text>
          </div>
          <Badge color="teal" variant="light">
            Review
          </Badge>
        </Group>

        <Group gap="md">
          <Paper className="mini-stat" p="md" radius="lg">
            <Text c="dimmed" size="sm">Mapped workbook columns</Text>
            <Title order={2}>{mappedRows.length}</Title>
          </Paper>
          <Paper className="mini-stat" p="md" radius="lg">
            <Text c="dimmed" size="sm">Mapped contract fields</Text>
            <Title order={2}>
              {mappedContractFields}/{totalContractFields}
            </Title>
          </Paper>
          <Paper className="mini-stat" p="md" radius="lg">
            <Text c="dimmed" size="sm">Email body length</Text>
            <Title order={2}>{emailTemplate.body.length}</Title>
          </Paper>
        </Group>

        <Text size="sm">Selected output: {outputLabel}</Text>
      </Stack>
    </Paper>
  );
}
