import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { thermalCarrierCost as resolver } from "../../src/calculators/energy/resolvers/thermalEnergy.js";
import { mockCtx } from "../helpers/mock-ctx.js";

describe("thermalCarrierCost", () => {
  test("computes consumption × unitRate + baseRate", () => {
    const result = resolver.resolve(
      mockCtx({}, {
        thermalCarrierDemand: 200,
        thermalUnitRate: 0.5,
        thermalBaseRate: 300,
      }),
    );
    assert.strictEqual(result, 200 * 0.5 + 300);
  });

  test("uses thermalBaseRate resolver — not raw primaryEnergyCarrierData.baseRate", () => {
    // Provide different values to confirm the resolver reads thermalBaseRate, not config
    const result = resolver.resolve(
      mockCtx({}, {
        thermalCarrierDemand: 100,
        thermalUnitRate: 1,
        thermalBaseRate: 999,
        // If the resolver mistakenly read primaryEnergyCarrierData.baseRate it would use 0
        primaryEnergyCarrierData: { baseRate: 0 } as any,
      }),
    );
    assert.strictEqual(result, 100 * 1 + 999);
  });

  test("zero consumption still includes base rate", () => {
    const result = resolver.resolve(
      mockCtx({}, {
        thermalCarrierDemand: 0,
        thermalUnitRate: 0.5,
        thermalBaseRate: 181.83,
      }),
    );
    assert.strictEqual(result, 181.83);
  });
});
