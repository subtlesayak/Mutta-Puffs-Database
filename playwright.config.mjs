import {defineConfig, devices} from '@playwright/test';

const communityMode = process.env.MPDB_TEST_COMMUNITY === '1';
const port = communityMode ? 4323 : 4321;
const origin = 'http://127.0.0.1:' + port;
const baseURL = origin + '/Mutta-Puffs-Database/';
const communitySuite = /community\.spec\.ts$/;

export default defineConfig({
  testDir: './tests/e2e',
  ...(communityMode ? {testMatch:communitySuite} : {testIgnore:communitySuite}),
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
    command: communityMode
      ? 'npm run dev -- --ignore-lock --host 127.0.0.1 --port ' + port
      : 'npm run preview -- --host 127.0.0.1 --port ' + port,
    env: communityMode ? {
      ASTRO_TELEMETRY_DISABLED:'1',
      PUBLIC_COMMUNITY_API_URL:'http://127.0.0.1:4324',
    } : undefined,
    url: baseURL,
    reuseExistingServer: !process.env.CI && !communityMode,
  },
});
