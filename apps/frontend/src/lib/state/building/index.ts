import {
  adaptBuildingFeature,
  addressEntries,
} from '@/config/adapters/buildingFeature';
import { atom } from 'nanostores';

export { addressEntries };

export type DigitalEnergyTwin = {
  volume: number | undefined;
  groundArea: number | undefined;
  upperFloorArea: number | undefined;
  grossExternalWallArea: number | undefined;
  grossExternalWallAreaWithoutAttic: number | undefined;
  grossExternalWallAreaAttic: number | undefined;
  roofArea: number | undefined;
  roofPitchDegrees: number | undefined;
  height: number | undefined;
  lowestEavesHeight: number | undefined;
  envelopeArea: number | undefined;
  adjacentWallArea: number | undefined;
  adjacentWallAreaWithoutAttic: number | undefined;
  adjacentWallAreaAttic: number | undefined;
  constructionYear: number | undefined;
  geothermalEnergyAvailable: boolean | undefined;
};

export type BuildingAddress = {
  street: string;
  postcode?: string;
  city: string;
};

export type BuildingProperties = {
  measuredHeight: number | undefined;
  lowestEave: number | undefined;
  groundHeight: number | undefined;
  roofHeight: number | undefined;
  isFlatRoof: boolean | undefined;
  digitalEnergyTwin: DigitalEnergyTwin;
  address: BuildingAddress | undefined;
};

export type BuildingFeatureSource = {
  getProperty(name: string): unknown;
};

export type AdaptedBuildingFeature = {
  id: string | undefined;
  isValidBuilding: boolean;
  properties: BuildingProperties;
};

export type BuildingFeatureAdapter = (
  feature: BuildingFeatureSource,
) => AdaptedBuildingFeature;

export type BuildingCoordinates = {
  lon: number;
  lat: number;
};

export type BuildingSelectionOptions = {
  streetOverride?: string;
  allowInvalidBuilding?: boolean;
};

export type BuildingState = {
  id: string;
  properties: BuildingProperties;
  coordinates: BuildingCoordinates;
};

export const $building = atom<BuildingState | null>(null);

// All building transitions run synchronously before observers can save new work.
let transitionDepth = 0;
let restoringInputs = false;
const beforeChange = new Set<() => void>();
export const isSessionTransition = () => transitionDepth > 0;
export const isRestoringInputs = () => restoringInputs;
export function beforeBuildingChange(callback: () => void): void {
  beforeChange.add(callback);
}
export function sessionTransition(action: () => void): void {
  transitionDepth++;
  try {
    action();
  } finally {
    transitionDepth--;
  }
}
export function setBuildingState(
  building: BuildingState | null,
  hydrate?: () => void,
): void {
  for (const callback of beforeChange) callback();
  sessionTransition(() => {
    restoringInputs = !!hydrate;
    try {
      $building.set(building);
      hydrate?.();
    } finally {
      restoringInputs = false;
    }
  });
}

export function setBuilding(
  feature: BuildingFeatureSource,
  coordinates: BuildingCoordinates,
  options: BuildingSelectionOptions = {},
) {
  const adapted = adaptBuildingFeature(feature);
  if (
    (!adapted.isValidBuilding && !options.allowInvalidBuilding) ||
    !adapted.id
  )
    return;

  const address = adapted.properties.address;
  const properties =
    options.streetOverride && address
      ? {
          ...adapted.properties,
          address: { ...address, street: options.streetOverride },
        }
      : adapted.properties;

  setBuildingState({
    id: adapted.id,
    coordinates,
    properties,
  });
}

export function unselectBuilding() {
  setBuildingState(null);
}
