import { expect, test, _electron as electron } from '@playwright/test';
import electronBinary from 'electron';

test('desktop app launches to main workflow shell', async () => {
  const launchEnv = { ...process.env };
  delete launchEnv.ELECTRON_RUN_AS_NODE;

  const app = await electron.launch({
    args: ['.'],
    env: launchEnv,
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
  await expect(window.getByText('Document Generation Workspace')).toBeVisible();
  await expect(window.getByText('Workflow progress')).toBeVisible();

  await app.close();
});
