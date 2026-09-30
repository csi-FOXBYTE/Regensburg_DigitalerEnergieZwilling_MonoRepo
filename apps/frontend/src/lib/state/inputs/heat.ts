import {
  isHeatingSystemCompatible,
  type RangeKey,
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { computed } from 'nanostores';
import { $config } from '../calculation-config';
import makeFieldStore from '../../field-store';
import { bindFieldToOptions, makeSelectionStore } from '../../selection-store';
import { rangeKeyEquals } from '../../yearHelper/rangeBandOptions';
import {
  $resolvedInput,
  $resolvedInputState,
} from '../computed/resolved-input';
import { $inputState } from './atoms';
import { buildingOrNewerYearOptions } from './general';

export const heatingSystemConstructionYearField = makeFieldStore({
  store: $inputState,
  getValue: (obj) =>
    obj.heat.heatingSystemConstructionYear as RangeKey | undefined,
  setValue: (draft, value) => {
    draft.heat.heatingSystemConstructionYear = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

bindFieldToOptions(
  heatingSystemConstructionYearField,
  buildingOrNewerYearOptions,
  rangeKeyEquals,
);

export const primaryEnergyCarrierField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.heat.primaryEnergyCarrier ?? undefined,
  setValue: (draft, value) => {
    draft.heat.primaryEnergyCarrier = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const primaryEnergyCarrierOptions = makeSelectionStore(
  (config) => config.heat.primaryEnergyCarriers,
);

bindFieldToOptions(primaryEnergyCarrierField, primaryEnergyCarrierOptions);

export const heatingSystemTypeOptions = computed(
  [$config, $resolvedInput],
  (config, state) => {
    const carrierFilter = config.heat.allowedHeatingSystemTypesByCarrier.find(
      ({ key }) => key === state.heat.primaryEnergyCarrier,
    );

    return config.heat.heatingSystemTypes.filter(
      (system) =>
        isHeatingSystemCompatible(system, state) &&
        (!carrierFilter || carrierFilter.allowedValues.includes(system.value)),
    );
  },
);

export const heatingSystemTypeField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.heat.heatingSystemType ?? undefined,
  setValue: (draft, value) => {
    draft.heat.heatingSystemType = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

bindFieldToOptions(heatingSystemTypeField, heatingSystemTypeOptions);

export const heatingSurfaceTypeOptions = makeSelectionStore(
  (config) => config.heat.heatingSurfaceTypes,
);

export const heatingSurfaceTypeField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.heat.heatingSurfaceType ?? undefined,
  setValue: (draft, value) => {
    draft.heat.heatingSurfaceType = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

bindFieldToOptions(heatingSurfaceTypeField, heatingSurfaceTypeOptions);

export const hasGasSupplyField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.heat.hasGasSupply ?? undefined,
  setValue: (draft, value) => {
    draft.heat.hasGasSupply = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const hasStorageField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.heat.hasStorage ?? undefined,
  setValue: (draft, value) => {
    draft.heat.hasStorage = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const userThermalTotalCostField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.heat.userThermalTotalCost ?? undefined,
  setValue: (draft, value) => {
    draft.heat.userThermalTotalCost = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const userThermalUnitRateField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.heat.userThermalUnitRate ?? undefined,
  setValue: (draft, value) => {
    draft.heat.userThermalUnitRate = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const userThermalBaseRateField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.heat.userThermalBaseRate ?? undefined,
  setValue: (draft, value) => {
    draft.heat.userThermalBaseRate = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

/**
 * The annual base price cannot exceed the annual heating costs. Compares the
 * effective values (entered value, otherwise the resolved placeholder) so it
 * matches what is shown in the fields.
 */
export const $isThermalBaseRateInvalid = computed(
  [$inputState, $resolvedInputState],
  (input, resolved) => {
    const total =
      input.heat.userThermalTotalCost ?? resolved.heat.userThermalTotalCost;
    const base =
      input.heat.userThermalBaseRate ?? resolved.heat.userThermalBaseRate;
    return total != null && base != null && base > total;
  },
);

/**
 * A supplied thermal bill can only be converted to consumption with a
 * positive effective unit rate.
 */
export const $isThermalUnitRateInvalid = computed(
  [$inputState, $resolvedInputState],
  (input, resolved) => {
    const total = input.heat.userThermalTotalCost;
    const unitRate =
      input.heat.userThermalUnitRate ?? resolved.heat.userThermalUnitRate;
    return total != null && (unitRate == null || unitRate <= 0);
  },
);

export const $canProgressHeatStep = computed(
  [$isThermalBaseRateInvalid, $isThermalUnitRateInvalid],
  (baseRateInvalid, unitRateInvalid) => !baseRateInvalid && !unitRateInvalid,
);

export const $isSystemOnlyElectrical = computed(
  [$resolvedInputState, $config],
  (state, config) => {
    const type = state.heat.heatingSystemType;
    if (!type) return false;
    return (
      (config.heat.electricalRatio.find((r) => r.key === type)?.value ?? 0) >= 1
    );
  },
);

$isSystemOnlyElectrical.listen((onlyElectrical) => {
  if (onlyElectrical) {
    userThermalTotalCostField.setValue(undefined);
    userThermalUnitRateField.setValue(undefined);
    userThermalBaseRateField.setValue(undefined);
  }
});
