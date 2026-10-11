import { expect, test } from '@playwright/test';

const TEST_USER = {
  goal: 'Portraits',
  goalId: 'portraits',
  goalEmoji: '👤',
  skillLevel: 'beginner',
  dailyMinutes: 30,
  createdAt: '2026-10-10T00:00:00.000Z',
};

test('onboarding renders for a new visitor', async ({ page }) => {
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
    await page.addInitScript(user => {
      window.localStorage.setItem('artxp_user', JSON.stringify(user));
    }, TEST_USER);
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
