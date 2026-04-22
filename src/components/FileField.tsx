import { Button, Group, Stack, Text, TextInput } from '@mantine/core';

type FileFieldProps = {
  description: string;
  isBusy?: boolean;
  label: string;
  onBrowse: () => void;
  placeholder: string;
  value: string;
};

export function FileField({
  description,
  isBusy = false,
  label,
  onBrowse,
  placeholder,
  value,
}: FileFieldProps) {
  return (
    <Stack gap={6}>
      <Group justify="space-between">
        <Text fw={600}>{label}</Text>
        <Button
          loading={isBusy}
          onClick={onBrowse}
          size="xs"
          variant="light"
        >
          Browse
        </Button>
      </Group>
      <TextInput
        placeholder={placeholder}
        readOnly
        value={value}
      />
      <Text
        c="dimmed"
        size="sm"
      >
        {description}
      </Text>
    </Stack>
  );
}
