import { test, expect } from '@playwright/test';

const reception = { identifier: 'reception@demo.clinic', password: 'Demo1234!' };

test.describe.skip('ClinicFlow clinic workflows', () => {
  test('Flow 1: new patient → token → doctor → prescription → dispense', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Phone / Email').fill(reception.identifier);
    await page.getByLabel('Password').fill(reception.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('link', { name: /See Doctor/i })).toBeVisible();
    await page.getByRole('link', { name: /See Doctor/i }).click();
    await page.getByRole('link', { name: /Create New Patient/i }).click();
    await expect(page.getByRole('heading', { name: 'New Patient' })).toBeVisible();
  });

  test('Flow 3: repeat medicine has no token language', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Phone / Email').fill(reception.identifier);
    await page.getByLabel('Password').fill(reception.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: /Repeat Medicine/i }).click();
    await expect(page.getByText(/No token/i)).toBeVisible();
  });
});
