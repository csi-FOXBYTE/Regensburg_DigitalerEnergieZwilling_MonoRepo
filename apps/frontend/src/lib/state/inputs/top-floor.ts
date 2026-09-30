import { type RangeKey } from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { computed } from 'nanostores';
import makeFieldStore from '../../field-store';
import {
  bindFieldToOptions,
  makeSelectionStore,
} from '../../selection-store';
import { rangeKeyEquals } from '../../yearHelper/rangeBandOptions';
import { $resolvedInputState } from '../computed/resolved-input';
import { $inputState } from './atoms';
import { buildingOrNewerYearOptions } from './general';

export const hasAtticField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.topFloor.hasAttic ?? undefined,
  setValue: (draft, value) => {
    draft.topFloor.hasAttic = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const isAtticHeatedField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.topFloor.isAtticHeated ?? undefined,
  setValue: (draft, value) => {
    draft.topFloor.isAtticHeated = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const topFloorYearField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.topFloor.year as RangeKey | undefined,
  setValue: (draft, value) => {
    draft.topFloor.year = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

bindFieldToOptions(topFloorYearField, buildingOrNewerYearOptions, rangeKeyEquals);

export const topFloorAreaField = makeFieldStore({
  store: $inputState,
  getValue: (obj): number | null | undefined => obj.topFloor.area,
  setValue: (draft, value) => {
    draft.topFloor.area = value ?? undefined;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const $isTopFloorAreaInvalid = computed(
  [$inputState, $resolvedInputState],
  (input, resolved) => {
    const hasAttic = input.topFloor.hasAttic ?? resolved.topFloor.hasAttic;
    const isAtticHeated =
      input.topFloor.isAtticHeated ?? resolved.topFloor.isAtticHeated;
    if (!hasAttic || isAtticHeated) return false;

    const roofArea = input.roof.area ?? resolved.roof.area;
    const topFloorArea = input.topFloor.area ?? resolved.topFloor.area;
    return roofArea != null && topFloorArea != null && topFloorArea > roofArea;
  },
);

export const topFloorTypeOptions = makeSelectionStore(
  (config) => config.topFloor.topFloorTypes,
);

export const topFloorTypeField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.topFloor.topFloorType ?? undefined,
  setValue: (draft, value) => {
    draft.topFloor.topFloorType = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

bindFieldToOptions(topFloorTypeField, topFloorTypeOptions);

export const topFloorHasInsulationField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.topFloor.hasInsulation ?? undefined,
  setValue: (draft, value) => {
    draft.topFloor.hasInsulation = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const topFloorInsulationThicknessField = makeFieldStore({
  store: $inputState,
  getValue: (obj): number | null | undefined => obj.topFloor.insulationThickness,
  setValue: (draft, value) => {
    draft.topFloor.insulationThickness = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});
