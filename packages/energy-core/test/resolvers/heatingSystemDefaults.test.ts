import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { DETEnergyCaluclator } from "../../src/calculators/energy/index.js";
import {
  hasGasSupply,
  hasGeothermalAvailability,
  heatingPerformanceFactor,
} from "../../src/calculators/energy/resolvers/heatingSystem.js";
import { DEFAULT_CONFIG } from "../../src/types/config/default-config.js";
import { mockCtx } from "../helpers/mock-ctx.js";
import { baseInput } from "../validators/fixtures.js";

describe("heating system defaults", () => {
  test("assumes a gas supply when availability is omitted or null", () => {
    assert.equal(hasGasSupply.resolve(mockCtx()), true);
    assert.equal(hasGasSupply.resolve(mockCtx({ hasGasSupply: null })), true);
  });

  test("preserves an explicitly unavailable gas supply", () => {
    assert.equal(hasGasSupply.resolve(mockCtx({ hasGasSupply: false })), false);
  });

  test("assumes geothermal energy is unavailable when availability is omitted or null", () => {
    assert.equal(hasGeothermalAvailability.resolve(mockCtx()), false);
    assert.equal(
      hasGeothermalAvailability.resolve(mockCtx({ hasGeothermalAvailability: null })),
      false,
    );
  });

  test("preserves explicitly available geothermal energy", () => {
    assert.equal(
      hasGeothermalAvailability.resolve(mockCtx({ hasGeothermalAvailability: true })),
      true,
    );
  });

  test("defaults to natural gas with its configured standard boiler", () => {
    const ctx = DETEnergyCaluclator({ config: DEFAULT_CONFIG, input: baseInput() });

    assert.equal(ctx.get("primaryEnergyCarrier"), "natural_gas");
    assert.equal(ctx.get("heatingSystemType"), "standard_boiler_70_55");
  });

  test("falls back to oil when gas is unavailable and storage is available", () => {
    const input = baseInput();
    input.heat = { hasGasSupply: false, hasStorage: true };
    const ctx = DETEnergyCaluclator({ config: DEFAULT_CONFIG, input });

    assert.equal(ctx.get("primaryEnergyCarrier"), "heating_oil");
    assert.equal(ctx.get("heatingSystemType"), "standard_boiler_70_55");
  });

  test("uses the configured electricity heating system without gas or storage", () => {
    const input = baseInput();
    input.heat = { hasGasSupply: false, hasStorage: false };
    const ctx = DETEnergyCaluclator({ config: DEFAULT_CONFIG, input });

    assert.equal(ctx.get("primaryEnergyCarrier"), "none");
    assert.equal(ctx.get("heatingSystemType"), "air_source_heat_pump_55_45");
    assert.equal(ctx.get("electricalRatio"), 1);
  });

  test("follows a changed default heating system for the fallback carrier", () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.heat.defaultHeatingSystemType.find((entry) => entry.key === "none")!.value =
      "electric_direct_heater";
    const input = baseInput();
    input.heat = { hasGasSupply: false, hasStorage: false };
    const ctx = DETEnergyCaluclator({ config, input });

    assert.equal(ctx.get("primaryEnergyCarrier"), "none");
    assert.equal(ctx.get("heatingSystemType"), "electric_direct_heater");
  });

  test("keeps the configured heat pump for an explicitly selected electricity carrier", () => {
    const input = baseInput();
    input.heat = { primaryEnergyCarrier: "none", hasGasSupply: false };
    const ctx = DETEnergyCaluclator({ config: DEFAULT_CONFIG, input });

    assert.equal(ctx.get("heatingSystemType"), "air_source_heat_pump_55_45");
  });

  test("interpolates the heating performance factor by usable floor area", () => {
    const ctx = mockCtx(
      {},
      {
        heatingSystemType: "standard_boiler_70_55",
        heatingSystemConstructionYear: 1980,
        usableFloorArea: 325,
      },
    );
    ctx.input.config = DEFAULT_CONFIG;

    assert.equal(heatingPerformanceFactor.resolve(ctx), 1.415);
  });
});
