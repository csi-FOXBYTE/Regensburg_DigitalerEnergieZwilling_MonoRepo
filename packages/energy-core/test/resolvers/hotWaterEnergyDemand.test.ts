import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { hotWaterEnergyDemandFromAreaFactor as resolver } from "../../src/calculators/energy/resolvers/heatingDemand.js";
import { BuildingType } from "../../src/types/building-type.js";
import { DEFAULT_CONFIG } from "../../src/types/config/default-config.js";
import { mockCtx } from "../helpers/mock-ctx.js";

describe("hotWaterEnergyDemandFromAreaFactor", () => {
  function resolve(buildingType: typeof BuildingType[keyof typeof BuildingType]) {
    const ctx = mockCtx({}, { buildingType });
    ctx.input.config = DEFAULT_CONFIG;
    return resolver.resolve(ctx);
  }

  test("uses the single-family factor", () => {
    assert.equal(resolve(BuildingType.SINGLE_FAMILY), 11);
  });

  test("uses the multi-family factor", () => {
    assert.equal(resolve(BuildingType.MULTI_FAMILY), 15);
  });
});
