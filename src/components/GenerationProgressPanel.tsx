import { Badge, Group, Paper, Progress, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import type { GenerateProjectProgress } from '../../shared/desktop';
import type { GenerationOptions } from '../types/template';
import { useI18n } from '../i18n';

type Props = {
  elapsedSeconds: number;
  fallbackRowsFound: number;
  generationOptions: GenerationOptions;
  progress: GenerateProjectProgress | null;
  progressValue: number;
  selectedOutputLabel: string;
  stage: string | null;
};

function metricValue(value: number | undefined, fallback = 0) {
  return value ?? fallback;
}

function metricPair(current: number | undefined, expected: number | undefined) {
  if (typeof expected === 'number') {
    return `${metricValue(current)}/${expected}`;
  }

  return `${metricValue(current)}`;
}

function stageLabel(stage: string | undefined) {
  if (!stage) {
    return 'Starting';
  }

  return stage
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function GenerationProgressPanel({
  elapsedSeconds,
  fallbackRowsFound,
  generationOptions,
  progress,
  progressValue,
  selectedOutputLabel,
  stage,
}: Props) {
  const { copy } = useI18n();
  const rowsFound = progress?.rowsFound ?? (progress?.total && progress.stage === 'docx' ? progress.total : fallbackRowsFound);
  const workingTotal = progress?.total ?? 0;
  const isWorkingOnBatch = workingTotal > 0;
  const docxExpected = progress?.expectedDocxCount
    ?? (generationOptions.generateDocx ? progress?.generatedCount : undefined);
  const pdfExpected = progress?.expectedPdfCount
    ?? (generationOptions.generatePdf ? progress?.generatedCount : undefined);
  const emailExpected = progress?.expectedEmailDraftCount
    ?? (generationOptions.generateEmailDrafts ? progress?.generatedCount : undefined);

  return (
    <Paper className="panel-card execution-panel" p="xl" radius="lg">
      <Stack gap="lg">
        <Group justify="space-between" wrap="nowrap">
          <div>
            <Title order={3}>{copy.generationProgress.inProgress}</Title>
            <Text c="dimmed" size="sm">
              {progress?.message ?? stage ?? copy.generationProgress.running}
            </Text>
          </div>
          <Group gap="xs">
            {isWorkingOnBatch ? (
              <Badge color="teal" size="lg" variant="light">
                {copy.generationProgress.workingOn(progress?.current ?? 0, workingTotal)}
              </Badge>
            ) : null}
            <Badge color="orange" size="lg" variant="light">
              {copy.generationProgress.elapsed(elapsedSeconds)}
            </Badge>
          </Group>
        </Group>

        <Progress animated color="orange" radius="xl" size="xl" value={progressValue} />

        <SimpleGrid cols={{ base: 1, md: 3, xl: 6 }} spacing="md">
          <Paper className="mini-stat" p="md" radius="lg">
            <Text c="dimmed" size="sm">{copy.generationProgress.rowsFound}</Text>
            <Title order={2}>{rowsFound}</Title>
          </Paper>
          <Paper className="mini-stat" p="md" radius="lg">
            <Text c="dimmed" size="sm">{copy.generationProgress.generatedRecords}</Text>
            <Title order={2}>{metricValue(progress?.generatedCount)}</Title>
          </Paper>
          <Paper className="mini-stat" p="md" radius="lg">
            <Text c="dimmed" size="sm">{copy.generationProgress.skippedRows}</Text>
            <Title order={2}>{metricValue(progress?.skippedCount)}</Title>
          </Paper>
          <Paper className="mini-stat" p="md" radius="lg">
            <Text c="dimmed" size="sm">{copy.generationProgress.docxFiles}</Text>
            <Title order={2}>{metricPair(progress?.docxCount, docxExpected)}</Title>
          </Paper>
          <Paper className="mini-stat" p="md" radius="lg">
            <Text c="dimmed" size="sm">{copy.generationProgress.pdfFiles}</Text>
            <Title order={2}>{metricPair(progress?.pdfCount, pdfExpected)}</Title>
          </Paper>
          <Paper className="mini-stat" p="md" radius="lg">
            <Text c="dimmed" size="sm">{copy.generationProgress.emailDrafts}</Text>
            <Title order={2}>{metricPair(progress?.emailDraftCount, emailExpected)}</Title>
          </Paper>
        </SimpleGrid>

        <Group gap="xl">
          <Text c="dimmed" size="sm">
            {copy.generationProgress.stage}: {stageLabel(progress?.stage ?? stage ?? undefined)}
          </Text>
          <Text c="dimmed" size="sm">
            {copy.generationProgress.outputTargets}: {selectedOutputLabel}
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}
