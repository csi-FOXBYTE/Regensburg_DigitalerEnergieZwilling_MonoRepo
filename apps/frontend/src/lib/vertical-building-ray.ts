import * as Cesium from 'cesium';

// Start above local terrain and cast toward the ellipsoid at the supplied coordinates.
export function createVerticalBuildingRay(
  ellipsoid: Cesium.Ellipsoid,
  longitudeDegrees: number,
  latitudeDegrees: number,
): Cesium.Ray {
  const cartographic = Cesium.Cartographic.fromDegrees(
    longitudeDegrees,
    latitudeDegrees,
    10_000,
  );
  const origin = ellipsoid.cartographicToCartesian(cartographic);
  const outwardNormal =
    ellipsoid.geodeticSurfaceNormalCartographic(cartographic);
  return new Cesium.Ray(
    origin,
    Cesium.Cartesian3.negate(outwardNormal, new Cesium.Cartesian3()),
  );
}
