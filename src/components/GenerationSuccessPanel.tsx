import { useMemo } from 'react';
import { Alert, Badge, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import type { GenerateProjectResult, OutputTreeEntry } from '../../shared/desktop';
import { useI18n } from '../i18n';

type Props = {
  isOpeningPath: boolean;
  onOpenPath: (path: string) => void;
  onStartAgain: () => void;
  result: GenerateProjectResult;
};

type OutputTreeNode = OutputTreeEntry & {
  children: OutputTreeNode[];
  name: string;
};

function normalizeRelativePath(value: string) {
  return value.replaceAll('\\', '/');
}

function buildOutputTree(entries: OutputTreeEntry[]) {
  const root: OutputTreeNode = {
    absolutePath: '',
    children: [],
    kind: 'directory',
    name: '',
    relativePath: '',
  };
  const byPath = new Map<string, OutputTreeNode>([['', root]]);

  for (const entry of entries.filter((item) => item.relativePath !== '.')) {
    const normalizedPath = normalizeRelativePath(entry.relativePath);
    const parts = normalizedPath.split('/').filter(Boolean);
    let current = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLeaf = index === parts.length - 1;
      let node = byPath.get(currentPath);

      if (!node) {
        node = {
          absolutePath: isLeaf ? entry.absolutePath : '',
          children: [],
          kind: isLeaf ? entry.kind : 'directory',
          name: part,
          relativePath: currentPath,
        };
        byPath.set(currentPath, node);
        current.children.push(node);
      } else if (isLeaf) {
        node.absolutePath = entry.absolutePath;
        node.kind = entry.kind;
      }

      current = node;
    });
  }

  const sortTree = (node: OutputTreeNode) => {
    node.children.sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === 'directory' ? -1 : 1;
      }
      return left.name.localeCompare(right.name);
    });
    node.children.forEach(sortTree);
  };

  sortTree(root);
  return root.children;
}

function OutputTreeRows({
  isOpeningPath,
  nodes,
  onOpenPath,
  depth = 0,
}: {
  depth?: number;
  isOpeningPath: boolean;
  nodes: OutputTreeNode[];
  onOpenPath: (path: string) => void;
}) {
  const { copy } = useI18n();

  return (
    <Stack gap={2}>
      {nodes.map((node) => (
        <div key={`${node.kind}-${node.relativePath}`}>
          <button
            className="output-tree-row"
            disabled={isOpeningPath || !node.absolutePath}
            onClick={() => {
              if (node.absolutePath) {
                onOpenPath(node.absolutePath);
              }
            }}
            style={{ paddingLeft: `${12 + depth * 22}px` }}
            type="button"
          >
            <Badge
              color={node.kind === 'directory' ? 'blue' : 'gray'}
              size="sm"
              variant="light"
            >
              {node.kind === 'directory' ? 'DIR' : 'FILE'}
            </Badge>
            <Text className="output-tree-name" component="span" size="sm">
              {node.name}
            </Text>
            <Text c="dimmed" component="span" size="xs">
              {copy.success.open}
            </Text>
          </button>
          {node.children.length > 0 ? (
            <OutputTreeRows
              depth={depth + 1}
              isOpeningPath={isOpeningPath}
              nodes={node.children}
              onOpenPath={onOpenPath}
            />
          ) : null}
        </div>
      ))}
    </Stack>
  );
}

export function GenerationSuccessPanel({
  isOpeningPath,
  onOpenPath,
  onStartAgain,
  result,
}: Props) {
  const { copy } = useI18n();
  const combinedEmailPath = result.combinedEmailPath;
  const treeNodes = useMemo(() => buildOutputTree(result.createdEntries), [result.createdEntries]);

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

        <SimpleGrid cols={{ base: 1, md: 3, xl: 6 }} spacing="md">
          <Paper className="mini-stat" p="md" radius="lg">
            <Text c="dimmed" size="sm">{copy.success.rowsFound}</Text>
            <Title order={2}>{result.rowsFound}</Title>
          </Paper>
          <Paper className="mini-stat" p="md" radius="lg">
            <Text c="dimmed" size="sm">{copy.success.generatedRecords}</Text>
            <Title order={2}>{result.generatedCount}</Title>
          </Paper>
          <Paper className="mini-stat" p="md" radius="lg">
            <Text c="dimmed" size="sm">{copy.success.skippedRows}</Text>
            <Title order={2}>{result.skippedCount}</Title>
          </Paper>
          <Paper className="mini-stat" p="md" radius="lg">
            <Text c="dimmed" size="sm">{copy.success.docxFiles}</Text>
            <Title order={2}>{result.docxCount}</Title>
          </Paper>
          <Paper className="mini-stat" p="md" radius="lg">
            <Text c="dimmed" size="sm">{copy.success.pdfFiles}</Text>
            <Title order={2}>{result.pdfCount}</Title>
          </Paper>
          <Paper className="mini-stat" p="md" radius="lg">
            <Text c="dimmed" size="sm">{copy.success.emailDrafts}</Text>
            <Title order={2}>{result.emailDraftCount}</Title>
          </Paper>
        </SimpleGrid>

        {result.warnings.length > 0 ? (
          <Alert color="yellow" title={copy.success.warningsTitle} variant="light">
            <Stack gap={4}>
              {result.warnings.map((warning) => (
                <Text key={warning} size="sm">{warning}</Text>
              ))}
            </Stack>
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
              {copy.success.resultTree}
            </Text>
            {treeNodes.length === 0 ? (
              <Text c="dimmed" size="sm">
                {copy.success.noFilesYet}
              </Text>
            ) : (
              <OutputTreeRows
                isOpeningPath={isOpeningPath}
                nodes={treeNodes}
                onOpenPath={onOpenPath}
              />
            )}
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  );
}
