import { memo } from 'react';
import { Alert, Badge, Group, Paper, ScrollArea, Stack, Table, Text, Title } from '@mantine/core';
import type { WorkbookPreviewRow } from '../types/template';
import { useI18n } from '../i18n';
import { CreatableSelect } from './CreatableSelect';

type Props = {
  availableVariables: string[];
  isLoading: boolean;
  loadError: string | null;
  onAssignmentChange: (columnLetter: string, value: string | null) => void;
  rows: WorkbookPreviewRow[];
};

function WorkbookPreviewPanelComponent({
  availableVariables,
  isLoading,
  loadError,
  onAssignmentChange,
  rows,
}: Props) {
  const { copy } = useI18n();

  return (
    <Paper className="panel-card" p="lg" radius="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={3}>{copy.workbookPreview.title}</Title>
            <Text c="dimmed" size="sm">
              {copy.workbookPreview.subtitle}
            </Text>
          </div>
          <Badge color="cyan" variant="light">{copy.workbookPreview.badgeColumns(rows.length)}</Badge>
        </Group>

        {loadError ? (
          <Alert color="red" radius="lg" title={copy.workbookPreview.previewUnavailable} variant="light">
            {loadError}
          </Alert>
        ) : null}

        <ScrollArea>
          <Table highlightOnHover striped withColumnBorders>
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
              {rows.map((row) => (
                <Table.Tr key={row.columnLetter}>
                  <Table.Td>{row.columnLetter}</Table.Td>
                  <Table.Td>{row.header}</Table.Td>
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
                    <Badge color={row.usedBy === 'both' ? 'teal' : row.usedBy === 'email' ? 'blue' : row.usedBy === 'contract' ? 'grape' : 'gray'} variant="light">
                      {row.usedBy === 'both'
                        ? copy.workbookPreview.usedByBoth
                        : row.usedBy === 'email'
                          ? copy.workbookPreview.usedByEmail
                          : row.usedBy === 'contract'
                            ? copy.workbookPreview.usedByContract
                            : copy.workbookPreview.usedByNone}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        {isLoading ? (
          <Text c="dimmed" size="sm">
            {copy.workbookPreview.refreshing}
          </Text>
        ) : null}
      </Stack>
    </Paper>
  );
}

export const WorkbookPreviewPanel = memo(WorkbookPreviewPanelComponent);
