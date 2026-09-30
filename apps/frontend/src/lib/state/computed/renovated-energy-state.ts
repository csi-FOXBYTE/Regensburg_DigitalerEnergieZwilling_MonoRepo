import {
  applyRenovation,
  calculate,
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { computed } from 'nanostores';
import { $config } from '../calculation-config';
import { $renovations } from '../inputs/renovation';
import { $calculationInput } from './calculation-input';
import { $currentEnergyState } from './current-energy-state';

export const $renovatedEnergyState = computed(
  [$calculationInput, $renovations, $config, $currentEnergyState],
  (input, renovations, config, currentState) => {
    const baseInput = {
      ...input,
      preRenovationValues: currentState.preRenovationValues,
    };
    const renovatedInput =
      renovations.length > 0
        ? applyRenovation(baseInput, renovations)
        : baseInput;
    return calculate(config, renovatedInput);
  },
);
