import assert from 'node:assert/strict';
import test from 'node:test';
import { createUtmToWgs84Transform } from '../src/config/adapters/addressCoordinates';

test('transforms the UTM central meridian to WGS84 degrees', () => {
  const transform = createUtmToWgs84Transform({
    zone: 32,
    hemisphere: 'north',
  });

  assert.deepEqual(transform(500000, 0), { lat: 0, lon: 9 });
});

test('supports a configurable UTM zone and hemisphere', () => {
  const transform = createUtmToWgs84Transform({
    zone: 33,
    hemisphere: 'south',
  });

  const result = transform(500000, 10000000);

  assert.equal(result.lat, 0);
  assert.ok(Math.abs(result.lon - 15) < Number.EPSILON * 10);
});

test('transforms a non-central UTM reference coordinate', () => {
  const transform = createUtmToWgs84Transform({
    zone: 31,
    hemisphere: 'north',
  });
  const result = transform(448251.795, 5411932.678);

  assert.ok(Math.abs(result.lat - 48.8582) < 0.00001);
  assert.ok(Math.abs(result.lon - 2.2945) < 0.00001);
});

test('rejects invalid UTM zones', () => {
  assert.throws(
    () =>
      createUtmToWgs84Transform({
        zone: 0,
        hemisphere: 'north',
      }),
    RangeError,
  );
});
