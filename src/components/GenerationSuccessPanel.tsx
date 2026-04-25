import { useMemo } from 'react';
import { Alert, Badge, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import type { GenerateProjectResult, OutputTreeEntry } from '../../shared/desktop';
import { useI18n } from '../i18n';

type Props = {
  isOpeningPath: boolean;
  onOpenPath: (path: string) => void;
  onStartAgain: () => void;
  result: GenerateProjectResult;
};

export function GenerationSuccessPanel({
  isOpeningPath,
  onOpenPath,
  onStartAgain,
  result,
}: Props) {
  const { copy } = useI18n();
  const combinedEmailPath = result.combinedEmailPath;
  const treeEntries = useMemo(() => {
    const filtered = result.createdEntries.filter((entry) => entry.relativePath !== '.');

    return filtered.map((entry) => ({
      ...entry,
      depth: Math.max(0, entry.relativePath.split(/[\\/]/).length - 1),
    }));
  }, [result.createdEntries]);

  const hasDelayedArtifacts = !treeEntries.some(
    (entry) =>
        entry.kind === 'file' &&
      (
        entry.relativePath.endsWith('email_drafts.docx') ||
        entry.relativePath.endsWith('generation_report.txt')
      ),
  );

  return (
    <Paper className="panel-card" p="lg" radius="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={3}>{copy.success.generationComplete}</Title>
            <Text c="dimmed" size="sm">
              {copy.success.subtitle}
            </Text>
          </div>
          <Badge color="teal" variant="light">
            {copy.success.summary(result.generatedCount, result.skippedCount)}
          </Badge>
        </Group>

        {hasDelayedArtifacts ? (
          <Alert color="yellow" title={copy.success.finishingTitle} variant="light">
            {copy.success.finishingBody}
          </Alert>
        ) : null}

        <Group gap="sm">
          <Button onClick={() => onOpenPath(result.outputDir)} size="xs" variant="light">
            {copy.success.openOutputFolder}
          </Button>
          <Button onClick={() => onOpenPath(result.reportPath)} size="xs" variant="light">
            {copy.success.openReport}
          </Button>
          {combinedEmailPath ? (
            <Button onClick={() => onOpenPath(combinedEmailPath)} size="xs" variant="light">
              {copy.success.openDrafts}
            </Button>
          ) : null}
          <Button loading={isOpeningPath} onClick={onStartAgain} size="xs" variant="default">
            {copy.success.startAgain}
          </Button>
        </Group>

        <Paper p="md" radius="md" withBorder>
          <Stack gap={6}>
            <Text fw={600} size="sm">
              {copy.success.createdFiles}
            </Text>
            {treeEntries.length === 0 ? (
              <Text c="dimmed" size="sm">
                {copy.success.noFilesYet}
              </Text>
            ) : (
              treeEntries.map((entry: OutputTreeEntry & { depth: number }) => (
                <Group key={`${entry.kind}-${entry.relativePath}`} justify="space-between" wrap="nowrap">
                  <Text
                    size="sm"
                    style={{
                      marginLeft: `${entry.depth * 14}px`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    [{entry.kind === 'directory' ? 'DIR' : 'FILE'}] {entry.relativePath}
                  </Text>
                  <Button
                    onClick={() => onOpenPath(entry.absolutePath)}
                    size="compact-xs"
                    variant="subtle"
                  >
                    {copy.success.open}
                  </Button>
                </Group>
              ))
            )}
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  );
}
