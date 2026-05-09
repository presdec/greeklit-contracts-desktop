import { memo, useMemo, useRef, useState } from 'react';
import { Alert, Button, Group, Modal, Paper, Stack, Table, Text, TextInput } from '@mantine/core';
import { extractTokens, renderTemplate, tokenName } from '../lib/template';
import type { WorkbookPreviewRow } from '../types/template';
import { useI18n } from '../i18n';
import { CreatableSelect } from './CreatableSelect';

type Props = {
  availableVariables: string[];
  outputFilenamePattern: string;
  setTokenMapping: (token: string, variable: string | null) => void;
  setOutputFilenamePattern: (value: string) => void;
  tokenContexts: Record<string, string>;
  tokenMappings: Record<string, string>;
  tokens: string[];
  variableSources: Record<string, WorkbookPreviewRow>;
  workbookRows: WorkbookPreviewRow[];
};

type FilenamePatternSectionProps = {
  filenameTokens: string[];
  isFilenamePatternMissing: boolean;
  missingFilenameVariables: string[];
  onInsertToken: (variable: string) => void;
  onPatternChange: (value: string, selectionStart: number | null) => void;
  onSelectionChange: (selectionStart: number | null) => void;
  outputFilenamePattern: string;
  variableSources: Record<string, WorkbookPreviewRow>;
};

function FilenamePatternSection({
  filenameTokens,
  isFilenamePatternMissing,
  missingFilenameVariables,
  onInsertToken,
  onPatternChange,
  onSelectionChange,
  outputFilenamePattern,
  variableSources,
}: FilenamePatternSectionProps) {
  const { copy } = useI18n();

  const sampleValues: Record<string, string> = {};
  for (const [key, row] of Object.entries(variableSources)) {
    if (row.sampleValue) sampleValues[key] = row.sampleValue;
  }
  const filenamePreview = outputFilenamePattern.trim()
    ? renderTemplate(outputFilenamePattern, sampleValues)
    : null;

  return (
    <Paper className="panel-card" p="lg" radius="lg">
      <Stack gap="xs">
        <Text fw={700} size="sm">{copy.contractMapping.outputFilenamePatternLabel}</Text>
        <Text c="dimmed" size="sm">{copy.contractMapping.outputFilenamePatternDesc}</Text>
        {filenameTokens.length > 0 ? (
          <Group gap="xs">
            {filenameTokens.map((variable) => (
              <Button
                key={variable}
                className="field-chip"
                onClick={() => onInsertToken(variable)}
                radius="xl"
                size="xs"
                variant="light"
              >
                {variable}
              </Button>
            ))}
          </Group>
        ) : null}
        <TextInput
          onChange={(event) =>
            onPatternChange(event.currentTarget.value, event.currentTarget.selectionStart)}
          onClick={(event) => onSelectionChange(event.currentTarget.selectionStart)}
          onKeyUp={(event) => onSelectionChange((event.currentTarget as HTMLInputElement).selectionStart)}
          placeholder={copy.contractMapping.outputFilenamePatternPlaceholder}
          value={outputFilenamePattern}
        />
        {filenamePreview ? (
          <Text c="dimmed" size="xs">
            {copy.contractMapping.outputFilenamePatternPreviewLabel}{' '}
            <Text component="span" fw={600} inherit>{filenamePreview}</Text>
          </Text>
        ) : null}
        {isFilenamePatternMissing ? (
          <Text c="yellow.7" fw={600} size="xs">
            {copy.contractMapping.outputFilenamePatternRequiredBody}
          </Text>
        ) : null}
        {missingFilenameVariables.length > 0 ? (
          <Text c="yellow.7" fw={600} size="xs">
            {copy.contractMapping.outputFilenamePatternMissingBody} {missingFilenameVariables.join(', ')}
          </Text>
        ) : null}
      </Stack>
    </Paper>
  );
}

type TemplateMappingPreviewSectionProps = {
  availableVariables: string[];
  onPreviewToken: (token: string) => void;
  setTokenMapping: (token: string, variable: string | null) => void;
  tokenContexts: Record<string, string>;
  tokenMappings: Record<string, string>;
  tokens: string[];
  variableSources: Record<string, WorkbookPreviewRow>;
};

function TemplateMappingPreviewSection({
  availableVariables,
  onPreviewToken,
  setTokenMapping,
  tokenContexts,
  tokenMappings,
  tokens,
  variableSources,
}: TemplateMappingPreviewSectionProps) {
  const { copy } = useI18n();

  return (
    <Paper className="panel-card" p="lg" radius="lg">
      <Stack gap="xs">
        <div>
          <Text fw={700} size="sm">{copy.contractMapping.mappingPreviewTitle}</Text>
          <Text c="dimmed" size="sm">{copy.contractMapping.mappingPreviewDesc}</Text>
        </div>
        <Table highlightOnHover striped withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{copy.contractMapping.wordField}</Table.Th>
              <Table.Th>{copy.contractMapping.workbookVariable}</Table.Th>
              <Table.Th>{copy.contractMapping.sourceColumn}</Table.Th>
              <Table.Th>{copy.contractMapping.sampleValue}</Table.Th>
              <Table.Th>{copy.contractMapping.context}</Table.Th>
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
                    <CreatableSelect
                      data={availableVariables}
                      onChange={(value) => setTokenMapping(token, value)}
                      placeholder={copy.contractMapping.chooseVariable}
                      value={variable || null}
                    />
                  </Table.Td>
                  <Table.Td>{source?.columnLetter ?? '-'}</Table.Td>
                  <Table.Td>{source?.sampleValue || '-'}</Table.Td>
                  <Table.Td>
                    <Button
                      disabled={!tokenContexts[token]}
                      onClick={() => onPreviewToken(token)}
                      size="xs"
                      variant="light"
                    >
                      {copy.contractMapping.showParagraph}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Stack>
    </Paper>
  );
}

function ContractMappingPanelComponent({
  availableVariables,
  outputFilenamePattern,
  setTokenMapping,
  setOutputFilenamePattern,
  tokenContexts,
  tokenMappings,
  tokens,
  variableSources,
  workbookRows,
}: Props) {
  const { copy } = useI18n();
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const filenameSelectionStart = useRef<number>(outputFilenamePattern.length);

  const filenameTokens = useMemo(
    () => Array.from(new Set(availableVariables.filter((name) => name.trim().length > 0))),
    [availableVariables],
  );

  const selectedVariables = useMemo(
    () => new Set(workbookRows.filter((row) => row.selectedVariable).map((row) => row.selectedVariable)),
    [workbookRows],
  );

  const filenamePatternVariables = useMemo(
    () =>
      Array.from(new Set(extractTokens(outputFilenamePattern)
        .map(tokenName)
        .filter((name) => name.trim().length > 0))),
    [outputFilenamePattern],
  );
  const isFilenamePatternMissing = outputFilenamePattern.trim().length === 0;

  const missingFilenameVariables = useMemo(
    () => filenamePatternVariables.filter((name) => !selectedVariables.has(name)),
    [filenamePatternVariables, selectedVariables],
  );

  function insertFilenameToken(variable: string) {
    const token = `{{${variable}}}`;
    const pos = filenameSelectionStart.current;
    const next = outputFilenamePattern.slice(0, pos) + token + outputFilenamePattern.slice(pos);
    setOutputFilenamePattern(next);
    filenameSelectionStart.current = pos + token.length;
  }

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

    return {
      paragraph,
      renderedParagraph: sampleValue
        ? paragraph.replaceAll(`{{${previewToken}}}`, sampleValue)
        : paragraph,
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
        title={copy.contractMapping.paragraphPreviewTitle}
      >
        <Stack gap="md">
          {previewContent ? (
            <>
              <Text c="dimmed" size="sm">
                Token <code>{`{{${previewContent.token}}}`}</code>
                {previewContent.sampleValue
                  ? copy.contractMapping.tokenWithSample(previewContent.sampleValue)
                  : copy.contractMapping.tokenWithoutSample}
              </Text>
              <Paper p="md" radius="md" withBorder>
                <Stack gap="xs">
                  <Text fw={600} size="sm">{copy.contractMapping.originalParagraph}</Text>
                  <Text size="sm">{previewContent.paragraph}</Text>
                </Stack>
              </Paper>
              <Paper p="md" radius="md" withBorder>
                <Stack gap="xs">
                  <Text fw={600} size="sm">{copy.contractMapping.renderedParagraph}</Text>
                  <Text size="sm">{previewContent.renderedParagraph}</Text>
                </Stack>
              </Paper>
            </>
          ) : (
            <Alert color="yellow" title={copy.contractMapping.noContextTitle} variant="light">
              {copy.contractMapping.noContextBody}
            </Alert>
          )}
        </Stack>
      </Modal>

      <FilenamePatternSection
        filenameTokens={filenameTokens}
        isFilenamePatternMissing={isFilenamePatternMissing}
        missingFilenameVariables={missingFilenameVariables}
        onInsertToken={insertFilenameToken}
        onPatternChange={(value, selectionStart) => {
          filenameSelectionStart.current = selectionStart ?? value.length;
          setOutputFilenamePattern(value);
        }}
        onSelectionChange={(selectionStart) => {
          filenameSelectionStart.current = selectionStart ?? outputFilenamePattern.length;
        }}
        outputFilenamePattern={outputFilenamePattern}
        variableSources={variableSources}
      />

      {!tokens.length ? (
        <Alert color="yellow" radius="lg" title={copy.contractMapping.noPlaceholdersTitle} variant="light">
          {copy.contractMapping.noPlaceholdersBody}
        </Alert>
      ) : null}

      <TemplateMappingPreviewSection
        availableVariables={availableVariables}
        onPreviewToken={setPreviewToken}
        setTokenMapping={setTokenMapping}
        tokenContexts={tokenContexts}
        tokenMappings={tokenMappings}
        tokens={tokens}
        variableSources={variableSources}
      />
    </Stack>
  );
}

export const ContractMappingPanel = memo(ContractMappingPanelComponent);
