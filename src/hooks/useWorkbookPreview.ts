import { useAtom } from 'jotai/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WorkbookHeaderAnalysis, WorkbookPreviewColumn, WorkbookPreviewRawRow, WorkbookPreviewSampleRow } from '../../shared/desktop';
import type { TemplateStatusResult } from '../../shared/desktop';
import { variableColumnsAtom } from '../state/workspace';
import type { WorkbookPreviewRow } from '../types/template';
import type { ProjectConfig } from '../../shared/desktop';

const NUMERIC_INPUT_DEBOUNCE_MS = 400;

function normalizePreviewError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const permissionMatch = message.match(/PermissionError: \[Errno 13\] Permission denied: '([^']+)'/);
  if (permissionMatch) {
    return `The workbook could not be opened: ${permissionMatch[1]}. Close it in Excel, wait for OneDrive sync to finish, then reload the preview.`;
  }

  if (/Permission denied|EPERM|EACCES/i.test(message)) {
    return 'The workbook could not be opened. Close it in Excel, wait for OneDrive sync to finish, then reload the preview.';
  }

  return error instanceof Error ? error.message : 'Could not inspect workbook.';
}

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
  const [headerAnalysis, setHeaderAnalysis] = useState<WorkbookHeaderAnalysis | null>(null);
  const [maxColumn, setMaxColumn] = useState(0);
  const [previewRows, setPreviewRows] = useState<WorkbookPreviewRawRow[]>([]);
  const [rawColumns, setRawColumns] = useState<WorkbookPreviewColumn[]>([]);
  const [sampleRows, setSampleRows] = useState<WorkbookPreviewSampleRow[]>([]);
  const [templateStatus, setTemplateStatus] = useState<TemplateStatusResult | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [skippedRows, setSkippedRows] = useState(0);
  const [worksheetNames, setWorksheetNames] = useState<string[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const previewRequestId = useRef(0);
  const lastContractTemplatePathRef = useRef<string | undefined>(undefined);

  const debouncedHeaderRow = useDebounced(project.headerRow, NUMERIC_INPUT_DEBOUNCE_MS);
  const debouncedDataStartRow = useDebounced(project.dataStartRow, NUMERIC_INPUT_DEBOUNCE_MS);

  const refreshPreview = useCallback((options?: { forceTemplateReload?: boolean }) => {
    if (options?.forceTemplateReload) {
      lastContractTemplatePathRef.current = undefined;
    }

    setRefreshTick((current) => current + 1);
  }, []);

  const clearPreview = useCallback(() => {
    setContractTokenContexts({});
    setContractVariables([]);
    setColumnValues({});
    setHeaderAnalysis(null);
    setLoadError(null);
    setMaxColumn(0);
    setPreviewRows([]);
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

    const contractPathChanged =
      project.contractTemplatePath !== lastContractTemplatePathRef.current;

    if (!project.workbookPath) {
      if (!contractPathChanged) {
        clearPreview();
        setIsLoading(false);
        return;
      }
      // No workbook yet, but template path changed — do a template-only scan
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = await desktopApp.inspectProject({
          contractTemplatePath: project.contractTemplatePath,
          dataStartRow: 2,
          headerRow: 1,
          rejectionColumn: project.rejectionColumn,
          rejectionValue: project.rejectionValue,
          workbookPath: '',
          worksheetName: '',
        });
        if (previewRequestId.current !== requestId) {
          return;
        }
        setContractTokenContexts(result.contractTokenContexts ?? {});
        setContractVariables(result.contractTokens);
        lastContractTemplatePathRef.current = project.contractTemplatePath;
      } catch {
        // ignore errors on template-only scan
      } finally {
        if (previewRequestId.current === requestId) {
          setIsLoading(false);
        }
      }
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
      setHeaderAnalysis(result.headerAnalysis ?? null);
      setMaxColumn(result.maxColumn ?? 0);
      setPreviewRows(result.previewRows ?? []);
      if (contractPathChanged) {
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
    } catch (error) {
      if (previewRequestId.current === requestId) {
        setLoadError(normalizePreviewError(error));
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
    const requiredVariables = new Set([
      ...contractVariables,
      ...emailVariables,
      ...filenameVariables,
    ]);

    if (requiredVariables.size === 0 || rawColumns.length === 0) {
      return;
    }

    setFieldAssignments((current) => {
      const usedVariables = new Set(Object.values(current).filter(Boolean));
      let changed = false;
      const nextAssignments = { ...current };

      for (const column of rawColumns) {
        const suggestedVariable = column.suggestedVariable;
        if (
          !suggestedVariable
          || !requiredVariables.has(suggestedVariable)
          || nextAssignments[column.columnLetter]
          || usedVariables.has(suggestedVariable)
        ) {
          continue;
        }

        nextAssignments[column.columnLetter] = suggestedVariable;
        usedVariables.add(suggestedVariable);
        changed = true;
      }

      return changed ? nextAssignments : current;
    });
  }, [contractVariables, emailVariables, filenameVariables, rawColumns, setFieldAssignments]);

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
          ...contractVariables,
          ...emailVariables,
          ...filenameVariables,
          ...Object.values(fieldAssignments).filter(Boolean),
        ]),
      ),
    [contractVariables, emailVariables, filenameVariables, fieldAssignments],
  );

  const rows: WorkbookPreviewRow[] = useMemo(
    () =>
      rawColumns.map((column) => {
        const selectedVariable = fieldAssignments[column.columnLetter] ?? '';
        return {
          ...column,
          selectedVariable,
          usedBy: 'unused',
        };
      }),
    [fieldAssignments, rawColumns],
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
    headerAnalysis,
    loadError,
    maxColumn,
    previewRows,
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
