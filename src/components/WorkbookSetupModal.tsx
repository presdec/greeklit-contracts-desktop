import { Alert, Button, Group, Modal, NumberInput, ScrollArea, Select, SimpleGrid, Skeleton, Stack, Table, Text, Title } from '@mantine/core';
import type { ProjectConfig, WorkbookHeaderAnalysis, WorkbookPreviewRawRow } from '../../shared/desktop';
import type { WorkbookPreviewRow } from '../types/template';
import { useI18n } from '../i18n';

type Props = {
  columnValues: Record<string, string[]>;
  headerAnalysis: WorkbookHeaderAnalysis | null;
  isLoading: boolean;
  maxColumn: number;
  onClose: () => void;
  onSaveSettings: () => void;
  opened: boolean;
  previewRows: WorkbookPreviewRawRow[];
  project: ProjectConfig;
  setProject: React.Dispatch<React.SetStateAction<ProjectConfig>>;
  workbookRows: WorkbookPreviewRow[];
  worksheetOptions: string[];
};

function excelColumnIndex(columnLetter: string) {
  return columnLetter
    .toUpperCase()
    .split('')
    .reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0);
}

type PreviewColumnItem =
  | { key: string; type: 'separator' }
  | { key: string; letter: string; type: 'column' };

function buildPreviewColumnItems(columnLetters: string[], maxColumn: number): PreviewColumnItem[] {
  const sortedLetters = [...columnLetters].sort((left, right) => excelColumnIndex(left) - excelColumnIndex(right));
  const items: PreviewColumnItem[] = [];
  let previousIndex = 0;

  for (const letter of sortedLetters) {
    const currentIndex = excelColumnIndex(letter);
    if (previousIndex > 0 && currentIndex > previousIndex + 1) {
      items.push({ key: `${previousIndex}-${currentIndex}`, type: 'separator' });
    }
    items.push({ key: letter, letter, type: 'column' });
    previousIndex = currentIndex;
  }

  if (previousIndex > 0 && maxColumn > previousIndex) {
    items.push({ key: `${previousIndex}-end`, type: 'separator' });
  }

  return items;
}

export function WorkbookSetupModal({
  columnValues,
  headerAnalysis,
  isLoading,
  maxColumn,
  onClose,
  onSaveSettings,
  opened,
  previewRows,
  project,
  setProject,
  workbookRows,
  worksheetOptions,
}: Props) {
  const { copy } = useI18n();
  const suggestedHeaderRow = headerAnalysis?.suggestedHeaderRow ?? null;
  const showHeaderRowWarning = suggestedHeaderRow !== null && suggestedHeaderRow !== project.headerRow;
  const previewColumnLetters = Array.from(
    new Set(previewRows.flatMap((row) => row.cells.map((cell) => cell.columnLetter))),
  );
  const previewColumnItems = buildPreviewColumnItems(previewColumnLetters, maxColumn);
  const rejectedPreviewRow = previewRows.find((row) => row.role === 'rejected-data');
  const rejectionColumn = project.rejectionColumn.trim().toUpperCase();
  const rejectionValue = project.rejectionValue.trim();
  const rejectionColumnOptions = workbookRows.map((row) => ({
    label: `${row.columnLetter} - ${row.header}`,
    value: row.columnLetter,
  }));
  const rejectionValueOptions = project.rejectionColumn
    ? (columnValues[project.rejectionColumn] ?? []).filter((value) => value.length > 0).map((value) => ({
        label: value || '(blank)',
        value,
      }))
    : [];

  return (
    <Modal
      onClose={onClose}
      opened={opened}
      size="90vw"
      title={copy.workbookSetupModal.title}
    >
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={4}>{copy.workbookSetupModal.heading}</Title>
          <Text c="dimmed" size="sm">
            {copy.workbookSetupModal.description}
          </Text>
        </Stack>

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
          <NumberInput
            description={copy.projectSetup.dataStartRowDesc}
            label={copy.projectSetup.dataStartRow}
            min={1}
            onChange={(value) => setProject((current) => ({
              ...current,
              dataStartRow: Number(value) || 1,
            }))}
            value={project.dataStartRow}
          />
        </SimpleGrid>

        {showHeaderRowWarning ? (
          <Alert color="yellow" radius="lg" title={copy.projectSetup.headerRowWarningTitle} variant="light">
            <Group align="flex-start" justify="space-between">
              <Text size="sm">
                {copy.projectSetup.headerRowWarningBody(
                  project.headerRow,
                  headerAnalysis?.selectedHeaderCount ?? 0,
                  suggestedHeaderRow,
                  headerAnalysis?.suggestedHeaderCount ?? 0,
                )}
              </Text>
              <Button
                color="yellow"
                onClick={() => setProject((current) => ({
                  ...current,
                  dataStartRow: suggestedHeaderRow + 1,
                  headerRow: suggestedHeaderRow,
                }))}
                size="xs"
                variant="light"
              >
                {copy.projectSetup.useSuggestedHeaderRow(suggestedHeaderRow)}
              </Button>
            </Group>
          </Alert>
        ) : null}

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Select
            clearable
            data={rejectionColumnOptions}
            description={copy.projectSetup.rejectionColumnDesc}
            label={copy.projectSetup.rejectionColumn}
            onChange={(value) => setProject((current) => ({
              ...current,
              rejectionColumn: value ?? '',
              rejectionValue: current.rejectionColumn === value ? current.rejectionValue : '',
            }))}
            placeholder={copy.projectSetup.rejectionColumnPlaceholder}
            searchable
            value={project.rejectionColumn || null}
          />
          <Select
            clearable
            data={rejectionValueOptions}
            description={copy.projectSetup.rejectionValueDesc}
            disabled={!project.rejectionColumn}
            label={copy.projectSetup.rejectionValue}
            onChange={(value) => setProject((current) => ({
              ...current,
              rejectionValue: value ?? '',
            }))}
            placeholder={copy.projectSetup.rejectionValuePlaceholder}
            searchable
            value={project.rejectionValue || null}
          />
        </SimpleGrid>

        <Group gap="md">
          <Group gap={6}>
            <span className="preview-legend preview-legend--selected" />
            <Text size="sm">{copy.workbookSetupModal.selectedHeaderLegend}</Text>
          </Group>
          <Group gap={6}>
            <span className="preview-legend preview-legend--suggested" />
            <Text size="sm">{copy.workbookSetupModal.suggestedHeaderLegend}</Text>
          </Group>
          <Group gap={6}>
            <span className="preview-legend preview-legend--data" />
            <Text size="sm">{copy.workbookSetupModal.dataLegend}</Text>
          </Group>
          <Group gap={6}>
            <span className="preview-legend preview-legend--rejected" />
            <Text size="sm">{copy.workbookSetupModal.rejectedLegend}</Text>
          </Group>
        </Group>

        {project.rejectionColumn && project.rejectionValue && !rejectedPreviewRow ? (
          <Alert color="blue" radius="lg" variant="light">
            {copy.workbookSetupModal.noRejectedPreviewMatch}
          </Alert>
        ) : null}

        <Text c="dimmed" size="sm">
          {copy.workbookSetupModal.mergedTitleHint}
        </Text>

        <ScrollArea>
          <Table highlightOnHover withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{copy.setupPreview.row}</Table.Th>
                <Table.Th>{copy.setupPreview.populatedCells}</Table.Th>
                {previewColumnItems.map((item) => (
                  item.type === 'separator'
                    ? <Table.Th key={item.key} className="source-preview-separator">...</Table.Th>
                    : <Table.Th key={item.key}>{item.letter}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                Array.from({ length: Math.max(previewRows.length, 4) }).map((_, rowIndex) => (
                  <Table.Tr key={`source-preview-skeleton-${rowIndex}`}>
                    <Table.Td><Skeleton height={14} radius="sm" width={48} /></Table.Td>
                    <Table.Td><Skeleton height={14} radius="sm" width={72} /></Table.Td>
                    {previewColumnItems.map((item, columnIndex) => (
                      <Table.Td
                        key={`source-preview-skeleton-${rowIndex}-${item.key}`}
                        className={item.type === 'separator' ? 'source-preview-separator' : undefined}
                      >
                        <Skeleton height={14} radius="sm" width={columnIndex % 3 === 0 ? 96 : 64} />
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              ) : previewRows.map((row) => {
                const cellValues = Object.fromEntries(
                  row.cells.map((cell) => [cell.columnLetter, cell.value]),
                );

                return (
                  <Table.Tr
                    key={`${row.role}-${row.rowNumber}`}
                    className={`source-preview-row source-preview-row--${row.role}${row.hasLeadingGap ? ' source-preview-row--has-leading-gap' : ''}`}
                  >
                    <Table.Td>{row.rowNumber}</Table.Td>
                    <Table.Td>{row.populatedCells}</Table.Td>
                    {previewColumnItems.map((item) => (
                      item.type === 'separator' ? (
                        <Table.Td key={`${row.rowNumber}-${item.key}`} className="source-preview-separator">
                          ...
                        </Table.Td>
                      ) : (
                        <Table.Td
                          key={`${row.rowNumber}-${item.letter}`}
                          className={[
                            row.role === 'rejected-data'
                            && item.letter === rejectionColumn
                            && cellValues[item.letter] === rejectionValue
                              ? 'source-preview-rejection-value-cell'
                              : '',
                          ].filter(Boolean).join(' ') || undefined}
                        >
                          {cellValues[item.letter] || '-'}
                        </Table.Td>
                      )
                    ))}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        <Group justify="flex-end">
          <Button onClick={onSaveSettings}>
            {copy.workbookSetupModal.saveSettings}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
