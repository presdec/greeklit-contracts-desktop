# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: desktop-launch.spec.ts >> desktop app launches to main workflow shell
- Location: e2e\desktop-launch.spec.ts:6:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Greeklit Contracts Desktop')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Greeklit Contracts Desktop')

```

# Test source

```ts
  1  | import { expect, test, _electron as electron } from '@playwright/test';
  2  | 
  3  | const isWindows = process.platform === 'win32';
  4  | const electronBinary = isWindows ? './node_modules/.bin/electron.cmd' : './node_modules/.bin/electron';
  5  | 
  6  | test('desktop app launches to main workflow shell', async () => {
  7  |   const app = await electron.launch({
  8  |     args: ['dist-electron/main/main.js'],
  9  |     executablePath: electronBinary,
  10 |   });
  11 | 
  12 |   let window = null;
  13 |   for (let attempt = 0; attempt < 30; attempt += 1) {
  14 |     window = app.windows().find((candidate) => !candidate.url().startsWith('devtools://')) ?? null;
  15 |     if (window) {
  16 |       break;
  17 |     }
  18 |     await new Promise((resolve) => setTimeout(resolve, 250));
  19 |   }
  20 | 
  21 |   expect(window).not.toBeNull();
  22 |   if (!window) {
  23 |     await app.close();
  24 |     throw new Error('App window did not appear.');
  25 |   }
  26 | 
  27 |   await window.waitForLoadState('networkidle');
> 28 |   await expect(window.getByText('Greeklit Contracts Desktop')).toBeVisible();
     |                                                                ^ Error: expect(locator).toBeVisible() failed
  29 |   await expect(window.getByText('Workflow progress')).toBeVisible();
  30 | 
  31 |   await app.close();
  32 | });
  33 | 
```