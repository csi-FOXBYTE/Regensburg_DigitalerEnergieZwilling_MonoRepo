import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { DETEnergyCaluclator } from "../../src/calculators/energy/index.js";
import { calculate } from "../../src/calculate.js";
import { DEFAULT_CONFIG } from "../../src/types/config/default-config.js";
import { resolveKeyedValue } from "../../src/types/keyed-values.js";
import { baseInput } from "../validators/fixtures.js";

describe("roof-shape defaults", () => {
  test("assumes no attic and solid construction for a flat roof", () => {
    const input = baseInput();
    input.roof.isFlatRoof = true;
    const ctx = DETEnergyCaluclator({ config: DEFAULT_CONFIG, input });

    assert.strictEqual(ctx.get("isFlatRoof"), true);
    assert.strictEqual(
      ctx.get("hasAttic"),
      resolveKeyedValue(DEFAULT_CONFIG.topFloor.defaultHasAtticByIsFlatRoof, true),
    );
    assert.strictEqual(
      ctx.get("isAtticHeated"),
      DEFAULT_CONFIG.topFloor.defaultIsAtticHeated,
    );
    assert.strictEqual(
      ctx.get("roofConstructionType"),
      resolveKeyedValue(DEFAULT_CONFIG.roof.defaultConstructionTypeByIsFlatRoof, true),
    );
  });

  test("assumes an unheated attic and wood construction for a non-flat roof", () => {
    const input = baseInput();
    input.roof.isFlatRoof = false;
    const ctx = DETEnergyCaluclator({ config: DEFAULT_CONFIG, input });

    assert.strictEqual(
      ctx.get("hasAttic"),
      resolveKeyedValue(DEFAULT_CONFIG.topFloor.defaultHasAtticByIsFlatRoof, false),
    );
    assert.strictEqual(
      ctx.get("isAtticHeated"),
      DEFAULT_CONFIG.topFloor.defaultIsAtticHeated,
    );
    assert.strictEqual(
      ctx.get("roofConstructionType"),
      resolveKeyedValue(DEFAULT_CONFIG.roof.defaultConstructionTypeByIsFlatRoof, false),
    );
  });

  test("explicit values override roof-shape assumptions", () => {
    const input = baseInput();
    input.roof.isFlatRoof = true;
    input.roof.constructionType = "wood_construction";
    input.topFloor.hasAttic = true;
    input.topFloor.isAtticHeated = true;
    const ctx = DETEnergyCaluclator({ config: DEFAULT_CONFIG, input });

    assert.strictEqual(ctx.get("hasAttic"), true);
    assert.strictEqual(ctx.get("isAtticHeated"), true);
    assert.strictEqual(ctx.get("roofConstructionType"), "wood_construction");
  });

  test("uses the configured roof-shape assumption when roof shape is unavailable", () => {
    const input = baseInput();
    const ctx = DETEnergyCaluclator({ config: DEFAULT_CONFIG, input });

    const configuredRoofShape = DEFAULT_CONFIG.roof.defaultIsFlatRoof;
    assert.strictEqual(ctx.get("isFlatRoof"), configuredRoofShape);
    assert.strictEqual(
      ctx.get("hasAttic"),
      resolveKeyedValue(
        DEFAULT_CONFIG.topFloor.defaultHasAtticByIsFlatRoof,
        configuredRoofShape,
      ),
    );
    assert.strictEqual(
      ctx.get("isAtticHeated"),
      DEFAULT_CONFIG.topFloor.defaultIsAtticHeated,
    );
    assert.strictEqual(
      ctx.get("roofConstructionType"),
      resolveKeyedValue(
        DEFAULT_CONFIG.roof.defaultConstructionTypeByIsFlatRoof,
        configuredRoofShape,
      ),
    );
  });

  test("allows the missing roof-shape assumption to be configured", () => {
    const input = baseInput();
    const config = structuredClone(DEFAULT_CONFIG);
    config.roof.defaultIsFlatRoof = true;
    const ctx = DETEnergyCaluclator({ config, input });

    assert.strictEqual(ctx.get("isFlatRoof"), true);
    assert.strictEqual(
      ctx.get("hasAttic"),
      resolveKeyedValue(config.topFloor.defaultHasAtticByIsFlatRoof, true),
    );
    assert.strictEqual(
      ctx.get("roofConstructionType"),
      resolveKeyedValue(config.roof.defaultConstructionTypeByIsFlatRoof, true),
    );
  });

  test("includes the roof shape and derived assumptions in resolved input", () => {
    const input = baseInput();
    input.roof.isFlatRoof = false;

    const result = calculate(DEFAULT_CONFIG, input);

    assert.strictEqual(result.resolvedInput.roof.isFlatRoof, false);
    assert.strictEqual(
      result.resolvedInput.roof.constructionType,
      resolveKeyedValue(DEFAULT_CONFIG.roof.defaultConstructionTypeByIsFlatRoof, false),
    );
    assert.strictEqual(
      result.resolvedInput.topFloor.hasAttic,
      resolveKeyedValue(DEFAULT_CONFIG.topFloor.defaultHasAtticByIsFlatRoof, false),
    );
    assert.strictEqual(
      result.resolvedInput.topFloor.isAtticHeated,
      DEFAULT_CONFIG.topFloor.defaultIsAtticHeated,
    );
  });
});
