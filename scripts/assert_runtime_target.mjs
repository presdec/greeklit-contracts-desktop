import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(scriptDir, '..');
const runtimeKey = process.argv[2];

if (!runtimeKey) {
  console.error('Usage: node scripts/assert_runtime_target.mjs <platform-arch>');
  process.exit(2);
}

const targetDir = join(appDir, 'runtime', runtimeKey);
const executableSuffix = runtimeKey.startsWith('win32-') ? '.exe' : '';
const requiredFiles = [
  `generate_contracts${executableSuffix}`,
  `generate_email_drafts${executableSuffix}`,
  `inspect_project${executableSuffix}`,
  'manifest.json',
];
const missingFiles = requiredFiles.filter((fileName) => !existsSync(join(targetDir, fileName)));

if (missingFiles.length > 0) {
  console.error(
    [
      `Missing packaged runtime for ${runtimeKey}.`,
      `Expected directory: ${targetDir}`,
      `Missing files: ${missingFiles.join(', ')}`,
      '',
      'Build Linux release artifacts on Linux, WSL, or a Linux CI runner so PyInstaller creates runtime/linux-x64.',
      'If you cross-package elsewhere, copy a previously built runtime/linux-x64 directory into app/runtime first.',
    ].join('\n'),
  );
  process.exit(1);
}

console.log(`Runtime target ${runtimeKey} is ready: ${targetDir}`);
