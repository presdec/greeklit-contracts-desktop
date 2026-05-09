import { Alert, Badge, Button, Group, Modal, Paper, Stack, Table, Text } from '@mantine/core';
import { useMemo } from 'react';
import { useI18n } from '../i18n';

const fieldColors = [
  { background: '#e7f5ff', border: '#74c0fc', color: '#0b7285' },
  { background: '#f3f0ff', border: '#b197fc', color: '#5f3dc4' },
  { background: '#fff0f6', border: '#faa2c1', color: '#a61e4d' },
  { background: '#ebfbee', border: '#8ce99a', color: '#2b8a3e' },
  { background: '#fff9db', border: '#ffd43b', color: '#e67700' },
  { background: '#e6fcf5', border: '#63e6be', color: '#087f5b' },
  { background: '#fff4e6', border: '#ffa94d', color: '#d9480f' },
  { background: '#f8f9fa', border: '#adb5bd', color: '#343a40' },
];
const fallbackFieldColor = fieldColors[0] as typeof fieldColors[number];

type Props = {
  emailContent: string;
  emailLoadError: string | null;
  emailVariables: string[];
  mode: 'email' | 'word';
  onClose: () => void;
  onSaveSettings: () => void;
  opened: boolean;
  tokenContexts: Record<string, string>;
  wordTokens: string[];
};

function snippetForVariable(content: string, variable: string) {
  const token = `{{${variable}}}`;
  const index = content.indexOf(token);
  if (index < 0) {
    return '';
  }

  const start = Math.max(0, index - 80);
  const end = Math.min(content.length, index + token.length + 80);
  return `${start > 0 ? '...' : ''}${content.slice(start, end)}${end < content.length ? '...' : ''}`;
}

function renderHighlightedContext(context: string, field: string, color: typeof fieldColors[number]) {
  const token = `{{${field}}}`;
  const parts = context.split(token);

  if (parts.length === 1) {
    return context;
  }

  return parts.map((part, index) => (
    <span key={`${field}-${index}`}>
      {part}
      {index < parts.length - 1 ? (
        <mark
          style={{
            background: color.background,
            border: `1px solid ${color.border}`,
            borderRadius: 4,
            color: color.color,
            fontWeight: 700,
            padding: '1px 4px',
          }}
        >
          {token}
        </mark>
      ) : null}
    </span>
  ));
}

export function TemplateInspectionModal({
  emailContent,
  emailLoadError,
  emailVariables,
  mode,
  onClose,
  onSaveSettings,
  opened,
  tokenContexts,
  wordTokens,
}: Props) {
  const { copy } = useI18n();
  const isWord = mode === 'word';
  const rows = useMemo(
    () => isWord
      ? wordTokens.map((field) => ({
        context: tokenContexts[field] ?? '',
        field,
      }))
      : emailVariables.map((field) => ({
        context: snippetForVariable(emailContent, field),
        field,
      })),
    [emailContent, emailVariables, isWord, tokenContexts, wordTokens],
  );

  return (
    <Modal
      onClose={onClose}
      opened={opened}
      size="80vw"
      title={isWord ? copy.templateInspection.wordTitle : copy.templateInspection.emailTitle}
    >
      <Stack gap="lg">
        <Text c="dimmed" size="sm">
          {isWord ? copy.templateInspection.wordDescription : copy.templateInspection.emailDescription}
        </Text>

        {emailLoadError && !isWord ? (
          <Alert color="red" radius="lg" title={copy.externalEmailTemplate.loadErrorTitle} variant="light">
            {emailLoadError}
          </Alert>
        ) : null}

        {rows.length === 0 ? (
          <Alert color="yellow" radius="lg" title={copy.templateInspection.noFieldsTitle} variant="light">
            {copy.templateInspection.noFieldsBody}
          </Alert>
        ) : (
          <Table highlightOnHover withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{copy.templateInspection.field}</Table.Th>
                <Table.Th>{copy.templateInspection.context}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row, index) => {
                const color = fieldColors[index % fieldColors.length] ?? fallbackFieldColor;

                return (
                <Table.Tr key={row.field}>
                  <Table.Td>
                    <Badge
                      styles={isWord ? {
                        root: {
                          backgroundColor: color.background,
                          borderColor: color.border,
                          color: color.color,
                        },
                      } : undefined}
                      variant="light"
                    >
                      {row.field}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {row.context ? (
                      <Paper p="sm" radius="md" withBorder>
                        <Text size="sm">
                          {isWord
                            ? renderHighlightedContext(row.context, row.field, color)
                            : row.context}
                        </Text>
                      </Paper>
                    ) : (
                      <Text c="dimmed" size="sm">{copy.templateInspection.noContext}</Text>
                    )}
                  </Table.Td>
                </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}

        <Group justify="flex-end">
          <Button onClick={onSaveSettings}>
            {copy.templateInspection.saveSettings}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
