import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { thermalBaseline as resolver } from "../../src/calculators/energy/resolvers/heatingDemand.js";
import { mockCtx } from "../helpers/mock-ctx.js";

describe("thermalBaseline", () => {
  test("takes physics path when userThermalConsumption is null", () => {
    const result = resolver.resolve(
      mockCtx({}, {
        userThermalConsumption: null,
        calculatedThermalBaseline: 5000,
      }),
    );
    assert.strictEqual(result, 5000);
  });

  test("takes billing path when userThermalConsumption is non-null", () => {
    const result = resolver.resolve(
      mockCtx({}, {
        userThermalConsumption: 150,
        userTotalEnergyDemand: 4000,
        renovationFactor: 1,
      }),
    );
    assert.strictEqual(result, 4000);
  });

  test("scales by renovationFactor on billing path", () => {
    const result = resolver.resolve(
      mockCtx({}, {
        userThermalConsumption: 150,
        userTotalEnergyDemand: 4000,
        renovationFactor: 0.7,
      }),
    );
    assert.strictEqual(result, 2800);
  });

  test("takes physics path when consumption is null — base-only carrier with total provided", () => {
    // Simulates rate=0: userThermalConsumption resolver returned null despite total being set
    const result = resolver.resolve(
      mockCtx(
        { userThermalTotalCost: 1200 },
        {
          userThermalConsumption: null,   // resolver returned null (rate=0)
          calculatedThermalBaseline: 5000,
        },
      ),
    );
    assert.strictEqual(result, 5000);
  });
});
