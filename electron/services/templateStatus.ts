import { existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { TemplateStatusRequest, TemplateStatusResult } from '../../shared/desktop';
import { resolveWorkspacePath } from '../lib/runtimePaths';

function getWordLockFilePath(templatePath: string) {
  const directory = dirname(templatePath);
  const basename = templatePath.split(/[/\\]/).pop() ?? '';
  return join(directory, `~$${basename}`);
}

export async function getTemplateStatus(
  request: TemplateStatusRequest,
): Promise<TemplateStatusResult> {
  const templatePath = resolveWorkspacePath(request.templatePath) ?? '';

  if (!templatePath || !existsSync(templatePath)) {
    return {
      exists: false,
      isLocked: false,
      lastModifiedMs: null,
      templatePath,
    };
  }

  const info = await stat(templatePath);

  return {
    exists: true,
    isLocked: existsSync(getWordLockFilePath(templatePath)),
    lastModifiedMs: info.mtimeMs,
    templatePath,
  };
}
