import {
  applyRenovation,
  generateHeatingRenovations,
  generateHeatingSurfaceRenovations,
  generateInsulationRenovations,
  type InsulationRenovationKeys,
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import i18next from 'i18next';
import { computed } from 'nanostores';
import { $config } from '../calculation-config';
import { $selectedHeatingRenovations, $selectedInsulationRenovations } from '../inputs/renovation';
import { $calculationInput } from './calculation-input';
import { $currentEnergyState } from './current-energy-state';
import { $resolvedInput } from './resolved-input';

const translateInsulationKey = (key: InsulationRenovationKeys) =>
  i18next.t(`energyCalculation:renovation.insulation.${key}`);

export const $insulationRenovations = computed([$config, $resolvedInput], (config, resolvedInput) =>
  generateInsulationRenovations(config, resolvedInput, translateInsulationKey),
);

const $resolvedInsulationPatchedInput = computed([$resolvedInput, $selectedInsulationRenovations], (resolvedInput, selected) =>
  selected.length > 0 ? applyRenovation(resolvedInput, selected) : resolvedInput,
);

const $resolvedHeatingPatchedInput = computed([$resolvedInsulationPatchedInput, $selectedHeatingRenovations], (patchedInput, selected) =>
  selected.length > 0 ? applyRenovation(patchedInput, selected) : patchedInput,
);

export const $heatingRenovations = computed([$config, $resolvedInsulationPatchedInput], (config, patchedInput) =>
  generateHeatingRenovations(config, patchedInput, i18next.language, i18next.t('energyCalculation:renovation.heating.renewal')),
);

export const $heatingSurfaceRenovations = computed([$config, $resolvedHeatingPatchedInput], (config, patchedInput) =>
  generateHeatingSurfaceRenovations(config, patchedInput, i18next.language),
);

export const $baseInputForCost = computed(
  [$calculationInput, $currentEnergyState],
  (input, currentState) => ({ ...input, preRenovationValues: currentState.preRenovationValues }),
);

export const $insulationPatchedInputForCost = computed(
  [$baseInputForCost, $selectedInsulationRenovations],
  (base, selected) => selected.length > 0 ? applyRenovation(base, selected) : base,
);

export const $heatingPatchedInputForCost = computed(
  [$insulationPatchedInputForCost, $selectedHeatingRenovations],
  (base, selected) => selected.length > 0 ? applyRenovation(base, selected) : base,
);
