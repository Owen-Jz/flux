import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Mobile Viewports
    {
      name: 'Mobile 320px',
      use: {
        ...devices['iPhone SE'],
        viewport: { width: 320, height: 568 },
      },
    },
    {
      name: 'Mobile 375px',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'Mobile 428px',
      use: {
        ...devices['iPhone 14 Pro'],
        viewport: { width: 428, height: 926 },
      },
    },
    {
      name: 'Tablet 768px',
      use: {
        ...devices['iPad Mini'],
        viewport: { width: 768, height: 1024 },
      },
    },
    // Desktop for comparison
    {
      name: 'Desktop',
      use: {
        viewport: { width: 1280, height: 720 },
      },
    },
    // iOS Safari
    {
      name: 'iOS Safari',
      use: {
        ...devices['iPhone 14 Pro'],
        browserName: 'webkit',
      },
    },
    // Chrome Android
    {
      name: 'Chrome Android',
      use: {
        ...devices['Pixel 7'],
        browserName: 'chromium',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
