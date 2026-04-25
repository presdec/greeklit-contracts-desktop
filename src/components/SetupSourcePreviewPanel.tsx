import { Alert, Badge, Group, Paper, ScrollArea, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import type { WorkbookPreviewSampleRow } from '../../shared/desktop';
import { useI18n } from '../i18n';

type Props = {
  contractVariables: string[];
  isLoading: boolean;
  loadError: string | null;
  sampleRows: WorkbookPreviewSampleRow[];
};

export function SetupSourcePreviewPanel({
  contractVariables,
  isLoading,
  loadError,
  sampleRows,
}: Props) {
  const { copy } = useI18n();
  const headers = Object.keys(sampleRows[0]?.values ?? {});

  return (
    <Paper className="panel-card" p="lg" radius="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={3}>{copy.setupPreview.loadCheck}</Title>
            <Text c="dimmed" size="sm">
              {copy.setupPreview.subtitle}
            </Text>
          </div>
          <Badge color="cyan" variant="light">
            {copy.setupPreview.badge}
          </Badge>
        </Group>

        {loadError ? (
          <Alert color="red" radius="lg" title={copy.setupPreview.previewUnavailable} variant="light">
            {loadError}
          </Alert>
        ) : null}

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <Paper className="mini-stat" p="md" radius="lg">
            <Stack gap="sm">
              <Text c="dimmed" size="sm">
                {copy.setupPreview.fieldsFoundInWord}
              </Text>
              <Group gap="xs">
                {contractVariables.slice(0, 10).map((token) => (
                  <Badge key={token} color="grape" variant="light">
                    {token}
                  </Badge>
                ))}
                {!contractVariables.length ? (
                  <Text size="sm">
                    {copy.setupPreview.noTemplateFields}
                  </Text>
                ) : null}
              </Group>
            </Stack>
          </Paper>

          <Paper className="mini-stat" p="md" radius="lg">
            <Stack gap="xs">
              <Text c="dimmed" size="sm">
                {copy.setupPreview.quickCheck}
              </Text>
              <Text size="sm">
                {copy.setupPreview.quickCheckDesc(sampleRows.length)}
              </Text>
            </Stack>
          </Paper>
        </SimpleGrid>

        <ScrollArea>
          <Table highlightOnHover striped withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{copy.setupPreview.row}</Table.Th>
                {headers.map((header) => (
                  <Table.Th key={header}>{header}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sampleRows.map((row) => (
                <Table.Tr key={row.rowNumber}>
                  <Table.Td>{row.rowNumber}</Table.Td>
                  {headers.map((header) => (
                    <Table.Td key={`${row.rowNumber}-${header}`}>{row.values[header] || '—'}</Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        {isLoading ? (
          <Text c="dimmed" size="sm">
            {copy.setupPreview.refreshing}
          </Text>
        ) : null}
      </Stack>
    </Paper>
  );
}
