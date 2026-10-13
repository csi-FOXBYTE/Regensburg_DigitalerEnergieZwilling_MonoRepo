import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildingTypeKey,
  isAllowedEvent,
  measureKey,
  type AnalyticsEvent,
} from '../src/lib/analytics/catalog';
import { computeKpis } from '../src/lib/analytics/kpi';
import {
  ANALYTICS_SESSION_KEY,
  ANALYTICS_SESSION_TIMEOUT,
  sanitizedPageUrl,
  Tracker,
} from '../src/lib/analytics/tracker';
import { CONSENT_KEY, ConsentManager } from '../src/lib/consent/state';
import {
  BUILDING_PREFIX,
  SessionStorage,
} from '../src/lib/state/session/storage';
import { FakeStorage, session } from './helpers/consent-fixtures';

const target = { trackerUrl: 'https://matomo.example/matomo.php', siteId: 7 };

function setup({ configured = true } = {}) {
  const storage = new FakeStorage();
  const tabStore = new FakeStorage();
  let now = 1_800_000_000_000;
  let ids = 0;
  const permission = new ConsentManager(
    () => storage,
    () => now,
  );
  const location = {
    origin: 'https://det.example',
    pathname: '/de/',
  };
  const sent: URLSearchParams[] = [];
  const batches: string[][] = [];
  let hold: Promise<void> | undefined;
  let failNext = false;
  const tracker = new Tracker(
    permission,
    async (url, requests) => {
      assert.equal(url, target.trackerUrl);
      if (failNext) {
        failNext = false;
        throw new TypeError('Failed to fetch');
      }
      sent.push(...requests);
      batches.push(requests.map((body) => body.get('e_a')!));
      await hold;
    },
    () => tabStore,
    () => sanitizedPageUrl(location),
    () => (++ids).toString(16).padStart(16, '0'),
  );
  if (configured) {
    tracker.configure(target);
    permission.enablePurpose('analytics');
  }
  return {
    storage,
    tabStore,
    permission,
    tracker,
    sent,
    batches,
    location,
    holdDelivery: (until: Promise<void>) => {
      hold = until;
    },
    failNextDelivery: () => {
      failNext = true;
    },
    /** Lets the queued microtask flush run. */
    settle: () => tracker.flush(),
    actions: () => sent.map((body) => `${body.get('e_a')}:${body.get('e_n')}`),
    advance: (ms: number) => {
      now += ms;
    },
  };
}

test('dormant without configuration: analytics is never offered or sent', async () => {
  const { storage, tabStore, permission, tracker, sent, settle } = setup({
    configured: false,
  });
  permission.commit({ functional: true, analytics: true });
  tracker.track('tool_started');
  await settle();
  assert.equal(permission.allows('analytics'), false);
  assert.equal(permission.needsDecision(), false);
  assert.deepEqual(sent, []);
  assert.deepEqual(tabStore.writes, []);
  const stored = JSON.parse(storage.data.get(CONSENT_KEY)!);
  assert.equal(stored.purposeVersion, 1, 'readable by the previous release');
  assert.equal(stored.choices.analytics, false);
});

test('without opt-in nothing is sent or buffered, and a later grant replays nothing', async () => {
  const { tabStore, permission, tracker, sent, actions, settle } = setup();
  tracker.track('tool_started');
  tracker.track('step_completed', 'landing');
  permission.commit({ functional: true, analytics: false });
  tracker.track('step_completed', 'building_selection');
  await settle();
  assert.deepEqual(sent, []);
  assert.deepEqual(tabStore.writes, []);
  permission.commit({ functional: false, analytics: true });
  await settle();
  assert.deepEqual(sent, []);
  tracker.track('step_completed', 'initial_assessment');
  await settle();
  assert.deepEqual(actions(), ['step_completed:initial_assessment']);
});

test('decisions made before analytics existed keep functional storage but ask again', () => {
  const { storage, permission } = setup({ configured: false });
  permission.commit({ functional: true });
  const configured = new ConsentManager(() => storage, permission.now);
  assert.equal(configured.needsDecision(), false);
  configured.enablePurpose('analytics');
  assert.equal(configured.needsDecision(), true);
  assert.equal(configured.allows('functional'), true);
  assert.equal(configured.allows('analytics'), false);
  configured.commit({ functional: true, analytics: true });
  assert.equal(configured.needsDecision(), false);
  assert.equal(configured.allows('analytics'), true);
  assert.equal(JSON.parse(storage.data.get(CONSENT_KEY)!).purposeVersion, 2);
});

test('withdrawal stops sending and removes the session reference only', async () => {
  const { storage, tabStore, permission, tracker, sent, settle } = setup();
  const sessions = new SessionStorage(permission);
  permission.commit({ functional: true, analytics: true });
  sessions.saveSession('A', session());
  sessions.flush();
  tracker.track('tool_started');
  await settle();
  assert.equal(sent.length, 1);
  assert.ok(tabStore.data.has(ANALYTICS_SESSION_KEY));
  // Queued in the same action as the withdrawal: dropped, not delivered.
  tracker.track('step_completed', 'landing');
  permission.commit({ functional: true, analytics: false });
  assert.equal(tabStore.data.has(ANALYTICS_SESSION_KEY), false);
  tracker.track('step_completed', 'building_selection');
  await settle();
  assert.equal(sent.length, 1);
  assert.ok(storage.data.has(BUILDING_PREFIX + 'A'), 'progress is kept');
});

test('a second tab observes withdrawal before sending', async () => {
  const { storage, permission, tracker, sent, settle } = setup();
  permission.commit({ functional: true, analytics: true });
  const other = new ConsentManager(() => storage, permission.now);
  other.enablePurpose('analytics');
  other.commit({ functional: true, analytics: false });
  tracker.track('tool_started');
  await settle();
  assert.deepEqual(sent, []);
});

test('only catalogued codes and values pass the allow-list', async () => {
  const { permission, tracker, actions, settle } = setup();
  permission.commit({ functional: false, analytics: true });
  const untyped = tracker.track as (code: string, value?: string) => void;
  untyped.call(tracker, 'page_view');
  untyped.call(tracker, 'tool_started', 'extra');
  untyped.call(tracker, 'step_completed');
  untyped.call(tracker, 'step_completed', 'Musterstraße 1');
  untyped.call(tracker, 'renovation_measure_confirmed', 'heat_custom_x');
  untyped.call(tracker, 'pdf_downloaded', 'deletion-token');
  untyped.call(tracker, '__proto__');
  await settle();
  assert.deepEqual(actions(), []);
  assert.equal(isAllowedEvent('donation_completed', undefined), true);
  assert.equal(isAllowedEvent('constructor', undefined), false);
  assert.equal(measureKey('heat_custom_target_system'), undefined);
  assert.equal(measureKey('toString'), undefined);
  assert.equal(measureKey('envelope_outerWalls'), 'envelope_outer_walls');
  assert.equal(buildingTypeKey('multiFamily'), 'multi_family');
  assert.equal(buildingTypeKey('castle'), undefined);
});

test('requests carry only the fixed event fields and a sanitized page URL', async () => {
  const { permission, tracker, sent, location, settle } = setup();
  permission.commit({ functional: false, analytics: true });
  location.pathname = '/en/delete/secret-token';
  tracker.track('step_completed', 'heating');
  await settle();
  const body = sent[0];
  assert.deepEqual([...body.keys()].sort(), [
    '_id',
    'apiv',
    'e_a',
    'e_c',
    'e_n',
    'idsite',
    'rand',
    'rec',
    'send_image',
    'url',
  ]);
  assert.equal(body.get('idsite'), '7');
  assert.equal(body.get('e_c'), 'Sanierungstool');
  assert.equal(body.get('e_a'), 'step_completed');
  assert.equal(body.get('e_n'), 'heating');
  assert.match(body.get('_id')!, /^[0-9a-f]{16}$/);
  assert.equal(body.get('url'), 'https://det.example/en/');
  assert.equal(
    sanitizedPageUrl({
      origin: 'https://det.example',
      pathname: '/debugbubble',
    }),
    'https://det.example/',
  );
});

test('repeated triggers are sent once per session, also across reloads', async () => {
  const { tabStore, permission, tracker, actions, advance, settle } = setup();
  permission.commit({ functional: false, analytics: true });
  tracker.track('step_completed', 'heating');
  tracker.track('step_completed', 'heating');
  tracker.track('tool_completed');
  tracker.track('tool_completed');
  await settle();
  let resent = false;
  const reloaded = new Tracker(
    permission,
    async () => {
      resent = true;
    },
    () => tabStore,
    () => 'https://det.example/de/',
  );
  reloaded.configure(target);
  reloaded.track('tool_completed');
  await reloaded.flush();
  assert.equal(resent, false, 'a reload must not resend');
  assert.deepEqual(actions(), [
    'step_completed:heating',
    'tool_completed:null',
  ]);

  advance(ANALYTICS_SESSION_TIMEOUT - 1);
  tracker.track('tool_completed');
  await settle();
  assert.equal(actions().length, 2, 'activity within the timeout');
  advance(ANALYTICS_SESSION_TIMEOUT);
  tracker.track('tool_completed');
  await settle();
  assert.equal(actions().length, 3, 'a new session after inactivity');
});

test('a new session reference is random and unrelated to the previous one', async () => {
  const { permission, tracker, sent, advance, settle } = setup();
  permission.commit({ functional: false, analytics: true });
  tracker.track('tool_started');
  await settle();
  advance(ANALYTICS_SESSION_TIMEOUT);
  tracker.track('tool_started');
  await settle();
  assert.notEqual(sent[0].get('_id'), sent[1].get('_id'));
});

test('events of one action leave as one ordered batch after the previous delivery', async () => {
  const { permission, tracker, batches, holdDelivery, settle } = setup();
  permission.commit({ functional: false, analytics: true });
  let release!: () => void;
  holdDelivery(
    new Promise((resolve) => {
      release = resolve;
    }),
  );
  tracker.track('tool_started');
  tracker.track('step_completed', 'landing');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(batches, [['tool_started', 'step_completed']]);

  // A second action while the first request is in flight waits for it, so
  // Matomo never sees parallel requests that could split the visit.
  tracker.track('step_completed', 'building_selection');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(batches.length, 1);
  holdDelivery(Promise.resolve());
  release();
  await settle();
  assert.deepEqual(batches, [
    ['tool_started', 'step_completed'],
    ['step_completed'],
  ]);
});

test('a withdrawal cancels batches waiting behind an in-flight request', async () => {
  const { permission, tracker, actions, holdDelivery, settle } = setup();
  permission.commit({ functional: false, analytics: true });
  let release!: () => void;
  holdDelivery(
    new Promise((resolve) => {
      release = resolve;
    }),
  );
  tracker.track('tool_started');
  await new Promise((resolve) => setTimeout(resolve, 0));
  tracker.track('step_completed', 'landing');
  await new Promise((resolve) => setTimeout(resolve, 0));
  permission.commit({ functional: false, analytics: false });
  release();
  await settle();
  assert.deepEqual(actions(), ['tool_started:null']);
});

test('a failed delivery never blocks later events', async () => {
  const { permission, tracker, actions, failNextDelivery, settle } = setup();
  permission.commit({ functional: false, analytics: true });
  failNextDelivery();
  tracker.track('tool_started');
  await settle();
  tracker.track('step_completed', 'landing');
  await settle();
  assert.deepEqual(actions(), ['step_completed:landing']);
});

test('KPIs follow the concept definitions per session', () => {
  const step = (value: string) =>
    ({ code: 'step_completed', value }) as AnalyticsEvent;
  const started = { code: 'tool_started' } as AnalyticsEvent;
  const completed = { code: 'tool_completed' } as AnalyticsEvent;
  const pdf = { code: 'pdf_downloaded', value: 'energy_report_pdf' } as const;
  const kpis = computeKpis([
    [started, step('landing'), step('building_data'), completed, pdf],
    [
      started,
      step('landing'),
      completed,
      { code: 'donation_completed' } as AnalyticsEvent,
    ],
    [started, step('landing'), step('heating')],
    [started, step('landing'), step('heating')],
    [started],
    [{ code: 'contact_requested', value: 'energy_advice_link' }],
  ]);
  assert.equal(kpis.started, 5);
  assert.equal(kpis.completed, 2);
  assert.equal(kpis.completionRate, 0.4);
  assert.equal(kpis.dropOffRate, 0.6);
  assert.equal(kpis.pdfDownloaded, 1);
  assert.equal(kpis.pdfRate, 0.5);
  assert.equal(kpis.contactRequested, 1);
  assert.equal(kpis.contactRate, 0.5);
  assert.equal(kpis.donationRate, 0.5);
  assert.deepEqual(kpis.dropOffSteps, { heating: 2 });
  assert.equal(kpis.dropOffWithoutStep, 1);
  assert.equal(computeKpis([]).completionRate, null);
});

test('resumed sessions complete without starting, so the completion rate can exceed 1', () => {
  // Documents the literal concept definition; the denominator needs a business decision.
  const kpis = computeKpis([
    [{ code: 'tool_started' }, { code: 'tool_completed' }],
    [{ code: 'tool_completed' }],
  ] as AnalyticsEvent[][]);
  assert.equal(kpis.completionRate, 2);
  assert.equal(kpis.dropOffRate, -1);
});
