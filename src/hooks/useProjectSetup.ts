import { useCallback, useState } from 'react';
import type { FileDialogRequest, ProjectConfig } from '../../shared/desktop';
import { initialProject } from '../data/defaults';

export function useProjectSetup(desktopApp: Window['desktopApp']) {
  const [activePicker, setActivePicker] = useState<keyof ProjectConfig | null>(null);
  const [isOpeningProject, setIsOpeningProject] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [lastProjectPath, setLastProjectPath] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectConfig>(initialProject);

  const pickProjectPath = useCallback(async (
    field: keyof Pick<
      ProjectConfig,
      'workbookPath' | 'contractTemplatePath' | 'emailTemplatePath' | 'outputFolderPath'
    >,
    request: FileDialogRequest,
  ) => {
    setActivePicker(field);
    try {
      const selectedPath = await desktopApp.pickPath(request);
      if (!selectedPath) {
        return null;
      }
      setProject((current) => {
        if (current[field] === selectedPath) {
          return current;
        }

        return { ...current, [field]: selectedPath };
      });
      return selectedPath;
    } finally {
      setActivePicker(null);
    }
  }, [desktopApp]);

  const openProject = useCallback(async () => {
    setIsOpeningProject(true);
    try {
      const result = await desktopApp.openProject();
      if (!result) {
        return null;
      }
      setProject(result.project);
      setLastProjectPath(result.filePath);
      return result.filePath;
    } finally {
      setIsOpeningProject(false);
    }
  }, [desktopApp]);

  const saveProject = useCallback(async () => {
    setIsSavingProject(true);
    try {
      const savedPath = await desktopApp.saveProject(project);
      if (!savedPath) {
        return null;
      }
      setLastProjectPath(savedPath);
      return savedPath;
    } finally {
      setIsSavingProject(false);
    }
  }, [desktopApp, project]);

  return {
    activePicker,
    isOpeningProject,
    isSavingProject,
    lastProjectPath,
    openProject,
    pickProjectPath,
    project,
    saveProject,
    setProject,
  };
}
