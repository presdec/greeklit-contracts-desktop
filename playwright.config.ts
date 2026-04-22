import { defineConfig } from '@playwright/test';

export default defineConfig({
  fullyParallel: false,
  reporter: 'list',
  testDir: './e2e',
  timeout: 60_000,
  use: {
    trace: 'on-first-retry',
  },
});
