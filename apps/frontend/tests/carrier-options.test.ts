import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { $inputState, emptyInputState } from '../src/lib/state/inputs/atoms';
import {
  primaryEnergyCarrierField,
  primaryEnergyCarrierOptions,
} from '../src/lib/state/inputs/heat';

afterEach(() => $inputState.set(emptyInputState()));

test('carrier choices follow gas and storage availability', () => {
  $inputState.set({
    ...emptyInputState(),
    heat: { hasGasSupply: false, hasStorage: false },
  });
  const withoutSupply = primaryEnergyCarrierOptions.get().map((carrier) => carrier.value);
  assert.ok(withoutSupply.includes('none'));
  assert.ok(withoutSupply.includes('district_heating'));
  assert.ok(!withoutSupply.includes('natural_gas'));
  assert.ok(!withoutSupply.includes('heating_oil'));

  $inputState.set({
    ...$inputState.get(),
    heat: { hasGasSupply: false, hasStorage: true },
  });
  const withStorage = primaryEnergyCarrierOptions.get().map((carrier) => carrier.value);
  assert.ok(withStorage.includes('heating_oil'));
  assert.ok(!withStorage.includes('natural_gas'));
});

test('clears a selected carrier when its required supply becomes unavailable', () => {
  primaryEnergyCarrierField.setValue('natural_gas');
  $inputState.set({
    ...$inputState.get(),
    heat: { ...$inputState.get().heat, hasGasSupply: false },
  });

  assert.equal(primaryEnergyCarrierField.$store.get(), undefined);
});
