import {
  devices,
  expect,
  test,
  type Browser,
  type Page,
} from '@playwright/test';
import { MATOMO } from './matomo';

/**
 * Fills the local Matomo with realistic data: every simulated user clicks
 * through the real app in a fresh browser, and the real tracker sends to the
 * real Matomo. Behaviour is drawn from a seeded random generator, so a run
 * with the same SEED_USERS is reproducible.
 */
const USERS = Number(process.env.SEED_USERS ?? 20);
// Checked to select a regular residential building (others ask for confirmation).
const ADDRESSES = [
  'Isarstraße 1',
  'Isarstraße 3',
  'Isarstraße 5',
  'Isarstraße 8',
  'Isarstraße 12',
  'Altmühlstraße 5',
  'Innstraße 6',
  'Ilzstraße 3',
  'Naabstraße 7',
  'Vilsstraße 2',
  'Amberger Straße 30',
];
const STAGES = [
  'bounce', // opens the page and leaves
  'landing', // starts, then leaves on the map
  'search', // searches an address but selects nothing
  'building_selection',
  'initial_assessment',
  'building_data',
  'building_envelope',
  'heating',
  'electricity_renewables',
  'complete',
] as const;
type Stage = (typeof STAGES)[number];

function random(seed: number) {
  let state = seed + 0x6d2b79f5;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function persona(index: number) {
  const next = random(index);
  const pick = <T>(weighted: [T, number][]) => {
    let roll = next() * weighted.reduce((sum, [, weight]) => sum + weight, 0);
    for (const [value, weight] of weighted)
      if ((roll -= weight) < 0) return value;
    return weighted[weighted.length - 1][0];
  };
  return {
    consent: pick<'all' | 'functional' | 'none'>([
      ['all', 75],
      ['functional', 10],
      ['none', 15],
    ]),
    leaveAfter: pick<Stage>([
      ['bounce', 5],
      ['landing', 6],
      ['search', 5],
      ['building_selection', 6],
      ['initial_assessment', 8],
      ['building_data', 8],
      ['building_envelope', 6],
      ['heating', 5],
      ['electricity_renewables', 4],
      ['complete', 47],
    ]),
    mobile: next() < 0.3,
    multiFamily: next() < 0.3,
    address: ADDRESSES[Math.floor(next() * ADDRESSES.length)],
    envelopeMeasures: Math.floor(next() * 4),
    heatingChoice: next(),
    pdf: next() < 0.6,
    contact: next() < 0.3,
    thinkTime: () => 300 + next() * 1500,
  };
}

async function openApp(browser: Browser, mobile: boolean) {
  const context = await browser.newContext({
    ...(mobile ? devices['Pixel 7'] : devices['Desktop Chrome']),
    baseURL: 'http://localhost:4321',
    ignoreHTTPSErrors: true,
  });
  // The local frontend answers with http://localhost:8090; inside the Docker
  // network the same Matomo is http://matomo. Only the first request.
  await context.route(
    '**/api/public/analytics-config',
    (route) =>
      route.fulfill({
        json: { matomo: { trackerUrl: `${MATOMO}/matomo.php`, siteId: 1 } },
      }),
    { times: 1 },
  );
  // Real click on our link, but no traffic to the external advice website.
  await context.route('https://www.energieagentur-regensburg.de/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<title>Beratung</title>',
    }),
  );
  await context.addInitScript(() => {
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
  return context;
}

async function chooseConsent(
  page: Page,
  consent: 'all' | 'functional' | 'none',
) {
  const dialog = page.getByRole('dialog', {
    name: 'Ihre Daten. Ihre Entscheidung.',
  });
  if (consent === 'all')
    return dialog.getByRole('button', { name: 'Alle erlauben' }).click();
  if (consent === 'none')
    return dialog.getByRole('button', { name: 'Optionale ablehnen' }).click();
  await dialog.getByRole('button', { name: 'Einstellungen' }).click();
  await page
    .getByRole('switch', { name: 'Fortschritt & Einstellungen' })
    .click();
  await page.getByRole('button', { name: 'Auswahl speichern' }).click();
}

async function closeDialogs(page: Page) {
  // Notices that only show without stored consent (map help, methodology).
  for (const name of [
    'Kartenbedienung',
    'Hinweise zur Datengrundlage und Berechnung',
  ]) {
    const dialog = page.getByRole('dialog', { name });
    if (await dialog.isVisible()) await page.keyboard.press('Escape');
  }
}

async function forward(page: Page, name: string) {
  await closeDialogs(page);
  const button = page.getByRole('button', { name, exact: true }).last();
  await expect(button).toBeEnabled({ timeout: 20_000 });
  await button.click();
}

for (let index = 0; index < USERS; index++) {
  const user = persona(index);
  const label = `${user.mobile ? 'mobile' : 'desktop'}, consent ${user.consent}, leaves after ${user.leaveAfter}`;

  test(`user ${index + 1}: ${label}`, async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await openApp(browser, user.mobile);
    const page = await context.newPage();
    const think = () => page.waitForTimeout(user.thinkTime());
    const leaves = (stage: Stage) => user.leaveAfter === stage;

    await page.goto('/de/');
    await chooseConsent(page, user.consent);
    await think();
    if (leaves('bounce')) return context.close();

    await page.getByRole('button', { name: 'Jetzt starten' }).click();
    await think();
    if (leaves('landing')) return context.close();

    await closeDialogs(page);
    await page
      .getByRole('combobox', { name: 'Adresse eingeben' })
      .fill(user.address);
    const option = page.getByRole('option', {
      name: `${user.address}, Regensburg`,
      exact: true,
    });
    await expect(option).toBeVisible({ timeout: 20_000 });
    if (leaves('search')) return context.close();
    await option.click();
    const assess = page.getByRole('button', {
      name: 'Jetzt Sanierungsvorschlag ermitteln',
    });
    await expect(assess).toBeVisible({ timeout: 45_000 });
    await think();
    if (leaves('building_selection')) return context.close();

    await assess.click();
    await think();
    if (leaves('initial_assessment')) return context.close();

    if (user.multiFamily) {
      await closeDialogs(page);
      await page
        .getByRole('combobox', {
          name: 'Ist das Gebäude ein Ein- oder Mehrfamilienhaus?',
        })
        .click();
      await page.getByRole('option', { name: 'Mehrfamilienhaus' }).click();
    }
    for (const stage of [
      'building_data',
      'building_envelope',
      'heating',
      'electricity_renewables',
    ] as const) {
      await forward(page, 'Weiter');
      await think();
      if (leaves(stage)) return context.close();
    }

    await closeDialogs(page);
    const checkboxes = await page.getByRole('checkbox').all();
    for (const checkbox of checkboxes.slice(0, user.envelopeMeasures))
      if (await checkbox.isVisible()) await checkbox.click();
    for (const group of await page.getByRole('radiogroup').all()) {
      const radios = await group.getByRole('radio').all();
      if (radios.length)
        await radios[Math.floor(user.heatingChoice * radios.length)].click();
    }
    await forward(page, 'Ergebnis anzeigen');
    await expect(
      page.getByRole('button', { name: 'PDF-Bericht herunterladen' }),
    ).toBeVisible({ timeout: 30_000 });
    await think();

    if (user.pdf) {
      const download = page.waitForEvent('download');
      await page
        .getByRole('button', { name: 'PDF-Bericht herunterladen' })
        .click();
      await download;
      await think();
    }
    if (user.contact) {
      const popup = page.waitForEvent('popup');
      await page
        .getByRole('link', { name: /energieagentur-regensburg\.de/ })
        .click();
      await (await popup).close();
    }
    // Let the last bulk request reach Matomo before the browser closes.
    await page.waitForTimeout(1500);
    await context.close();
  });
}
