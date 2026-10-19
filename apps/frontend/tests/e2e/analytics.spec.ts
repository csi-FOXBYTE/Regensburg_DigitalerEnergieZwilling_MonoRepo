import { expect, test, type Page } from '@playwright/test';

const TRACKER_URL = 'https://matomo.invalid/matomo.php';
const TEST_ADDRESS_QUERY = 'Isarstr. 1';
const TEST_ADDRESS_RESULT = 'Isarstraße 1, Regensburg';

/**
 * Serves an analytics config and records what would reach Matomo. Routes stay
 * active only for the config request: request interception slows 3D tile
 * loading enough to make the address-based building selection time out.
 */
async function mockAnalytics(page: Page, configured = true) {
  const events: URLSearchParams[] = [];
  await page.route(
    '**/api/public/analytics-config',
    (route) =>
      route.fulfill({
        json: {
          matomo: configured ? { trackerUrl: TRACKER_URL, siteId: 99 } : null,
        },
      }),
    { times: 1 },
  );
  // The .invalid host never resolves; observing the request is enough.
  const batches: number[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith(TRACKER_URL)) return;
    const bulk = JSON.parse(request.postData() ?? '{}') as {
      requests?: string[];
    };
    batches.push(bulk.requests?.length ?? 0);
    for (const query of bulk.requests ?? [])
      events.push(new URLSearchParams(query));
  });
  const actions = () =>
    events.map((body) =>
      [body.get('e_a'), body.get('e_n')].filter(Boolean).join(':'),
    );
  return { events, actions, batches };
}

async function seedStorage(page: Page, decision?: object) {
  await page.addInitScript((decision) => {
    if (sessionStorage.getItem('e2e-seeded')) return;
    sessionStorage.setItem('e2e-seeded', '1');
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    if (decision)
      localStorage.setItem(
        'det_consent',
        JSON.stringify({
          version: 1,
          decidedAt: now,
          expiresAt: now + 180 * day,
          ...decision,
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
  }, decision);
}

const consentDialog = (page: Page) =>
  page.getByRole('dialog', { name: 'Ihre Daten. Ihre Entscheidung.' });

async function selectTestBuilding(page: Page, { mapHelp = false } = {}) {
  await page.getByRole('button', { name: 'Jetzt starten' }).click();
  if (mapHelp) {
    // Without storage consent, seen notices are not remembered.
    const help = page.getByRole('dialog', { name: 'Kartenbedienung' });
    await expect(help).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(help).toBeHidden();
  }
  await page
    .getByRole('combobox', { name: 'Adresse eingeben' })
    .fill(TEST_ADDRESS_QUERY);
  await page
    .getByRole('option', { name: TEST_ADDRESS_RESULT, exact: true })
    .click({ timeout: 15_000 });
  const continueButton = page.getByRole('button', {
    name: 'Jetzt Sanierungsvorschlag ermitteln',
  });
  // The first run of a suite waits for 3D tiles to load.
  await expect(continueButton).toBeEnabled({ timeout: 45_000 });
  await continueButton.click();
}

async function continueTo(page: Page, name: string) {
  const button = page.getByRole('button', { name, exact: true }).last();
  await expect(button).toBeEnabled();
  await button.click();
}

test.describe('web analytics', () => {
  test.setTimeout(90_000);

  test('stays dormant without a configured Matomo site', async ({ page }) => {
    const { events } = await mockAnalytics(page, false);
    await seedStorage(page, {
      purposeVersion: 1,
      choices: { functional: true },
    });
    await page.goto('/de/');
    await selectTestBuilding(page);
    await expect(
      page.getByText('Allgemeine Daten zu Ihrem Gebäude', { exact: true }),
    ).toBeVisible();
    await expect(consentDialog(page)).toBeHidden();

    await page
      .getByRole('button', { name: 'Datenschutzeinstellungen' })
      .click();
    await expect(page.getByText('Fortschritt & Einstellungen')).toBeVisible();
    await expect(page.getByText('Webanalyse', { exact: true })).toHaveCount(0);
    expect(events).toEqual([]);
  });

  test('asks again when a stored decision predates analytics', async ({
    page,
  }) => {
    const { events } = await mockAnalytics(page);
    await seedStorage(page, {
      purposeVersion: 1,
      choices: { functional: true },
    });
    await page.goto('/de/');
    await expect(consentDialog(page)).toBeVisible();
    await expect(consentDialog(page)).toContainText(
      'in zusammengefasster Form',
    );
    await consentDialog(page)
      .getByRole('button', { name: 'Einstellungen' })
      .click();
    await expect(
      page.getByRole('switch', { name: 'Webanalyse' }),
    ).toBeVisible();
    await expect(
      page.getByRole('switch', { name: 'Fortschritt & Einstellungen' }),
    ).toBeChecked();
    expect(events).toEqual([]);
  });

  test('sends nothing after the analytics option is declined', async ({
    page,
  }) => {
    const { events } = await mockAnalytics(page);
    await seedStorage(page);
    await page.goto('/de/');
    await consentDialog(page)
      .getByRole('button', { name: 'Optionale ablehnen' })
      .click();
    await selectTestBuilding(page, { mapHelp: true });
    await expect(
      page.getByText('Allgemeine Daten zu Ihrem Gebäude', { exact: true }),
    ).toBeVisible();
    expect(events).toEqual([]);
    expect(
      await page.evaluate(() =>
        sessionStorage.getItem('det_analytics_session'),
      ),
    ).toBeNull();
  });

  test('records the funnel after opt-in and stops on withdrawal', async ({
    page,
    context,
  }) => {
    const { events, actions, batches } = await mockAnalytics(page);
    await seedStorage(page);
    await page.goto('/de/');
    await consentDialog(page)
      .getByRole('button', { name: 'Alle erlauben' })
      .click();
    expect(events, 'consent alone sends nothing').toEqual([]);

    await selectTestBuilding(page);
    for (const step of [
      'Allgemeine Daten',
      'Außenbauteile',
      'Wärmeversorgung',
      'Strom',
    ]) {
      await test.step(step, () => continueTo(page, 'Weiter'));
    }
    await continueTo(page, 'Ergebnis anzeigen');
    await expect(
      page.getByRole('button', { name: 'PDF-Bericht herunterladen' }),
    ).toBeVisible({ timeout: 20_000 });

    // Back and forward again must not count a second completion.
    await page.goBack();
    await continueTo(page, 'Ergebnis anzeigen');

    const download = page.waitForEvent('download');
    await page
      .getByRole('button', { name: 'PDF-Bericht herunterladen' })
      .click();
    await download;

    // Keep the external advice website (and its cookies) out of the test.
    await context.route(
      'https://www.energieagentur-regensburg.de/**',
      (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: '<title>Beratung</title>',
        }),
    );
    const popup = page.waitForEvent('popup');
    await page
      .getByRole('link', { name: /energieagentur-regensburg\.de/ })
      .click();
    await (await popup).close();

    await expect
      .poll(actions)
      .toEqual(
        expect.arrayContaining([
          'tool_started',
          'step_completed:landing',
          'step_completed:building_selection',
          'step_completed:initial_assessment',
          'building_type_confirmed:single_family',
          'step_completed:building_data',
          'step_completed:building_envelope',
          'step_completed:heating',
          'step_completed:electricity_renewables',
          'step_completed:renovation_measures',
          'step_completed:results',
          'tool_completed',
          'pdf_downloaded:energy_report_pdf',
          'step_completed:pdf_export',
          'contact_requested:energy_advice_link',
          'step_completed:consulting_contact',
        ]),
      );
    expect(
      actions().filter((action) => action === 'tool_completed'),
    ).toHaveLength(1);
    // Events of one click share a bulk request, so Matomo keeps one visit.
    expect(batches[0], 'tool_started and landing together').toBe(2);
    expect(new Set(actions()).size).toBe(actions().length);

    const sessionIds = new Set(events.map((body) => body.get('_id')));
    expect(sessionIds.size).toBe(1);
    for (const body of events) {
      expect(body.get('idsite')).toBe('99');
      expect(body.get('e_c')).toBe('Sanierungstool');
      expect(body.get('url')).toMatch(/^https?:\/\/[^/]+\/de\/$/);
      expect(body.has('urlref')).toBe(false);
      expect(body.has('action_name')).toBe(false);
    }
    expect(JSON.stringify(actions())).not.toMatch(/Isar|DEBY|[0-9]{3,}/);
    expect(await context.cookies()).toEqual([]);

    // Withdrawal: no further events and the session reference is gone.
    const sent = events.length;
    await page
      .getByRole('button', { name: 'Datenschutzeinstellungen' })
      .click();
    await page.getByRole('switch', { name: 'Webanalyse' }).click();
    await page.getByRole('button', { name: 'Auswahl speichern' }).click();
    expect(
      await page.evaluate(() =>
        sessionStorage.getItem('det_analytics_session'),
      ),
    ).toBeNull();
    const nextPopup = page.waitForEvent('popup');
    await page
      .getByRole('link', { name: /energieagentur-regensburg\.de/ })
      .click();
    await (await nextPopup).close();
    await page.waitForTimeout(500);
    expect(events).toHaveLength(sent);
  });
});
