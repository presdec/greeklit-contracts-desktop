import { useMemo, useState } from 'react';
import { Alert, Badge, Button, Checkbox, Group, Modal, Paper, Select, Stack, Table, Text, Title } from '@mantine/core';
import type { GenerationOptions, WorkbookPreviewRow } from '../types/template';

type Props = {
  availableVariables: string[];
  generationOptions: GenerationOptions;
  mappedContractFields: number;
  setGenerationOption: (key: keyof GenerationOptions, value: boolean) => void;
  setTokenMapping: (token: string, variable: string | null) => void;
  tokenContexts: Record<string, string>;
  tokenMappings: Record<string, string>;
  tokens: string[];
  variableSources: Record<string, WorkbookPreviewRow>;
};

export function ContractMappingPanel({
  availableVariables,
  generationOptions,
  mappedContractFields,
  setGenerationOption,
  setTokenMapping,
  tokenContexts,
  tokenMappings,
  tokens,
  variableSources,
}: Props) {
  const [previewToken, setPreviewToken] = useState<string | null>(null);

  const previewContent = useMemo(() => {
    if (!previewToken) {
      return null;
    }

    const mappedVariable = tokenMappings[previewToken] ?? '';
    const sampleValue = mappedVariable ? variableSources[mappedVariable]?.sampleValue ?? '' : '';
    const paragraph = tokenContexts[previewToken] ?? '';

    if (!paragraph) {
      return null;
    }

    const renderedParagraph = sampleValue
      ? paragraph.replaceAll(`{{${previewToken}}}`, sampleValue)
      : paragraph;

    return {
      paragraph,
      renderedParagraph,
      sampleValue,
      token: previewToken,
    };
  }, [previewToken, tokenContexts, tokenMappings, variableSources]);

  return (
    <Stack gap="xl">
      <Modal
        centered
        onClose={() => setPreviewToken(null)}
        opened={Boolean(previewToken)}
        size="lg"
        title="Contract paragraph preview"
      >
        <Stack gap="md">
          {previewContent ? (
            <>
              <Text c="dimmed" size="sm">
                Token <code>{`{{${previewContent.token}}}`}</code>
                {previewContent.sampleValue
                  ? ` with sample value \"${previewContent.sampleValue}\"`
                  : ' (no mapped sample value yet)'}
              </Text>
              <Paper p="md" radius="md" withBorder>
                <Stack gap="xs">
                  <Text fw={600} size="sm">Original paragraph</Text>
                  <Text size="sm">{previewContent.paragraph}</Text>
                </Stack>
              </Paper>
              <Paper p="md" radius="md" withBorder>
                <Stack gap="xs">
                  <Text fw={600} size="sm">Rendered with sample value</Text>
                  <Text size="sm">{previewContent.renderedParagraph}</Text>
                </Stack>
              </Paper>
            </>
          ) : (
            <Alert color="yellow" title="No paragraph context found" variant="light">
              This token was found in the DOCX, but the app could not extract a paragraph around it.
            </Alert>
          )}
        </Stack>
      </Modal>

      <Paper className="panel-card" p="lg" radius="lg">
        <Stack gap="lg">
          <Group justify="space-between">
            <div>
              <Title order={3}>Contract Field Mapping</Title>
              <Text c="dimmed" size="sm">
                Connect each DOCX placeholder to a workbook-backed variable before generation.
              </Text>
            </div>
            <Badge color="grape" variant="light">
              {mappedContractFields} / {tokens.length} mapped
            </Badge>
          </Group>

          {!tokens.length ? (
            <Alert color="yellow" radius="lg" title="No contract placeholders found" variant="light">
              The app can only map fields that already exist in the DOCX. Open the contract template,
              decide where values should be inserted, and add placeholders in double braces such as
              <code>{'{{AUTHOR}}'}</code>, <code>{'{{TITLE}}'}</code>, or{' '}
              <code>{'{{APPLICATION_CODE}}'}</code>. After saving the DOCX, reload the
              project or go back to Project Setup and browse for the contract file again. If you picked
              the wrong file, you can replace it there and re-check.
            </Alert>
          ) : null}

          <Alert color="teal" radius="lg" title="Need more placeholders?" variant="light">
            You can return to Project Setup, open or replace the DOCX, add markers like
            <code>{'{{AUTHOR}}'}</code>, save, and then re-open that file to refresh this mapping list.
          </Alert>

          <Table highlightOnHover striped withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>DOCX field</Table.Th>
                <Table.Th>Workbook variable</Table.Th>
                <Table.Th>Source column</Table.Th>
                <Table.Th>Sample value</Table.Th>
                <Table.Th>Context</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tokens.map((token) => {
                const variable = tokenMappings[token] ?? '';
                const source = variableSources[variable];

                return (
                  <Table.Tr key={token}>
                    <Table.Td>{token}</Table.Td>
                    <Table.Td>
                      <Select
                        data={availableVariables}
                        onChange={(value) => setTokenMapping(token, value)}
                        placeholder="Choose variable"
                        searchable
                        value={variable || null}
                      />
                    </Table.Td>
                    <Table.Td>{source?.columnLetter ?? '—'}</Table.Td>
                    <Table.Td>{source?.sampleValue || '—'}</Table.Td>
                    <Table.Td>
                      <Button
                        disabled={!tokenContexts[token]}
                        onClick={() => setPreviewToken(token)}
                        size="xs"
                        variant="light"
                      >
                        Show paragraph
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper className="panel-card" p="lg" radius="lg">
        <Stack gap="md">
          <div>
            <Title order={3}>Output Format</Title>
            <Text c="dimmed" size="sm">
              Choose whether the completed run creates DOCX files, PDFs, or both.
            </Text>
          </div>

          <Group gap="xl">
            <Checkbox
              checked={generationOptions.generateDocx}
              label="Generate DOCX"
              onChange={(event) =>
                setGenerationOption('generateDocx', event.currentTarget.checked)
              }
            />
            <Checkbox
              checked={generationOptions.generatePdf}
              label="Generate PDF"
              onChange={(event) =>
                setGenerationOption('generatePdf', event.currentTarget.checked)
              }
            />
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}
