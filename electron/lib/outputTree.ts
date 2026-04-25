import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { OutputTreeEntry } from '../../shared/desktop';

export async function collectOutputTree(rootPath: string) {
  const entries: OutputTreeEntry[] = [];

  async function walk(currentPath: string) {
    const info = await stat(currentPath);
    const relativePath = relative(rootPath, currentPath) || '.';

    entries.push({
      absolutePath: currentPath,
      kind: info.isDirectory() ? 'directory' : 'file',
      relativePath,
    });

    if (!info.isDirectory()) {
      return;
    }

    const children = await readdir(currentPath, { withFileTypes: true });
    for (const child of children.sort((a, b) => a.name.localeCompare(b.name))) {
      await walk(join(currentPath, child.name));
    }
  }

  await walk(rootPath);

  return entries;
}
