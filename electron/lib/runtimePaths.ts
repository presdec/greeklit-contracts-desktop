import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import type { SaveStarterTemplateRequest } from '../../shared/desktop';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));

export type RuntimeEntrypointName = 'emailGenerator' | 'generator' | 'inspectProject';

export type RuntimeEnvironment = {
  appDataPath: string;
  homePath: string;
  isPackaged: boolean;
  resourcesPath: string;
  tempPath: string;
};

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
  source: 'dev-runtime' | 'dev-script' | 'env' | 'missing' | 'packaged-runtime';
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
  cwd: string;
};

export function getWorkspaceRoot() {
  return resolve(__dirname, '../../..');
}

export function getDefaultRuntimeEnvironment(): RuntimeEnvironment {
  return {
    appDataPath: join(getWorkspaceRoot(), '.tmp', 'app-data'),
    homePath: homedir(),
    isPackaged: false,
    resourcesPath: process.resourcesPath ? resolve(process.resourcesPath) : getWorkspaceRoot(),
    tempPath: tmpdir(),
  };
}

function getResourcesRoot(environment: RuntimeEnvironment) {
  return environment.isPackaged ? resolve(environment.resourcesPath) : getWorkspaceRoot();
}

function getRuntimeBuildKey() {
  return `${process.platform}-${process.arch}`;
}

function getPackagedRuntimeRoot(environment: RuntimeEnvironment) {
  return join(getResourcesRoot(environment), 'runtime');
}

function getDevRuntimeRoot() {
  return join(getWorkspaceRoot(), 'app', 'runtime');
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
    generator: join(getWorkspaceRoot(), 'app', 'scripts', 'generate_contracts.py'),
    inspectProject: join(getWorkspaceRoot(), 'app', 'scripts', 'inspect_project.py'),
  }[name];
}

function getExecutableBaseName(name: RuntimeEntrypointName) {
  return {
    emailGenerator: 'generate_email_drafts',
    generator: 'generate_contracts',
    inspectProject: 'inspect_project',
  }[name];
}

function getRuntimeExecutableCandidates(
  name: RuntimeEntrypointName,
  environment: RuntimeEnvironment,
) {
  const executableName = getPlatformExecutableName(getExecutableBaseName(name));
  const platformKey = getRuntimeBuildKey();
  const packagedRuntimeRoot = getPackagedRuntimeRoot(environment);
  const devRuntimeRoot = getDevRuntimeRoot();

  const packagedCandidates = [
    join(packagedRuntimeRoot, platformKey, executableName),
    join(packagedRuntimeRoot, executableName),
    join(getResourcesRoot(environment), 'bin', platformKey, executableName),
    join(getResourcesRoot(environment), 'bin', executableName),
  ];
  const devCandidates = [
    join(devRuntimeRoot, platformKey, executableName),
    join(devRuntimeRoot, executableName),
  ];

  return environment.isPackaged
    ? uniqueStrings(packagedCandidates)
    : uniqueStrings([...packagedCandidates, ...devCandidates]);
}

function resolveRuntimeEntrypoint(
  name: RuntimeEntrypointName,
  environment: RuntimeEnvironment,
): ResolvedRuntimeEntrypoint {
  const envOverride = process.env[getEntrypointEnvVar(name)];

  if (envOverride) {
    return {
      absolutePath: envOverride,
      exists: existsSync(envOverride),
      mode: envOverride.toLowerCase().endsWith('.py') ? 'python-script' : 'packaged-executable',
      name,
      source: 'env',
    };
  }

  // In development, prefer the source script so runtime behavior always matches
  // the latest checked-in Python code instead of a potentially stale built exe.
  if (!environment.isPackaged) {
    const devPath = getDevEntrypointPath(name);
    if (existsSync(devPath)) {
      return {
        absolutePath: devPath,
        exists: true,
        mode: 'python-script',
        name,
        source: 'dev-script',
      };
    }
  }

  const runtimePath = getRuntimeExecutableCandidates(name, environment)
    .find((candidate) => existsSync(candidate));
  if (runtimePath) {
    return {
      absolutePath: runtimePath,
      exists: true,
      mode: 'packaged-executable',
      name,
      source: environment.isPackaged ? 'packaged-runtime' : 'dev-runtime',
    };
  }

  if (!environment.isPackaged) {
    const devPath = getDevEntrypointPath(name);
    return {
      absolutePath: devPath,
      exists: existsSync(devPath),
      mode: 'python-script',
      name,
      source: 'dev-script',
    };
  }

  const missingExecutable = getRuntimeExecutableCandidates(name, environment)[0]
    ?? join(getPackagedRuntimeRoot(environment), getPlatformExecutableName(getExecutableBaseName(name)));
  return {
    absolutePath: missingExecutable,
    exists: false,
    mode: 'packaged-executable',
    name,
    source: 'missing',
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

function getPythonCandidates(environment: RuntimeEnvironment): CommandCandidate[] {
  const pythonExecutableName = process.platform === 'win32' ? 'python.exe' : 'python';
  const workspaceVenv = join(
    getWorkspaceRoot(),
    '.venv',
    process.platform === 'win32' ? 'Scripts' : 'bin',
    pythonExecutableName,
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

  const filteredCandidates = environment.isPackaged
    && process.env.GREEKLIT_ALLOW_PACKAGED_PYTHON !== '1'
    ? []
    : candidates;

  return filteredCandidates.filter((candidate, index, allCandidates) => {
    const signature = `${candidate.command}::${(candidate.argsPrefix ?? []).join(' ')}`;
    return allCandidates.findIndex((item) => {
      const itemSignature = `${item.command}::${(item.argsPrefix ?? []).join(' ')}`;
      return itemSignature === signature;
    }) === index;
  });
}

async function resolvePythonRuntime(environment: RuntimeEnvironment) {
  for (const candidate of getPythonCandidates(environment)) {
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

function getLibreOfficeCandidates(
  environment: RuntimeEnvironment,
  preferredCommand?: string,
) {
  const consoleName = process.platform === 'win32' ? 'soffice.com' : 'soffice';
  const packagedRuntimeRoot = getPackagedRuntimeRoot(environment);
  const platformKey = getRuntimeBuildKey();
  const platformCandidates = process.platform === 'win32'
    ? [
        'C:/Program Files/LibreOffice/program/soffice.com',
        'C:/Program Files/LibreOffice/program/soffice.exe',
        'C:/Program Files (x86)/LibreOffice/program/soffice.com',
        'C:/Program Files (x86)/LibreOffice/program/soffice.exe',
      ]
    : process.platform === 'darwin'
      ? ['/Applications/LibreOffice.app/Contents/MacOS/soffice']
      : ['/usr/bin/soffice', '/usr/local/bin/soffice', '/snap/bin/libreoffice'];

  return uniqueStrings([
    process.env.GREEKLIT_LIBREOFFICE_PATH,
    preferredCommand,
    join(packagedRuntimeRoot, platformKey, consoleName),
    join(packagedRuntimeRoot, consoleName),
    join(getResourcesRoot(environment), 'LibreOffice', 'program', consoleName),
    'soffice.com',
    'soffice',
    'libreoffice',
    ...platformCandidates,
  ]);
}

export async function resolveLibreOfficeCommand(
  environment: RuntimeEnvironment,
  preferredCommand?: string,
) {
  for (const candidate of getLibreOfficeCandidates(environment, preferredCommand)) {
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

export async function resolveRuntime(environment: RuntimeEnvironment): Promise<ResolvedRuntime> {
  const runtime = {
    emailGenerator: resolveRuntimeEntrypoint('emailGenerator', environment),
    generator: resolveRuntimeEntrypoint('generator', environment),
    inspectProject: resolveRuntimeEntrypoint('inspectProject', environment),
    libreOfficeCommand: await resolveLibreOfficeCommand(environment),
    pythonRuntime: null,
  } satisfies ResolvedRuntime;

  const needsPythonRuntime = [
    runtime.emailGenerator,
    runtime.generator,
    runtime.inspectProject,
  ].some((entrypoint) => entrypoint.mode === 'python-script');

  return {
    ...runtime,
    pythonRuntime: needsPythonRuntime ? await resolvePythonRuntime(environment) : null,
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
  environment: RuntimeEnvironment,
): RuntimeCommand {
  const entrypoint = runtime[entrypointName];

  if (entrypoint.mode === 'packaged-executable') {
    return {
      args,
      command: entrypoint.absolutePath,
      cwd: environment.appDataPath,
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
    cwd: getWorkspaceRoot(),
  };
}

export function getRuntimeTempRoot(environment: RuntimeEnvironment) {
  return join(environment.appDataPath, 'runtime-temp');
}

export function getStarterTemplatePath(
  kind: SaveStarterTemplateRequest['kind'],
  environment = getDefaultRuntimeEnvironment(),
) {
  const starterTemplateNames = {
    email: 'starter-email-template.txt',
    excel: 'starter-workbook.xlsx',
    word: 'starter-contract-template.docx',
  } as const;
  const fileName = starterTemplateNames[kind];
  const candidates = environment.isPackaged
    ? [
        join(getResourcesRoot(environment), 'templates', fileName),
        join(getResourcesRoot(environment), 'app', 'templates', fileName),
      ]
    : [
        join(getWorkspaceRoot(), 'app', 'templates', fileName),
        join(getResourcesRoot(environment), 'templates', fileName),
      ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0] ?? fileName;
}

export function resolveProjectPath(
  pathValue: string | undefined,
  environment = getDefaultRuntimeEnvironment(),
) {
  if (!pathValue) {
    return undefined;
  }

  if (isAbsolute(pathValue)) {
    return pathValue;
  }

  const basePath = environment.isPackaged ? environment.homePath : getWorkspaceRoot();
  return resolve(basePath, pathValue);
}
