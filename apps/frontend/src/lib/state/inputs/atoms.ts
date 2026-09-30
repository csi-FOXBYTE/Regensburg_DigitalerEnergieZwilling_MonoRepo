import {
  type DETBottomFloorInput,
  type DETElectricityInput,
  type DETExteriorWallWindowsInput,
  type DETGeneralInput,
  type DETHeatInput,
  type DETOuterWallInput,
  type DETRoofInput,
  type DETRoofWindowsInput,
  type DETTopFloorInput,
  type Renovation,
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { atom } from 'nanostores';
import { $building, isRestoringInputs } from '../building';
import { getSession, type SavedSession } from '../session/storage';
import { $step, setMaxStepReached } from '../ui/progress';

export type InputState = {
  general: Partial<DETGeneralInput>;
  heat: Partial<DETHeatInput>;
  roof: Partial<DETRoofInput>;
  roofWindows: Partial<DETRoofWindowsInput>;
  exteriorWallWindows: Partial<DETExteriorWallWindowsInput>;
  topFloor: Partial<DETTopFloorInput>;
  outerWall: Partial<DETOuterWallInput>;
  bottomFloor: Partial<DETBottomFloorInput>;
  electricity: Partial<DETElectricityInput>;
};

export const emptyInputState = (): InputState => ({
  general: {},
  heat: { heatingSurfaceType: 'free_heat_emitter' },
  roof: {},
  roofWindows: {},
  exteriorWallWindows: {},
  topFloor: {},
  outerWall: {},
  bottomFloor: {},
  electricity: {},
});

export const $inputState = atom<InputState>(emptyInputState());

export const $selectedInsulationRenovations = atom<Renovation[]>([]);
export const $selectedHeatingSurfaceRenovations = atom<Renovation[]>([]);
export const $selectedHeatingRenovations = atom<Renovation[]>([]);

export function hydrateInputs(session: SavedSession | null): void {
  const data = session ? structuredClone(session) : null;
  $inputState.set(data?.inputState ?? emptyInputState());
  $selectedInsulationRenovations.set(data?.insulationRenovations ?? []);
  $selectedHeatingSurfaceRenovations.set(data?.heatingSurfaceRenovations ?? []);
  $selectedHeatingRenovations.set(data?.heatingRenovations ?? []);
  setMaxStepReached(
    data ? Math.max(data.step, data.maxStepReached ?? data.step) : $step.get(),
  );
}

$building.subscribe((building) => {
  if (isRestoringInputs()) return;
  hydrateInputs(building ? getSession(building.id) : null);
});
