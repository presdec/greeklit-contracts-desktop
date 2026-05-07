import { memo, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, Divider, Group, Modal, Paper, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import type { TemplateStatusResult } from '../../shared/desktop';
import { extractTokens, renderTemplate, tokenName } from '../lib/template';
import type { WorkbookPreviewRow } from '../types/template';
import { useI18n } from '../i18n';
import { CreatableSelect } from './CreatableSelect';

type Props = {
  availableVariables: string[];
  contractTemplatePath: string;
  isOpeningTemplate?: boolean;
  isReloadingTemplate?: boolean;
  mappedContractFields: number;
  onOpenTemplate: () => void;
  onReloadTemplate: () => void;
  outputFilenamePattern: string;
  setTokenMapping: (token: string, variable: string | null) => void;
  setOutputFilenamePattern: (value: string) => void;
  templateStatus: TemplateStatusResult | null;
  tokenContexts: Record<string, string>;
  tokenMappings: Record<string, string>;
  tokens: string[];
  variableSources: Record<string, WorkbookPreviewRow>;
  workbookRows: WorkbookPreviewRow[];
};

function ContractMappingPanelComponent({
  availableVariables,
  contractTemplatePath,
  isOpeningTemplate = false,
  isReloadingTemplate = false,
  mappedContractFields,
  onOpenTemplate,
  onReloadTemplate,
  outputFilenamePattern,
  setTokenMapping,
  setOutputFilenamePattern,
  templateStatus,
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

  const filenameSampleValues = useMemo(
    () =>
      workbookRows.reduce<Record<string, string>>((accumulator, row) => {
        if (row.selectedVariable) {
          accumulator[row.selectedVariable] = row.sampleValue;
        }
        return accumulator;
      }, {}),
    [workbookRows],
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

  const missingFilenameVariables = useMemo(
    () => filenamePatternVariables.filter((name) => !selectedVariables.has(name)),
    [filenamePatternVariables, selectedVariables],
  );

  const filenamePatternPreview = useMemo(
    () => renderTemplate(outputFilenamePattern, filenameSampleValues),
    [filenameSampleValues, outputFilenamePattern],
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

  const templateStatusText = useMemo(() => {
    if (!contractTemplatePath) {
      return copy.contractMapping.statusNoTemplate;
    }

    if (!templateStatus?.exists) {
      return copy.contractMapping.statusTemplateMissing;
    }

    if (templateStatus.isLocked) {
      return copy.contractMapping.statusTemplateLocked;
    }

    if (templateStatus.lastModifiedMs) {
      return copy.contractMapping.statusTemplateEditedAt(
        new Date(templateStatus.lastModifiedMs).toLocaleTimeString(),
      );
    }

    return copy.contractMapping.statusTemplateHint;
  }, [contractTemplatePath, copy.contractMapping, templateStatus]);

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

      <Paper className="panel-card" p="lg" radius="lg">
        <Stack gap="lg">
          <Group justify="space-between">
            <div>
              <Title order={3}>{copy.contractMapping.title}</Title>
              <Text c="dimmed" size="sm">
                {copy.contractMapping.subtitle}
              </Text>
            </div>
            <Group gap="sm">
              <Badge color="grape" variant="light">
                {copy.contractMapping.badgeMapped(mappedContractFields, tokens.length)}
              </Badge>
              <Button
                disabled={!contractTemplatePath}
                loading={isOpeningTemplate}
                onClick={onOpenTemplate}
                size="xs"
                variant="default"
              >
                {copy.contractMapping.openTemplate}
              </Button>
              <Button
                disabled={!contractTemplatePath}
                loading={isReloadingTemplate}
                onClick={onReloadTemplate}
                size="xs"
                variant="light"
              >
                {copy.contractMapping.reloadFields}
              </Button>
            </Group>
          </Group>

          <Alert color={templateStatus?.isLocked ? 'yellow' : 'blue'} radius="lg" title={copy.contractMapping.templateFlowTitle} variant="light">
            {templateStatusText}
          </Alert>

          <Stack gap="xs">
            <Text fw={500} size="sm">{copy.contractMapping.outputFilenamePatternLabel}</Text>
            <Text c="dimmed" size="sm">{copy.contractMapping.outputFilenamePatternDesc}</Text>
            {filenameTokens.length > 0 ? (
              <>
                <Text c="dimmed" size="xs">{copy.contractMapping.filenameTokensHint}</Text>
                <Group gap="xs">
                  {filenameTokens.map((variable) => (
                    <Button
                      key={variable}
                      className="field-chip"
                      onClick={() => insertFilenameToken(variable)}
                      radius="xl"
                      size="xs"
                      variant="light"
                    >
                      {variable}
                    </Button>
                  ))}
                </Group>
                <Divider />
              </>
            ) : null}
            <TextInput
              onChange={(event) => {
                filenameSelectionStart.current = event.currentTarget.selectionStart ?? event.currentTarget.value.length;
                setOutputFilenamePattern(event.currentTarget.value);
              }}
              onClick={(event) => {
                filenameSelectionStart.current = event.currentTarget.selectionStart ?? event.currentTarget.value.length;
              }}
              onKeyUp={(event) => {
                filenameSelectionStart.current = (event.currentTarget as HTMLInputElement).selectionStart ?? event.currentTarget.value.length;
              }}
              placeholder={copy.contractMapping.outputFilenamePatternPlaceholder}
              value={outputFilenamePattern}
            />

            <Stack gap={4}>
              <Text c="dimmed" fw={500} size="xs">{copy.contractMapping.outputFilenamePatternPreviewLabel}</Text>
              <Text ff="monospace" size="sm">{filenamePatternPreview || '-'}</Text>
            </Stack>

            {missingFilenameVariables.length > 0 ? (
              <Alert color="yellow" radius="md" title={copy.contractMapping.outputFilenamePatternMissingTitle} variant="light">
                {copy.contractMapping.outputFilenamePatternMissingBody} {missingFilenameVariables.join(', ')}
              </Alert>
            ) : null}
          </Stack>

          {!tokens.length ? (
            <Alert color="yellow" radius="lg" title={copy.contractMapping.noPlaceholdersTitle} variant="light">
              {copy.contractMapping.noPlaceholdersBody}
            </Alert>
          ) : null}

          <Alert color="teal" radius="lg" title={copy.contractMapping.needMorePlaceholdersTitle} variant="light">
            {copy.contractMapping.needMorePlaceholdersBody}
          </Alert>

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
                        onClick={() => setPreviewToken(token)}
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
    </Stack>
  );
}

export const ContractMappingPanel = memo(ContractMappingPanelComponent);
