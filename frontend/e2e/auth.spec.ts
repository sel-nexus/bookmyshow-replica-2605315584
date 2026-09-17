import { expect, test, type Page } from '@playwright/test';

/** Capture uncaught and error-level console output before the first navigation. */
function captureBrowserErrors(page: Page): string[] {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  return browserErrors;
}

/** Verify client-side login validation surfaces an accessible recovery message. */
test('shows an accessible error for an invalid mobile number', async ({ page }) => {
  const browserErrors = captureBrowserErrors(page);
  await page.goto('/login');
  await page.getByLabel('Mobile number').fill('98765');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('alert')).toHaveText('Enter a valid 10-digit mobile number.');
  await page.screenshot({ path: 'test-results/auth-invalid-mobile.png', fullPage: true });
  expect(browserErrors).toEqual([]);
});

/** Verify the real browser login journey against the live frontend and backend. */
test('logs in with a valid mobile number and OTP', async ({ page }) => {
  const browserErrors = captureBrowserErrors(page);
  await page.goto('/login');
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByLabel('One-time password')).toBeVisible();
  await page.getByLabel('One-time password').fill('1234');
  await page.getByRole('button', { name: 'Verify & continue' }).click();
  await expect(page).toHaveURL(/\/movies$/);
  await expect(page.getByRole('heading', { name: 'Paradise' })).toBeVisible();
  await page.screenshot({ path: 'test-results/auth-movies.png', fullPage: true });
  expect(browserErrors).toEqual([]);
});
