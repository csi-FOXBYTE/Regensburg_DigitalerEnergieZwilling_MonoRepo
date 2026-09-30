import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CONSENT_KEY,
  CONSENT_TTL,
  ConsentManager,
  DAY,
  parseDecision,
} from '../src/lib/consent/state';
import {
  BUILDING_PREFIX,
  META_KEY,
  PROGRESS_TTL,
  SessionStorage,
} from '../src/lib/state/session/storage';
import { FakeStorage, session } from './helpers/consent-fixtures';

function setup() {
  const storage = new FakeStorage();
  let now = 1_800_000_000_000;
  const permission = new ConsentManager(
    () => storage,
    () => now,
  );
  const sessions = new SessionStorage(permission);
  return {
    storage,
    permission,
    sessions,
    advance: (ms: number) => {
      now += ms;
    },
    now: () => now,
  };
}

test('optional reads and writes stay off until an explicit grant', () => {
  const { storage, permission, sessions } = setup();
  sessions.getSession('unknown');
  sessions.getMeta();
  sessions.hasSeen('map-help-seen');
  sessions.saveSession('A', session());
  sessions.markSeen('map-help-seen');
  sessions.flush();
  assert.deepEqual([...new Set(storage.reads)], [CONSENT_KEY]);
  assert.deepEqual(storage.writes, []);
  permission.commit({ functional: false });
  sessions.flush();
  assert.deepEqual([...storage.data.keys()], [CONSENT_KEY]);
  assert.equal(sessions.getSession('A')?.inputState.general.livingArea, 123);
});

test('grant flushes memory; withdrawal keeps work and cannot be undone by a delayed flush', () => {
  const { storage, permission, sessions } = setup();
  storage.data.set('unrelated', 'keep');
  sessions.saveSession('A', session());
  sessions.markSeen('map-help-seen');
  permission.commit({ functional: true });
  assert.ok(storage.data.has(BUILDING_PREFIX + 'A'));
  assert.ok(storage.data.has('map-help-seen'));
  assert.ok(storage.data.has(META_KEY));
  permission.commit({ functional: false });
  const next = session();
  next.inputState.general.livingArea = 250;
  sessions.saveSession('A', next);
  sessions.flush();
  assert.deepEqual(
    [...storage.data.keys()].sort(),
    [CONSENT_KEY, 'unrelated'].sort(),
  );
  assert.equal(sessions.getSession('A')?.inputState.general.livingArea, 250);
  assert.equal(sessions.hasSeen('map-help-seen'), true);
  permission.commit({ functional: true });
  assert.equal(
    JSON.parse(storage.data.get(BUILDING_PREFIX + 'A')!).value.inputState
      .general.livingArea,
    250,
  );
});

for (const functional of [true, false])
  test(`decision (${functional}) expires at 180 days without renewal on read`, () => {
    const { storage, permission, advance } = setup();
    permission.commit({ functional });
    const raw = storage.data.get(CONSENT_KEY);
    advance(CONSENT_TTL - 1);
    assert.equal(permission.allows('functional'), functional);
    assert.ok(permission.$decision.get());
    assert.equal(storage.data.get(CONSENT_KEY), raw);
    advance(1);
    assert.equal(permission.allows('functional'), false);
    assert.equal(permission.$decision.get(), null);
  });

test('invalid, unsupported and future-purpose decisions grant no speculative permission', () => {
  const { permission, now } = setup();
  permission.commit({ functional: true });
  const valid = permission.$decision.get()!;
  for (const raw of [
    null,
    '{',
    'true',
    JSON.stringify({ ...valid, version: 2 }),
    JSON.stringify({ ...valid, purposeVersion: 2 }),
    JSON.stringify({ ...valid, choices: { all: true } }),
    JSON.stringify({ ...valid, expiresAt: now() + DAY }),
  ]) {
    assert.equal(parseDecision(raw, now()), null);
  }
  assert.equal(permission.allows('futurePurpose'), false);
});

test('permitted persistent fallback never replaces fresher or mutated memory', () => {
  const { storage, permission, sessions, now } = setup();
  permission.commit({ functional: true });
  sessions.saveSession('A', session());
  sessions.flush();
  const page = new SessionStorage(new ConsentManager(() => storage, now));
  const original = page.getSession('A')!;
  original.inputState.general.livingArea = 999;
  assert.equal(page.getSession('A')?.inputState.general.livingArea, 123);
  page.saveSession('A', original);
  sessions.saveSession('A', session('A'), true);
  sessions.flush();
  assert.equal(page.getSession('A')?.inputState.general.livingArea, 999);
});

test('90-day session expiry is fixed on reads and enumeration, with lazy metadata cleanup', () => {
  const { storage, permission, sessions, now, advance } = setup();
  permission.commit({ functional: true });
  sessions.saveSession('A', session());
  sessions.flush();
  const raw = storage.data.get(BUILDING_PREFIX + 'A');
  advance(PROGRESS_TTL - 1);
  const page = new SessionStorage(new ConsentManager(() => storage, now));
  assert.ok(page.getSession('A'));
  assert.deepEqual(page.getBuildingIds(), ['A']);
  page.saveSession('A', page.getSession('A')!);
  page.flush();
  assert.equal(storage.data.get(BUILDING_PREFIX + 'A'), raw);
  advance(1);
  const nextPage = new SessionStorage(new ConsentManager(() => storage, now));
  assert.equal(nextPage.getSession('A'), null);
  assert.equal(nextPage.getMeta().lastActiveBuildingId, null);
  assert.equal(storage.data.has(BUILDING_PREFIX + 'A'), false);
  assert.equal(storage.data.has(META_KEY), false);
  assert.ok(page.getSession('A'), 'open-page memory remains available');
});

test('actual progress and explicit resumption renew expiry', () => {
  const { storage, permission, sessions, now, advance } = setup();
  permission.commit({ functional: true });
  sessions.saveSession('A', session());
  sessions.flush();
  advance(DAY);
  const changed = session();
  changed.inputState.general.livingArea = 200;
  sessions.saveSession('A', changed);
  sessions.flush();
  assert.equal(
    JSON.parse(storage.data.get(BUILDING_PREFIX + 'A')!).expiresAt,
    now() + PROGRESS_TTL,
  );
  advance(DAY);
  sessions.saveSession('A', changed, true);
  sessions.flush();
  assert.equal(
    JSON.parse(storage.data.get(BUILDING_PREFIX + 'A')!).savedAt,
    now(),
  );
});

test('notices use memory without consent and expire persistently without read renewal', () => {
  const { storage, permission, sessions, now, advance } = setup();
  assert.equal(sessions.hasSeen('map-help-seen'), false);
  sessions.markSeen('map-help-seen');
  assert.equal(sessions.hasSeen('map-help-seen'), true);
  assert.equal(storage.data.size, 0);
  permission.commit({ functional: true });
  const raw = storage.data.get('map-help-seen');
  advance(PROGRESS_TTL - 1);
  const page = new SessionStorage(new ConsentManager(() => storage, now));
  assert.equal(page.hasSeen('map-help-seen'), true);
  page.markSeen('map-help-seen');
  assert.equal(storage.data.get('map-help-seen'), raw);
  advance(1);
  const nextPage = new SessionStorage(new ConsentManager(() => storage, now));
  assert.equal(nextPage.hasSeen('map-help-seen'), false);
  assert.equal(page.hasSeen('map-help-seen'), true);
});

test('a second tab observes withdrawal before any deferred optional write', () => {
  const { storage, permission, sessions, now } = setup();
  permission.commit({ functional: true });
  const other = new ConsentManager(() => storage, now);
  assert.equal(other.allows('functional'), true);
  const otherSessions = new SessionStorage(other);
  otherSessions.saveSession('B', session('B'));
  permission.commit({ functional: false });
  otherSessions.flush();
  assert.equal(other.allows('functional'), false);
  assert.deepEqual([...storage.data.keys()], [CONSENT_KEY]);
  assert.ok(otherSessions.getSession('B'));
  assert.equal(sessions.getSession('B'), null);
});

test('blocked reads, quota errors and failed deletion preserve memory and report once', () => {
  const { storage, permission, sessions } = setup();
  storage.failRead = storage.failWrite = storage.failRemove = true;
  let reports = 0;
  permission.$storageError.listen(() => reports++);
  permission.commit({ functional: true });
  sessions.saveSession('A', session());
  sessions.markSeen('map-help-seen');
  sessions.flush();
  assert.ok(sessions.getSession('A'));
  permission.commit({ functional: false });
  sessions.flush();
  assert.equal(permission.allows('functional'), false);
  assert.ok(sessions.getSession('A'));
  assert.equal(reports, 1);
});

test('malformed optional payloads are absent and cleared sessions cannot resurface after a failed deletion', () => {
  const { storage, permission, sessions } = setup();
  permission.commit({ functional: true });
  storage.data.set(BUILDING_PREFIX + 'broken', '{');
  assert.equal(sessions.getSession('broken'), null);
  sessions.saveSession('A', session());
  sessions.flush();
  storage.failRemove = true;
  sessions.clearSession('A');
  sessions.flush();
  assert.equal(sessions.getSession('A'), null);
});

test('serialization failures preserve new memory snapshots', () => {
  const { permission, sessions } = setup();
  permission.commit({ functional: true });
  sessions.saveSession('A', session());
  const cyclic = session();
  Object.assign(cyclic.inputState.general, { cycle: cyclic.inputState });
  sessions.saveSession('A', cyclic);
  sessions.flush();
  assert.equal(permission.$storageError.get(), true);
  assert.ok(sessions.getSession('A'));
});

test('expired permission prevents optional reads and writes even in a previously accepted document', () => {
  const { storage, permission, sessions, advance } = setup();
  permission.commit({ functional: true });
  sessions.saveSession('A', session());
  sessions.flush();
  advance(CONSENT_TTL);
  storage.reads = [];
  storage.writes = [];
  assert.equal(sessions.getSession('unknown'), null);
  sessions.saveSession('B', session('B'));
  sessions.flush();
  assert.deepEqual([...new Set(storage.reads)], [CONSENT_KEY]);
  assert.deepEqual(storage.writes, []);
  assert.ok(sessions.getSession('A'));
  assert.ok(sessions.getSession('B'));
});
