import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { calculate } from "../../src/calculate.js";
import { DETEnergyCaluclator } from "../../src/calculators/energy/index.js";
import { DEFAULT_CONFIG } from "../../src/types/config/default-config.js";
import { baseConfig, baseInput } from "../validators/fixtures.js";

describe("outerWallAllowsAdditionalInsulation", () => {
  test("defaults to true when the construction type omits the setting", () => {
    const config = baseConfig();
    const input = baseInput();
    const ctx = DETEnergyCaluclator({ config, input });

    assert.equal(ctx.get("outerWallAllowsAdditionalInsulation"), true);
  });

  test("resolves false for a construction type that disallows it", () => {
    const input = baseInput();
    input.outerWall.constructionType =
      "solid_wall_with_thermal_insulation_composite_system";
    const ctx = DETEnergyCaluclator({ config: DEFAULT_CONFIG, input });

    assert.equal(ctx.get("outerWallAllowsAdditionalInsulation"), false);
  });

  test("does not alter insulation resolvers", () => {
    const input = baseInput();
    input.outerWall.constructionType =
      "solid_wall_with_thermal_insulation_composite_system";
    input.outerWall.hasInsulation = true;
    input.outerWall.insulationThickness = 0.25;
    const ctx = DETEnergyCaluclator({ config: DEFAULT_CONFIG, input });

    assert.equal(ctx.get("outerWallAllowsAdditionalInsulation"), false);
    assert.equal(ctx.get("outerWallHasInsulation"), true);
    assert.equal(ctx.get("outerWallInsulationThickness"), 0.25);
  });

  test("is included in the resolved input", () => {
    const config = baseConfig();
    config.outerWall.constructionTypes[0]!.allowsAdditionalInsulation = false;

    const result = calculate(config, baseInput());

    assert.equal(result.resolvedInput.outerWall.allowsAdditionalInsulation, false);
  });
});
