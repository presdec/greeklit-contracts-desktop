import { memo, useMemo, useState } from 'react';
import { Alert, Badge, Button, Collapse, Group, Paper, ScrollArea, SegmentedControl, Skeleton, Stack, Table, Text, Title } from '@mantine/core';
import type { WorkbookPreviewRow } from '../types/template';
import { useI18n } from '../i18n';
import { CreatableSelect } from './CreatableSelect';

type MappingPanelMode = 'compact' | 'full' | 'half';
type MappingFilter = 'all' | 'email' | 'filename' | 'missing' | 'required' | 'word';

function excelColumnIndex(columnLetter: string) {
  return columnLetter
    .toUpperCase()
    .split('')
    .reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0);
}

type Props = {
  availableVariables: string[];
  defaultMode?: MappingPanelMode;
  headerMatchedMappings: number;
  isLoading: boolean;
  loadError: string | null;
  missingVariables: string[];
  onAssignmentChange: (columnLetter: string, value: string | null) => void;
  requiredVariables: string[];
  rows: WorkbookPreviewRow[];
  usageByVariable: Record<string, { email: boolean; filename: boolean; word: boolean }>;
};

function WorkbookPreviewPanelComponent({
  availableVariables,
  defaultMode = 'half',
  headerMatchedMappings,
  isLoading,
  loadError,
  missingVariables,
  onAssignmentChange,
  requiredVariables,
  rows,
  usageByVariable,
}: Props) {
  const { copy } = useI18n();
  const [mode, setMode] = useState<MappingPanelMode>(defaultMode);
  const [filter, setFilter] = useState<MappingFilter>('all');
  const [showGuidance, setShowGuidance] = useState(false);
  const requiredVariableSet = useMemo(() => new Set(requiredVariables), [requiredVariables]);
  const missingVariableSet = useMemo(() => new Set(missingVariables), [missingVariables]);
  const mappedRequiredCount = Math.max(0, requiredVariables.length - missingVariables.length);
  const panelHeight = mode === 'compact' ? 320 : mode === 'half' ? 520 : '72vh';

  const filteredRows = useMemo(
    () => rows.filter((row) => {
      const variable = row.selectedVariable || row.suggestedVariable || '';
      const usage = variable ? usageByVariable[variable] : null;
      const isRequired = Boolean(variable && requiredVariableSet.has(variable));
      const isMissing = Boolean(row.suggestedVariable && missingVariableSet.has(row.suggestedVariable));

      if (filter === 'all') {
        return true;
      }
      if (filter === 'required') {
        return isRequired || isMissing;
      }
      if (filter === 'missing') {
        return isMissing;
      }
      if (filter === 'word') {
        return Boolean(usage?.word);
      }
      if (filter === 'email') {
        return Boolean(usage?.email);
      }
      return Boolean(usage?.filename);
    }),
    [filter, missingVariableSet, requiredVariableSet, rows, usageByVariable],
  );

  const sortedRows = useMemo(
    () => [...filteredRows].sort((left, right) => {
      const leftMissing = left.suggestedVariable ? missingVariableSet.has(left.suggestedVariable) : false;
      const rightMissing = right.suggestedVariable ? missingVariableSet.has(right.suggestedVariable) : false;
      if (leftMissing !== rightMissing) {
        return leftMissing ? -1 : 1;
      }

      return excelColumnIndex(left.columnLetter) - excelColumnIndex(right.columnLetter);
    }),
    [filteredRows, missingVariableSet],
  );

  const renderUsageBadges = (variable: string) => {
    const usage = usageByVariable[variable];
    if (!usage) {
      return <Badge color="gray" variant="light">{copy.workbookPreview.usedByNone}</Badge>;
    }

    return (
      <Group gap={4}>
        {usage.word ? <Badge color="grape" variant="light">{copy.workbookPreview.usedByWord}</Badge> : null}
        {usage.email ? <Badge color="blue" variant="light">{copy.workbookPreview.usedByEmail}</Badge> : null}
        {usage.filename ? <Badge color="orange" variant="light">{copy.workbookPreview.usedByFilename}</Badge> : null}
      </Group>
    );
  };

  return (
    <Paper className="panel-card workbook-dock" p="lg" radius="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={3}>{copy.workbookPreview.title}</Title>
            <Text c="dimmed" size="sm">
              {copy.workbookPreview.subtitle}
            </Text>
          </div>
          <Group gap="xs">
            <Badge color={missingVariables.length > 0 ? 'red' : 'teal'} variant="light">
              {copy.workbookPreview.requiredSummary(mappedRequiredCount, requiredVariables.length)}
            </Badge>
            <Badge color="cyan" variant="light">{copy.workbookPreview.badgeColumns(rows.length)}</Badge>
            <Button
              onClick={() => setShowGuidance((current) => !current)}
              size="compact-sm"
              variant="subtle"
            >
              {showGuidance ? copy.workbookPreview.hideGuidance : copy.workbookPreview.showGuidance}
            </Button>
          </Group>
        </Group>

        <Collapse in={showGuidance}>
          <Alert color="blue" radius="md" variant="light">
            <Stack gap={4}>
              {copy.workbookPreview.guidanceLines.map((line) => (
                <Text key={line} size="sm">{line}</Text>
              ))}
            </Stack>
          </Alert>
        </Collapse>

        <Group justify="space-between">
          <SegmentedControl
            data={[
              { label: copy.workbookPreview.modeCompact, value: 'compact' },
              { label: copy.workbookPreview.modeHalf, value: 'half' },
              { label: copy.workbookPreview.modeFull, value: 'full' },
            ]}
            onChange={(value) => setMode(value as MappingPanelMode)}
            size="xs"
            value={mode}
          />
          <Text c="dimmed" size="sm">
            {copy.workbookPreview.headerMatched(headerMatchedMappings)}
          </Text>
        </Group>

        <SegmentedControl
          data={[
            { label: copy.workbookPreview.filterAll, value: 'all' },
            { label: copy.workbookPreview.filterRequired, value: 'required' },
            { label: copy.workbookPreview.filterMissing, value: 'missing' },
            { label: copy.workbookPreview.usedByWord, value: 'word' },
            { label: copy.workbookPreview.usedByEmail, value: 'email' },
            { label: copy.workbookPreview.usedByFilename, value: 'filename' },
          ]}
          onChange={(value) => setFilter(value as MappingFilter)}
          size="xs"
          value={filter}
        />

        {loadError ? (
          <Alert color="red" radius="lg" title={copy.workbookPreview.previewUnavailable} variant="light">
            {loadError}
          </Alert>
        ) : null}

        <ScrollArea h={panelHeight} type="auto">
          <Table highlightOnHover stickyHeader stickyHeaderOffset={0} striped withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{copy.workbookPreview.column}</Table.Th>
                <Table.Th>{copy.workbookPreview.header}</Table.Th>
                <Table.Th>{copy.workbookPreview.firstRowValue}</Table.Th>
                <Table.Th>{copy.workbookPreview.selectedVariable}</Table.Th>
                <Table.Th>{copy.workbookPreview.usedBy}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                Array.from({ length: Math.max(sortedRows.length, 4) }).map((_, i) => (
                  <Table.Tr key={i}>
                    <Table.Td><Skeleton height={14} radius="sm" /></Table.Td>
                    <Table.Td><Skeleton height={14} radius="sm" /></Table.Td>
                    <Table.Td><Skeleton height={14} radius="sm" /></Table.Td>
                    <Table.Td><Skeleton height={28} radius="sm" /></Table.Td>
                    <Table.Td><Skeleton height={20} radius="sm" width={60} /></Table.Td>
                  </Table.Tr>
                ))
              ) : sortedRows.map((row) => {
                const displayedVariable = row.selectedVariable || row.suggestedVariable || '';
                const isMissingRequired = Boolean(row.suggestedVariable && missingVariableSet.has(row.suggestedVariable));

                return (
                  <Table.Tr key={row.columnLetter} className={isMissingRequired ? 'mapping-row--missing' : undefined}>
                    <Table.Td data-testid="workbook-column-letter">{row.columnLetter}</Table.Td>
                    <Table.Td>
                      <Stack gap={3}>
                        <Text fw={500} size="sm">{row.header}</Text>
                        {row.suggestedVariable && !row.selectedVariable ? (
                          <Button
                            aria-label={copy.workbookPreview.useSuggestedVariable(row.suggestedVariable)}
                            color={isMissingRequired ? 'red' : 'teal'}
                            onClick={() => onAssignmentChange(row.columnLetter, row.suggestedVariable)}
                            size="compact-xs"
                            style={{ alignSelf: 'flex-start' }}
                            variant="subtle"
                          >
                            {copy.workbookPreview.suggestedVariable}: {row.suggestedVariable}
                          </Button>
                        ) : null}
                      </Stack>
                    </Table.Td>
                    <Table.Td>{row.sampleValue || '-'}</Table.Td>
                    <Table.Td>
                      <CreatableSelect
                        data={availableVariables}
                        onChange={(value) => onAssignmentChange(row.columnLetter, value)}
                        placeholder={copy.workbookPreview.chooseVariable}
                        value={row.selectedVariable || null}
                      />
                    </Table.Td>
                    <Table.Td>
                      {displayedVariable ? renderUsageBadges(displayedVariable) : (
                        <Badge color="gray" variant="light">{copy.workbookPreview.usedByNone}</Badge>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Stack>
    </Paper>
  );
}

export const WorkbookPreviewPanel = memo(WorkbookPreviewPanelComponent);
