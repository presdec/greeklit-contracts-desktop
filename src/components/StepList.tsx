import { Badge, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import type { WizardStepId } from '../types/template';
import { useI18n } from '../i18n';

type Props = {
  activeStep: WizardStepId;
  visibleSteps: WizardStepId[];
};

export function StepList({ activeStep, visibleSteps }: Props) {
  const { copy } = useI18n();
  const displayedSteps = visibleSteps.map((id) => ({
    ...copy.steps[id],
    id,
  }));

  return (
    <Stack gap="md">
      {displayedSteps.map((step) => {
        const isCurrent = step.id === activeStep;
        const isComplete = step.id < activeStep;

        return (
          <Paper
            key={step.id}
            className={isCurrent ? 'step-card step-card--active' : 'step-card'}
            p="md"
            radius="md"
          >
            <Group
              align="flex-start"
              wrap="nowrap"
            >
              <ThemeIcon
                color={isCurrent ? 'teal' : isComplete ? 'lime' : 'gray'}
                radius="xl"
                size="lg"
                variant={isCurrent ? 'filled' : 'light'}
              >
                {step.id}
              </ThemeIcon>
              <Stack gap={4}>
                <Group gap="xs">
                  <Text fw={700}>{step.title}</Text>
                  {isComplete ? (
                    <Badge color="lime" variant="light">
                      {copy.stepList.ready}
                    </Badge>
                  ) : null}
                  {isCurrent ? (
                    <Badge color="teal" variant="light">
                      {copy.stepList.current}
                    </Badge>
                  ) : null}
                </Group>
                <Text c="dimmed" size="sm">
                  {step.description}
                </Text>
              </Stack>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}
