import {
  type DETConfig,
  type RangeKey,
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { computed } from 'nanostores';
import makeFieldStore from '../../field-store';
import {
  bindFieldToOptions,
  makeRangeBandStore,
} from '../../selection-store';
import {
  rangeKeyEquals,
  rangesAtOrAfterYear,
} from '../../yearHelper/rangeBandOptions';
import { $resolvedInputState } from '../computed/resolved-input';
import { $inputState } from './atoms';

export const buildingYearField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.general.buildingYear as RangeKey | undefined,
  setValue: (draft, value) => {
    draft.general.buildingYear = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const buildingYearOptions = makeRangeBandStore({
  getRanges: (config: DETConfig) => {
    return config.general.generalYearBands;
  },
});

export const buildingOrNewerYearOptions = makeRangeBandStore({
  $store: $resolvedInputState,
  getRanges: (config: DETConfig, state) =>
    rangesAtOrAfterYear(
      config.general.generalYearBands,
      state.general.buildingYear,
    ),
});

bindFieldToOptions(buildingYearField, buildingYearOptions, rangeKeyEquals);

export const buildingTypeField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.general.type,
  setValue: (draft, value) => {
    draft.general.type = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const numberOfStoriesField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.general.numberOfStories,
  setValue: (draft, value) => {
    draft.general.numberOfStories = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const buildingHeightField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.general.buildingHeight,
  setValue: (draft, value) => {
    draft.general.buildingHeight = value;
  },
  placeholderStore: $resolvedInputState,
});

export const buildingBaseAreaField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.general.buildingBaseArea,
  setValue: (draft, value) => {
    draft.general.buildingBaseArea = value;
  },
  placeholderStore: $resolvedInputState,
});

export const livingAreaField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.general.livingArea,
  setValue: (draft, value) => {
    draft.general.livingArea = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const $isLivingAreaInvalid = computed(
  [$inputState, $resolvedInputState],
  (input, resolved) => {
    const livingArea =
      input.general.livingArea ?? resolved.general.livingArea;
    return livingArea != null && livingArea <= 0;
  },
);

export const $canProgressGeneralDataStep = computed(
  $isLivingAreaInvalid,
  (livingAreaInvalid) => !livingAreaInvalid,
);
