import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ExternalBuildingTargetLifecycle,
  parseExternalBuildingTarget,
} from '../src/lib/state/external-building-target';

test('parses a complete external target and preserves its exact building ID', () => {
  assert.deepEqual(
    parseExternalBuildingTarget(
      'unrelated=kept&buildingId=Building-AbC&lat=49.019&lon=12.097',
    ),
    {
      status: 'valid',
      target: {
        buildingId: 'Building-AbC',
        latitudeDegrees: 49.019,
        longitudeDegrees: 12.097,
      },
    },
  );
});

test('ignores fragments without reserved external-target parameters', () => {
  assert.deepEqual(parseExternalBuildingTarget('foo=bar'), {
    status: 'absent',
  });
});

test('rejects incomplete, blank, non-finite, and out-of-range targets', () => {
  const invalidFragments = [
    'buildingId=123&lat=49',
    'buildingId=%20&lat=49&lon=12',
    'buildingId=123&lat=&lon=12',
    'buildingId=123&lat=NaN&lon=12',
    'buildingId=123&lat=Infinity&lon=12',
    'buildingId=123&lat=91&lon=12',
    'buildingId=123&lat=49&lon=-181',
  ];

  for (const fragment of invalidFragments) {
    assert.deepEqual(parseExternalBuildingTarget(fragment), {
      status: 'invalid',
    });
  }
});

test('valid targets suppress resume and can be consumed only once', () => {
  const lifecycle = new ExternalBuildingTargetLifecycle();
  lifecycle.initialize('buildingId=123&lat=49&lon=12', false);

  assert.equal(lifecycle.suppressesSessionResume(), true);
  assert.deepEqual(lifecycle.consumePendingTarget(), {
    buildingId: '123',
    latitudeDegrees: 49,
    longitudeDegrees: 12,
  });
  assert.equal(lifecycle.consumePendingTarget(), null);
  assert.equal(lifecycle.suppressesSessionResume(), true);
});

test('a successful restore ignores an external target', () => {
  const lifecycle = new ExternalBuildingTargetLifecycle();
  const result = lifecycle.initialize(
    'restore=valid&buildingId=123&lat=49&lon=12',
    true,
  );

  assert.deepEqual(result, { status: 'ignored' });
  assert.equal(lifecycle.suppressesSessionResume(), false);
  assert.equal(lifecycle.consumePendingTarget(), null);
  assert.equal(lifecycle.consumeInvalidWarning(), false);
});

test('a failed restore can fall back to a valid external target', () => {
  const lifecycle = new ExternalBuildingTargetLifecycle();
  lifecycle.initialize('restore=malformed&buildingId=123&lat=49&lon=12', false);

  assert.equal(lifecycle.suppressesSessionResume(), true);
  assert.equal(lifecycle.consumePendingTarget()?.buildingId, '123');
});

test('invalid external input warns once and does not suppress resume', () => {
  const lifecycle = new ExternalBuildingTargetLifecycle();
  lifecycle.initialize('buildingId=123&lat=49', false);

  assert.equal(lifecycle.suppressesSessionResume(), false);
  assert.equal(lifecycle.consumePendingTarget(), null);
  assert.equal(lifecycle.consumeInvalidWarning(), true);
  assert.equal(lifecycle.consumeInvalidWarning(), false);
});
