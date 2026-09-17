import { expect, test } from '@playwright/test';

/** Chain login, catalogue, theatre, seats, payment, and persisted ticket confirmation over live APIs. */
test('completes the authenticated catalogue-to-booking integration journey', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto('/login');
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('One-time password').fill('1234');
  await page.getByRole('button', { name: 'Verify & continue' }).click();
  await expect(page.getByRole('heading', { name: 'Paradise' })).toBeVisible();
  await page.getByRole('button', { name: 'Choose Paradise' }).click();
  await page.getByRole('button', { name: 'Sudharsham 70mm' }).click();
  await page.getByRole('button', { name: 'Select seats' }).click();
  await page.getByRole('radio', { name: 'UPI' }).click();
  await page.getByLabel('UPI ID').fill('cinema@upi');
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/v1/bookings') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Pay Rs. 450' }).click();
  const response = await responsePromise;
  const ticket = await response.json() as { theatre: { name: string }; seats: string[]; paymentMethod: string; totalPrice: number };
  expect(response.status()).toBe(201);
  await expect(page.getByRole('heading', { name: 'Congratulations!' })).toBeVisible();
  await expect(page.getByText(ticket.theatre.name)).toBeVisible();
  await expect(page.getByText(ticket.seats.join(', '))).toBeVisible();
  await expect(page.getByText('UPI')).toBeVisible();
  await expect(page.getByText(`Rs. ${ticket.totalPrice}`)).toBeVisible();
  expect(browserErrors).toEqual([]);
});
