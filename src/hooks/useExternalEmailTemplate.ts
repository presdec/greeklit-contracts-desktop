import { useEffect, useState } from 'react';

export function useExternalEmailTemplate(
  desktopApp: Window['desktopApp'],
  enabled: boolean,
  templatePath: string,
) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resolvedPath, setResolvedPath] = useState('');
  const [variables, setVariables] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) {
      setContent('');
      setIsLoading(false);
      setLoadError(null);
      setResolvedPath('');
      setVariables([]);
      return undefined;
    }

    const trimmedPath = templatePath.trim();
    if (!trimmedPath) {
      setContent('');
      setIsLoading(false);
      setLoadError(null);
      setResolvedPath('');
      setVariables([]);
      return undefined;
    }

    let cancelled = false;

    async function run() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const result = await desktopApp.inspectEmailTemplate({ templatePath: trimmedPath });
        if (cancelled) {
          return;
        }

        setContent(result.content);
        setResolvedPath(result.templatePath);
        setVariables(result.variables);
      } catch (error) {
        if (!cancelled) {
          setContent('');
          setResolvedPath(trimmedPath);
          setVariables([]);
          setLoadError(error instanceof Error ? error.message : 'Could not load email template.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [desktopApp, enabled, templatePath]);

  return {
    content,
    isLoading,
    loadError,
    resolvedPath,
    variables,
  };
}
