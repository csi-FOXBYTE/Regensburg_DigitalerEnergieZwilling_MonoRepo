import assert from 'node:assert/strict';
import test from 'node:test';
import { FakeStorage, session } from './helpers/consent-fixtures';

const storage = new FakeStorage();
const tabStore = new FakeStorage();
const requests: { url: string; body: URLSearchParams; init: RequestInit }[] =
  [];
let analyticsConfig: unknown = { matomo: null };

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    localStorage: storage,
    sessionStorage: tabStore,
    location: {
      origin: 'https://det.example',
      pathname: '/de/',
      hash: '#restore=payload&buildingId=DEBY_123&lat=49&lon=12',
    },
  },
});
globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
  if (String(input) === '/api/public/analytics-config')
    return Response.json(analyticsConfig);
  if (!String(input).startsWith('https://matomo.example/'))
    throw new TypeError('No network in unit tests');
  // Matomo bulk format: {"requests": ["?idsite=...", ...]}
  const bulk = JSON.parse(String(init.body)) as { requests: string[] };
  for (const query of bulk.requests)
    requests.push({
      url: String(input),
      body: new URLSearchParams(query),
      init,
    });
  return new Response(null, { status: 204 });
}) as typeof fetch;

const { consent, CONSENT_KEY, CONSENT_TTL } =
  await import('../src/lib/consent/state');
const { $consentView, initializeConsentDialog } =
  await import('../src/lib/consent/dialog-state');
const { initAnalytics, tracker } = await import('../src/lib/analytics');
const funnel = await import('../src/lib/analytics/funnel');
const { loadSessionFromData } = await import('../src/lib/state/session');
const atoms = await import('../src/lib/state/inputs/atoms');
const { Step } = await import('../src/lib/state/ui/progress');

const actions = () =>
  requests.map(({ body }) =>
    [body.get('e_a'), body.get('e_n')].filter(Boolean).join(':'),
  );
type Renovations = ReturnType<typeof atoms.$selectedInsulationRenovations.get>;
const renovations = (...ids: string[]) =>
  ids.map((id) => ({ id })) as unknown as Renovations;

test('a missing or malformed runtime config keeps analytics dormant', async () => {
  analyticsConfig = {
    matomo: { trackerUrl: 'javascript:alert(1)', siteId: 1 },
  };
  const { getAnalyticsConfig } = await import('../src/lib/api/public');
  assert.equal(await getAnalyticsConfig(), null);
  analyticsConfig = { matomo: { trackerUrl: '/matomo.php', siteId: 0 } };
  assert.equal(await getAnalyticsConfig(), null);
  analyticsConfig = { matomo: null };
  assert.equal(await getAnalyticsConfig(), null);
});

test('a decision predating analytics re-prompts before later dialogs can open', async () => {
  const decidedAt = Date.now() - 1000;
  storage.data.set(
    CONSENT_KEY,
    JSON.stringify({
      version: 1,
      purposeVersion: 1,
      choices: { functional: true },
      decidedAt,
      expiresAt: decidedAt + CONSENT_TTL,
    }),
  );
  analyticsConfig = {
    matomo: { trackerUrl: 'https://matomo.example/matomo.php?x=1', siteId: 3 },
  };
  const views: string[] = [];
  const stop = $consentView.listen((view) => views.push(view));
  await initAnalytics();
  initializeConsentDialog(true);
  stop();
  assert.deepEqual(views, ['initial'], 'never closed in between');
  assert.equal(consent.allows('functional'), true, 'progress stays usable');
  assert.equal(consent.allows('analytics'), false);
});

test('funnel triggers send catalogued keys only after opt-in and never for restores', async () => {
  await initAnalytics();
  assert.deepEqual(consent.$availablePurposes.get(), [
    'functional',
    'analytics',
  ]);

  funnel.trackToolStarted();
  await tracker.flush();
  assert.equal(requests.length, 0, 'nothing before the opt-in');

  consent.commit({ functional: false, analytics: true });
  const restored = session('restored');
  restored.step = Step.Result;
  loadSessionFromData(restored);
  await tracker.flush();
  assert.equal(requests.length, 0, 'a restore is not a completed check');

  funnel.trackStepConfirmed(Step.Welcome);
  funnel.trackStepConfirmed(Step.GeneralData);
  atoms.$selectedInsulationRenovations.set(
    renovations('envelope_roof', 'envelope_outerWindows'),
  );
  atoms.$selectedHeatingRenovations.set(
    renovations('heat_custom_carrier_custom_system'),
  );
  atoms.$selectedHeatingSurfaceRenovations.set(
    renovations('surface_radiant_surface_heating'),
  );
  funnel.trackStepConfirmed(Step.Renovation);
  funnel.trackStepConfirmed(Step.Renovation);
  funnel.trackDonationStarted();
  funnel.trackDonationCompleted();
  funnel.trackPdfDownloaded();
  funnel.trackContactRequested();
  await tracker.flush();

  assert.deepEqual(actions(), [
    'building_type_confirmed:single_family',
    'step_completed:building_data',
    'renovation_measure_confirmed:envelope_roof',
    'renovation_measure_confirmed:envelope_windows',
    'renovation_measure_confirmed:heating_surface_radiant',
    'step_completed:renovation_measures',
    'step_completed:results',
    'tool_completed',
    'donation_started',
    'donation_completed',
    'step_completed:data_donation',
    'pdf_downloaded:energy_report_pdf',
    'step_completed:pdf_export',
    'contact_requested:energy_advice_link',
    'step_completed:consulting_contact',
  ]);
  for (const { url, body, init } of requests) {
    assert.equal(url, 'https://matomo.example/matomo.php');
    assert.equal(body.get('url'), 'https://det.example/de/');
    assert.equal(body.get('idsite'), '3');
    assert.equal(init.credentials, 'omit');
    assert.doesNotMatch(body.toString(), /restore|payload|DEBY|lat=|lon=/);
  }
  assert.equal(storage.data.has('det_analytics_session'), false);
  assert.ok(tabStore.data.has('det_analytics_session'));
});
