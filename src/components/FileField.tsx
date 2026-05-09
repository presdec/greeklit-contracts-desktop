import { ActionIcon, Button, Group, Stack, Text, TextInput, Tooltip } from '@mantine/core';
import { useI18n } from '../i18n';

type FileFieldProps = {
  actionLabel?: string;
  description: string;
  error?: string;
  isBusy?: boolean;
  label: string;
  onBrowse: () => void;
  onClear?: () => void;
  onDownloadExample?: () => void;
  onSecondaryAction?: () => void;
  placeholder: string;
  exampleTooltip?: string;
  summary?: string;
  value: string;
};

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 16 16"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 2.5V9.5M8 9.5L5.5 7M8 9.5L10.5 7M3 11.5H13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 16 16"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.5 4.5L11.5 11.5M11.5 4.5L4.5 11.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 16 16"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.7 2.2L6.35 3.55C6.05 3.67 5.78 3.83 5.52 4.03L4.18 3.65L2.88 5.9L3.88 6.86C3.84 7.02 3.83 7.19 3.83 7.36C3.83 7.53 3.84 7.7 3.88 7.86L2.88 8.82L4.18 11.07L5.52 10.69C5.78 10.89 6.05 11.05 6.35 11.17L6.7 12.52H9.3L9.65 11.17C9.95 11.05 10.22 10.89 10.48 10.69L11.82 11.07L13.12 8.82L12.12 7.86C12.16 7.7 12.17 7.53 12.17 7.36C12.17 7.19 12.16 7.02 12.12 6.86L13.12 5.9L11.82 3.65L10.48 4.03C10.22 3.83 9.95 3.67 9.65 3.55L9.3 2.2H6.7Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
      <circle cx="8" cy="7.36" r="1.8" stroke="currentColor" strokeWidth="1.45" />
    </svg>
  );
}

export function FileField({
  actionLabel,
  description,
  error,
  isBusy = false,
  label,
  onBrowse,
  onClear,
  onDownloadExample,
  onSecondaryAction,
  placeholder,
  exampleTooltip,
  summary,
  value,
}: FileFieldProps) {
  const { copy } = useI18n();

  return (
    <Stack gap={6}>
      <Group justify="space-between">
        <Text fw={600}>{label}</Text>
        <Group gap="xs">
          {onDownloadExample ? (
            <Tooltip
              label={exampleTooltip ?? copy.fileField.downloadExample}
              withArrow
            >
              <ActionIcon
                aria-label={exampleTooltip ?? copy.fileField.downloadExample}
                className="file-field-action"
                onClick={onDownloadExample}
                size="sm"
                variant="light"
              >
                <DownloadIcon />
              </ActionIcon>
            </Tooltip>
          ) : null}
          {onSecondaryAction ? (
            <Tooltip label={actionLabel} withArrow>
              <ActionIcon
                aria-label={actionLabel}
                className="file-field-action"
                color="teal"
                disabled={!value}
                onClick={onSecondaryAction}
                size="sm"
                variant="light"
              >
                <SettingsIcon />
              </ActionIcon>
            </Tooltip>
          ) : null}
          <Button
            className="file-field-browse"
            loading={isBusy}
            onClick={onBrowse}
            size="sm"
            variant="light"
          >
            {copy.fileField.browse}
          </Button>
        </Group>
      </Group>
      <TextInput
        placeholder={placeholder}
        readOnly
        rightSection={onClear && value ? (
          <Tooltip label={copy.fileField.clear} withArrow>
            <ActionIcon
              aria-label={copy.fileField.clear}
              color="red"
              onClick={onClear}
              size="sm"
              variant="subtle"
            >
              <ClearIcon />
            </ActionIcon>
          </Tooltip>
        ) : null}
        value={value}
      />
      <Text
        c="dimmed"
        size="sm"
      >
        {description}
      </Text>
      {error ? (
        <Text c="yellow.7" fw={600} size="xs">
          {error}
        </Text>
      ) : null}
      {summary ? (
        <Text c="teal.8" fw={600} size="xs">
          {summary}
        </Text>
      ) : null}
    </Stack>
  );
}
