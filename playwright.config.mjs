import {defineConfig, devices} from '@playwright/test';

const origin = 'http://127.0.0.1:4321';
const baseURL = origin + '/Mutta-Puffs-Database/';

export default defineConfig({
  testDir: './tests/e2e',
  workers: process.env.CI ? 2 : undefined,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {baseURL, serviceWorkers: 'block', trace: 'retain-on-failure'},
  projects: [
    {name: 'desktop', use: {...devices['Desktop Chrome']}},
    {name: 'mobile', use: {...devices['Pixel 7']}},
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4321',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
