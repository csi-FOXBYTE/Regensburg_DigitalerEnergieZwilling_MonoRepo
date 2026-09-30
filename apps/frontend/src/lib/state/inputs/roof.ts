import { RoofInsulationType, type RangeKey } from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import makeFieldStore from '../../field-store';
import {
  bindFieldToOptions,
  makeSelectionStore,
} from '../../selection-store';
import { rangeKeyEquals } from '../../yearHelper/rangeBandOptions';
import { $resolvedInputState } from '../computed/resolved-input';
import { $inputState } from './atoms';
import { buildingOrNewerYearOptions } from './general';

export { RoofInsulationType };

export const roofAreaField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.roof.area,
  setValue: (draft, value) => {
    draft.roof.area = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const roofConstructionTypeOptions = makeSelectionStore(
  (config) => config.roof.constructionTypes,
);

export const roofConstructionTypeField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.roof.constructionType ?? undefined,
  setValue: (draft, value) => {
    draft.roof.constructionType = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

bindFieldToOptions(roofConstructionTypeField, roofConstructionTypeOptions);

export const roofHasInsulationField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.roof.hasInsulation ?? undefined,
  setValue: (draft, value) => {
    draft.roof.hasInsulation = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const roofInsulationThicknessField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.roof.insulationThickness,
  setValue: (draft, value) => {
    draft.roof.insulationThickness = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const roofInsulationTypeField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.roof.insulationType ?? undefined,
  setValue: (draft, value) => {
    draft.roof.insulationType = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

export const roofYearField = makeFieldStore({
  store: $inputState,
  getValue: (obj) => obj.roof.year as RangeKey | undefined,
  setValue: (draft, value) => {
    draft.roof.year = value;
  },
  placeholderStore: $resolvedInputState,
  resettable: true,
});

bindFieldToOptions(roofYearField, buildingOrNewerYearOptions, rangeKeyEquals);
