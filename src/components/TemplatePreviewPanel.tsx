import { Badge, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { renderTemplate, renderTemplateHtml } from '../lib/template';
import type { EmailTemplateState } from '../types/template';
import { useI18n } from '../i18n';

type Props = {
  emailTemplate: EmailTemplateState;
  sampleValues: Record<string, string>;
};

export function TemplatePreviewPanel({ emailTemplate, sampleValues }: Props) {
  const { copy } = useI18n();

  return (
    <Paper className="panel-card preview-card" p="lg" radius="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={3}>{copy.templatePreview.title}</Title>
            <Text c="dimmed" size="sm">
              {copy.templatePreview.subtitle}
            </Text>
          </div>
          <Badge color="teal" variant="light">{copy.templatePreview.badge}</Badge>
        </Group>
        <Stack gap="sm">
          <div><Text c="dimmed" size="sm">{copy.templatePreview.subject}</Text><Text fw={600}>{renderTemplate(emailTemplate.subject, sampleValues)}</Text></div>
          <div><Text c="dimmed" size="sm">{copy.templatePreview.to}</Text><Text>{renderTemplate(emailTemplate.to, sampleValues)}</Text></div>
          <div><Text c="dimmed" size="sm">{copy.templatePreview.cc}</Text><Text>{renderTemplate(emailTemplate.cc, sampleValues)}</Text></div>
          <Divider />
          <div
            className="preview-body preview-body--html"
            dangerouslySetInnerHTML={{ __html: renderTemplateHtml(emailTemplate.body, sampleValues) }}
          />
        </Stack>
      </Stack>
    </Paper>
  );
}
