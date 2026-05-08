import { Alert, Badge, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { normalizeEmailBody, renderTemplateHtml } from '../lib/template';
import { useI18n } from '../i18n';

type Props = {
  content: string;
  isLoading: boolean;
  loadError: string | null;
  resolvedPath: string;
  sampleValues: Record<string, string>;
  variables: string[];
};

export function ExternalEmailTemplatePanel({
  content,
  isLoading,
  loadError,
  resolvedPath,
  sampleValues,
  variables,
}: Props) {
  const { copy } = useI18n();
  const renderedBody = normalizeEmailBody(renderTemplateHtml(content, sampleValues));

  return (
    <Paper className="panel-card preview-card" p="lg" radius="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={3}>{copy.externalEmailTemplate.title}</Title>
            <Text c="dimmed" size="sm">
              {copy.externalEmailTemplate.subtitle}
            </Text>
          </div>
          <Badge color="orange" variant="light">
            {isLoading ? copy.externalEmailTemplate.loading : copy.externalEmailTemplate.badge}
          </Badge>
        </Group>

        {loadError ? (
          <Alert color="red" radius="lg" title={copy.externalEmailTemplate.loadErrorTitle} variant="light">
            {loadError}
          </Alert>
        ) : null}

        <Stack gap="xs">
          <Text c="dimmed" size="sm">{copy.externalEmailTemplate.file}</Text>
          <Text ff="monospace" size="sm">{resolvedPath || '-'}</Text>
        </Stack>

        <Stack gap="xs">
          <Group gap="xs">
            <Text c="dimmed" size="sm">{copy.externalEmailTemplate.variables}</Text>
            {isLoading ? <Loader size={12} /> : null}
          </Group>
          <Group gap="xs">
            {variables.length > 0 ? variables.map((variable) => (
              <Badge key={variable} color="blue" variant="light">
                {variable}
              </Badge>
            )) : (
              <Text c="dimmed" size="sm">{copy.externalEmailTemplate.noVariables}</Text>
            )}
          </Group>
        </Stack>

        <Stack gap="xs">
          <Text c="dimmed" size="sm">{copy.externalEmailTemplate.preview}</Text>
          <div
            className="preview-body preview-body--html"
            dangerouslySetInnerHTML={{ __html: renderedBody }}
          />
        </Stack>
      </Stack>
    </Paper>
  );
}
