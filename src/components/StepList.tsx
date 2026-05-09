import { Badge, Group, Stack, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import type { WizardStepId } from '../types/template';
import type { WorkflowValidationIssue } from '../features/workspace/workflowValidation';
import { useI18n } from '../i18n';

type Props = {
  activeStep: WizardStepId;
  onStepChange: (step: WizardStepId) => void;
  validationIssues: WorkflowValidationIssue[];
  visibleSteps: WizardStepId[];
};

export function StepList({ activeStep, onStepChange, validationIssues, visibleSteps }: Props) {
  const { copy } = useI18n();
  const displayedSteps = visibleSteps.map((id) => ({
    ...copy.steps[id],
    id,
  }));

  return (
    <Stack gap="xs">
      {displayedSteps.map((step) => {
        const isCurrent = step.id === activeStep;
        const isComplete = step.id < activeStep;
        const hasIssue = !isCurrent && validationIssues.some((issue) => issue.targetStep === step.id);

        return (
          <UnstyledButton
            key={step.id}
            className={isCurrent ? 'step-card step-card--active' : 'step-card'}
            onClick={() => onStepChange(step.id)}
          >
            <Group
              align="center"
              className="step-card__content"
              wrap="nowrap"
            >
              <ThemeIcon
                color={isCurrent ? 'teal' : hasIssue ? 'yellow' : isComplete ? 'lime' : 'gray'}
                radius="xl"
                size="md"
                variant={isCurrent || hasIssue ? 'filled' : 'light'}
              >
                {step.id}
              </ThemeIcon>
              <Text fw={isCurrent ? 700 : 500} size="sm">{step.title}</Text>
              {isComplete && !hasIssue ? (
                <Badge color="lime" ml="auto" size="xs" variant="light">
                  {copy.stepList.ready}
                </Badge>
              ) : null}
              {isCurrent ? (
                <Badge color="teal" ml="auto" size="xs" variant="light">
                  {copy.stepList.current}
                </Badge>
              ) : null}
            </Group>
          </UnstyledButton>
        );
      })}
    </Stack>
  );
}
