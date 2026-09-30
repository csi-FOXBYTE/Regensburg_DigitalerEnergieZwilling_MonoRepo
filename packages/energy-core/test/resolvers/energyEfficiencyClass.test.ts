import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { energyEfficiencyClass as resolver } from "../../src/calculators/energy/resolvers/totals.js";
import { DEFAULT_CONFIG } from "../../src/types/config/default-config.js";
import { mockCtx } from "../helpers/mock-ctx.js";

describe("energyEfficiencyClass", () => {
  function resolve(value: number) {
    const ctx = mockCtx({}, { totalEnergyDemandPerSquareMeter: value });
    ctx.input.config = DEFAULT_CONFIG;
    return resolver.resolve(ctx);
  }

  test("keeps the upper boundary in the better class", () => {
    assert.equal(resolve(30), "A+");
  });

  test("moves to the next class above the upper boundary", () => {
    assert.equal(resolve(30.01), "A");
  });
});
