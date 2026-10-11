import { expect, test } from '@playwright/test';

const EMPTY_PROFILE = {
  goal: null,
  goal_id: null,
  goal_emoji: null,
  self_reported_level: null,
  daily_minutes: null,
  medium_preferences: [],
  style_preferences: [],
};

const TEST_PROFILE = {
  ...EMPTY_PROFILE,
  goal: 'Portraits',
  goal_id: 'portraits',
  goal_emoji: '👤',
  self_reported_level: 'beginner',
  daily_minutes: 30,
};

async function mockPhaseOneApi(page, profile) {
  await page.route('**/api/v1/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/v1/me' && request.method() === 'GET') {
      return route.fulfill({
        json: {
          id: 'e2e-user',
          email: 'e2e@artxp.local',
          locale: 'en',
          timezone: 'UTC',
          created_at: '2026-10-11T00:00:00+00:00',
          profile,
        },
      });
    }
    if (path === '/api/v1/practice-entries' && request.method() === 'GET') {
      return route.fulfill({ json: [] });
    }
    if (path === '/api/v1/auth/dev-session') {
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ status: 404, json: { detail: 'Not mocked' } });
  });
}

test('onboarding renders for a new visitor', async ({ page }) => {
  await mockPhaseOneApi(page, EMPTY_PROFILE);
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'What do you want to draw?' }),
  ).toBeVisible();
  await page.screenshot({
    path: '../docs/screenshots/onboarding.png',
    fullPage: true,
  });
});

test.describe('existing-user routes', () => {
  test.beforeEach(async ({ page }) => {
    await mockPhaseOneApi(page, TEST_PROFILE);
  });

  const routes = [
    { path: '/', heading: /Good (morning|afternoon|evening)/i, file: 'dashboard' },
    { path: '/planner', heading: 'Practice Planner', file: 'planner' },
    { path: '/references', heading: 'Reference Finder', file: 'references' },
    { path: '/log', heading: 'Practice Log', file: 'practice-log' },
    { path: '/settings', heading: 'Settings', file: 'settings' },
  ];

  for (const route of routes) {
    test(`${route.file} route renders`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole('heading', { name: route.heading })).toBeVisible();
      await page.screenshot({
        path: `../docs/screenshots/${route.file}.png`,
        fullPage: true,
      });
    });
  }
});