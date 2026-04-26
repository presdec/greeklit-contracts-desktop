import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(scriptDir, '..');
const workspaceRoot = resolve(appDir, '..');
const scriptArgs = process.argv.slice(2);
const separatorIndex = scriptArgs.indexOf('--');
if (separatorIndex > 0) {
  scriptArgs.splice(separatorIndex, 1);
}

if (scriptArgs.length === 0) {
  console.error('Usage: node scripts/run_python_script.mjs <script.py> [...args]');
  process.exit(2);
}

const pythonExecutableName = process.platform === 'win32' ? 'python.exe' : 'python';
const candidates = [
  process.env.GREEKLIT_PYTHON_PATH
    ? {
        argsPrefix: [],
        command: process.env.GREEKLIT_PYTHON_PATH,
        label: 'GREEKLIT_PYTHON_PATH',
      }
    : null,
  process.env.PYTHON
    ? {
        argsPrefix: [],
        command: process.env.PYTHON,
        label: 'PYTHON',
      }
    : null,
  {
    argsPrefix: [],
    command: join(workspaceRoot, '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', pythonExecutableName),
    label: 'workspace .venv',
  },
  {
    argsPrefix: [],
    command: join(appDir, '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', pythonExecutableName),
    label: 'app .venv',
  },
  process.platform === 'win32'
    ? {
        argsPrefix: ['-3'],
        command: 'py',
        label: 'py -3 from PATH',
      }
    : null,
  {
    argsPrefix: [],
    command: 'python3',
    label: 'python3 from PATH',
  },
  {
    argsPrefix: [],
    command: 'python',
    label: 'python from PATH',
  },
].filter(Boolean);

function canRun(candidate) {
  if (
    candidate.command.includes('/') || candidate.command.includes('\\')
  ) {
    if (!existsSync(candidate.command)) {
      return false;
    }
  }

  const result = spawnSync(candidate.command, [...candidate.argsPrefix, '-V'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  return result.status === 0;
}

const python = candidates.find(canRun);

if (!python) {
  console.error('No usable Python runtime found.');
  process.exit(1);
}

const result = spawnSync(python.command, [...python.argsPrefix, ...scriptArgs], {
  cwd: appDir,
  encoding: 'utf8',
  stdio: 'inherit',
  windowsHide: true,
});

process.exit(result.status ?? 1);
