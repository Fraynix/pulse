import { test, expect } from '@playwright/test';

const BASE = 'http://127.0.0.1:3100';
const SS = 'e2e/screenshots/tour';

// Helper: navigate and screenshot, tolerate errors
async function snap(page: any, path: string, name: string) {
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    // Wait a bit for client-side rendering
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SS}/${name}.png`, fullPage: true });
  } catch {
    // Page may redirect or error — screenshot whatever is shown
    await page.screenshot({ path: `${SS}/${name}-error.png`, fullPage: true }).catch(() => {});
  }
}

test('Tour complet — pages publiques & auth', async ({ page }) => {
  // Public pages
  await snap(page, '/', '01-home');
  await snap(page, '/onboarding', '04-onboarding');
  await snap(page, '/explore', '05-explore-coachs');

  // Protected pages (will redirect to login or show auth wall)
  await snap(page, '/dashboard', '06-dashboard');
  await snap(page, '/planning', '07-planning');
  await snap(page, '/progress', '08-progress');
  await snap(page, '/goals', '09-goals');
  await snap(page, '/nutrition', '10-nutrition');
  await snap(page, '/journal', '11-journal');
  await snap(page, '/insights', '12-insights');
  await snap(page, '/community', '13-community');
  await snap(page, '/profile', '14-profile');

  // Coach pages
  await snap(page, '/coach', '15-coach-dashboard');
  await snap(page, '/coach/clients', '16-coach-clients');
  await snap(page, '/coach/sessions', '17-coach-sessions');
  await snap(page, '/coach/revenue', '18-coach-revenue');
  await snap(page, '/coach/reviews', '19-coach-reviews');
  await snap(page, '/coach/events', '20-coach-events');
  await snap(page, '/coach/availability', '21-coach-availability');

  // Admin pages
  await snap(page, '/admin', '22-admin');
});

test('Tour mobile — pages clés', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await snap(page, '/', '30-mobile-home');
  await snap(page, '/onboarding', '33-mobile-onboarding');
  await snap(page, '/explore', '34-mobile-explore');
  await snap(page, '/dashboard', '35-mobile-dashboard');
  await snap(page, '/planning', '36-mobile-planning');
  await snap(page, '/coach', '37-mobile-coach');
});
