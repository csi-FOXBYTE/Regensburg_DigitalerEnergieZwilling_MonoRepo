import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { DETEnergyCaluclator } from "../../src/calculators/energy/index.js";
import { calculate } from "../../src/calculate.js";
import { baseConfig, baseInput } from "../validators/fixtures.js";

describe("building occupancy resolvers", () => {
  test("uses the configured single-family defaults", () => {
    const ctx = DETEnergyCaluclator({
      config: baseConfig(),
      input: baseInput(),
    });

    assert.equal(ctx.get("numberOfApartments"), 1);
    assert.equal(ctx.get("numberOfPeople"), 3);
    assert.equal(ctx.get("averagePeoplePerApartment"), 3);
  });

  test("uses the configured multi-family defaults", () => {
    const input = baseInput();
    input.general.type = "multiFamily";
    const ctx = DETEnergyCaluclator({ config: baseConfig(), input });

    assert.equal(ctx.get("numberOfApartments"), 2);
    assert.equal(ctx.get("numberOfPeople"), 6);
    assert.equal(ctx.get("averagePeoplePerApartment"), 3);
  });

  test("uses the configured people average with an explicit apartment count", () => {
    const input = baseInput();
    input.general.type = "multiFamily";
    input.general.numberOfApartments = 4;
    const ctx = DETEnergyCaluclator({ config: baseConfig(), input });

    assert.equal(ctx.get("numberOfPeople"), 12);
    assert.equal(ctx.get("averagePeoplePerApartment"), 3);
  });

  test("derives the average from explicit people and apartment counts", () => {
    const input = baseInput();
    input.general.type = "multiFamily";
    input.general.numberOfApartments = 4;
    input.general.numberOfPeople = 10;
    const ctx = DETEnergyCaluclator({ config: baseConfig(), input });

    assert.equal(ctx.get("numberOfPeople"), 10);
    assert.equal(ctx.get("averagePeoplePerApartment"), 2.5);
  });

  test("includes the resolved occupancy values in resolvedInput", () => {
    const input = baseInput();
    input.general.type = "multiFamily";
    const result = calculate(baseConfig(), input);

    assert.equal(result.resolvedInput.general.numberOfApartments, 2);
    assert.equal(result.resolvedInput.general.numberOfPeople, 6);
    assert.equal(result.resolvedInput.general.averagePeoplePerApartment, 3);
  });
});
