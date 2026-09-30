import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { electricityBaseRate as resolver } from "../../src/calculators/energy/resolvers/electricalEnergy.js";
import type { DETCalculatorContext, DETCalculatorRegistry } from "../../src/calculators/energy/index.js";
import type { ResolverContext } from "../../src/engine/types.js";
import type { ElectricityTypeData } from "../../src/types/config/heat.js";

const CONFIG_BASE_RATE = 50;
const typeData: ElectricityTypeData = { co2Factor: 366, unitRate: 0.192, baseRate: CONFIG_BASE_RATE, primaryEnergyFactor: 1.8 };

function ctx(userElectricityBaseRate?: number | null): ResolverContext<DETCalculatorContext, DETCalculatorRegistry> {
  return {
    input: {
      config: {} as DETCalculatorContext["config"],
      input: { electricity: { userElectricityBaseRate } } as DETCalculatorContext["input"],
    },
    get(key) {
      if (key === "electricityTypeData") return typeData as DETCalculatorRegistry[typeof key];
      throw new Error(`Unexpected ctx.get("${String(key)}")`);
    },
    getAll: () => ({}),
  };
}

describe("electricityBaseRate", () => {
  test("returns config baseRate when no user override", () => {
    assert.strictEqual(resolver.resolve(ctx()), CONFIG_BASE_RATE);
    assert.strictEqual(resolver.resolve(ctx(null)), CONFIG_BASE_RATE);
  });

  test("returns user override when provided", () => {
    assert.strictEqual(resolver.resolve(ctx(120)), 120);
  });

  test("allows overriding to zero", () => {
    assert.strictEqual(resolver.resolve(ctx(0)), 0);
  });
});
