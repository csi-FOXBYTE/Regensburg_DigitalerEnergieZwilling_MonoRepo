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

export const roofWindowsAreaField = makeFieldStore({
  store: $inputState,
  getValue: (obj): number | null | undefined => obj.roofWindows.area,
  setValue: (draft, value) => {
    draft.roofWindows.area = value ?? undefined;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const roofWindowsWindowTypeOptions = makeSelectionStore(
  (config) => config.windows.windowTypes,
);

export const roofWindowsWindowTypeField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.roofWindows.windowType ?? undefined,
  setValue: (draft, value) => {
    draft.roofWindows.windowType = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

bindFieldToOptions(
  roofWindowsWindowTypeField,
  roofWindowsWindowTypeOptions,
);

export const roofWindowsUValueField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.roofWindows.uValue,
  setValue: (draft, value) => {
    draft.roofWindows.uValue = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const roofWindowsYearField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.roofWindows.year as RangeKey | undefined,
  setValue: (draft, value) => {
    draft.roofWindows.year = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

bindFieldToOptions(
  roofWindowsYearField,
  buildingOrNewerYearOptions,
  rangeKeyEquals,
);

export const $isRoofWindowsAreaInvalid = computed(
  [$inputState, $resolvedInputState],
  (input, resolved) => {
    const hasAttic = input.topFloor.hasAttic ?? resolved.topFloor.hasAttic;
    const isAtticHeated =
      input.topFloor.isAtticHeated ?? resolved.topFloor.isAtticHeated;
    if (hasAttic && !isAtticHeated) return false;

    const roofArea = input.roof.area ?? resolved.roof.area;
    const roofWindowsArea = input.roofWindows.area ?? resolved.roofWindows.area;
    return (
      roofArea != null && roofWindowsArea != null && roofWindowsArea > roofArea
    );
  },
);
