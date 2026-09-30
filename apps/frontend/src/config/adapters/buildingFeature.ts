import type {
  AdaptedBuildingFeature,
  BuildingAddress,
  BuildingFeatureAdapter,
  BuildingFeatureSource,
} from '@/lib/state/building';
import { mapConfig } from '../map';

const adaptedFeatureCache = new WeakMap<
  BuildingFeatureSource,
  AdaptedBuildingFeature
>();

function numberProperty(
  feature: BuildingFeatureSource,
  name: string,
): number | undefined {
  const value = feature.getProperty(name);
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return undefined;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function booleanProperty(
  feature: BuildingFeatureSource,
  name: string,
): boolean | undefined {
  const value = feature.getProperty(name);
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return undefined;
}

function sharedWallAreaSum(
  feature: BuildingFeatureSource,
  key: 'sharedWallArea' | 'sharedWallAreaWithoutAttic' | 'sharedWallAreaAttic',
): number | undefined {
  const raw = feature.getProperty('digitalEnergyTwin.adjacentBuildings');
  if (typeof raw !== 'string') return undefined;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return undefined;
    let sum = 0;
    for (const building of parsed) {
      const area =
        typeof building === 'object' && building !== null
          ? (building as Record<string, unknown>)[key]
          : undefined;
      // A missing split is unknown, not a shared area of zero.
      if (typeof area !== 'number' || !Number.isFinite(area) || area < 0) {
        return undefined;
      }
      sum += area;
    }
    return sum;
  } catch {
    return undefined;
  }
}

function flatRoofProperty(feature: BuildingFeatureSource): boolean | undefined {
  const roofType = feature.getProperty('roofType');
  return roofType == null ? undefined : String(roofType) === '1000';
}

/** Splits "Berliner Straße 7a,9;Zwickauer Straße 10" into one entry per address. */
export function addressEntries(raw: string): string[] {
  return raw
    .split(';')
    .flatMap((segment) => {
      const trimmed = segment.trim();
      const match = /^(.*)\s+(\d[^\s]*(?:,[^\s]*)*)$/.exec(trimmed);
      if (!match) return trimmed;
      const [, street, houseNumbers] = match;
      return houseNumbers.split(',').map((number) => `${street} ${number}`);
    })
    .filter((entry) => entry.length > 0);
}

function addressProperty(
  feature: BuildingFeatureSource,
): BuildingAddress | undefined {
  const street = feature.getProperty('addresses.0.ThoroughfareName');
  const city = feature.getProperty('addresses.0.Locality');
  if (typeof street !== 'string' || typeof city !== 'string') return undefined;

  const postcode = feature.getProperty('addresses.0.PostalCode');
  return {
    street: addressEntries(street)[0] ?? street,
    postcode: typeof postcode === 'string' ? postcode : undefined,
    city,
  };
}

/**
 * Converts municipality-specific 3D Tiles metadata to the frontend's building
 * contract. Other municipalities only need to replace the mappings here.
 */
export const adaptBuildingFeature: BuildingFeatureAdapter = (feature) => {
  const cached = adaptedFeatureCache.get(feature);
  if (cached) return cached;

  const id = feature.getProperty('id');
  const buildingFunction = feature.getProperty('function');

  const adapted = {
    id: id == null ? undefined : String(id),
    isValidBuilding: String(buildingFunction ?? '').startsWith(
      mapConfig.selectableBuildingFunctionPrefix,
    ),
    properties: {
      measuredHeight: numberProperty(feature, 'measuredHeight'),
      lowestEave: numberProperty(feature, 'NiedrigsteTraufeDesGebaeudes'),
      groundHeight: numberProperty(feature, 'HoeheGrund'),
      roofHeight: numberProperty(feature, 'HoeheDach'),
      isFlatRoof: flatRoofProperty(feature),
      address: addressProperty(feature),
      digitalEnergyTwin: {
        volume: numberProperty(feature, 'digitalEnergyTwin.volume'),
        groundArea: numberProperty(feature, 'digitalEnergyTwin.groundArea'),
        upperFloorArea: numberProperty(
          feature,
          'digitalEnergyTwin.upperFloorArea',
        ),
        grossExternalWallArea: numberProperty(
          feature,
          'digitalEnergyTwin.grossExternalWallArea',
        ),
        grossExternalWallAreaWithoutAttic: numberProperty(
          feature,
          'digitalEnergyTwin.grossExternalWallAreaWithoutAttic',
        ),
        grossExternalWallAreaAttic: numberProperty(
          feature,
          'digitalEnergyTwin.grossExternalWallAreaAttic',
        ),
        roofArea: numberProperty(feature, 'digitalEnergyTwin.roofArea'),
        roofPitchDegrees: numberProperty(
          feature,
          'digitalEnergyTwin.roofPitchDegrees',
        ),
        height: numberProperty(feature, 'digitalEnergyTwin.height'),
        lowestEavesHeight: numberProperty(
          feature,
          'digitalEnergyTwin.lowestEavesHeight',
        ),
        envelopeArea: numberProperty(feature, 'digitalEnergyTwin.envelopeArea'),
        adjacentWallArea: sharedWallAreaSum(feature, 'sharedWallArea'),
        adjacentWallAreaWithoutAttic: sharedWallAreaSum(
          feature,
          'sharedWallAreaWithoutAttic',
        ),
        adjacentWallAreaAttic: sharedWallAreaSum(feature, 'sharedWallAreaAttic'),
        constructionYear: numberProperty(
          feature,
          'digitalEnergyTwin.constructionYear',
        ),
        geothermalEnergyAvailable: booleanProperty(
          feature,
          'digitalEnergyTwin.geothermalEnergyAvailable',
        ),
      },
    },
  };

  adaptedFeatureCache.set(feature, adapted);
  return adapted;
};
