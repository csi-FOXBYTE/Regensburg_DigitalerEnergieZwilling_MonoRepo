import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { DETEnergyCaluclator } from "../../src/calculators/energy/index.js";
import { BuildingType } from "../../src/types/building-type.js";
import { DEFAULT_CONFIG } from "../../src/types/config/default-config.js";
import type { DETInput } from "../../src/types/input/index.js";
import { resolveKeyedValue } from "../../src/types/keyed-values.js";
import { resolveYearBand } from "../../src/types/range-bands.js";
import { validateInput } from "../../src/validators/index.js";

const clone = <T>(value: T): T => structuredClone(value);

function baseInput(): DETInput {
  return {
    general: {
      buildingYear: 1968,
      numberOfStories: 2,
      buildingHeight: 8.85,
      lowestEaveHeight: 5.9,
      buildingBaseArea: 77,
      type: BuildingType.SINGLE_FAMILY,
    },
    heat: {
      primaryEnergyCarrier: "natural_gas",
      heatingSystemType: "condensing_boiler_70_55",
      heatingSystemConstructionYear: 1998,
      heatingSurfaceType: "free_heat_emitter",
      hasGasSupply: true,
      hasStorage: false,
      hasGeothermalAvailability: false,
    },
    electricity: {},
    roof: {
      area: 77,
      isFlatRoof: false,
      year: 1968,
      hasInsulation: false,
      uValue: 0.8,
    },
    roofWindows: { area: 0, year: 1968, uValue: 2 },
    exteriorWallWindows: { area: 42.4, year: 1990, uValue: 2.7 },
    topFloor: {
      area: 77,
      year: 1968,
      hasAttic: true,
      isAtticHeated: false,
      hasInsulation: false,
      uValue: 0.7,
    },
    outerWall: {
      area: 212,
      areaWithoutAttic: 180,
      atticArea: 32,
      adjacentWallArea: 0,
      year: 1968,
      hasInsulation: false,
      uValue: 1.4,
    },
    bottomFloor: {
      area: 77,
      year: 1968,
      hasBasement: false,
      isBasementHeated: false,
      isHeated: false,
      hasInsulation: false,
      uValue: 1,
    },
    preRenovationValues: null,
  };
}

function evaluate(input: DETInput) {
  const validation = validateInput(input, DEFAULT_CONFIG);
  assert.equal(
    validation.success,
    true,
    validation.success ? undefined : JSON.stringify(validation.issues),
  );
  return DETEnergyCaluclator({ config: DEFAULT_CONFIG, input });
}

describe("calculation resolver paths with DEFAULT_CONFIG", () => {
  for (const attic of [
    { name: "unheated attic", hasAttic: true, isAtticHeated: false, height: 6.4, interiorHeight: 3 },
    { name: "heated attic", hasAttic: true, isAtticHeated: true, height: 9.4, interiorHeight: 3 },
    { name: "absent attic", hasAttic: false, isAtticHeated: true, height: 6.4, interiorHeight: 3 },
  ]) {
    test(`keeps above-ground volume fixed when story count changes with ${attic.name}`, () => {
      const input = baseInput();
      input.general.buildingBaseArea = 100;
      input.general.buildingHeight = 9.4;
      input.general.lowestEaveHeight = 6.4;
      input.topFloor.hasAttic = attic.hasAttic;
      input.topFloor.isAtticHeated = attic.isAtticHeated;
      const twoStories = evaluate(input);
      const threeStoryInput = clone(input);
      threeStoryInput.general.numberOfStories = 3;
      const threeStories = evaluate(threeStoryInput);

      assert.equal(twoStories.get("totalStoryHeight"), attic.height);
      assert.equal(twoStories.get("grossHeatedVolume"), 100 * attic.height);
      assert.equal(twoStories.get("interiorStoryHeight"), attic.interiorHeight);
      assert.equal(threeStories.get("grossHeatedVolume"), twoStories.get("grossHeatedVolume"));
      assert.equal(threeStories.get("usableFloorArea"), twoStories.get("usableFloorArea"));
      const expectedThreeStoryHeight = attic.hasAttic && attic.isAtticHeated ? 2.2 : 5.8 / 3;
      assert.ok(Math.abs(threeStories.get("interiorStoryHeight") - expectedThreeStoryHeight) < 1e-12);
    });

    test(`adds one derived basement story below the building height with ${attic.name}`, () => {
      const input = baseInput();
      input.general.buildingBaseArea = 100;
      input.general.buildingHeight = 9.4;
      input.general.lowestEaveHeight = 6.4;
      input.topFloor.hasAttic = attic.hasAttic;
      input.topFloor.isAtticHeated = attic.isAtticHeated;
      input.bottomFloor.hasBasement = true;
      const unheated = evaluate(input);
      const heatedInput = clone(input);
      heatedInput.bottomFloor.isBasementHeated = true;
      const heated = evaluate(heatedInput);

      assert.equal(heated.get("interiorStoryHeight"), unheated.get("interiorStoryHeight"));
      assert.ok(Math.abs(heated.get("totalStoryHeight") - attic.height - 3.2) < 1e-12);
      assert.ok(Math.abs(heated.get("grossHeatedVolume") - unheated.get("grossHeatedVolume") - 320) < 1e-12);
      assert.equal(heated.get("numberOfHeatedStories"), unheated.get("numberOfHeatedStories") + 1);
    });
  }

  test("uses assumed story height only to infer missing story count", () => {
    const input = baseInput();
    input.general.buildingHeight = 9.4;
    input.general.lowestEaveHeight = 6.4;
    delete input.general.numberOfStories;
    const defaultEstimate = evaluate(input);
    const config = clone(DEFAULT_CONFIG);
    config.general.assumedInteriorStoryHeight = 2;
    const shorterEstimate = DETEnergyCaluclator({ config, input });

    assert.equal(defaultEstimate.get("numberOfStories"), 2);
    assert.equal(defaultEstimate.get("interiorStoryHeight"), 3);
    assert.equal(shorterEstimate.get("numberOfStories"), 3);
    assert.ok(Math.abs(shorterEstimate.get("interiorStoryHeight") - 5.8 / 3) < 1e-12);
    assert.equal(shorterEstimate.get("grossHeatedVolume"), defaultEstimate.get("grossHeatedVolume"));

    const explicitInput = clone(input);
    explicitInput.general.numberOfStories = 2;
    const explicit = DETEnergyCaluclator({ config, input: explicitInput });
    assert.equal(explicit.get("interiorStoryHeight"), 3);
  });

  test("selects the configured roof or top-floor path from attic state", () => {
    const flatInput = baseInput();
    flatInput.roof.isFlatRoof = true;
    delete flatInput.topFloor.hasAttic;
    delete flatInput.topFloor.isAtticHeated;
    delete flatInput.roof.constructionType;
    const flat = evaluate(flatInput);

    assert.equal(flat.get("hasAttic"), false);
    assert.equal(flat.get("isSpaceBelowRoofHeated"), true);
    assert.ok(flat.get("roofHeatLoss") > 0);
    assert.equal(flat.get("topFloorHeatLoss"), 0);
    assert.equal(
      flat.get("roofConstructionType"),
      resolveKeyedValue(DEFAULT_CONFIG.roof.defaultConstructionTypeByIsFlatRoof, true),
    );

    const unheatedInput = baseInput();
    unheatedInput.topFloor.hasAttic = true;
    unheatedInput.topFloor.isAtticHeated = false;
    const unheated = evaluate(unheatedInput);

    assert.equal(unheated.get("isSpaceBelowRoofHeated"), false);
    assert.equal(unheated.get("roofHeatLoss"), 0);
    assert.ok(unheated.get("topFloorHeatLoss") > 0);

    const heatedInput = clone(unheatedInput);
    heatedInput.topFloor.isAtticHeated = true;
    const heated = evaluate(heatedInput);

    assert.equal(heated.get("isSpaceBelowRoofHeated"), true);
    assert.ok(heated.get("roofHeatLoss") > 0);
    assert.equal(heated.get("topFloorHeatLoss"), 0);
    assert.ok(heated.get("grossHeatedVolume") > unheated.get("grossHeatedVolume"));
  });

  test("selects the configured bottom-floor path from basement state", () => {
    const makeBasementInput = (hasBasement: boolean, isBasementHeated: boolean) => {
      const input = baseInput();
      delete input.bottomFloor.uValue;
      delete input.bottomFloor.constructionType;
      input.bottomFloor.hasBasement = hasBasement;
      input.bottomFloor.isBasementHeated = isBasementHeated;
      return input;
    };

    const absent = evaluate(makeBasementInput(false, true));
    assert.equal(absent.get("isBasementHeated"), false);
    assert.equal(absent.get("isSpaceAboveBaseSlabHeated"), true);
    const absentDefaults = resolveKeyedValue(
      DEFAULT_CONFIG.bottomFloor.defaultConstructionType,
      true,
    );
    assert.equal(
      absent.get("bottomFloorConstructionType"),
      resolveYearBand(absentDefaults, absent.get("bottomFloorYear")),
    );

    const unheated = evaluate(makeBasementInput(true, false));
    assert.equal(unheated.get("isBasementHeated"), false);
    assert.equal(unheated.get("isSpaceAboveBaseSlabHeated"), false);
    const unheatedDefaults = resolveKeyedValue(
      DEFAULT_CONFIG.bottomFloor.defaultConstructionType,
      false,
    );
    assert.equal(
      unheated.get("bottomFloorConstructionType"),
      resolveYearBand(unheatedDefaults, unheated.get("bottomFloorYear")),
    );

    const heated = evaluate(makeBasementInput(true, true));
    assert.equal(heated.get("isBasementHeated"), true);
    assert.equal(heated.get("isSpaceAboveBaseSlabHeated"), true);
    assert.ok(heated.get("grossHeatedVolume") > unheated.get("grossHeatedVolume"));
  });

  test("resolves omitted component U-values from config and preserves explicit values", () => {
    const omittedInput = baseInput();
    delete omittedInput.roof.uValue;
    delete omittedInput.topFloor.uValue;
    delete omittedInput.outerWall.uValue;
    delete omittedInput.exteriorWallWindows.uValue;
    delete omittedInput.bottomFloor.uValue;
    omittedInput.exteriorWallWindows.year = 1968;
    const omitted = evaluate(omittedInput);

    const roofUValues = resolveKeyedValue(
      DEFAULT_CONFIG.roof.uValue,
      omitted.get("roofConstructionType"),
    );
    const topFloorUValues = resolveKeyedValue(
      DEFAULT_CONFIG.topFloor.uValue,
      omitted.get("topFloorType"),
    );
    const outerWallUValues = resolveKeyedValue(
      DEFAULT_CONFIG.outerWall.uValue,
      omitted.get("outerWallConstructionType"),
    );
    const windowUValues = resolveKeyedValue(
      DEFAULT_CONFIG.windows.uValue,
      omitted.get("exteriorWallWindowsType"),
    );
    const bottomFloorUValues = resolveKeyedValue(
      DEFAULT_CONFIG.bottomFloor.uValue,
      omitted.get("bottomFloorConstructionType"),
    );

    assert.equal(
      omitted.get("roofUValue"),
      resolveYearBand(roofUValues, omitted.get("roofYear")),
    );
    assert.equal(
      omitted.get("topFloorUValue"),
      resolveYearBand(topFloorUValues, omitted.get("topFloorYear")),
    );
    assert.equal(
      omitted.get("outerWallUValue"),
      resolveYearBand(outerWallUValues, omitted.get("outerWallYear")),
    );
    assert.equal(
      omitted.get("exteriorWallWindowsUValue"),
      resolveYearBand(windowUValues, omitted.get("exteriorWallWindowsYear")),
    );
    assert.equal(
      omitted.get("bottomFloorUValue"),
      resolveYearBand(bottomFloorUValues, omitted.get("bottomFloorYear")),
    );

    const insulatedInput = clone(omittedInput);
    insulatedInput.roof.hasInsulation = true;
    insulatedInput.roof.insulationThickness = 0.16;
    insulatedInput.topFloor.hasInsulation = true;
    insulatedInput.topFloor.insulationThickness = 0.16;
    insulatedInput.outerWall.hasInsulation = true;
    insulatedInput.outerWall.insulationThickness = 0.12;
    insulatedInput.bottomFloor.hasInsulation = true;
    insulatedInput.bottomFloor.insulationThickness = 0.1;
    const insulated = evaluate(insulatedInput);

    assert.ok(insulated.get("roofUValue") < omitted.get("roofUValue"));
    assert.ok(insulated.get("topFloorUValue") < omitted.get("topFloorUValue"));
    assert.ok(insulated.get("outerWallUValue") < omitted.get("outerWallUValue"));
    assert.ok(insulated.get("bottomFloorUValue") < omitted.get("bottomFloorUValue"));

    const explicitInput = baseInput();
    explicitInput.roof.uValue = 0.21;
    explicitInput.topFloor.uValue = 0.22;
    explicitInput.outerWall.uValue = 0.23;
    explicitInput.exteriorWallWindows.uValue = 1.24;
    explicitInput.bottomFloor.uValue = 0.25;
    const explicit = evaluate(explicitInput);

    assert.equal(explicit.get("roofUValue"), explicitInput.roof.uValue);
    assert.equal(explicit.get("topFloorUValue"), explicitInput.topFloor.uValue);
    assert.equal(explicit.get("outerWallUValue"), explicitInput.outerWall.uValue);
    assert.equal(
      explicit.get("exteriorWallWindowsUValue"),
      explicitInput.exteriorWallWindows.uValue,
    );
    assert.equal(explicit.get("bottomFloorUValue"), explicitInput.bottomFloor.uValue);
  });

  test("routes heating demand according to the configured electrical ratio", () => {
    const cases = [
      {
        carrier: "natural_gas",
        system: "condensing_boiler_70_55",
        surface: "free_heat_emitter",
        year: 1998,
        hasGasSupply: true,
        hasStorage: false,
      },
      {
        carrier: "none",
        system: "air_source_heat_pump_lt_40",
        surface: "radiant_surface_heating",
        year: 2010,
        hasGasSupply: false,
        hasStorage: false,
      },
    ] as const;

    for (const testCase of cases) {
      const input = baseInput();
      input.heat.primaryEnergyCarrier = testCase.carrier;
      input.heat.heatingSystemType = testCase.system;
      input.heat.heatingSurfaceType = testCase.surface;
      input.heat.heatingSystemConstructionYear = testCase.year;
      input.heat.hasGasSupply = testCase.hasGasSupply;
      input.heat.hasStorage = testCase.hasStorage;
      const ctx = evaluate(input);

      const configuredRatio = resolveKeyedValue(
        DEFAULT_CONFIG.heat.electricalRatio,
        testCase.system,
      );
      assert.equal(ctx.get("electricalRatio"), configuredRatio);
      assert.equal(
        ctx.get("electricalHeatingEnergyDemand"),
        ctx.get("netThermalDemand") * configuredRatio,
      );
      assert.equal(
        ctx.get("thermalEnergyDemand"),
        ctx.get("netThermalDemand") * (1 - configuredRatio),
      );
    }
  });

  test("uses configured fallbacks while preserving explicit geometry input", () => {
    const inferredInput = baseInput();
    delete inferredInput.general.numberOfStories;
    const inferred = evaluate(inferredInput);
    const configuredStoryHeight =
      DEFAULT_CONFIG.general.assumedInteriorStoryHeight +
      DEFAULT_CONFIG.general.assumedFloorSlabThickness;
    assert.equal(
      inferred.get("numberOfStories"),
      Math.max(1, Math.round(inferredInput.general.lowestEaveHeight / configuredStoryHeight)),
    );

    const explicitInput = clone(inferredInput);
    explicitInput.general.numberOfStories = 3;
    const explicit = evaluate(explicitInput);
    assert.equal(explicit.get("numberOfStories"), explicitInput.general.numberOfStories);

    const singleFamilyInput = baseInput();
    singleFamilyInput.heat.primaryEnergyCarrier = "none";
    singleFamilyInput.heat.heatingSystemType = "air_source_heat_pump_lt_40";
    singleFamilyInput.heat.heatingSurfaceType = "radiant_surface_heating";
    singleFamilyInput.heat.heatingSystemConstructionYear = 2010;
    const singleFamily = evaluate(singleFamilyInput);
    assert.equal(singleFamily.get("hasInternalGains"), true);
    assert.equal(
      singleFamily.get("internalGainsFactor"),
      resolveKeyedValue(
        DEFAULT_CONFIG.heat.internalGainsFactorByBuildingType,
        BuildingType.SINGLE_FAMILY,
      ),
    );

    const multiFamilyInput = clone(singleFamilyInput);
    multiFamilyInput.general.type = BuildingType.MULTI_FAMILY;
    const multiFamily = evaluate(multiFamilyInput);
    assert.equal(
      multiFamily.get("internalGainsFactor"),
      resolveKeyedValue(
        DEFAULT_CONFIG.heat.internalGainsFactorByBuildingType,
        BuildingType.MULTI_FAMILY,
      ),
    );
  });
});
