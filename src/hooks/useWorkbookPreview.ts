import { useAtom } from 'jotai/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WorkbookPreviewSampleRow } from '../../shared/desktop';
import type { TemplateStatusResult } from '../../shared/desktop';
import { canonicalVariables } from '../data/defaults';
import { usageForVariable } from '../lib/template';
import { variableColumnsAtom } from '../state/workspace';
import type { WorkbookPreviewRow } from '../types/template';
import type { ProjectConfig } from '../../shared/desktop';

const NUMERIC_INPUT_DEBOUNCE_MS = 400;

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export function useWorkbookPreview(
  desktopApp: Window['desktopApp'],
  project: ProjectConfig,
  emailVariables: string[],
  filenameVariables: string[],
  onResolvedWorksheetName?: (worksheetName: string) => void,
) {
  const [contractTokenContexts, setContractTokenContexts] = useState<Record<string, string>>({});
  const [contractVariables, setContractVariables] = useState<string[]>([]);
  const [columnValues, setColumnValues] = useState<Record<string, string[]>>({});
  const [fieldAssignments, setFieldAssignments] = useAtom(variableColumnsAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rawColumns, setRawColumns] = useState<
    Array<{ columnLetter: string; header: string; sampleValue: string; suggestedVariable: string | null }>
  >([]);
  const [sampleRows, setSampleRows] = useState<WorkbookPreviewSampleRow[]>([]);
  const [templateStatus, setTemplateStatus] = useState<TemplateStatusResult | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [skippedRows, setSkippedRows] = useState(0);
  const [worksheetNames, setWorksheetNames] = useState<string[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const previewRequestId = useRef(0);
  // Track the last contract template path used so we can skip DOCX re-parsing
  // when only workbook row numbers or the worksheet changed.
  const lastContractTemplatePathRef = useRef<string | undefined>(undefined);

  // Debounce numeric row inputs so rapid changes don't fire a Python IPC call on every keystroke
  const debouncedHeaderRow = useDebounced(project.headerRow, NUMERIC_INPUT_DEBOUNCE_MS);
  const debouncedDataStartRow = useDebounced(project.dataStartRow, NUMERIC_INPUT_DEBOUNCE_MS);

  const refreshPreview = useCallback(() => {
    setRefreshTick((current) => current + 1);
  }, []);

  const clearPreview = useCallback(() => {
    setContractTokenContexts({});
    setContractVariables([]);
    setColumnValues({});
    setLoadError(null);
    setRawColumns([]);
    setSampleRows([]);
    setTemplateStatus(null);
    setTotalRows(0);
    setSkippedRows(0);
    setWorksheetNames([]);
  }, []);

  const loadTemplateStatus = useCallback(async () => {
    if (!project.contractTemplatePath) {
      setTemplateStatus(null);
      return;
    }

    const result = await desktopApp.getTemplateStatus({
      templatePath: project.contractTemplatePath,
    });
    setTemplateStatus(result);
  }, [desktopApp, project.contractTemplatePath]);

  const loadPreview = useCallback(async () => {
    const requestId = previewRequestId.current + 1;
    previewRequestId.current = requestId;

    if (!project.workbookPath) {
      clearPreview();
      setIsLoading(false);
      return;
    }

    const headerRow = Number.isFinite(debouncedHeaderRow) && debouncedHeaderRow > 0
      ? Math.floor(debouncedHeaderRow)
      : 1;
    const dataStartRow = Number.isFinite(debouncedDataStartRow) && debouncedDataStartRow > 0
      ? Math.floor(debouncedDataStartRow)
      : Math.max(2, headerRow + 1);
    const worksheetName = (project.worksheetName ?? '').trim();

    setIsLoading(true);
    setLoadError(null);

    // Only send contractTemplatePath to Python when it has changed since the
    // last successful call — avoids re-parsing the DOCX on every row change.
    const contractPathChanged =
      project.contractTemplatePath !== lastContractTemplatePathRef.current;
    const contractTemplatePathForRequest = contractPathChanged
      ? project.contractTemplatePath
      : undefined;

    try {
      const result = await desktopApp.inspectProject({
        contractTemplatePath: contractTemplatePathForRequest,
        dataStartRow,
        headerRow,
        rejectionColumn: project.rejectionColumn,
        rejectionValue: project.rejectionValue,
        workbookPath: project.workbookPath,
        worksheetName,
      });

      if (previewRequestId.current !== requestId) {
        return;
      }

      setRawColumns(result.columns);
      setColumnValues(result.columnValues ?? {});
      if (contractPathChanged) {
        // Only update contract tokens when the template actually changed.
        setContractTokenContexts(result.contractTokenContexts ?? {});
        setContractVariables(result.contractTokens);
        lastContractTemplatePathRef.current = project.contractTemplatePath;
      }
      setSampleRows(result.sampleRows);
      setTotalRows(result.totalRows);
      setSkippedRows(result.skippedRows ?? 0);
      setWorksheetNames(result.worksheetNames ?? []);
      if (!worksheetName && result.worksheetName) {
        onResolvedWorksheetName?.(result.worksheetName);
      }
      // loadTemplateStatus is handled by its own useEffect (on path change)
      // and 3-second polling — no need to call it here.
    } catch (error) {
      if (previewRequestId.current === requestId) {
        setLoadError(error instanceof Error ? error.message : 'Could not inspect workbook.');
      }
    } finally {
      if (previewRequestId.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [
    desktopApp,
    clearPreview,
    project.contractTemplatePath,
    debouncedDataStartRow,
    debouncedHeaderRow,
    project.rejectionColumn,
    project.rejectionValue,
    project.workbookPath,
    project.worksheetName,
    onResolvedWorksheetName,
  ]);

  useEffect(() => {
    async function run() {
      await loadPreview();
    }

    void run();
  }, [loadPreview, refreshTick]);

  useEffect(() => {
    if (!project.contractTemplatePath) {
      return undefined;
    }

    void loadTemplateStatus();

    const interval = window.setInterval(() => {
      void loadTemplateStatus();
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadTemplateStatus, project.contractTemplatePath]);

  const availableVariables = useMemo(
    () =>
      Array.from(
        new Set([
          ...canonicalVariables,
          ...contractVariables,
          ...emailVariables,
          ...filenameVariables,
          ...rawColumns.map((column) => column.suggestedVariable).filter(Boolean),
        ]),
      ) as string[],
    [contractVariables, emailVariables, filenameVariables, rawColumns],
  );

  const contractAndFilenameVariables = useMemo(
    () => Array.from(new Set([...contractVariables, ...filenameVariables])),
    [contractVariables, filenameVariables],
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
  }, [rawColumns, setFieldAssignments]);

  const rows: WorkbookPreviewRow[] = useMemo(
    () =>
      rawColumns.map((column) => {
        const selectedVariable = fieldAssignments[column.columnLetter] ?? '';
        return {
          ...column,
          selectedVariable,
          usedBy: usageForVariable(selectedVariable, emailVariables, contractAndFilenameVariables),
        };
      }),
    [contractAndFilenameVariables, emailVariables, fieldAssignments, rawColumns],
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
    columnValues,
    contractTokenContexts,
    contractVariables,
    isLoading,
    loadError,
    refreshPreview,
    rows,
    sampleRows,
    sampleValues,
    setFieldAssignment,
    templateStatus,
    totalRows,
    skippedRows,
    worksheetNames,
  };
}
