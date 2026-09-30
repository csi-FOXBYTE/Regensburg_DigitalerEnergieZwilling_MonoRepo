import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { userThermalConsumption as resolver } from "../../src/calculators/energy/resolvers/renovation.js";
import { mockCtx } from "../helpers/mock-ctx.js";
import type { PrimaryEnergyCarrierData } from "../../src/types/config/heat.js";

const defaultCarrierData: PrimaryEnergyCarrierData = {
  energyPerUnit: 10.42,
  unit: "m³",
  unitRate: 0.652,
  baseRate: 181.83,
  co2Factor: 201,
  primaryEnergyFactor: 1.1,
};

function ctx(
  heat: { userThermalTotalCost?: number | null; userThermalUnitRate?: number | null; userThermalBaseRate?: number | null } = {},
  carrierData: PrimaryEnergyCarrierData = defaultCarrierData,
) {
  return mockCtx(heat, { preRenovationCarrierData: carrierData });
}

describe("userThermalConsumption", () => {
  test("returns null when userThermalTotalCost is not provided", () => {
    assert.strictEqual(resolver.resolve(ctx({})), null);
  });

  test("returns null when userThermalTotalCost is null", () => {
    assert.strictEqual(resolver.resolve(ctx({ userThermalTotalCost: null })), null);
  });

  test("derives consumption from (total - base) / rate", () => {
    const total = 1200;
    const base = 181.83;
    const rate = 0.652;
    const result = resolver.resolve(ctx({ userThermalTotalCost: total, userThermalUnitRate: rate, userThermalBaseRate: base }));
    assert.strictEqual(result, (total - base) / rate);
  });

  test("falls back to config unitRate when userThermalUnitRate is not provided", () => {
    const total = 1200;
    const base = 181.83;
    // rate falls back to defaultCarrierData.unitRate = 0.652
    const result = resolver.resolve(ctx({ userThermalTotalCost: total, userThermalBaseRate: base }));
    assert.strictEqual(result, (total - base) / defaultCarrierData.unitRate);
  });

  test("falls back to config baseRate when userThermalBaseRate is not provided", () => {
    const total = 1200;
    const rate = 0.652;
    // base falls back to defaultCarrierData.baseRate = 181.83
    const result = resolver.resolve(ctx({ userThermalTotalCost: total, userThermalUnitRate: rate }));
    assert.strictEqual(result, (total - defaultCarrierData.baseRate) / rate);
  });

  test("returns null when config unitRate is 0 (base-only carrier)", () => {
    const baseOnlyCarrier: PrimaryEnergyCarrierData = { ...defaultCarrierData, unitRate: 0 };
    assert.strictEqual(
      resolver.resolve(ctx({ userThermalTotalCost: 1200 }, baseOnlyCarrier)),
      null,
    );
  });

  test("returns null when explicit userThermalUnitRate is 0", () => {
    assert.strictEqual(
      resolver.resolve(ctx({ userThermalTotalCost: 1200, userThermalUnitRate: 0 })),
      null,
    );
  });
});
