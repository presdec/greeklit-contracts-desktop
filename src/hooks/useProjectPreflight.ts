import { useEffect, useState } from 'react';
import type { GenerateProjectRequest, ProjectPreflightResult } from '../../shared/desktop';
import { useI18n } from '../i18n';

export function useProjectPreflight(
  desktopApp: Window['desktopApp'],
  request: GenerateProjectRequest,
  enabled: boolean,
) {
  const { language } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ProjectPreflightResult | null>(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;

    async function run() {
      setIsLoading(true);
      try {
        const nextResult = await desktopApp.validateProject(request);
        if (!cancelled) {
          setResult(nextResult);
        }
      } catch (error) {
        if (!cancelled) {
          setResult({
            canGenerate: false,
            checks: [
              {
                detail: error instanceof Error
                  ? error.message
                  : (language === 'el' ? 'Αδυναμία εκτέλεσης προελέγχου.' : 'Could not run preflight validation.'),
                id: 'preflight-runtime',
                label: language === 'el' ? 'Προέλεγχος' : 'Preflight validation',
                status: 'fail',
              },
            ],
            errors: [
              error instanceof Error
                ? error.message
                : (language === 'el' ? 'Αδυναμία εκτέλεσης προελέγχου.' : 'Could not run preflight validation.'),
            ],
            pdfBackend: 'none',
            warnings: [],
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    const timeout = window.setTimeout(() => {
      void run();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [desktopApp, enabled, language, request]);

  return {
    isLoading,
    result,
  };
}
