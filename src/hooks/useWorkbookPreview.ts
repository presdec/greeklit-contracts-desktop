import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkbookPreviewSampleRow } from '../../shared/desktop';
import { canonicalVariables } from '../data/defaults';
import { usageForVariable } from '../lib/template';
import type { WorkbookPreviewRow } from '../types/template';
import type { ProjectConfig } from '../../shared/desktop';

export function useWorkbookPreview(
  desktopApp: Window['desktopApp'],
  project: ProjectConfig,
  emailVariables: string[],
) {
  const [contractTokenContexts, setContractTokenContexts] = useState<Record<string, string>>({});
  const [contractVariables, setContractVariables] = useState<string[]>([]);
  const [fieldAssignments, setFieldAssignments] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rawColumns, setRawColumns] = useState<
    Array<{ columnLetter: string; header: string; sampleValue: string; suggestedVariable: string | null }>
  >([]);
  const [sampleRows, setSampleRows] = useState<WorkbookPreviewSampleRow[]>([]);

  useEffect(() => {
    let isActive = true;

    async function loadPreview() {
      if (!project.workbookPath || !project.worksheetName) {
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const result = await desktopApp.inspectProject({
          contractTemplatePath: project.contractTemplatePath,
          dataStartRow: project.dataStartRow,
          headerRow: project.headerRow,
          workbookPath: project.workbookPath,
          worksheetName: project.worksheetName,
        });

        if (!isActive) {
          return;
        }

        setRawColumns(result.columns);
        setContractTokenContexts(result.contractTokenContexts ?? {});
        setContractVariables(result.contractTokens);
        setSampleRows(result.sampleRows);
      } catch (error) {
        if (!isActive) {
          return;
        }
        setLoadError(error instanceof Error ? error.message : 'Could not inspect workbook.');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadPreview();

    return () => {
      isActive = false;
    };
  }, [
    desktopApp,
    project.contractTemplatePath,
    project.dataStartRow,
    project.headerRow,
    project.workbookPath,
    project.worksheetName,
  ]);

  const availableVariables = useMemo(
    () =>
      Array.from(
        new Set([
          ...canonicalVariables,
          ...contractVariables,
          ...emailVariables,
          ...rawColumns.map((column) => column.suggestedVariable).filter(Boolean),
        ]),
      ) as string[],
    [contractVariables, emailVariables, rawColumns],
  );

  useEffect(() => {
    setFieldAssignments((current) => {
      const nextAssignments = { ...current };
      let hasChanges = false;
      const usedVariables = new Set(
        Object.values(current).filter((value) => value),
      );

      for (const column of rawColumns) {
        if (nextAssignments[column.columnLetter]) {
          continue;
        }

        const suggestedVariable = column.suggestedVariable ?? '';

        if (!suggestedVariable || usedVariables.has(suggestedVariable)) {
          continue;
        }

        nextAssignments[column.columnLetter] = suggestedVariable;
        usedVariables.add(suggestedVariable);
        hasChanges = true;
      }

      return hasChanges ? nextAssignments : current;
    });
  }, [rawColumns]);

  const rows: WorkbookPreviewRow[] = useMemo(
    () =>
      rawColumns.map((column) => {
        const selectedVariable = fieldAssignments[column.columnLetter] ?? '';
        return {
          ...column,
          selectedVariable,
          usedBy: usageForVariable(selectedVariable, emailVariables, contractVariables),
        };
      }),
    [contractVariables, emailVariables, fieldAssignments, rawColumns],
  );

  const sampleValues = useMemo(
    () =>
      rows.reduce<Record<string, string>>((accumulator, row) => {
        if (row.selectedVariable) {
          accumulator[row.selectedVariable] = row.sampleValue;
        }
        return accumulator;
      }, {}),
    [rows],
  );

  const setFieldAssignment = useCallback((columnLetter: string, variable: string | null) =>
    setFieldAssignments((current) => {
      const nextValue = variable ?? '';

      if (current[columnLetter] === nextValue) {
        return current;
      }

      const nextAssignments = {
        ...current,
        [columnLetter]: nextValue,
      };

      if (nextValue) {
        for (const [existingColumn, existingValue] of Object.entries(nextAssignments)) {
          if (existingColumn !== columnLetter && existingValue === nextValue) {
            nextAssignments[existingColumn] = '';
          }
        }
      }

      return nextAssignments;
    }), []);

  return {
    availableVariables,
    contractTokenContexts,
    contractVariables,
    isLoading,
    loadError,
    rows,
    sampleRows,
    sampleValues,
    setFieldAssignment,
  };
}
