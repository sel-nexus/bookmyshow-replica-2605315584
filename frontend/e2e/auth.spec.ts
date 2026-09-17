import { expect, test } from '@playwright/test';

/** Verify the real browser login journey against the live frontend and backend. */
test('logs in with a valid mobile number and OTP', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto('/login');
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByLabel('One-time password')).toBeVisible();
  await page.getByLabel('One-time password').fill('1234');
  await page.getByRole('button', { name: 'Verify & continue' }).click();
  await expect(page).toHaveURL(/\/movies$/);
  expect(browserErrors).toEqual([]);
});
