import { expect, test, type Locator, type Page } from '@playwright/test';

const TEST_ADDRESS_QUERY = 'Isarstr. 1';
const TEST_ADDRESS_RESULT = 'Isarstraße 1, Regensburg';

async function focusWithTab(page: Page, target: Locator, maxTabs = 200) {
  await expect(target).toBeVisible();

  for (let index = 0; index < maxTabs; index += 1) {
    if (
      await target.evaluate((element) => element === document.activeElement)
    ) {
      return;
    }
    await page.keyboard.press('Tab');
  }

  await expect(
    target,
    `Target did not receive focus after ${maxTabs} Tab presses`,
  ).toBeFocused();
}

async function activateButtonWithKeyboard(
  page: Page,
  name: string,
  key: 'Enter' | 'Space' = 'Enter',
) {
  const button = page.getByRole('button', { name, exact: true });
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
  await focusWithTab(page, button);
  await page.keyboard.press(key);
}

async function expectStep(page: Page, title: string) {
  await expect(
    page.locator('[data-step-gate]:visible').getByText(title, { exact: true }),
  ).toBeVisible();
}

test.describe('keyboard navigation', () => {
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

  test('complete calculation flow reaches results without pointer input', async ({
    page,
  }) => {
    await activateButtonWithKeyboard(page, 'Jetzt starten');

    const addressInput = page.getByRole('combobox', {
      name: 'Adresse eingeben',
    });
    await expect(addressInput).toBeEditable();
    await focusWithTab(page, addressInput);
    await page.keyboard.type(TEST_ADDRESS_QUERY);

    const addressResult = page.getByRole('option', {
      name: TEST_ADDRESS_RESULT,
      exact: true,
    });
    await expect(addressResult).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const buildingContinueButton = page.getByRole('button', {
      name: 'Jetzt Sanierungsvorschlag ermitteln',
    });
    await expect(buildingContinueButton).toBeVisible({ timeout: 20_000 });
    await activateButtonWithKeyboard(
      page,
      'Jetzt Sanierungsvorschlag ermitteln',
      'Space',
    );

    await expectStep(page, 'Allgemeine Daten zu Ihrem Gebäude');
    await activateButtonWithKeyboard(page, 'Weiter');

    await expectStep(page, 'Außenbauteile des Gebäudes');
    await activateButtonWithKeyboard(page, 'Weiter', 'Space');

    await expectStep(page, 'Wärmeversorgung');
    await activateButtonWithKeyboard(page, 'Weiter');

    await expectStep(page, 'Strom & erneuerbare Energien');
    await activateButtonWithKeyboard(page, 'Weiter', 'Space');

    await expectStep(page, 'Sanierungsmaßnahmen');
    await activateButtonWithKeyboard(page, 'Ergebnis anzeigen');

    await expectStep(page, 'Ihre Ergebnisse im Überblick');
  });
});
