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
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { computed, type ReadableAtom } from 'nanostores';
import type { InputState } from '../inputs/atoms';
import { $currentEnergyState } from './current-energy-state';

export const $resolvedInput = computed(
  $currentEnergyState,
  (state) => state.resolvedInput,
);

export const $resolvedInputState: ReadableAtom<InputState> = computed($resolvedInput, (r) => ({
  general: r.general,
  heat: r.heat,
  roof: r.roof,
  roofWindows: r.roofWindows,
  exteriorWallWindows: r.exteriorWallWindows,
  topFloor: r.topFloor,
  outerWall: r.outerWall,
  bottomFloor: r.bottomFloor,
  electricity: r.electricity,
}));

export const $resolvedGeneralInput: ReadableAtom<Partial<DETGeneralInput>> =
  computed($resolvedInput, (r) => r.general);
export const $resolvedHeatInput: ReadableAtom<Partial<DETHeatInput>> = computed(
  $resolvedInput,
  (r) => r.heat,
);
export const $resolvedElectricityInput: ReadableAtom<
  Partial<DETElectricityInput>
> = computed($resolvedInput, (r) => r.electricity);
export const $resolvedRoofInput: ReadableAtom<Partial<DETRoofInput>> = computed(
  $resolvedInput,
  (r) => r.roof,
);
export const $resolvedRoofWindowsInput: ReadableAtom<
  Partial<DETRoofWindowsInput>
> = computed($resolvedInput, (r) => r.roofWindows);
export const $resolvedExteriorWallWindowsInput: ReadableAtom<
  Partial<DETExteriorWallWindowsInput>
> = computed($resolvedInput, (r) => r.exteriorWallWindows);
export const $resolvedTopFloorInput: ReadableAtom<Partial<DETTopFloorInput>> =
  computed($resolvedInput, (r) => r.topFloor);
export const $resolvedOuterWallInput: ReadableAtom<Partial<DETOuterWallInput>> =
  computed($resolvedInput, (r) => r.outerWall);
export const $resolvedBottomFloorInput: ReadableAtom<
  Partial<DETBottomFloorInput>
> = computed($resolvedInput, (r) => r.bottomFloor);
