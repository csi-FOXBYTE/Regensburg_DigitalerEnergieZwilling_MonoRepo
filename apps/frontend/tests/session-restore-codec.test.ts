import assert from 'node:assert/strict';
import test from 'node:test';
import { Step } from '../src/lib/state/ui/progress';
import {
  decodeSessionRestore,
  encodeSessionRestore,
} from '../src/lib/state/session/restore-codec';
import type { SavedSession } from '../src/lib/state/session/storage';

function session(): SavedSession {
  return {
    step: Step.Result,
    maxStepReached: Step.Result,
    building: {
      id: 'Gebäude-测试',
      coordinates: { lon: 12.1, lat: 49.01 },
      properties: {
        measuredHeight: undefined,
        lowestEave: undefined,
        groundHeight: undefined,
        roofHeight: undefined,
        isFlatRoof: undefined,
        address: {
          street: 'Prüfstraße 1',
          postcode: '93047',
          city: 'Regensburg',
        },
        digitalEnergyTwin: {
          volume: undefined,
          groundArea: undefined,
          upperFloorArea: undefined,
          grossExternalWallArea: undefined,
          grossExternalWallAreaWithoutAttic: undefined,
          grossExternalWallAreaAttic: undefined,
          roofArea: undefined,
          roofPitchDegrees: undefined,
          height: undefined,
          lowestEavesHeight: undefined,
          envelopeArea: undefined,
          adjacentWallArea: undefined,
          adjacentWallAreaWithoutAttic: undefined,
          adjacentWallAreaAttic: undefined,
          constructionYear: undefined,
          geothermalEnergyAvailable: undefined,
        },
      },
    },
    cameraTarget: { longitudeDegrees: 12.1, latitudeDegrees: 49.01 },
    cameraLon: 0.21,
    cameraLat: 0.86,
    inputState: {
      general: { note: 'Grüße 🌍' },
      heat: {},
      roof: {},
      roofWindows: {},
      exteriorWallWindows: {},
      topFloor: {},
      outerWall: {},
      bottomFloor: {},
      electricity: {},
    } as SavedSession['inputState'],
    insulationRenovations: [],
    heatingSurfaceRenovations: [],
    heatingRenovations: [],
  };
}

function encodeUnknown(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

test('round-trips a Unicode session as unpadded Base64URL', () => {
  const original = session();
  const encoded = encodeSessionRestore(original);

  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  assert.equal(encoded.includes('='), false);
  assert.deepEqual(
    decodeSessionRestore(encoded),
    JSON.parse(JSON.stringify(original)),
  );
});

test('rejects an unsupported envelope version', () => {
  assert.throws(() =>
    decodeSessionRestore(encodeUnknown({ version: 2, session: session() })),
  );
});

test('rejects malformed Base64URL and malformed JSON', () => {
  assert.throws(() => decodeSessionRestore('not+base64'));
  assert.throws(() => decodeSessionRestore(encodeUnknown('not an envelope')));
});

test('rejects invalid building coordinates, step bounds, input, and renovations', () => {
  const cases = [
    { ...session(), building: { ...session().building, id: '' } },
    {
      ...session(),
      building: {
        ...session().building,
        coordinates: { lon: Number.NaN, lat: 49.01 },
      },
    },
    { ...session(), step: Step.Welcome },
    { ...session(), inputState: null },
    { ...session(), heatingRenovations: null },
  ];

  for (const invalidSession of cases) {
    assert.throws(() =>
      decodeSessionRestore(
        encodeUnknown({ version: 1, session: invalidSession }),
      ),
    );
  }
});
