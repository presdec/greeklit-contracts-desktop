import { Alert, Badge, Group, Paper, Stack, Text, Title } from '@mantine/core';
import type { ProjectPreflightCheck } from '../../shared/desktop';
import type { ProjectPreflightResult } from '../../shared/desktop';
import type { EmailTemplateState, GenerationOptions, WorkbookPreviewRow } from '../types/template';
import { useI18n } from '../i18n';

type Props = {
  generationOptions: GenerationOptions;
  mappedContractFields: number;
  totalContractFields: number;
  emailTemplate: EmailTemplateState;
  preflight: ProjectPreflightResult | null;
  preflightLoading: boolean;
  rows: WorkbookPreviewRow[];
};

function localizePreflightCheck(check: ProjectPreflightCheck, language: 'en' | 'el') {
  if (language !== 'el') {
    return check;
  }

  const greekById: Record<string, { detail: string; label: string }> = {
    'outputs': {
      label: 'Επιλογή εξόδου',
      detail: 'Επιλέξτε τουλάχιστον έναν τύπο εξόδου πριν τη δημιουργία.',
    },
    'payload': {
      label: 'Δεδομένα δημιουργίας',
      detail: 'Αδυναμία προετοιμασίας δεδομένων δημιουργίας.',
    },
    'python-runtime': {
      label: 'Runtime Python',
      detail: 'Έλεγχος διαθεσιμότητας runtime Python.',
    },
    'generator-script': {
      label: 'Scripts generator',
      detail: 'Έλεγχος ύπαρξης των απαραίτητων scripts generator.',
    },
    'workbook': {
      label: 'Αρχείο workbook',
      detail: 'Το workbook πρέπει να υπάρχει στον δίσκο.',
    },
    'contract-template': {
      label: 'Πρότυπο Word',
      detail: 'Το πρότυπο Word είναι απαραίτητο για DOCX ή PDF.',
    },
    'email-template-file': {
      label: 'Αρχείο προτύπου email',
      detail: 'Επιλέξτε έγκυρο αρχείο προτύπου email ή απενεργοποιήστε την επιλογή εξωτερικού αρχείου.',
    },
    'output-directory': {
      label: 'Φάκελος εξόδου',
      detail: 'Ο φάκελος εξόδου πρέπει να είναι προσβάσιμος για εγγραφή.',
    },
    'worksheet': {
      label: 'Φύλλο και ρυθμίσεις γραμμών',
      detail: 'Επαλήθευση ονόματος φύλλου, γραμμής επικεφαλίδων και γραμμής έναρξης δεδομένων.',
    },
    'mappings': {
      label: 'Αντιστοιχίσεις placeholders',
      detail: 'Απαιτείται τουλάχιστον μία αντιστοίχιση Word ή email placeholder.',
    },
    'required-placeholders': {
      label: 'Κάλυψη απαιτούμενων placeholders',
      detail: 'Όλα τα απαιτούμενα placeholders Word και email πρέπει να είναι αντιστοιχισμένα.',
    },
    'pdf-backend': {
      label: 'Δυνατότητα PDF',
      detail: 'Απαιτείται διαθέσιμο backend PDF για παραγωγή PDF.',
    },
    'preflight-runtime': {
      label: 'Προέλεγχος',
      detail: 'Αδυναμία εκτέλεσης προελέγχου.',
    },
  };

  const localized = greekById[check.id];
  if (!localized) {
    return check;
  }

  return {
    ...check,
    detail: check.status === 'fail' ? `${localized.detail} ${check.detail}` : localized.detail,
    label: localized.label,
  };
}

export function ReviewSummaryPanel({
  generationOptions,
  mappedContractFields,
  totalContractFields,
  emailTemplate,
  preflight,
  preflightLoading,
  rows,
}: Props) {
  const { copy, language } = useI18n();
  const mappedRows = rows.filter((row) => row.selectedVariable);
  const outputLabel = [
    generationOptions.generateDocx ? copy.outputLabels.word : null,
    generationOptions.generatePdf ? copy.outputLabels.pdf : null,
    generationOptions.generateEmailDrafts ? copy.outputLabels.email : null,
  ].filter(Boolean).join(' + ');

  return (
    <Paper className="panel-card" p="lg" radius="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={3}>{copy.review.title}</Title>
            <Text c="dimmed" size="sm">
              {copy.review.subtitle}
            </Text>
          </div>
          <Badge color="teal" variant="light">
            {copy.review.badge}
          </Badge>
        </Group>

        <Group gap="md">
          <Paper className="mini-stat" p="md" radius="lg">
            <Text c="dimmed" size="sm">{copy.review.mappedColumns}</Text>
            <Title order={2}>{mappedRows.length}</Title>
          </Paper>
          {generationOptions.generateDocx || generationOptions.generatePdf ? (
            <Paper className="mini-stat" p="md" radius="lg">
              <Text c="dimmed" size="sm">{copy.review.mappedWordFields}</Text>
              <Title order={2}>
                {mappedContractFields}/{totalContractFields}
              </Title>
            </Paper>
          ) : null}
          <Paper className="mini-stat" p="md" radius="lg">
            <Text c="dimmed" size="sm">{copy.review.emailBodyLength}</Text>
            <Title order={2}>{emailTemplate.body.length}</Title>
          </Paper>
        </Group>

        <Text size="sm">{copy.review.selectedOutput}: {outputLabel || copy.outputLabels.none}</Text>

        {preflightLoading ? (
          <Alert color="blue" title={copy.review.preflightLoadingTitle} variant="light">
            {copy.review.preflightLoadingBody}
          </Alert>
        ) : null}

        {preflight ? (
          <Stack gap="sm">
            <Title order={4}>{copy.review.setupCheck}</Title>
            {preflight.checks.map((check) => {
              const localizedCheck = localizePreflightCheck(check, language);

              return (
                <Paper key={check.id} p="sm" radius="md" withBorder>
                <Group justify="space-between" wrap="nowrap">
                  <div>
                    <Text fw={600} size="sm">{localizedCheck.label}</Text>
                    <Text c="dimmed" size="sm">{localizedCheck.detail}</Text>
                  </div>
                  <Badge
                    color={
                      localizedCheck.status === 'pass'
                        ? 'teal'
                        : localizedCheck.status === 'warn'
                          ? 'yellow'
                          : 'red'
                    }
                    variant="light"
                  >
                    {localizedCheck.status === 'pass'
                      ? copy.review.statusPass
                      : localizedCheck.status === 'warn'
                        ? copy.review.statusWarn
                        : copy.review.statusFail}
                  </Badge>
                </Group>
              </Paper>
              );
            })}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}
