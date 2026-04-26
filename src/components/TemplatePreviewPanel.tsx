import { memo, useMemo } from 'react';
import { Badge, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { renderTemplate, renderTemplateHtml } from '../lib/template';
import type { EmailTemplateState } from '../types/template';
import { useI18n } from '../i18n';

type Props = {
  emailTemplate: EmailTemplateState;
  sampleValues: Record<string, string>;
};

function TemplatePreviewPanelComponent({ emailTemplate, sampleValues }: Props) {
  const { copy } = useI18n();
  const renderedTemplate = useMemo(
    () => ({
      body: renderTemplateHtml(emailTemplate.body, sampleValues),
      cc: renderTemplate(emailTemplate.cc, sampleValues),
      subject: renderTemplate(emailTemplate.subject, sampleValues),
      to: renderTemplate(emailTemplate.to, sampleValues),
    }),
    [emailTemplate, sampleValues],
  );

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
          <div><Text c="dimmed" size="sm">{copy.templatePreview.subject}</Text><Text fw={600}>{renderedTemplate.subject}</Text></div>
          <div><Text c="dimmed" size="sm">{copy.templatePreview.to}</Text><Text>{renderedTemplate.to}</Text></div>
          <div><Text c="dimmed" size="sm">{copy.templatePreview.cc}</Text><Text>{renderedTemplate.cc}</Text></div>
          <Divider />
          <div
            className="preview-body preview-body--html"
            dangerouslySetInnerHTML={{ __html: renderedTemplate.body }}
          />
        </Stack>
      </Stack>
    </Paper>
  );
}

export const TemplatePreviewPanel = memo(TemplatePreviewPanelComponent);
