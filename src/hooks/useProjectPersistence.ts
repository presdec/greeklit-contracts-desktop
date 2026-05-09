import { useAtomValue, useSetAtom } from 'jotai/react';
import { useCallback, useEffect, useState } from 'react';
import { hydrateWorkspaceAtom, markSavedAtom, workspaceDocumentAtom } from '../state/workspace';
import type { RecentProjectEntry } from '../../shared/desktop';

const lastProjectPathStorageKey = 'greeklit.lastProjectPath';

function readLastProjectPath() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(lastProjectPathStorageKey);
}

function rememberLastProjectPath(filePath: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(lastProjectPathStorageKey, filePath);
  }
}

export function useProjectPersistence(desktopApp: Window['desktopApp']) {
  const workspaceDocument = useAtomValue(workspaceDocumentAtom);
  const hydrateWorkspace = useSetAtom(hydrateWorkspaceAtom);
  const markSaved = useSetAtom(markSavedAtom);
  const [isOpeningProject, setIsOpeningProject] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [lastProjectPath, setLastProjectPath] = useState<string | null>(() => readLastProjectPath());
  const [recentProjects, setRecentProjects] = useState<RecentProjectEntry[]>([]);

  const refreshRecentProjects = useCallback(async () => {
    setRecentProjects(await desktopApp.getRecentProjects());
  }, [desktopApp]);

  useEffect(() => {
    void refreshRecentProjects();
  }, [refreshRecentProjects]);

  const openProjectPath = useCallback(async (filePath?: string | null) => {
    setIsOpeningProject(true);
    try {
      const result = await desktopApp.openProject(filePath);
      if (!result) {
        return null;
      }

      hydrateWorkspace(result.projectDocument);
      markSaved();
      setLastProjectPath(result.filePath);
      rememberLastProjectPath(result.filePath);
      await refreshRecentProjects();
      return result.filePath;
    } finally {
      setIsOpeningProject(false);
    }
  }, [desktopApp, hydrateWorkspace, refreshRecentProjects]);

  const openProject = useCallback(async () => openProjectPath(), [openProjectPath]);

  const openLastProject = useCallback(async () => {
    const filePath = recentProjects[0]?.filePath ?? lastProjectPath;
    if (!filePath) {
      return null;
    }

    return openProjectPath(filePath);
  }, [lastProjectPath, openProjectPath, recentProjects]);

  const saveProject = useCallback(async (options?: { saveAs?: boolean }) => {
    setIsSavingProject(true);
    try {
      const savedPath = await desktopApp.saveProject(
        workspaceDocument,
        options?.saveAs ? null : lastProjectPath,
      );
      if (!savedPath) {
        return null;
      }

      markSaved();
      setLastProjectPath(savedPath);
      rememberLastProjectPath(savedPath);
      await refreshRecentProjects();
      return savedPath;
    } finally {
      setIsSavingProject(false);
    }
  }, [desktopApp, lastProjectPath, refreshRecentProjects, workspaceDocument]);

  return {
    isOpeningProject,
    isSavingProject,
    lastProjectPath,
    openProjectPath,
    openLastProject,
    openProject,
    recentProjects,
    saveProject,
  };
}
