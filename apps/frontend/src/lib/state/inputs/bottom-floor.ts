import { type RangeKey } from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import makeFieldStore from '../../field-store';
import {
  bindFieldToOptions,
  makeSelectionStore,
} from '../../selection-store';
import { rangeKeyEquals } from '../../yearHelper/rangeBandOptions';
import { $resolvedInputState } from '../computed/resolved-input';
import { $inputState } from './atoms';
import { buildingOrNewerYearOptions } from './general';

export const bottomFloorYearField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.bottomFloor.year as RangeKey | undefined,
  setValue: (draft, value) => {
    draft.bottomFloor.year = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

bindFieldToOptions(
  bottomFloorYearField,
  buildingOrNewerYearOptions,
  rangeKeyEquals,
);

export const hasBasementField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.bottomFloor.hasBasement ?? undefined,
  setValue: (draft, value) => {
    draft.bottomFloor.hasBasement = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const isBasementHeatedField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.bottomFloor.isBasementHeated ?? undefined,
  setValue: (draft, value) => {
    draft.bottomFloor.isBasementHeated = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const bottomFloorConstructionTypeOptions = makeSelectionStore(
  (config) => config.bottomFloor.constructionTypes,
  {
    $store: $resolvedInputState,
    getKey: (state) =>
      state.bottomFloor.hasBasement === false || state.bottomFloor.isBasementHeated === true,
    getFilter: (config) => config.bottomFloor.allowedConstructionTypesByHeatedCellar,
  },
);

export const bottomFloorConstructionTypeField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.bottomFloor.constructionType ?? undefined,
  setValue: (draft, value) => {
    draft.bottomFloor.constructionType = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

bindFieldToOptions(
  bottomFloorConstructionTypeField,
  bottomFloorConstructionTypeOptions,
);

export const bottomFloorHasInsulationField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.bottomFloor.hasInsulation ?? undefined,
  setValue: (draft, value) => {
    draft.bottomFloor.hasInsulation = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const bottomFloorInsulationThicknessField = makeFieldStore({
  store: $inputState,
  getValue: (obj): number | null | undefined => obj.bottomFloor.insulationThickness,
  setValue: (draft, value) => {
    draft.bottomFloor.insulationThickness = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const bottomFloorAreaField = makeFieldStore({
  store: $inputState,
  getValue: (obj): number | null | undefined => obj.bottomFloor.area,
  setValue: (draft, value) => {
    draft.bottomFloor.area = value ?? undefined;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});
