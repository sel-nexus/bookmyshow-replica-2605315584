import { expect, test } from '@playwright/test';

/** Verify unauthenticated catalogue access redirects users to the login workflow. */
test('redirects an unauthenticated visitor from the catalogue to login', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto('/movies');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Sign in to the show.' })).toBeVisible();
  await page.screenshot({ path: 'test-results/catalog-unauthenticated.png', fullPage: true });
  expect(browserErrors).toEqual([]);
});

/** Verify the authenticated movie-to-theatre catalogue journey against live services. */
test('loads backend movies, stores a theatre choice, and continues to seat selection', async ({ page }) => {
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

  await expect(page.getByRole('heading', { name: 'Paradise' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bloody Romeo' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'OG2' })).toBeVisible();
  await page.getByRole('button', { name: 'Choose Paradise' }).click();
  await expect(page.getByRole('button', { name: 'Sandhya 70mm' })).toBeVisible();
  await page.getByRole('button', { name: 'Sandhya 70mm' }).click();
  await expect(page.getByRole('button', { name: 'Continue to seat selection' })).toBeVisible();
  await page.screenshot({ path: 'test-results/catalog-theatre-selected.png', fullPage: true });
  await page.getByRole('button', { name: 'Continue to seat selection' }).click();
  await expect(page).toHaveURL(/\/booking$/);
  await expect(page.getByRole('heading', { name: 'Choose your seats' })).toBeVisible();
  expect(browserErrors).toEqual([]);
});

/** Verify delayed live theatre responses expose loading and configured empty states without interception. */
test('shows loading then no theatres when the live test backend returns an empty catalogue', async ({ page }) => {
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

  await page.getByRole('button', { name: 'Choose Bloody Romeo' }).click();
  await expect(page.getByText('Loading theatres…')).toBeVisible();
  await expect(page.getByText(/no theatres available/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sandhya 70mm' })).not.toBeVisible();
  expect(browserErrors).toEqual([]);
});
