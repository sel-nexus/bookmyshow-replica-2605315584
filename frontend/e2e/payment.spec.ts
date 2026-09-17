import { expect, test } from '@playwright/test';

/** Verify the client-only seat and dummy payment journey after catalogue selection. */
test('selects deterministic seats and completes the two-second dummy payment state', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('/booking');
  await page.evaluate(() => {
    window.localStorage.setItem('bookmyshow_token', 'e2e-token');
    window.sessionStorage.setItem('bookmyshow_selected_movie', JSON.stringify({ id: 1, title: 'Paradise', posterLabel: 'Now showing' }));
    window.sessionStorage.setItem('bookmyshow_selected_theatre', JSON.stringify({ id: 1, name: 'Sandhya 70mm' }));
  });
  await page.reload();

  await page.getByRole('button', { name: 'Select seats' }).click();
  await expect(page.getByText('A1, A2, A3')).toBeVisible();
  await expect(page.getByText('Rs. 450')).toBeVisible();
  await page.getByLabel('Card Number').fill('4242424242424242');
  await page.getByLabel('Expiry Date').fill('12/30');
  await page.getByLabel('CVV').fill('123');
  await page.getByRole('button', { name: 'Pay Rs. 450' }).click();
  await expect(page.getByRole('status', { name: 'Payment processing' })).toBeVisible();
  await page.waitForTimeout(2000);
  await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem('bookmyshow_booking_session'))).toContain('A1');
  expect(browserErrors).toEqual([]);
});
