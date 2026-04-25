import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import type { SaveStarterTemplateRequest } from '../../shared/desktop';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));

export type RuntimeEntrypointName = 'emailGenerator' | 'generator' | 'inspectProject';

export type ResolvedPythonRuntime = {
  argsPrefix: string[];
  command: string;
  label: string;
};

export type ResolvedRuntimeEntrypoint = {
  absolutePath: string;
  exists: boolean;
  mode: 'packaged-executable' | 'python-script';
  name: RuntimeEntrypointName;
};

export type ResolvedRuntime = {
  emailGenerator: ResolvedRuntimeEntrypoint;
  generator: ResolvedRuntimeEntrypoint;
  inspectProject: ResolvedRuntimeEntrypoint;
  libreOfficeCommand: string | null;
  pythonRuntime: ResolvedPythonRuntime | null;
};

type CommandCandidate = {
  argsPrefix?: string[];
  command: string;
  label: string;
};

type RuntimeCommand = {
  args: string[];
  command: string;
};

export function getWorkspaceRoot() {
  return resolve(__dirname, '../../..');
}

function getResourcesRoot() {
  return process.resourcesPath ? resolve(process.resourcesPath) : getWorkspaceRoot();
}

function getPackagedRuntimeRoot() {
  return join(getResourcesRoot(), 'runtime');
}

function getPlatformExecutableName(baseName: string) {
  return process.platform === 'win32' ? `${baseName}.exe` : baseName;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value && value.trim()))),
  );
}

function getEntrypointEnvVar(name: RuntimeEntrypointName) {
  return {
    emailGenerator: 'GREEKLIT_EMAIL_GENERATOR_PATH',
    generator: 'GREEKLIT_GENERATOR_PATH',
    inspectProject: 'GREEKLIT_INSPECT_PROJECT_PATH',
  }[name];
}

function getDevEntrypointPath(name: RuntimeEntrypointName) {
  return {
    emailGenerator: join(getWorkspaceRoot(), 'app', 'scripts', 'generate_email_drafts.py'),
    generator: join(getWorkspaceRoot(), 'generate_contracts.py'),
    inspectProject: join(getWorkspaceRoot(), 'app', 'scripts', 'inspect_project.py'),
  }[name];
}

function getPackagedEntrypointCandidates(name: RuntimeEntrypointName) {
  const executableBaseName = {
    emailGenerator: 'generate_email_drafts',
    generator: 'generate_contracts',
    inspectProject: 'inspect_project',
  }[name];
  const executableName = getPlatformExecutableName(executableBaseName);

  return uniqueStrings([
    join(getPackagedRuntimeRoot(), executableName),
    join(getResourcesRoot(), 'bin', executableName),
  ]);
}

function resolveRuntimeEntrypoint(name: RuntimeEntrypointName): ResolvedRuntimeEntrypoint {
  const envOverride = process.env[getEntrypointEnvVar(name)];

  if (envOverride) {
    return {
      absolutePath: envOverride,
      exists: existsSync(envOverride),
      mode: envOverride.toLowerCase().endsWith('.py') ? 'python-script' : 'packaged-executable',
      name,
    };
  }

  const packagedPath = getPackagedEntrypointCandidates(name).find((candidate) => existsSync(candidate));
  if (packagedPath) {
    return {
      absolutePath: packagedPath,
      exists: true,
      mode: 'packaged-executable',
      name,
    };
  }

  const devPath = getDevEntrypointPath(name);
  return {
    absolutePath: devPath,
    exists: existsSync(devPath),
    mode: 'python-script',
    name,
  };
}

async function canRunCommand(candidate: CommandCandidate, verifyArgs: string[]) {
  try {
    await execFileAsync(candidate.command, [...(candidate.argsPrefix ?? []), ...verifyArgs], {
      timeout: 15_000,
      windowsHide: true,
    });
    return true;
  } catch {
    return false;
  }
}

function getPythonCandidates(homePath: string): CommandCandidate[] {
  const pythonExecutableName = process.platform === 'win32' ? 'python.exe' : 'python';
  const workspaceVenv = join(
    getWorkspaceRoot(),
    '.venv',
    process.platform === 'win32' ? 'Scripts' : 'bin',
    pythonExecutableName,
  );
  const homeAnaconda = join(
    homePath,
    'anaconda3',
    process.platform === 'win32' ? 'python.exe' : join('bin', 'python'),
  );
  const homeMiniconda = join(
    homePath,
    'miniconda3',
    process.platform === 'win32' ? 'python.exe' : join('bin', 'python'),
  );
  const candidates: CommandCandidate[] = [
    process.env.GREEKLIT_PYTHON_PATH
      ? {
          command: process.env.GREEKLIT_PYTHON_PATH,
          label: 'GREEKLIT_PYTHON_PATH',
        }
      : null,
    process.env.PYTHON
      ? {
          command: process.env.PYTHON,
          label: 'PYTHON',
        }
      : null,
    {
      command: workspaceVenv,
      label: 'workspace .venv',
    },
    {
      command: homeAnaconda,
      label: 'home anaconda3',
    },
    {
      command: homeMiniconda,
      label: 'home miniconda3',
    },
    process.platform === 'win32'
      ? {
          argsPrefix: ['-3'],
          command: 'py',
          label: 'py -3 from PATH',
        }
      : null,
    {
      command: 'python3',
      label: 'python3 from PATH',
    },
    {
      command: 'python',
      label: 'python from PATH',
    },
  ].filter((candidate): candidate is CommandCandidate => Boolean(candidate));

  return candidates.filter((candidate, index, allCandidates) => {
    const signature = `${candidate.command}::${(candidate.argsPrefix ?? []).join(' ')}`;
    return allCandidates.findIndex((item) => {
      const itemSignature = `${item.command}::${(item.argsPrefix ?? []).join(' ')}`;
      return itemSignature === signature;
    }) === index;
  });
}

async function resolvePythonRuntime(homePath: string) {
  for (const candidate of getPythonCandidates(homePath)) {
    const canRun = await canRunCommand(candidate, ['-V']);
    if (!canRun) {
      continue;
    }

    return {
      argsPrefix: candidate.argsPrefix ?? [],
      command: candidate.command,
      label: candidate.label,
    } satisfies ResolvedPythonRuntime;
  }

  return null;
}

function getLibreOfficeCandidates(preferredCommand?: string) {
  const bundledConsoleName = process.platform === 'win32' ? 'soffice.com' : 'soffice';

  return uniqueStrings([
    process.env.GREEKLIT_LIBREOFFICE_PATH,
    preferredCommand,
    join(getPackagedRuntimeRoot(), bundledConsoleName),
    join(getResourcesRoot(), 'LibreOffice', 'program', bundledConsoleName),
    'soffice.com',
    'soffice',
    'libreoffice',
    'C:/Program Files/LibreOffice/program/soffice.com',
    'C:/Program Files/LibreOffice/program/soffice.exe',
    'C:/Program Files (x86)/LibreOffice/program/soffice.com',
    'C:/Program Files (x86)/LibreOffice/program/soffice.exe',
    '/usr/bin/soffice',
    '/usr/local/bin/soffice',
    '/snap/bin/libreoffice',
    '/Applications/LibreOffice.app/Contents/MacOS/soffice',
  ]);
}

export async function resolveLibreOfficeCommand(preferredCommand?: string) {
  for (const candidate of getLibreOfficeCandidates(preferredCommand)) {
    const canRun = await canRunCommand(
      {
        command: candidate,
        label: candidate,
      },
      ['--version'],
    );
    if (canRun) {
      return candidate;
    }
  }

  return null;
}

export async function resolveRuntime(homePath: string): Promise<ResolvedRuntime> {
  const runtime = {
    emailGenerator: resolveRuntimeEntrypoint('emailGenerator'),
    generator: resolveRuntimeEntrypoint('generator'),
    inspectProject: resolveRuntimeEntrypoint('inspectProject'),
    libreOfficeCommand: await resolveLibreOfficeCommand(),
    pythonRuntime: null,
  } satisfies ResolvedRuntime;

  const needsPythonRuntime = [
    runtime.emailGenerator,
    runtime.generator,
    runtime.inspectProject,
  ].some((entrypoint) => entrypoint.mode === 'python-script');

  return {
    ...runtime,
    pythonRuntime: needsPythonRuntime ? await resolvePythonRuntime(homePath) : null,
  };
}

export function describePythonRuntime(pythonRuntime: ResolvedPythonRuntime) {
  const prefix = pythonRuntime.argsPrefix.join(' ').trim();
  return prefix ? `${pythonRuntime.command} ${prefix}` : pythonRuntime.command;
}

export function buildRuntimeCommand(
  runtime: ResolvedRuntime,
  entrypointName: RuntimeEntrypointName,
  args: string[],
): RuntimeCommand {
  const entrypoint = runtime[entrypointName];

  if (entrypoint.mode === 'packaged-executable') {
    return {
      args,
      command: entrypoint.absolutePath,
    };
  }

  if (!runtime.pythonRuntime) {
    throw new Error(
      `No compatible Python runtime was found for ${entrypointName}.`,
    );
  }

  return {
    args: [...runtime.pythonRuntime.argsPrefix, entrypoint.absolutePath, ...args],
    command: runtime.pythonRuntime.command,
  };
}

export function getStarterTemplatePath(kind: SaveStarterTemplateRequest['kind']) {
  const starterTemplateNames = {
    email: 'starter-email-template.txt',
    excel: 'starter-workbook.xlsx',
    word: 'starter-contract-template.docx',
  } as const;

  return resolve(getWorkspaceRoot(), 'app', 'templates', starterTemplateNames[kind]);
}

export function resolveWorkspacePath(pathValue?: string) {
  if (!pathValue) {
    return undefined;
  }

  return isAbsolute(pathValue) ? pathValue : resolve(getWorkspaceRoot(), pathValue);
}
