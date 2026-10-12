import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { DETEnergyCaluclator } from "../../src/calculators/energy/index.js";
import { BuildingType } from "../../src/types/building-type.js";
import { DEFAULT_CONFIG } from "../../src/types/config/default-config.js";
import type { DETConfig } from "../../src/types/config/index.js";
import type { DETInput } from "../../src/types/input/index.js";
import { validateInput } from "../../src/validators/index.js";

const COMPONENT_HEAT_LOSSES = [
  "roofHeatLoss",
  "roofWindowsHeatLoss",
  "topFloorHeatLoss",
  "exteriorWallWindowsHeatLoss",
  "outerWallHeatLoss",
  "bottomFloorHeatLoss",
] as const;

function baseInput(isAtticHeated: boolean): DETInput {
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
    roof: { area: 90, isFlatRoof: false, year: 1968, hasInsulation: false, uValue: 1 },
    roofWindows: { area: 4, year: 1968, uValue: 1 },
    exteriorWallWindows: { area: 42.4, year: 1990, uValue: 1 },
    topFloor: {
      area: 77,
      year: 1968,
      hasAttic: true,
      isAtticHeated,
      hasInsulation: false,
      uValue: 1,
    },
    outerWall: {
      area: 212,
      areaWithoutAttic: 180,
      atticArea: 32,
      adjacentWallArea: 0,
      year: 1968,
      hasInsulation: false,
      uValue: 1,
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

function withSurcharge(thermalBridgeSurcharge: number): DETConfig {
  const config = structuredClone(DEFAULT_CONFIG);
  config.heat.thermalBridgeSurcharge = thermalBridgeSurcharge;
  return config;
}

function evaluate(config: DETConfig, input: DETInput) {
  const validation = validateInput(input, config);
  assert.equal(
    validation.success,
    true,
    validation.success ? undefined : JSON.stringify(validation.issues),
  );
  return DETEnergyCaluclator({ config, input });
}

describe("thermal bridge surcharge", () => {
  for (const isAtticHeated of [false, true]) {
    test(`envelope area matches the component areas with ${isAtticHeated ? "heated" : "unheated"} attic`, () => {
      const config = structuredClone(DEFAULT_CONFIG);
      config.roof.heatLossFactor = 1;
      config.topFloor.heatLossFactor = 1;
      config.outerWall.heatLossFactor = 1;
      config.bottomFloor.heatLossFactor = 1;
      config.windows.roofWindowsHeatLossFactor = 1;
      config.windows.exteriorWallWindowsHeatLossFactor = 1;
      const ctx = evaluate(config, baseInput(isAtticHeated));

      // With U = 1 W/(m²K) and F = 1, each component heat loss equals its area.
      const componentAreaSum = COMPONENT_HEAT_LOSSES.reduce(
        (sum, key) => sum + ctx.get(key),
        0,
      );
      assert.ok(Math.abs(ctx.get("thermalEnvelopeArea") - componentAreaSum) < 1e-9);
    });
  }

  test("adds ΔUWB × Ages to the total heat loss", () => {
    const input = baseInput(false);
    const without = evaluate(withSurcharge(0), input);
    const withBridges = evaluate(withSurcharge(0.1), input);

    assert.equal(without.get("thermalBridgeHeatLoss"), 0);
    assert.equal(
      without.get("totalHeatLoss"),
      without.get("ventilationHeatLoss") +
        COMPONENT_HEAT_LOSSES.reduce((sum, key) => sum + without.get(key), 0),
    );

    const expectedSurcharge = 0.1 * withBridges.get("thermalEnvelopeArea");
    assert.ok(Math.abs(withBridges.get("thermalBridgeHeatLoss") - expectedSurcharge) < 1e-9);
    assert.ok(
      Math.abs(
        withBridges.get("totalHeatLoss") - without.get("totalHeatLoss") - expectedSurcharge,
      ) < 1e-9,
    );
    assert.ok(withBridges.get("spaceHeatingDemand") > without.get("spaceHeatingDemand"));
  });

  test("uses the configured default of 0.10 W/(m²K)", () => {
    const ctx = evaluate(DEFAULT_CONFIG, baseInput(false));
    assert.equal(ctx.get("thermalBridgeSurcharge"), 0.1);
  });
});
