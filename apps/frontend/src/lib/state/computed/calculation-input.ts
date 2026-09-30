import {
  BuildingType,
  DEFAULT_CONFIG,
  type DETBottomFloorInput,
  type DETElectricityInput,
  type DETExteriorWallWindowsInput,
  type DETGeneralInput,
  type DETHeatInput,
  type DETInput,
  type DETOuterWallInput,
  type DETRoofInput,
  type DETRoofWindowsInput,
  type DETTopFloorInput,
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { computed } from 'nanostores';
import { $inputState } from '../inputs/atoms';
import { $lod2Input } from './lod2-input';

function defined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

const placeholderGeneral: DETGeneralInput = {
  buildingBaseArea: 0,
  buildingHeight: 0,
  lowestEaveHeight: 0,
  type: BuildingType.SINGLE_FAMILY,
  buildingYear: DEFAULT_CONFIG.general.generalYearBands[0],
};

const placeholderHeat: DETHeatInput = {};
const placeholderElectricity: DETElectricityInput = {};
const placeholderBottomFloor: DETBottomFloorInput = { area: 0 };
const placeholderExteriorWall: DETExteriorWallWindowsInput = {};
const placeholderRoofWindow: DETRoofWindowsInput = {};
const placeholderOuterWall: DETOuterWallInput = {
  areaWithoutAttic: 0,
  atticArea: 0,
};
const placeholderRoof: DETRoofInput = { area: 0 };
const placeholderTopFloor: DETTopFloorInput = { area: 0 };

export const $calculationInput = computed(
  [$lod2Input, $inputState],
  (lod2, inputs) => {
    const topFloor = {
      ...placeholderTopFloor,
      ...lod2.topFloor,
      ...defined(inputs.topFloor),
    };
    // Core's wall-area resolver reads the heating flag independently of existence.
    if (topFloor.hasAttic === false) topFloor.isAtticHeated = false;

    return {
      general: {
        ...placeholderGeneral,
        ...lod2.general,
        ...defined(inputs.general),
      },
      heat: {
        ...placeholderHeat,
        ...lod2.heat,
        ...defined(inputs.heat),
      },
      electricity: {
        ...placeholderElectricity,
        ...defined(inputs.electricity),
      },
      bottomFloor: {
        ...placeholderBottomFloor,
        ...lod2.bottomFloor,
        ...defined(inputs.bottomFloor),
      },
      exteriorWallWindows: {
        ...placeholderExteriorWall,
        ...defined(inputs.exteriorWallWindows),
      },
      roofWindows: { ...placeholderRoofWindow, ...defined(inputs.roofWindows) },
      outerWall: {
        ...placeholderOuterWall,
        ...lod2.outerWall,
        ...defined(inputs.outerWall),
      },
      roof: { ...placeholderRoof, ...lod2.roof, ...defined(inputs.roof) },
      topFloor,
    } satisfies DETInput;
  },
);
