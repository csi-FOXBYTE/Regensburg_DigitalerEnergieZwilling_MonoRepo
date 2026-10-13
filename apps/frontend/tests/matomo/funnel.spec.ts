import { expect, test, type Page } from '@playwright/test';
import { ADMIN, MATOMO } from './matomo';

type MatomoAction = {
  type: string;
  url?: string;
  eventCategory?: string;
  eventAction?: string;
  eventName?: string;
};
type MatomoVisit = {
  visitIp: string;
  referrerType: string;
  actionDetails: MatomoAction[];
};

async function matomoApi<T>(
  page: Page,
  method: string,
  params: Record<string, string> = {},
): Promise<T> {
  const token = await page.request.post(`${MATOMO}/index.php`, {
    form: {
      module: 'API',
      method: 'UsersManager.createAppSpecificTokenAuth',
      format: 'json',
      userLogin: ADMIN.login,
      passwordConfirmation: ADMIN.password,
      description: `e2e ${Date.now()}`,
    },
  });
  const { value: tokenAuth } = (await token.json()) as { value: string };
  const response = await page.request.post(`${MATOMO}/index.php`, {
    form: {
      module: 'API',
      method,
      format: 'json',
      token_auth: tokenAuth,
      idSite: '1',
      period: 'day',
      date: 'today',
      ...params,
    },
  });
  return (await response.json()) as T;
}

// Full renovation check against the real Matomo. Only the DEZ analytics config
// is mocked (the backend would serve it from MATOMO_URL/MATOMO_SITE_ID).
// ./matomo.sh test empties the visit log first.
test('Matomo records one ordered visit and nothing after withdrawal', async ({
  page,
  context,
}) => {
  test.setTimeout(240_000);
  const sent: string[] = [];
  page.on('response', async (response) => {
    if (!response.url().startsWith(`${MATOMO}/matomo.php`)) return;
    expect([200, 204]).toContain(response.status());
    expect((await response.allHeaders())['set-cookie']).toBeUndefined();
    const { requests } = JSON.parse(response.request().postData() ?? '{}') as {
      requests: string[];
    };
    for (const query of requests)
      sent.push(new URLSearchParams(query.slice(1)).get('e_a') ?? '');
  });
  // Only the first request: interception slows tile loading for the map.
  await page.route(
    '**/api/public/analytics-config',
    (route) =>
      route.fulfill({
        json: { matomo: { trackerUrl: `${MATOMO}/matomo.php`, siteId: 1 } },
      }),
    { times: 1 },
  );
  await page.addInitScript(() => {
    const now = Date.now();
    for (const key of ['map-help-seen', 'det_methodology_notice_seen_v1'])
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          savedAt: now,
          expiresAt: now + 90 * 864e5,
          value: true,
        }),
      );
  });

  await page.goto('/de/');
  await page
    .getByRole('dialog', { name: 'Ihre Daten. Ihre Entscheidung.' })
    .getByRole('button', { name: 'Alle erlauben' })
    .click();
  await page.getByRole('button', { name: 'Jetzt starten' }).click();
  await page
    .getByRole('combobox', { name: 'Adresse eingeben' })
    .fill('Isarstr. 1');
  await page
    .getByRole('option', { name: 'Isarstraße 1, Regensburg', exact: true })
    .click({ timeout: 15_000 });
  await page
    .getByRole('button', { name: 'Jetzt Sanierungsvorschlag ermitteln' })
    .click({ timeout: 45_000 });
  for (let i = 0; i < 4; i++) {
    const next = page.getByRole('button', { name: 'Weiter', exact: true });
    await expect(next.last()).toBeEnabled();
    await next.last().click();
  }
  for (const checkbox of (await page.getByRole('checkbox').all()).slice(0, 2))
    if ((await checkbox.isVisible()) && !(await checkbox.isChecked()))
      await checkbox.click();
  await page
    .getByRole('button', { name: 'Ergebnis anzeigen', exact: true })
    .last()
    .click();
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'PDF-Bericht herunterladen' })
    .click({ timeout: 30_000 });
  await download;
  await context.route('https://www.energieagentur-regensburg.de/**', (route) =>
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
    .poll(() => sent.includes('contact_requested'), { timeout: 15_000 })
    .toBe(true);
  await page.waitForTimeout(1000);
  const sentBeforeWithdrawal = sent.length;

  await page.getByRole('button', { name: 'Datenschutzeinstellungen' }).click();
  await page.getByRole('switch', { name: 'Webanalyse' }).click();
  await page.getByRole('button', { name: 'Auswahl speichern' }).click();
  const popupAfter = page.waitForEvent('popup');
  await page
    .getByRole('link', { name: /energieagentur-regensburg\.de/ })
    .click();
  await (await popupAfter).close();
  await page.waitForTimeout(2000);
  expect(sent, 'nothing after withdrawal').toHaveLength(sentBeforeWithdrawal);
  expect(
    (await context.cookies()).filter((c) => c.domain === 'matomo'),
  ).toEqual([]);

  const visits = await matomoApi<MatomoVisit[]>(
    page,
    'Live.getLastVisitsDetails',
    { filter_limit: '10' },
  );
  expect(visits, 'one session is one visit').toHaveLength(1);
  const [visit] = visits;
  const events = visit.actionDetails
    .filter((action) => action.type === 'event')
    .map((action) =>
      [action.eventAction, action.eventName].filter(Boolean).join(':'),
    );
  console.log('Stored visit:', {
    visitIp: visit.visitIp,
    referrerType: visit.referrerType,
    events,
  });
  expect(
    events.map((event) => event.split(':')[0]),
    'in the order they were triggered',
  ).toEqual(sent);
  expect(events[0]).toBe('tool_started');
  expect(events).toContain('tool_completed');
  for (const action of visit.actionDetails) {
    expect(action.eventCategory ?? 'Sanierungstool').toBe('Sanierungstool');
    expect(action.url).toMatch(/^https?:\/\/localhost:4321\/de\/$/);
  }
  expect(visit.referrerType).toBe('direct');
});

// Matomo's default recognition merges everyone with the same IP and browser
// into one visit; with [Tracker] trust_visitors_cookies = 1 the tab session
// sent as _id decides. Both users here share IP and user agent.
test('two users on the same network and browser are two visits', async ({
  browser,
  page,
}) => {
  test.setTimeout(120_000);
  type Visit = { idVisit: number };
  const before = await matomoApi<Visit[]>(page, 'Live.getLastVisitsDetails', {
    filter_limit: '-1',
  });
  for (let user = 0; user < 2; user++) {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    await context.route(
      '**/api/public/analytics-config',
      (route) =>
        route.fulfill({
          json: { matomo: { trackerUrl: `${MATOMO}/matomo.php`, siteId: 1 } },
        }),
      { times: 1 },
    );
    const visitor = await context.newPage();
    await visitor.goto('/de/');
    await visitor
      .getByRole('dialog', { name: 'Ihre Daten. Ihre Entscheidung.' })
      .getByRole('button', { name: 'Alle erlauben' })
      .click();
    const tracked = visitor.waitForResponse(`${MATOMO}/matomo.php`);
    await visitor.getByRole('button', { name: 'Jetzt starten' }).click();
    await tracked;
    await context.close();
  }
  const after = await matomoApi<Visit[]>(page, 'Live.getLastVisitsDetails', {
    filter_limit: '-1',
  });
  expect(after.length - before.length).toBe(2);
});
