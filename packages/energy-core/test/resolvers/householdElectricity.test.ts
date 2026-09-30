import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { DETEnergyCaluclator } from "../../src/calculators/energy/index.js";
import { OccupancyWarning } from "../../src/calculators/energy/resolvers/electricalEnergy.js";
import { baseConfig, baseInput } from "../validators/fixtures.js";

describe("household electricity resolvers", () => {
  test("uses every exact table value for one-apartment households", () => {
    const tableValues = [1800, 2700, 3500, 3800, 4500];

    tableValues.forEach((expected, index) => {
      const input = baseInput();
      input.general.numberOfPeople = index + 1;
      const ctx = DETEnergyCaluclator({ config: baseConfig(), input });

      assert.deepEqual(ctx.get("householdElectricityRegression"), {
        a: 1310,
        b: 650,
      });
      assert.equal(ctx.get("householdElectricityPerApartment"), expected);
      assert.equal(ctx.get("baseElectricalLoad"), expected);
    });
  });

  test("uses the EFH/ZFH regression for two apartments regardless of building type", () => {
    const input = baseInput();
    input.general.type = "multiFamily";
    const ctx = DETEnergyCaluclator({ config: baseConfig(), input });

    assert.deepEqual(ctx.get("householdElectricityRegression"), {
      a: 1310,
      b: 650,
    });
    assert.equal(ctx.get("householdElectricityPerApartment"), 3260);
    assert.equal(ctx.get("baseElectricalLoad"), 6520);
  });

  test("uses the MFH regression from three apartments onward", () => {
    const input = baseInput();
    input.general.type = "multiFamily";
    input.general.numberOfApartments = 3;
    input.general.numberOfPeople = 6;
    const ctx = DETEnergyCaluclator({ config: baseConfig(), input });

    assert.deepEqual(ctx.get("householdElectricityRegression"), {
      a: 890,
      b: 450,
    });
    assert.equal(ctx.get("householdElectricityPerApartment"), 1790);
    assert.equal(ctx.get("baseElectricalLoad"), 5370);
  });

  test("uses the regression with a fractional average", () => {
    const input = baseInput();
    input.general.type = "multiFamily";
    input.general.numberOfApartments = 2;
    input.general.numberOfPeople = 5;
    const ctx = DETEnergyCaluclator({ config: baseConfig(), input });

    assert.equal(ctx.get("averagePeoplePerApartment"), 2.5);
    assert.equal(ctx.get("householdElectricityPerApartment"), 2935);
    assert.equal(ctx.get("baseElectricalLoad"), 5870);
  });

  test("uses the regression above the one-apartment table range", () => {
    const input = baseInput();
    input.general.numberOfPeople = 6;
    const ctx = DETEnergyCaluclator({ config: baseConfig(), input });

    assert.equal(ctx.get("householdElectricityPerApartment"), 5210);
    assert.equal(ctx.get("baseElectricalLoad"), 5210);
  });

  test("uses the lowest table value for an empty one-apartment household", () => {
    const input = baseInput();
    input.general.numberOfPeople = 0;
    const ctx = DETEnergyCaluclator({ config: baseConfig(), input });

    assert.equal(ctx.get("householdElectricityPerApartment"), 1800);
    assert.equal(ctx.get("baseElectricalLoad"), 1800);
    assert.deepEqual(ctx.get("occupancyWarnings"), [
      OccupancyWarning.POSSIBLE_VACANCY,
    ]);
  });

  test("resolves warnings for high occupancy and possible vacancy", () => {
    const highInput = baseInput();
    highInput.general.numberOfPeople = 7;
    const high = DETEnergyCaluclator({ config: baseConfig(), input: highInput });
    assert.deepEqual(high.get("occupancyWarnings"), [
      OccupancyWarning.AVERAGE_PEOPLE_PER_APARTMENT_ABOVE_SIX,
    ]);

    const vacancyInput = baseInput();
    vacancyInput.general.type = "multiFamily";
    vacancyInput.general.numberOfApartments = 3;
    vacancyInput.general.numberOfPeople = 2;
    const vacancy = DETEnergyCaluclator({
      config: baseConfig(),
      input: vacancyInput,
    });
    assert.deepEqual(vacancy.get("occupancyWarnings"), [
      OccupancyWarning.POSSIBLE_VACANCY,
    ]);
  });
});
