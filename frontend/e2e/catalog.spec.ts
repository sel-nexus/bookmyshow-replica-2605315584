import { expect, test } from '@playwright/test';

/** Verify the authenticated movie-to-theatre catalogue journey against live services. */
test('loads backend movies and their mapped theatre choices', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('/login');
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('One-time password').fill('1234');
  await page.getByRole('button', { name: 'Verify & continue' }).click();

  await expect(page.getByRole('heading', { name: 'Paradise' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bloody Romeo' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'OG2' })).toBeVisible();
  await page.getByRole('button', { name: 'Choose Paradise' }).click();
  await expect(page.getByRole('button', { name: 'Sandhya 70mm' })).toBeVisible();
  await page.getByRole('button', { name: 'Sandhya 70mm' }).click();
  await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem('bookmyshow_selected_theatre')))
    .toContain('Sandhya 70mm');
  expect(browserErrors).toEqual([]);
});
