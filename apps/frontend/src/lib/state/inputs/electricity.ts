import makeFieldStore from '../../field-store';
import {
  bindFieldToOptions,
  makeSelectionStore,
} from '../../selection-store';
import { $resolvedInputState } from '../computed/resolved-input';
import { $inputState } from './atoms';

export const electricityTypeOptions = makeSelectionStore(
  (config) => config.heat.electricityTypes,
);

export const electricityTypeField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.electricity.electricityType ?? undefined,
  setValue: (draft, value) => {
    draft.electricity.electricityType = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

bindFieldToOptions(electricityTypeField, electricityTypeOptions);

export const userElectricityConsumptionField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.electricity.userElectricityConsumption ?? undefined,
  setValue: (draft, value) => {
    draft.electricity.userElectricityConsumption = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const electricityUnitRateField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.electricity.electricityUnitRate ?? undefined,
  setValue: (draft, value) => {
    draft.electricity.electricityUnitRate = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const electricityBaseRateField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.electricity.userElectricityBaseRate ?? undefined,
  setValue: (draft, value) => {
    draft.electricity.userElectricityBaseRate = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});
