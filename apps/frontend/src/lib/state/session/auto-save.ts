import { isSessionTransition } from '../building';
import {
  $inputState,
  $selectedHeatingRenovations,
  $selectedHeatingSurfaceRenovations,
  $selectedInsulationRenovations,
} from '../inputs/atoms';
import { $maxStepReached, $step } from '../ui/progress';
import { saveSession } from './index';
import { sessionStorage } from './storage';

const stores = [
  $step,
  $maxStepReached,
  $inputState,
  $selectedInsulationRenovations,
  $selectedHeatingSurfaceRenovations,
  $selectedHeatingRenovations,
];

let pending: ReturnType<typeof setTimeout> | undefined;

function schedule() {
  if (isSessionTransition()) return;
  saveSession(); // Memory is synchronous; only the persistent copy is debounced.
  clearTimeout(pending);
  pending = setTimeout(() => sessionStorage.flush(), 1000);
}

for (const store of stores) {
  store.listen(schedule);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => sessionStorage.flush());
}
