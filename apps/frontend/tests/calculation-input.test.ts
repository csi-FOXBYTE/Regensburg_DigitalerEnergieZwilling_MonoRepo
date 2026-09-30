import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
  DEFAULT_CONFIG,
  validateInput,
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { setBuilding, unselectBuilding } from '../src/lib/state/building';
import { $calculationInput } from '../src/lib/state/computed/calculation-input';
import { $currentEnergyState } from '../src/lib/state/computed/current-energy-state';
import { $lod2Input } from '../src/lib/state/computed/lod2-input';
import { $inputState, emptyInputState } from '../src/lib/state/inputs/atoms';
import { $isExteriorWallWindowsAreaInvalid } from '../src/lib/state/inputs/exterior-wall-windows';
import { $isAdjacentWallAreaInvalid } from '../src/lib/state/inputs/outer-wall';

function selectBuilding(overrides: Record<string, unknown> = {}) {
  const properties: Record<string, unknown> = {
    id: 'test-building',
    function: '31001_1000',
    roofType: '3100',
    measuredHeight: 12,
    NiedrigsteTraufeDesGebaeudes: 343,
    HoeheGrund: 340,
    'digitalEnergyTwin.lowestEavesHeight': 6,
    'digitalEnergyTwin.groundArea': 100,
    'digitalEnergyTwin.upperFloorArea': 100,
    'digitalEnergyTwin.roofArea': 120,
    'digitalEnergyTwin.grossExternalWallArea': 300,
    'digitalEnergyTwin.grossExternalWallAreaWithoutAttic': 240,
    'digitalEnergyTwin.grossExternalWallAreaAttic': 60,
    'digitalEnergyTwin.adjacentBuildings': JSON.stringify([
      {
        sharedWallArea: 150,
        sharedWallAreaWithoutAttic: 130,
        sharedWallAreaAttic: 20,
      },
      {
        sharedWallArea: 120,
        sharedWallAreaWithoutAttic: 90,
        sharedWallAreaAttic: 30,
      },
    ]),
    ...overrides,
  };
  setBuilding(
    { getProperty: (name) => properties[name] },
    { lon: 12.1, lat: 49.1 },
  );
}

afterEach(() => {
  unselectBuilding();
  $inputState.set(emptyInputState());
});

test('subtracts each shared wall split before passing exposed areas to core', () => {
  selectBuilding();
  const input = $calculationInput.get();
  assert.equal(input.outerWall.area, undefined);
  assert.equal(input.outerWall.areaWithoutAttic, 20);
  assert.equal(input.outerWall.atticArea, 10);
  assert.equal(input.outerWall.adjacentWallArea, 270);
  assert.equal(input.general.lowestEaveHeight, 6);
  assert.equal(input.general.buildingHeight, 12);
  assert.equal(validateInput(input, DEFAULT_CONFIG).success, true);
  assert.equal(
    $currentEnergyState.get().resolvedInput.general.numberOfStories,
    2,
  );
});

test('recalculates wall area when attic heating changes and preserves manual overrides', () => {
  selectBuilding();
  const input = emptyInputState();
  input.topFloor = { hasAttic: true, isAtticHeated: false };
  $inputState.set(input);
  assert.equal($currentEnergyState.get().resolvedInput.outerWall.area, 20);

  $inputState.set({
    ...input,
    topFloor: { hasAttic: true, isAtticHeated: true },
  });
  assert.equal($currentEnergyState.get().resolvedInput.outerWall.area, 30);

  $inputState.set({ ...$inputState.get(), outerWall: { area: 280 } });
  assert.equal($currentEnergyState.get().resolvedInput.outerWall.area, 280);
  $inputState.set({ ...$inputState.get(), outerWall: {} });
  assert.equal($currentEnergyState.get().resolvedInput.outerWall.area, 30);

  $inputState.set({
    ...input,
    topFloor: { hasAttic: false, isAtticHeated: true },
  });
  assert.equal($currentEnergyState.get().resolvedInput.outerWall.area, 20);
});

test('checks windows against heated wall area and adjacency against the full wall', () => {
  selectBuilding();
  const input = emptyInputState();
  input.topFloor = { hasAttic: true, isAtticHeated: false };
  input.exteriorWallWindows = { area: 20 };
  $inputState.set(input);
  assert.equal($isExteriorWallWindowsAreaInvalid.get(), false);
  assert.equal($isAdjacentWallAreaInvalid.get(), false);

  $inputState.set({ ...input, exteriorWallWindows: { area: 21 } });
  assert.equal($isExteriorWallWindowsAreaInvalid.get(), true);
  $inputState.set({ ...input, outerWall: { adjacentWallArea: 301 } });
  assert.equal($isAdjacentWallAreaInvalid.get(), true);
});

test('preserves a zero attic area and does not substitute the legacy wall total for missing splits', () => {
  selectBuilding({
    'digitalEnergyTwin.grossExternalWallAreaAttic': 0,
    'digitalEnergyTwin.adjacentBuildings': '[]',
  });
  assert.equal($lod2Input.get().outerWall.atticArea, 0);

  selectBuilding({
    'digitalEnergyTwin.grossExternalWallAreaWithoutAttic': null,
    'digitalEnergyTwin.grossExternalWallAreaAttic': null,
    'digitalEnergyTwin.lowestEavesHeight': null,
    HoeheGrund: undefined,
  });
  assert.equal($lod2Input.get().outerWall.area, undefined);
  assert.equal($lod2Input.get().outerWall.areaWithoutAttic, undefined);
  assert.equal($lod2Input.get().outerWall.atticArea, undefined);
  assert.equal($lod2Input.get().general.lowestEaveHeight, undefined);
  assert.equal($calculationInput.get().outerWall.area, undefined);
  assert.equal($calculationInput.get().outerWall.areaWithoutAttic, 0);
  assert.equal($calculationInput.get().outerWall.atticArea, 0);
});

test('an explicitly empty adjacency list leaves both gross areas exposed', () => {
  selectBuilding({ 'digitalEnergyTwin.adjacentBuildings': '[]' });
  assert.equal($calculationInput.get().outerWall.areaWithoutAttic, 240);
  assert.equal($calculationInput.get().outerWall.atticArea, 60);
  assert.equal($calculationInput.get().outerWall.adjacentWallArea, 0);
});

test('missing or invalid shared splits stay unknown instead of passing gross areas', () => {
  for (const adjacency of [
    undefined,
    null,
    'invalid JSON',
    '{}',
    JSON.stringify([{ sharedWallArea: 270 }]),
    JSON.stringify([
      {
        sharedWallArea: 270,
        sharedWallAreaWithoutAttic: null,
        sharedWallAreaAttic: null,
      },
    ]),
    JSON.stringify([
      {
        sharedWallArea: 150,
        sharedWallAreaWithoutAttic: 130,
        sharedWallAreaAttic: 20,
      },
      { sharedWallArea: 120 },
    ]),
  ]) {
    selectBuilding({ 'digitalEnergyTwin.adjacentBuildings': adjacency });
    assert.equal($lod2Input.get().outerWall.areaWithoutAttic, undefined);
    assert.equal($lod2Input.get().outerWall.atticArea, undefined);
  }
});

test('keeps a known split when the other shared split is unavailable', () => {
  selectBuilding({
    'digitalEnergyTwin.adjacentBuildings': JSON.stringify([
      {
        sharedWallArea: 270,
        sharedWallAreaWithoutAttic: 220,
        sharedWallAreaAttic: null,
      },
    ]),
  });
  assert.equal($lod2Input.get().outerWall.areaWithoutAttic, 20);
  assert.equal($lod2Input.get().outerWall.atticArea, undefined);
});

test('clamps exposed areas to zero if shared areas exceed the gross split', () => {
  selectBuilding({
    'digitalEnergyTwin.adjacentBuildings': JSON.stringify([
      {
        sharedWallArea: 310,
        sharedWallAreaWithoutAttic: 245,
        sharedWallAreaAttic: 65,
      },
    ]),
  });
  assert.equal($calculationInput.get().outerWall.areaWithoutAttic, 0);
  assert.equal($calculationInput.get().outerWall.atticArea, 0);
  assert.equal($isAdjacentWallAreaInvalid.get(), true);
});
