import { adaptBuildingFeature } from '@/config/adapters/buildingFeature';
import type { BuildingFeatureSource } from '@/lib/state/building';

export function hasExactBuildingId(
  feature: BuildingFeatureSource,
  buildingId: string,
): boolean {
  return adaptBuildingFeature(feature).id === buildingId;
}

export function findExactBuildingFeature<T extends BuildingFeatureSource>(
  features: readonly T[],
  buildingId: string,
): T | undefined {
  return features.find((feature) => hasExactBuildingId(feature, buildingId));
}
