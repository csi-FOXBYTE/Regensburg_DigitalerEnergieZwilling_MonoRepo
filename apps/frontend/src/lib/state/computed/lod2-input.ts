import type {
  DETBottomFloorInput,
  DETGeneralInput,
  DETHeatInput,
  DETOuterWallInput,
  DETRoofInput,
  DETTopFloorInput,
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { computed } from 'nanostores';
import { yearToRangeKey } from '../../yearHelper/rangeBandOptions';
import { $config } from '../calculation-config';
import { $building } from '../building';

export type Lod2DerivedInput = {
  general: Partial<DETGeneralInput>;
  heat: Partial<DETHeatInput>;
  bottomFloor: Partial<DETBottomFloorInput>;
  topFloor: Partial<DETTopFloorInput>;
  outerWall: Partial<DETOuterWallInput>;
  roof: Partial<DETRoofInput>;
};

function exposedWallArea(
  grossArea: number | undefined,
  sharedArea: number | undefined,
): number | undefined {
  if (grossArea == null || sharedArea == null) return undefined;
  return Math.max(0, grossArea - sharedArea);
}

export const $lod2Input = computed(
  [$building, $config],
  (building, config): Lod2DerivedInput => {
    const det = building?.properties.digitalEnergyTwin;
    // Core expects exposed areas; enrichment splits gross and shared walls at
    // this building's eave. Do not distribute the full shared area across them.
    const areaWithoutAttic = exposedWallArea(
      det?.grossExternalWallAreaWithoutAttic,
      det?.adjacentWallAreaWithoutAttic,
    );
    const atticArea = exposedWallArea(
      det?.grossExternalWallAreaAttic,
      det?.adjacentWallAreaAttic,
    );
    const height = det?.height ?? building?.properties.measuredHeight;
    const buildingYear =
      det?.constructionYear != null
        ? yearToRangeKey(det.constructionYear, config.general.generalYearBands)
        : undefined;

    return {
      general: {
        ...(det?.groundArea != null && { buildingBaseArea: det.groundArea }),
        ...(height != null && { buildingHeight: height }),
        ...(det?.lowestEavesHeight != null && {
          lowestEaveHeight: det.lowestEavesHeight,
        }),
        ...(buildingYear != null && { buildingYear }),
      },
      heat: {
        ...(det?.geothermalEnergyAvailable != null && {
          hasGeothermalAvailability: det.geothermalEnergyAvailable,
        }),
      },
      bottomFloor: {
        ...(det?.groundArea != null && { area: det.groundArea }),
      },
      topFloor: {
        ...(det?.upperFloorArea != null && { area: det.upperFloorArea }),
      },
      outerWall: {
        ...(areaWithoutAttic != null && { areaWithoutAttic }),
        ...(atticArea != null && { atticArea }),
        ...(det?.adjacentWallArea != null && {
          adjacentWallArea: det.adjacentWallArea,
        }),
      },
      roof: {
        ...(det?.roofArea != null && { area: det.roofArea }),
        ...(building?.properties.isFlatRoof != null && {
          isFlatRoof: building.properties.isFlatRoof,
        }),
      },
    };
  },
);
