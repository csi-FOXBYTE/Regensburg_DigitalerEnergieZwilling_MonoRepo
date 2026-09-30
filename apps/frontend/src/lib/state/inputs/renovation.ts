import { computed } from 'nanostores';
import {
  $selectedHeatingRenovations,
  $selectedHeatingSurfaceRenovations,
  $selectedInsulationRenovations,
} from './atoms';

export {
  $selectedHeatingRenovations,
  $selectedHeatingSurfaceRenovations,
  $selectedInsulationRenovations,
};

export const $renovations = computed(
  [$selectedInsulationRenovations, $selectedHeatingSurfaceRenovations, $selectedHeatingRenovations],
  (insulation, heatingSurface, heating) => [...insulation, ...heatingSurface, ...heating],
);
