import { defineConfig } from '@playwright/test';

// The cave renders with WebGL. CI machines have no GPU, so Chromium uses its software
// rasteriser: expect about one frame a second, hence the long timeouts.
export default defineConfig({
  testDir: './tests',
  timeout: 300_000,
  expect: { timeout: 120_000 },
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173/',
    viewport: { width: 1280, height: 720 },
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
    trace: 'retain-on-failure',
  },
  webServer: { command: 'npm run preview', url: 'http://127.0.0.1:4173/', reuseExistingServer: true, timeout: 60_000 },
});
