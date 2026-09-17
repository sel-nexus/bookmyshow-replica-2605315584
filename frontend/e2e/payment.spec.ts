import { expect, test } from '@playwright/test';

/** Verify a protected booking route redirects visitors without an authenticated session. */
test('redirects an unauthenticated visitor from booking to login', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto('/booking');
  await expect(page.getByRole('status')).toHaveText('Preparing your booking…');
  await expect(page).toHaveURL(/\/login$/);
  await page.screenshot({ path: 'test-results/booking-unauthenticated.png', fullPage: true });
  expect(browserErrors).toEqual([]);
});

/** Verify invalid payment fields expose accessible errors after a real selection journey. */
test('shows validation errors for invalid card details', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto('/login');
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('One-time password').fill('1234');
  await page.getByRole('button', { name: 'Verify & continue' }).click();
  await page.getByRole('button', { name: 'Choose Paradise' }).click();
  await page.getByRole('button', { name: 'Sandhya 70mm' }).click();
  await page.getByRole('button', { name: 'Continue to seat selection' }).click();
  await page.getByRole('button', { name: 'Select seats' }).click();
  await page.getByLabel('Card Number').fill('123');
  await page.getByLabel('Expiry Date').fill('12/3');
  await page.getByLabel('CVV').fill('1');
  await page.getByRole('button', { name: 'Pay Rs. 450' }).click();
  await expect(page.getByRole('alert')).toHaveCount(3);
  await expect(page.getByText('Enter a valid 16-digit card number.')).toBeVisible();
  await expect(page.getByText('Enter expiry as MM/YY.')).toBeVisible();
  await expect(page.getByText('Enter a valid CVV.')).toBeVisible();
  await page.screenshot({ path: 'test-results/payment-invalid-card.png', fullPage: true });
  expect(browserErrors).toEqual([]);
});
