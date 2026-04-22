import { expect, test, _electron as electron } from '@playwright/test';

const isWindows = process.platform === 'win32';
const electronBinary = isWindows ? './node_modules/.bin/electron.cmd' : './node_modules/.bin/electron';

test('desktop app launches to main workflow shell', async () => {
  const app = await electron.launch({
    args: ['dist-electron/main/main.js'],
    executablePath: electronBinary,
  });

  let window = null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    window = app.windows().find((candidate) => !candidate.url().startsWith('devtools://')) ?? null;
    if (window) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  expect(window).not.toBeNull();
  if (!window) {
    await app.close();
    throw new Error('App window did not appear.');
  }

  await window.waitForLoadState('networkidle');
  await expect(window.getByText('Greeklit Contracts Desktop')).toBeVisible();
  await expect(window.getByText('Workflow progress')).toBeVisible();

  await app.close();
});
