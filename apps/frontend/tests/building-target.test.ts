import assert from 'node:assert/strict';
import test from 'node:test';
import { findExactBuildingFeature } from '../src/lib/building-target';
import type { BuildingFeatureSource } from '../src/lib/state/building';

function feature(id: string): BuildingFeatureSource {
  return {
    getProperty: (name) => (name === 'id' ? id : undefined),
  };
}

test('finds only the exact case-sensitive building ID', () => {
  const nearby = feature('nearby-building');
  const wrongCase = feature('Requested-Building');
  const exact = feature('requested-building');

  assert.equal(
    findExactBuildingFeature([nearby, wrongCase, exact], 'requested-building'),
    exact,
  );
  assert.equal(
    findExactBuildingFeature([nearby, wrongCase], 'requested-building'),
    undefined,
  );
});
