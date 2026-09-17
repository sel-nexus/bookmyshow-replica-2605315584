import { expect, test } from '@playwright/test';

/** Verify a live booking request produces and renders the exact backend ticket contract. */
test('creates a card booking and renders its backend-created confirmation', async ({ page }) => {
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
  await page.getByLabel('Card Number').fill('4242424242424242');
  await page.getByLabel('Expiry Date').fill('12/30');
  await page.getByLabel('CVV').fill('123');
  const confirmationResponse = page.waitForResponse((response) => response.url().includes('/api/v1/bookings') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Pay Rs. 450' }).click();
  await expect(page.getByRole('status', { name: 'Payment processing' })).toBeVisible();
  const response = await confirmationResponse;
  expect(response.status()).toBe(201);
  const ticket = await response.json();
  expect(ticket).toEqual({
    confirmationId: expect.any(Number),
    movie: { id: 1, title: 'Paradise' },
    theatre: { id: 1, name: 'Sandhya 70mm' },
    seats: ['A1', 'A2', 'A3'],
    paymentMethod: 'card',
    totalPrice: 450
  });
  await expect(page).toHaveURL(/\/confirmation$/);
  await expect(page.getByRole('heading', { name: 'Congratulations!' })).toBeVisible();
  await expect(page.getByText(ticket.movie.title)).toBeVisible();
  await expect(page.getByText(ticket.theatre.name)).toBeVisible();
  await expect(page.getByText(`#${ticket.confirmationId}`)).toBeVisible();
  await page.screenshot({ path: 'test-results/booking-confirmation.png', fullPage: true });
  expect(browserErrors).toEqual([]);
});
