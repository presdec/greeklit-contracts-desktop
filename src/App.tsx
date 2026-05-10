import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionIcon, Alert, Badge, Box, Button, Card, Group, Kbd, Modal, Progress, SegmentedControl, SimpleGrid, Stack, Table, Text, Title, Tooltip } from '@mantine/core';
import { ContractMappingPanel } from './components/ContractMappingPanel';
import { EmailTemplateEditor } from './components/EmailTemplateEditor';
import { ExternalEmailTemplatePanel } from './components/ExternalEmailTemplatePanel';
import { GenerationProgressPanel } from './components/GenerationProgressPanel';
import { GenerationSuccessPanel } from './components/GenerationSuccessPanel';
import { ProjectSetupPanel } from './components/ProjectSetupPanel';
import { ReviewSummaryPanel } from './components/ReviewSummaryPanel';
import { StepList } from './components/StepList';
import { TemplatePreviewPanel } from './components/TemplatePreviewPanel';
import { TemplateInspectionModal } from './components/TemplateInspectionModal';
import { WorkbookSetupModal } from './components/WorkbookSetupModal';
import { WorkbookPreviewPanel } from './components/WorkbookPreviewPanel';
import { useWorkspaceController } from './features/workspace/useWorkspaceController';
import { useI18n } from './i18n';

type AppProps = {
  colorScheme: 'dark' | 'light';
  setColorScheme: (scheme: 'dark' | 'light') => void;
};

function ReloadIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="17"
      viewBox="0 0 24 24"
      width="17"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 6V11H15M4 18V13H9M18.3 9A7 7 0 0 0 6.4 6.6L4 9M5.7 15A7 7 0 0 0 17.6 17.4L20 15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function FolderOpenIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="17"
      viewBox="0 0 24 24"
      width="17"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10L12 7H18.5A2.5 2.5 0 0 1 21 9.5V10M3 7.5V18A2 2 0 0 0 5 20H18.2A2 2 0 0 0 20.1 18.6L22 12H6L3.8 18.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 3H17L21 7V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3ZM7 3V9H16V3M7 21V15H17V21"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function App({ colorScheme, setColorScheme }: AppProps) {
  const desktopApp = globalThis.window.desktopApp;
  const { copy, language, setLanguage } = useI18n();

  if (!desktopApp) {
    return (
      <main className="app-shell">
        <Alert color="red" radius="lg" title={copy.app.desktopBridgeUnavailableTitle} variant="light">
          {copy.app.desktopBridgeUnavailableBody}
        </Alert>
      </main>
    );
  }

  const controller = useWorkspaceController(desktopApp);
  const controllerRef = useRef(controller);
  useEffect(() => {
    controllerRef.current = controller;
  });
  const [navigationWarning, setNavigationWarning] = useState<string | null>(null);
  const [setupModal, setSetupModal] = useState<'email' | 'word' | 'workbook' | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const scrollToTop = () => {
    document.querySelector('.content-scroll')?.scrollTo({ top: 0, behavior: 'instant' });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const currentStep = copy.steps[controller.activeStep];
  const selectedOutputs = [
    controller.contractSettings.generationOptions.generateDocx ? copy.outputLabels.word : null,
    controller.contractSettings.generationOptions.generatePdf ? copy.outputLabels.pdf : null,
    controller.contractSettings.generationOptions.generateEmailDrafts ? copy.outputLabels.email : null,
  ].filter(Boolean) as string[];
  const selectedOutputLabel = selectedOutputs.length > 0 ? selectedOutputs.join(' + ') : copy.outputLabels.none;
  const fileSummaries = useMemo(() => ({
    emailTemplate: controller.projectSetup.project.emailTemplatePath
      ? copy.projectSetup.emailSummary(controller.externalEmailTemplate.variables.length)
      : undefined,
    outputFolder: controller.projectSetup.project.outputFolderPath
      ? copy.projectSetup.outputSummary
      : undefined,
    workbook: controller.projectSetup.project.workbookPath
      ? copy.projectSetup.workbookSummary(
        controller.projectSetup.project.headerRow,
        controller.projectSetup.project.dataStartRow,
        controller.workbookPreview.totalRows,
        controller.workbookPreview.rows.length,
      )
      : undefined,
    wordTemplate: controller.projectSetup.project.contractTemplatePath
      ? copy.projectSetup.wordSummary(controller.workbookPreview.contractVariables.length)
      : undefined,
  }), [
    controller.externalEmailTemplate.variables.length,
    controller.projectSetup.project.contractTemplatePath,
    controller.projectSetup.project.dataStartRow,
    controller.projectSetup.project.emailTemplatePath,
    controller.projectSetup.project.headerRow,
    controller.projectSetup.project.outputFolderPath,
    controller.projectSetup.project.workbookPath,
    controller.workbookPreview.contractVariables.length,
    controller.workbookPreview.rows.length,
    controller.workbookPreview.totalRows,
    copy.projectSetup,
  ]);

  const handlePickPath = async (
    field: 'workbookPath' | 'contractTemplatePath' | 'emailTemplatePath' | 'outputFolderPath',
  ) => {
    const selectedPath = await controller.handlePickPath(field);
    if (!selectedPath) {
      return null;
    }

    if (field === 'workbookPath') {
      setSetupModal('workbook');
    }
    if (field === 'contractTemplatePath') {
      setSetupModal('word');
    }
    if (field === 'emailTemplatePath') {
      setSetupModal('email');
    }

    return selectedPath;
  };

  const handleClearPath = (
    field: 'workbookPath' | 'contractTemplatePath' | 'emailTemplatePath' | 'outputFolderPath',
  ) => {
    controller.projectSetup.setProject((current) => {
      const next = { ...current, [field]: '' };
      if (field === 'workbookPath') {
        next.worksheetName = '';
        next.rejectionColumn = '';
        next.rejectionValue = '';
      }
      return next;
    });
  };

  useEffect(() => {
    if (!navigationWarning) {
      return;
    }

    if (!controller.nextStepIssue) {
      setNavigationWarning(null);
    }
  }, [
    controller.nextStepIssue,
    navigationWarning,
  ]);

  useEffect(() => {
    return desktopApp.onMenuAction((action) => {
      const c = controllerRef.current;
      if (typeof action !== 'string') {
        if (action.type === 'open-recent-project') {
          void c.handleOpenRecentProject(action.filePath);
        }
        return;
      }

      switch (action) {
        case 'open-project':
          void c.handleOpenProject();
          break;
        case 'open-last-project':
          void c.handleOpenLastProject();
          break;
        case 'save-project':
          void c.handleSaveProject();
          break;
        case 'save-project-as':
          void c.handleSaveProject({ saveAs: true });
          break;
        case 'open-contract-template':
          void c.handleOpenContractTemplate();
          break;
        case 'reload-template-fields':
          void c.handleReloadTemplateFields();
          break;
        case 'generate-project':
          if (c.canGenerateNow) {
            void c.handleGenerateProject();
          }
          break;
        default:
          break;
      }
    });
  }, [desktopApp]);

  return (
    <main className="app-shell">
      <div className="workspace">
        <Card className="sidebar-card" padding="xl" radius="xl">
          <Stack gap="xl">
            <Stack gap="xs">
              <Group justify="space-between" w="100%" wrap="nowrap">
                <Group gap={6} justify="space-between" w="100%" wrap="nowrap">
                  <Tooltip label={copy.app.loadProject} withArrow>
                    <ActionIcon
                      aria-label={copy.app.loadProject}
                      loading={controller.projectPersistence.isOpeningProject}
                      onClick={() => void controller.handleOpenProject()}
                      size="lg"
                      variant="subtle"
                    >
                      <FolderOpenIcon />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={copy.app.saveDraftSetup} withArrow>
                    <ActionIcon
                      aria-label={copy.app.saveDraftSetup}
                      loading={controller.projectPersistence.isSavingProject}
                      onClick={() => void controller.handleSaveProject()}
                      size="lg"
                      variant="subtle"
                    >
                      <SaveIcon />
                    </ActionIcon>
                  </Tooltip>
                  <SegmentedControl
                    data={[
                      { label: 'EN', value: 'en' },
                      { label: 'EL', value: 'el' },
                    ]}
                    onChange={(value) => setLanguage(value as 'en' | 'el')}
                    size="sm"
                    value={language}
                  />
                  <Tooltip label={copy.app.keyboardShortcuts} withArrow>
                    <ActionIcon
                      aria-label={copy.app.keyboardShortcuts}
                      onClick={() => setShortcutsOpen(true)}
                      size="lg"
                      variant="subtle"
                    >
                      <svg fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="15" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" x2="12.01" y1="17" y2="17" />
                      </svg>
                    </ActionIcon>
                  </Tooltip>
                  <ActionIcon
                    aria-label="Toggle color scheme"
                    onClick={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
                    size="lg"
                    variant="subtle"
                  >
                    {colorScheme === 'dark' ? (
                      <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" x2="12" y1="1" y2="3" />
                        <line x1="12" x2="12" y1="21" y2="23" />
                        <line x1="4.22" x2="5.64" y1="4.22" y2="5.64" />
                        <line x1="18.36" x2="19.78" y1="18.36" y2="19.78" />
                        <line x1="1" x2="3" y1="12" y2="12" />
                        <line x1="21" x2="23" y1="12" y2="12" />
                        <line x1="4.22" x2="5.64" y1="19.78" y2="18.36" />
                        <line x1="18.36" x2="19.78" y1="5.64" y2="4.22" />
                      </svg>
                    ) : (
                      <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    )}
                  </ActionIcon>
                </Group>
              </Group>
              <Title order={2}>{copy.sidebar.title}</Title>
              <Text c="dimmed">
                {copy.sidebar.description}
              </Text>
            </Stack>

            <Box>
              <Group justify="space-between">
                <Text fw={600}>{copy.sidebar.workflowProgress}</Text>
                <Text c="dimmed" size="sm">
                  {copy.sidebar.stepOf(controller.currentStepIndex + 1, controller.visibleSteps.length)}
                </Text>
              </Group>
              <Progress
                color="teal"
                mt="sm"
                radius="xl"
                size="lg"
                value={((controller.currentStepIndex + 1) / controller.visibleSteps.length) * 100}
              />
            </Box>

            <StepList
              activeStep={controller.activeStep}
              onStepChange={(step) => {
                setNavigationWarning(null);
                controller.setActiveStep(step);
                scrollToTop();
              }}
              validationIssues={controller.validation.issues}
              visibleSteps={controller.visibleSteps}
            />
          </Stack>
        </Card>

        <Card className="content-card" padding={0} radius="xl">
          <Box className="content-scroll">
          <Stack gap="xl">
            <WorkbookSetupModal
              columnValues={controller.workbookPreview.columnValues}
              headerAnalysis={controller.workbookPreview.headerAnalysis}
              isLoading={controller.workbookPreview.isLoading}
              maxColumn={controller.workbookPreview.maxColumn}
              onClose={() => setSetupModal(null)}
              onSaveSettings={() => setSetupModal(null)}
              opened={setupModal === 'workbook'}
              previewRows={controller.workbookPreview.previewRows}
              project={controller.projectSetup.project}
              setProject={controller.projectSetup.setProject}
              workbookRows={controller.workbookPreview.rows}
              worksheetOptions={controller.workbookPreview.worksheetNames}
            />
            <TemplateInspectionModal
              emailContent={controller.externalEmailTemplate.content}
              emailLoadError={controller.externalEmailTemplate.loadError}
              emailVariables={controller.externalEmailTemplate.variables}
              mode={setupModal === 'email' ? 'email' : 'word'}
              onClose={() => setSetupModal(null)}
              onSaveSettings={() => setSetupModal(null)}
              opened={setupModal === 'email' || setupModal === 'word'}
              tokenContexts={controller.workbookPreview.contractTokenContexts}
              wordTokens={controller.workbookPreview.contractVariables}
            />

            <Modal
              onClose={() => setShortcutsOpen(false)}
              opened={shortcutsOpen}
              size="sm"
              title={copy.app.shortcutsTitle}
            >
              {(() => {
                const mod = desktopApp.platform === 'darwin' ? '⌘' : 'Ctrl';
                const rows: [React.ReactNode, string][] = [
                  [[<Kbd key="k1">{mod}</Kbd>, '+', <Kbd key="k2">O</Kbd>], copy.shortcuts.openProject],
                  [[<Kbd key="k3">F9</Kbd>], copy.shortcuts.openLastProject],
                  [[<Kbd key="k4">F5</Kbd>], copy.shortcuts.saveProject],
                  [[<Kbd key="k5">{mod}</Kbd>, '+', <Kbd key="k6">Shift</Kbd>, '+', <Kbd key="k7">S</Kbd>], copy.shortcuts.saveProjectAs],
                  [[<Kbd key="k8">{mod}</Kbd>, '+', <Kbd key="k9">Shift</Kbd>, '+', <Kbd key="k10">O</Kbd>], copy.shortcuts.openWordTemplate],
                  [[<Kbd key="k11">{mod}</Kbd>, '+', <Kbd key="k12">R</Kbd>], copy.shortcuts.reloadFields],
                  [[<Kbd key="k13">{mod}</Kbd>, '+', <Kbd key="k14">Enter</Kbd>], copy.shortcuts.generateNow],
                ];
                return (
                  <Table>
                    <Table.Tbody>
                      {rows.map(([keys, label]) => (
                        <Table.Tr key={label}>
                          <Table.Td>
                            <Group gap={4} wrap="nowrap">{keys}</Group>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{label}</Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                );
              })()}
            </Modal>

            <Group align="flex-start" justify="space-between" wrap="nowrap">
              <Stack gap={4}>
                <Text c="teal.8" fw={700} size="sm" tt="uppercase">
                  {language === 'el' ? `Βήμα ${controller.activeStep}` : `Step ${controller.activeStep}`}
                </Text>
                <Title order={1}>{currentStep.title}</Title>
                <Text c="dimmed">{currentStep.description}</Text>
              </Stack>
              {controller.activeStep === 2 ? (
                <Group gap="xs" style={{ flex: '0 0 auto' }} wrap="nowrap">
                  <Badge color="teal" variant="light">
                    {copy.contractMapping.badgeMapped(
                      controller.contractSettings.mappedContractFields,
                      controller.workbookPreview.contractVariables.length,
                    )}
                  </Badge>
                  <Button
                    color="teal"
                    disabled={!controller.projectSetup.project.contractTemplatePath}
                    loading={controller.isOpeningTemplate}
                    onClick={() => void controller.handleOpenContractTemplate()}
                    size="xs"
                    variant="light"
                  >
                    {copy.contractMapping.openTemplate}
                  </Button>
                  <Tooltip label={copy.contractMapping.reloadFields} withArrow>
                    <ActionIcon
                      aria-label={copy.contractMapping.reloadFields}
                      color="teal"
                      disabled={!controller.projectSetup.project.contractTemplatePath}
                      loading={controller.isReloadingTemplate || controller.workbookPreview.isLoading}
                      onClick={() => void controller.handleReloadTemplateFields()}
                      size="lg"
                      variant="light"
                    >
                      <ReloadIcon />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              ) : null}
            </Group>

            {controller.workbookPreview.loadError ? (
              <Alert color="red" radius="lg" title={copy.app.couldNotLoadWorkbookPreview} variant="light">
                {controller.workbookPreview.loadError}
              </Alert>
            ) : null}

            {controller.generationError ? (
              <Alert color="red" radius="lg" title={copy.app.generationFailedTitle} variant="light">
                {controller.generationError}
              </Alert>
            ) : null}

            {controller.templateActionError ? (
              <Alert color="red" radius="lg" title={copy.app.couldNotSaveExampleTemplate} variant="light">
                {controller.templateActionError}
              </Alert>
            ) : null}

            {controller.activeStep === 4 && controller.generationResult ? (
              <Alert color="teal" radius="lg" title={copy.app.generationCompleteTitle} variant="light">
                {copy.app.generationCompleteSummary(
                  controller.generationResult.generatedCount,
                  controller.generationResult.skippedCount,
                )}
              </Alert>
            ) : null}

            {controller.activeStep === 4 && controller.generationInfo && !controller.generationResult ? (
              <Alert color="blue" radius="lg" title={copy.app.generationStatusTitle} variant="light">
                {controller.generationInfo}
              </Alert>
            ) : null}

            {controller.isGenerating ? (
              <GenerationProgressPanel
                elapsedSeconds={controller.generationElapsedSeconds}
                fallbackRowsFound={controller.workbookPreview.totalRows}
                generationOptions={controller.contractSettings.generationOptions}
                onCancel={() => void controller.handleCancelGeneration()}
                progress={controller.generationProgress}
                progressValue={controller.generationProgressValue}
                selectedOutputLabel={selectedOutputLabel}
                stage={controller.generationStage}
              />
            ) : null}

            {controller.activeStep === 1 ? (
              <Stack gap="xl">
                <ProjectSetupPanel
                  activePicker={controller.projectSetup.activePicker}
                  generationOptions={controller.contractSettings.generationOptions}
                  isLoading={controller.workbookPreview.isLoading}
                  onClearPath={handleClearPath}
                  onOpenEmailPreview={() => setSetupModal('email')}
                  onOpenWorkbookSetup={() => setSetupModal('workbook')}
                  onOpenWordPreview={() => setSetupModal('word')}
                  outlookMsgDraftsAvailable={controller.desktopCapabilities.outlookMsgDrafts}
                  onPickPath={handlePickPath}
                  onSaveStarterTemplate={(kind) => void controller.handleSaveStarterTemplate(kind)}
                  project={controller.projectSetup.project}
                  setGenerationOption={controller.contractSettings.setGenerationOption}
                  setProject={controller.projectSetup.setProject}
                  summaries={fileSummaries}
                  validationIssues={controller.validation.issues.filter((issue) => issue.targetStep === 1)}
                />
              </Stack>
            ) : null}

            {controller.activeStep === 2 ? (
              <Stack gap="xl">
                <ContractMappingPanel
                  availableVariables={controller.workbookPreview.availableVariables}
                  outputFilenamePattern={controller.projectSetup.project.outputFilenamePattern}
                  setTokenMapping={controller.contractSettings.setTokenMapping}
                  setOutputFilenamePattern={(value) =>
                    controller.projectSetup.setProject((current) => ({
                      ...current,
                      outputFilenamePattern: value,
                    }))}
                  tokenContexts={controller.workbookPreview.contractTokenContexts}
                  tokenMappings={controller.contractSettings.tokenMappings}
                  tokens={controller.workbookPreview.contractVariables}
                  validationIssues={controller.validation.issues.filter((issue) => issue.targetStep === 2)}
                  variableSources={controller.contractSettings.variableSources}
                  workbookRows={controller.workbookPreview.rows}
                />
                <WorkbookPreviewPanel
                  availableVariables={controller.workbookPreview.availableVariables}
                  defaultMode="compact"
                  headerMatchedMappings={controller.workbookMapping.headerMatchedMappings}
                  isLoading={controller.workbookPreview.isLoading}
                  loadError={controller.workbookPreview.loadError}
                  missingVariables={controller.workbookMapping.missingVariables}
                  onAssignmentChange={controller.workbookPreview.setFieldAssignment}
                  requiredVariables={controller.workbookMapping.requiredVariables}
                  rows={controller.workbookPreview.rows}
                  usageByVariable={controller.workbookMapping.usage}
                />
              </Stack>
            ) : null}

            {controller.activeStep === 3 ? (
              <Stack gap="xl">
                {controller.projectSetup.project.useOptionalEmailSource ? (
                  <ExternalEmailTemplatePanel
                    content={controller.externalEmailTemplate.content}
                    isLoading={controller.externalEmailTemplate.isLoading}
                    loadError={controller.externalEmailTemplate.loadError}
                    resolvedPath={controller.externalEmailTemplate.resolvedPath}
                    sampleValues={controller.workbookPreview.sampleValues}
                    variables={controller.externalEmailTemplate.variables}
                  />
                ) : (
                  <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="xl" verticalSpacing="xl">
                    <EmailTemplateEditor
                      activeEditor={controller.templateBuilder.activeEditor}
                      availableVariables={controller.workbookPreview.availableVariables}
                      editorRefs={controller.templateBuilder.editorRefs}
                      emailTemplate={controller.templateBuilder.emailTemplate}
                      insertFieldToken={controller.templateBuilder.insertFieldToken}
                      setActiveEditor={controller.templateBuilder.setActiveEditor}
                      updateEmailField={controller.templateBuilder.updateEmailField}
                      validationIssues={controller.validation.issues.filter((issue) => issue.targetStep === 3)}
                    />
                    <TemplatePreviewPanel
                      emailTemplate={controller.templateBuilder.emailTemplate}
                      sampleValues={controller.workbookPreview.sampleValues}
                    />
                  </SimpleGrid>
                )}
                <WorkbookPreviewPanel
                  availableVariables={controller.workbookPreview.availableVariables}
                  defaultMode="compact"
                  headerMatchedMappings={controller.workbookMapping.headerMatchedMappings}
                  isLoading={controller.workbookPreview.isLoading}
                  loadError={controller.workbookPreview.loadError}
                  missingVariables={controller.workbookMapping.missingVariables}
                  onAssignmentChange={controller.workbookPreview.setFieldAssignment}
                  requiredVariables={controller.workbookMapping.requiredVariables}
                  rows={controller.workbookPreview.rows}
                  usageByVariable={controller.workbookMapping.usage}
                />
              </Stack>
            ) : null}

            {controller.activeStep === 4 ? (
              controller.generationResult ? (
                <GenerationSuccessPanel
                  isOpeningPath={controller.isOpeningPath}
                  onOpenPath={(targetPath) => void controller.handleOpenPath(targetPath)}
                  onStartAgain={controller.handleStartAgain}
                  result={controller.generationResult}
                />
              ) : (
                <ReviewSummaryPanel
                  generationOptions={controller.contractSettings.generationOptions}
                  mappedContractFields={controller.contractSettings.mappedContractFields}
                  emailTemplate={controller.activeEmailTemplate}
                  missingWorkbookVariables={controller.workbookMapping.missingVariables}
                  onGoToStep={controller.setActiveStep}
                  preflight={controller.preflight.result}
                  preflightLoading={controller.preflight.isLoading}
                  requiredWorkbookVariables={controller.workbookMapping.requiredVariables}
                  rows={controller.workbookPreview.rows}
                  skippedRows={controller.workbookPreview.skippedRows}
                  totalContractFields={controller.workbookPreview.contractVariables.length}
                  totalRows={controller.workbookPreview.totalRows}
                  usageByVariable={controller.workbookMapping.usage}
                />
              )
            ) : null}

            {navigationWarning ? (
              <Alert color="yellow" radius="lg" variant="light">
                {navigationWarning}
              </Alert>
            ) : null}
          </Stack>
          </Box>

          <footer className="workflow-footer">
            <Stack gap={2} className="workflow-footer__meta">
              <Text c="dimmed">{copy.steps[controller.activeStep].nextHint}</Text>
              {controller.projectPersistence.lastProjectPath ? (
                <Text c="dimmed" size="sm">
                  {copy.app.projectFileLabel}: {controller.projectPersistence.lastProjectPath}
                </Text>
              ) : null}
            </Stack>
            <Group className="workflow-footer__actions" gap="sm">
              {controller.activeStep > 1 ? (
                <Button
                  onClick={() => {
                    if (controller.previousStep) {
                      controller.setActiveStep(controller.previousStep);
                      scrollToTop();
                    }
                  }}
                  size="md"
                  variant="default"
                >
                  {copy.app.back}
                </Button>
              ) : null}
              {controller.nextStep ? (
                <Button
                  onClick={() => {
                    if (!controller.nextStep) {
                      return;
                    }

                    const nextIssue = controller.validation.firstIssueForStepBefore(controller.nextStep);
                    if (nextIssue) {
                      setNavigationWarning(nextIssue.id === 'output-filename-pattern' ? null : nextIssue.detail);
                      return;
                    }

                    setNavigationWarning(null);
                    controller.setActiveStep(controller.nextStep);
                    scrollToTop();
                  }}
                  size="md"
                >
                  {copy.app.continueTo} {copy.steps[controller.nextStep].title}
                </Button>
              ) : (
                <Button
                  disabled={!controller.canGenerateNow}
                  loading={controller.isGenerating}
                  onClick={() => void controller.handleGenerateProject()}
                  size="md"
                >
                  {controller.isGenerating ? copy.app.generating : copy.app.generatingNow}
                </Button>
              )}
            </Group>
          </footer>
        </Card>
      </div>
    </main>
  );
}
