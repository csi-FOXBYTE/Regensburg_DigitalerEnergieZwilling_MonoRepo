import assert from 'node:assert/strict';
import test from 'node:test';
import * as Cesium from 'cesium';
import { createVerticalBuildingRay } from '../src/lib/vertical-building-ray';

test('casts downward along the ellipsoid normal through the target coordinate', () => {
  const ellipsoid = Cesium.Ellipsoid.WGS84;
  const ray = createVerticalBuildingRay(ellipsoid, 12.097, 49.019);
  const target = Cesium.Cartesian3.fromDegrees(12.097, 49.019, 0, ellipsoid);
  const toTarget = Cesium.Cartesian3.subtract(
    target,
    ray.origin,
    new Cesium.Cartesian3(),
  );

  assert.ok(Cesium.Cartesian3.magnitude(toTarget) > 9_000);
  assert.ok(
    Cesium.Cartesian3.equalsEpsilon(
      Cesium.Cartesian3.normalize(toTarget, toTarget),
      ray.direction,
      Cesium.Math.EPSILON12,
    ),
  );
});
