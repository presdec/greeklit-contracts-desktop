import { useCallback, useMemo, useState } from 'react';
import { Alert, Badge, Box, Button, Card, Divider, Group, Paper, Progress, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { ContractMappingPanel } from './components/ContractMappingPanel';
import { EmailTemplateEditor } from './components/EmailTemplateEditor';
import { ProjectSetupPanel } from './components/ProjectSetupPanel';
import { ReviewSummaryPanel } from './components/ReviewSummaryPanel';
import { SetupSourcePreviewPanel } from './components/SetupSourcePreviewPanel';
import { StepList } from './components/StepList';
import { TemplatePreviewPanel } from './components/TemplatePreviewPanel';
import { WorkbookPreviewPanel } from './components/WorkbookPreviewPanel';
import { useEmailTemplateBuilder } from './hooks/useEmailTemplateBuilder';
import { useContractTemplateSettings } from './hooks/useContractTemplateSettings';
import { useProjectSetup } from './hooks/useProjectSetup';
import { useWorkbookPreview } from './hooks/useWorkbookPreview';
import type { WizardStepId } from './types/template';

const stepCopy = {
  1: {
    description:
      'Choose the project details and quickly confirm the workbook and contract template loaded correctly.',
    title: 'Project Setup',
  },
  2: {
    description:
      'Map the contract fields to workbook values and decide whether the run creates DOCX files, PDFs, or both.',
    title: 'Contract Mapping',
  },
  3: {
    description:
      'Build the email template only after the source files and contract mappings look right.',
    title: 'Email Template Builder',
  },
  4: {
    description:
      'Check the rendered preview and mapping summary before you commit the setup.',
    title: 'Review And Commit',
  },
} as const;

const nextStepCopy = {
  1: 'Once the source preview looks right, continue to contract mapping.',
  2: 'Next up: build the email template after the contract mapping is ready.',
  3: 'Next up: review the rendered output before you commit the setup.',
  4: 'Next up: persist variable assignments into the project file and reuse them during generation.',
} as const;

export function App() {
  const desktopApp = globalThis.window.desktopApp;

  if (!desktopApp) {
    return (
      <main className="app-shell">
        <Alert color="red" radius="lg" title="Desktop bridge unavailable" variant="light">
          The Electron preload bridge did not load, so the desktop UI cannot access file dialogs yet.
        </Alert>
      </main>
    );
  }

  const projectSetup = useProjectSetup(desktopApp);
  const templateBuilder = useEmailTemplateBuilder();
  const [activeStep, setActiveStep] = useState<WizardStepId>(1);
  const workbookPreview = useWorkbookPreview(
    desktopApp,
    projectSetup.project,
    templateBuilder.emailVariables,
  );
  const contractSettings = useContractTemplateSettings(
    workbookPreview.contractVariables,
    workbookPreview.availableVariables,
    workbookPreview.rows,
  );

  const handleSaveProject = useCallback(async () => {
    const savedPath = await projectSetup.saveProject();
    return savedPath ? `Saved project to ${savedPath}.` : null;
  }, [projectSetup]);

  const handleOpenProject = useCallback(async () => {
    const filePath = await projectSetup.openProject();
    return filePath ? `Loaded project from ${filePath}.` : null;
  }, [projectSetup]);

  const pickerRequests = useMemo(() => ({
    workbookPath: {
      defaultPath: projectSetup.project.workbookPath || undefined,
      filters: [{ extensions: ['xlsx', 'xlsm', 'xls'], name: 'Excel Workbooks' }],
      mode: 'file' as const,
      title: 'Select Workbook',
    },
    contractTemplatePath: {
      defaultPath: projectSetup.project.contractTemplatePath || undefined,
      filters: [{ extensions: ['docx'], name: 'Word Templates' }],
      mode: 'file' as const,
      title: 'Select Contract Template',
    },
    emailTemplatePath: {
      defaultPath: projectSetup.project.emailTemplatePath || undefined,
      filters: [{ extensions: ['txt'], name: 'Text Templates' }],
      mode: 'file' as const,
      title: 'Select Email Template',
    },
    outputFolderPath: {
      defaultPath: projectSetup.project.outputFolderPath || undefined,
      mode: 'directory' as const,
      title: 'Select Output Folder',
    },
  }), [projectSetup.project]);

  const handlePickPath = useCallback((
    field: 'workbookPath' | 'contractTemplatePath' | 'emailTemplatePath' | 'outputFolderPath',
  ) => {
    void projectSetup.pickProjectPath(field, pickerRequests[field]);
  }, [pickerRequests, projectSetup]);

  const currentStep = stepCopy[activeStep];
  const nextStepHint = nextStepCopy[activeStep];

  return (
    <main className="app-shell">
      <div className="workspace">
        <Card className="sidebar-card" padding="xl" radius="xl">
          <Stack gap="xl">
            <Stack gap="xs">
              <Group justify="space-between">
                <Badge color="teal" variant="light">Desktop MVP</Badge>
                <Text c="dimmed" size="sm">{desktopApp.platform}</Text>
              </Group>
              <Title order={2}>Greeklit Contracts Desktop</Title>
              <Text c="dimmed">
                Move through setup, template building, and review in order instead of juggling everything at once.
              </Text>
            </Stack>

            <Box>
              <Group justify="space-between">
                <Text fw={600}>Workflow progress</Text>
                <Text c="dimmed" size="sm">Step {activeStep} of 4</Text>
              </Group>
              <Progress color="teal" mt="sm" radius="xl" size="lg" value={(activeStep / 4) * 100} />
            </Box>

            <StepList activeStep={activeStep} />
          </Stack>
        </Card>

        <Card className="content-card" padding="xl" radius="xl">
          <Stack gap="xl">
            <Group justify="space-between">
              <Stack gap={4}>
                <Text c="teal.8" fw={700} size="sm" tt="uppercase">Step {activeStep}</Text>
                <Title order={1}>{currentStep.title}</Title>
                <Text c="dimmed">{currentStep.description}</Text>
              </Stack>
              <Button loading={projectSetup.isOpeningProject} onClick={() => void handleOpenProject()} size="md" variant="default">
                Open Recent Project
              </Button>
            </Group>

            {workbookPreview.loadError ? (
              <Alert color="red" radius="lg" title="Could not load workbook preview" variant="light">
                {workbookPreview.loadError}
              </Alert>
            ) : null}

            {activeStep === 1 ? (
              <Stack gap="xl">
                <ProjectSetupPanel
                  activePicker={projectSetup.activePicker}
                  onPickPath={handlePickPath}
                  project={projectSetup.project}
                  setProject={projectSetup.setProject}
                />
                <SetupSourcePreviewPanel
                  contractVariables={workbookPreview.contractVariables}
                  isLoading={workbookPreview.isLoading}
                  loadError={workbookPreview.loadError}
                  sampleRows={workbookPreview.sampleRows}
                />
              </Stack>
            ) : null}

            {activeStep === 2 ? (
              <ContractMappingPanel
                availableVariables={workbookPreview.availableVariables}
                generationOptions={contractSettings.generationOptions}
                mappedContractFields={contractSettings.mappedContractFields}
                setGenerationOption={contractSettings.setGenerationOption}
                setTokenMapping={contractSettings.setTokenMapping}
                tokenContexts={workbookPreview.contractTokenContexts}
                tokenMappings={contractSettings.tokenMappings}
                tokens={workbookPreview.contractVariables}
                variableSources={contractSettings.variableSources}
              />
            ) : null}

            {activeStep === 3 ? (
              <Stack gap="xl">
                <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="xl" verticalSpacing="xl">
                  <EmailTemplateEditor
                    activeEditor={templateBuilder.activeEditor}
                    availableVariables={workbookPreview.availableVariables}
                    editorRefs={templateBuilder.editorRefs}
                    emailTemplate={templateBuilder.emailTemplate}
                    insertFieldToken={(variable) => {
                      const token = templateBuilder.insertFieldToken(variable);
                      void token;
                    }}
                    setActiveEditor={templateBuilder.setActiveEditor}
                    updateEmailField={templateBuilder.updateEmailField}
                  />
                  <TemplatePreviewPanel
                    emailTemplate={templateBuilder.emailTemplate}
                    sampleValues={workbookPreview.sampleValues}
                  />
                </SimpleGrid>
                <WorkbookPreviewPanel
                  availableVariables={workbookPreview.availableVariables}
                  isLoading={workbookPreview.isLoading}
                  loadError={workbookPreview.loadError}
                  onAssignmentChange={workbookPreview.setFieldAssignment}
                  rows={workbookPreview.rows}
                />
              </Stack>
            ) : null}

            {activeStep === 4 ? (
              <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="xl" verticalSpacing="xl">
                <TemplatePreviewPanel
                  emailTemplate={templateBuilder.emailTemplate}
                  sampleValues={workbookPreview.sampleValues}
                />
                <ReviewSummaryPanel
                  generationOptions={contractSettings.generationOptions}
                  mappedContractFields={contractSettings.mappedContractFields}
                  emailTemplate={templateBuilder.emailTemplate}
                  rows={workbookPreview.rows}
                  totalContractFields={workbookPreview.contractVariables.length}
                />
              </SimpleGrid>
            ) : null}

            <Divider />

            <Group justify="space-between">
              <Stack gap={2}>
                <Text c="dimmed">
                  {nextStepHint}
                </Text>
                {projectSetup.lastProjectPath ? (
                  <Text c="dimmed" size="sm">
                    Project file: {projectSetup.lastProjectPath}
                  </Text>
                ) : null}
              </Stack>
              <Group>
                {activeStep > 1 ? (
                  <Button onClick={() => setActiveStep((current: WizardStepId) => (current - 1) as WizardStepId)} size="md" variant="default">
                    Back
                  </Button>
                ) : null}
                <Button
                  loading={projectSetup.isSavingProject}
                  onClick={() => void handleSaveProject()}
                  size="md"
                  variant="default"
                >
                  Save Draft Setup
                </Button>
                {activeStep < 4 ? (
                  <Button onClick={() => setActiveStep((current: WizardStepId) => (current + 1) as WizardStepId)} size="md">
                    {activeStep === 1
                      ? 'Continue To Contract Mapping'
                      : activeStep === 2
                        ? 'Continue To Email Builder'
                        : 'Continue To Review'}
                  </Button>
                ) : (
                  <Button size="md">Ready For Generation</Button>
                )}
              </Group>
            </Group>
          </Stack>
        </Card>
      </div>
    </main>
  );
}
