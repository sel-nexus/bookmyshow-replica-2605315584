import { expect, test } from '@playwright/test';

/** Verify a live booking request produces a backend confirmation ticket. */
test('creates a booking after processing and renders its backend-created ticket', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto('/login');
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('One-time password').fill('1234');
  await page.getByRole('button', { name: 'Verify & continue' }).click();
  await page.getByRole('button', { name: 'Choose Paradise' }).click();
  await page.getByRole('button', { name: 'Sandhya 70mm' }).click();
  await page.getByRole('button', { name: 'Select seats' }).click();
  await page.getByLabel('Card Number').fill('4242424242424242');
  await page.getByLabel('Expiry Date').fill('12/30');
  await page.getByLabel('CVV').fill('123');
  const confirmationResponse = page.waitForResponse((response) => response.url().includes('/api/v1/bookings') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Pay Rs. 450' }).click();
  const response = await confirmationResponse;
  expect(response.status()).toBe(201);
  const ticket = await response.json() as { confirmationId: number; movie: { title: string }; theatre: { name: string } };
  await expect(page).toHaveURL(/\/confirmation$/);
  await expect(page.getByRole('heading', { name: 'Congratulations!' })).toBeVisible();
  await expect(page.getByText(ticket.movie.title)).toBeVisible();
  await expect(page.getByText(ticket.theatre.name)).toBeVisible();
  await expect(page.getByText(`#${ticket.confirmationId}`)).toBeVisible();
  expect(browserErrors).toEqual([]);
});
