import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { brand } from '../../src/config/brand';

const TEST_ADDRESS_QUERY = 'Isarstr. 1';
const TEST_ADDRESS_RESULT = 'Isarstraße 1, Regensburg';

async function expectNoHorizontalOverflow(page: Page, soft = false) {
  const dimensions = await page.locator('html').evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));

  const assertion = soft ? expect.soft : expect;
  assertion(
    dimensions.scrollWidth,
    `The page is ${dimensions.scrollWidth - dimensions.clientWidth}px wider than the viewport`,
  ).toBeLessThanOrEqual(dimensions.clientWidth);
}

async function attachScreenshot(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
}

async function openBuildingSelection(page: Page) {
  const startButton = page.getByRole('button', { name: 'Jetzt starten' });
  await expect(startButton).toBeVisible();
  await expect(startButton).toBeEnabled();
  await startButton.click();

  const addressInput = page.getByRole('combobox', {
    name: 'Adresse eingeben',
  });
  await expect(addressInput).toBeVisible();
  await expect(addressInput).toBeEditable();
  return addressInput;
}

async function selectTestBuilding(page: Page) {
  const addressInput = page.getByRole('combobox', {
    name: 'Adresse eingeben',
  });
  await addressInput.fill(TEST_ADDRESS_QUERY);

  const addressResult = page.getByRole('option', {
    name: TEST_ADDRESS_RESULT,
    exact: true,
  });
  await expect(addressResult).toBeVisible({ timeout: 15_000 });
  await addressResult.click();

  const continueButton = page.getByRole('button', {
    name: 'Jetzt Sanierungsvorschlag ermitteln',
  });
  await expect(continueButton).toBeVisible({ timeout: 20_000 });
  await expect(continueButton).toBeEnabled();
  return continueButton;
}

async function expectNoColorContrastViolations(
  page: Page,
  testInfo: TestInfo,
  name: string,
) {
  const results = await new AxeBuilder({ page })
    .withRules(['color-contrast'])
    .analyze();

  await testInfo.attach(`${name}-axe-results`, {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });

  expect(
    results.violations,
    `${name} contains color contrast violations`,
  ).toEqual([]);
}

test.describe('responsive entry flow', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      localStorage.setItem(
        'det_consent',
        JSON.stringify({
          version: 1,
          purposeVersion: 1,
          choices: { functional: true },
          decidedAt: now,
          expiresAt: now + 180 * day,
        }),
      );
      for (const key of ['map-help-seen', 'det_methodology_notice_seen_v1']) {
        localStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            savedAt: now,
            expiresAt: now + 90 * day,
            value: true,
          }),
        );
      }
    });
    await page.goto('/de/');
  });

  test('landing page, address search, and building selection remain usable', async ({
    page,
  }, testInfo) => {
    await expect(page).toHaveTitle(brand.pageTitle);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoColorContrastViolations(page, testInfo, 'landing-page');
    await attachScreenshot(page, testInfo, 'landing-page');

    await openBuildingSelection(page);
    await expectNoHorizontalOverflow(page);
    await attachScreenshot(page, testInfo, 'building-selection');

    const continueButton = await selectTestBuilding(page);
    await expectNoHorizontalOverflow(page);
    await expectNoColorContrastViolations(page, testInfo, 'selected-building');
    await attachScreenshot(page, testInfo, 'selected-building');

    await continueButton.click();
    await expect(
      page.getByText('Allgemeine Daten zu Ihrem Gebäude', { exact: true }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await attachScreenshot(page, testInfo, 'general-data');
  });

  test('content remains usable with a 200 percent user font size', async ({
    page,
  }, testInfo) => {
    // Simulates a user-defined browser root font size. It deliberately does
    // not require an application-specific font-size control.
    await page.addStyleTag({
      content: ':root { font-size: 200% !important; }',
    });

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoHorizontalOverflow(page, true);
    await attachScreenshot(page, testInfo, 'landing-page-font-200');

    await openBuildingSelection(page);
    await expectNoHorizontalOverflow(page, true);
    await selectTestBuilding(page);
    await expectNoHorizontalOverflow(page, true);
    await attachScreenshot(page, testInfo, 'selected-building-font-200');
  });

  test('content remains usable with Windows forced colors', async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await expect(
      page.evaluate(() => matchMedia('(forced-colors: active)').matches),
    ).resolves.toBe(true);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await attachScreenshot(page, testInfo, 'landing-page-forced-colors');

    await openBuildingSelection(page);
    await expectNoHorizontalOverflow(page);
    await selectTestBuilding(page);
    await expectNoHorizontalOverflow(page);
    await attachScreenshot(page, testInfo, 'selected-building-forced-colors');
  });
});
