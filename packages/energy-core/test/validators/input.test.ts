import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { validateInput } from "../../src/validators/index.js";
import type { ValidationResult } from "../../src/validators/index.js";
import { baseConfig, baseInput, basePreRenovation } from "./fixtures.js";

type Config = ReturnType<typeof baseConfig>;
type Input = ReturnType<typeof baseInput>;

function freshConfig(): Config {
  return structuredClone(baseConfig());
}

function freshInput(): Input {
  return structuredClone(baseInput());
}

function assertPassed<T>(result: ValidationResult<T>): void {
  assert.strictEqual(
    result.success,
    true,
    !result.success ? `Expected success, got issues: ${JSON.stringify(result.issues)}` : "",
  );
}

function assertFailed<T>(result: ValidationResult<T>, path: string): void {
  assert.strictEqual(result.success, false, "Expected validation failure but got success");
  if (!result.success) {
    assert.ok(
      result.issues.some((i) => i.path === path),
      `Expected issue at path "${path}", got: ${JSON.stringify(result.issues)}`,
    );
  }
}

const cfg = baseConfig();

// ── Happy paths ───────────────────────────────────────────────────────────────

describe("validateInput — happy paths", () => {
  test("passes when no optional selection fields are set", () => {
    assertPassed(validateInput(baseInput(), cfg));
  });

  test("passes when all optional selection fields are set to valid values", () => {
    const input = freshInput();
    input.heat = {
      primaryEnergyCarrier: "gas",
      heatingSystemType: "boiler",
      heatingSurfaceType: "radiator",
    };
    input.electricity = { electricityType: "grid" };
    input.roof = { area: 100, constructionType: "rafter" };
    input.topFloor = { area: 100, topFloorType: "flatRoof" };
    input.outerWall = {
      area: 200,
      areaWithoutAttic: 180,
      atticArea: 20,
      constructionType: "brick",
    };
    input.bottomFloor = { area: 100, constructionType: "concrete" };
    input.exteriorWallWindows = { windowType: "double" };
    input.roofWindows = { windowType: "double" };
    input.preRenovationValues = basePreRenovation();
    assertPassed(validateInput(input, cfg));
  });

  test("passes when optional fields are explicitly null", () => {
    const input = freshInput();
    input.heat = {
      primaryEnergyCarrier: null,
      heatingSystemType: null,
      heatingSurfaceType: null,
    };
    input.electricity = { electricityType: null };
    input.roof = { area: 100, constructionType: null };
    input.topFloor = { area: 100, topFloorType: null };
    input.outerWall = {
      area: 200,
      areaWithoutAttic: 180,
      atticArea: 20,
      constructionType: null,
    };
    input.bottomFloor = { area: 100, constructionType: null };
    input.exteriorWallWindows = { windowType: null };
    input.roofWindows = { windowType: null };
    assertPassed(validateInput(input, cfg));
  });

  test("passes without a total outer-wall area", () => {
    const input = freshInput();
    delete input.outerWall.area;

    assertPassed(validateInput(input, cfg));
  });

  test("skips preRenovationValues cross-checks when preRenovationValues is null", () => {
    const input = freshInput();
    input.preRenovationValues = null;
    assertPassed(validateInput(input, cfg));
  });
});

// ── Zod shape failures ────────────────────────────────────────────────────────

describe("validateInput — shape failures", () => {
  test("fails when data is null", () => {
    assert.strictEqual(validateInput(null, cfg).success, false);
  });

  test("fails when a required input section is missing", () => {
    const input = freshInput() as Record<string, unknown>;
    delete input.general;
    assert.strictEqual(validateInput(input, cfg).success, false);
  });

  test("fails when general.buildingHeight is missing", () => {
    const input = freshInput() as Record<string, unknown>;
    input.general = {
      buildingYear: 2005,
      lowestEaveHeight: 6,
      buildingBaseArea: 100,
      type: "singleFamily",
    };
    assert.strictEqual(validateInput(input, cfg).success, false);
  });

  test("fails when general.lowestEaveHeight is missing", () => {
    const input = freshInput() as Record<string, unknown>;
    input.general = {
      buildingYear: 2005,
      buildingHeight: 6,
      buildingBaseArea: 100,
      type: "singleFamily",
    };

    assertFailed(validateInput(input, cfg), "general.lowestEaveHeight");
  });

  test("fails when either split outer-wall area is missing", () => {
    const withoutAtticArea = freshInput() as unknown as {
      outerWall: Record<string, unknown>;
    };
    delete withoutAtticArea.outerWall.areaWithoutAttic;
    assertFailed(validateInput(withoutAtticArea, cfg), "outerWall.areaWithoutAttic");

    const withoutWallAtticArea = freshInput() as unknown as {
      outerWall: Record<string, unknown>;
    };
    delete withoutWallAtticArea.outerWall.atticArea;
    assertFailed(validateInput(withoutWallAtticArea, cfg), "outerWall.atticArea");
  });
});

// ── General cross-checks ─────────────────────────────────────────────────────

describe("validateInput — general", () => {
  test("passes when a single-family apartment count is omitted, null, one, or two", () => {
    const omitted = freshInput();
    assertPassed(validateInput(omitted, cfg));

    const nullCount = freshInput();
    nullCount.general.numberOfApartments = null;
    assertPassed(validateInput(nullCount, cfg));

    const oneApartment = freshInput();
    oneApartment.general.numberOfApartments = 1;
    assertPassed(validateInput(oneApartment, cfg));

    const twoApartments = freshInput();
    twoApartments.general.numberOfApartments = 2;
    assertPassed(validateInput(twoApartments, cfg));
  });

  test("fails when a single-family home specifies more than two apartments", () => {
    const input = freshInput();
    input.general.numberOfApartments = 3;
    assertFailed(validateInput(input, cfg), "general.numberOfApartments");
  });

  test("allows multiple apartments for a multi-family home", () => {
    const input = freshInput();
    input.general.type = "multiFamily";
    input.general.numberOfApartments = 4;
    assertPassed(validateInput(input, cfg));
  });
});

// ── Heat cross-checks ─────────────────────────────────────────────────────────

describe("validateInput — heat", () => {
  test("fails when primaryEnergyCarrier is not in config carriers", () => {
    const input = freshInput();
    input.heat = { primaryEnergyCarrier: "oil" };
    assertFailed(validateInput(input, cfg), "heat.primaryEnergyCarrier");
  });

  test("fails when heatingSystemType is not in config system types", () => {
    const input = freshInput();
    input.heat = { heatingSystemType: "heatPump" };
    assertFailed(validateInput(input, cfg), "heat.heatingSystemType");
  });

  test("fails when heatingSystemType is not allowed for the given carrier", () => {
    const localCfg = freshConfig();
    localCfg.heat.heatingSystemTypes.push({ value: "heatPump", localization: {} });
    localCfg.heat.heatingPerformanceFactor.push({
      key: "heatPump",
      value: [{ to: 2000, value: 3.0 }, { from: 2000, value: 3.2 }],
    });
    localCfg.heat.temperatureControlPerformanceFactor.push({
      key: "heatPump",
      value: [{ to: 2000, value: [{ key: "radiator", value: 1.0 }] }, { from: 2000, value: [{ key: "radiator", value: 1.0 }] }],
    });
    localCfg.heat.electricalRatio.push({ key: "heatPump", value: 1.0 });
    localCfg.heat.hasInternalGains.push({ key: "heatPump", value: false });
    // gas → only boiler allowed, heatPump is not
    localCfg.heat.allowedHeatingSystemTypesByCarrier = [{ key: "gas", allowedValues: ["boiler"] }];

    const input = freshInput();
    input.heat = { primaryEnergyCarrier: "gas", heatingSystemType: "heatPump" };
    assertFailed(validateInput(input, localCfg), "heat.heatingSystemType");
  });

  test("passes when carrier has no entry in allowedHeatingSystemTypesByCarrier (all systems allowed)", () => {
    const localCfg = freshConfig();
    localCfg.heat.allowedHeatingSystemTypesByCarrier = [];
    const input = freshInput();
    input.heat = { primaryEnergyCarrier: "gas", heatingSystemType: "boiler" };
    assertPassed(validateInput(input, localCfg));
  });

  test("skips allowedHeatingSystemTypesByCarrier check when only one of the pair is set", () => {
    const input = freshInput();
    input.heat = { primaryEnergyCarrier: "gas" };
    assertPassed(validateInput(input, cfg));

    const input2 = freshInput();
    input2.heat = { heatingSystemType: "boiler" };
    assertPassed(validateInput(input2, cfg));
  });

  test("fails when heatingSurfaceType is not in config surface types", () => {
    const input = freshInput();
    input.heat = { heatingSurfaceType: "underfloor" };
    assertFailed(validateInput(input, cfg), "heat.heatingSurfaceType");
  });

  test("fails when a submitted carrier does not meet its requirements", () => {
    const localCfg = freshConfig();
    localCfg.heat.primaryEnergyCarriers[0]!.requirements = { gas: true };
    const input = freshInput();
    input.heat = { primaryEnergyCarrier: "gas", hasGasSupply: false };

    assertFailed(validateInput(input, localCfg), "heat.primaryEnergyCarrier");
  });

  test("passes when a submitted carrier meets its requirements", () => {
    const localCfg = freshConfig();
    localCfg.heat.primaryEnergyCarriers[0]!.requirements = { gas: true };
    const input = freshInput();
    input.heat = { primaryEnergyCarrier: "gas", hasGasSupply: true };

    assertPassed(validateInput(input, localCfg));
  });

  test("fails when a submitted heating system requires unavailable geothermal energy", () => {
    const localCfg = freshConfig();
    localCfg.heat.heatingSystemTypes[0]!.requirements = { geothermal: true };
    const input = freshInput();
    input.heat = {
      heatingSystemType: "boiler",
      hasGeothermalAvailability: false,
    };

    assertFailed(validateInput(input, localCfg), "heat.heatingSystemType");
  });

  test("passes when a submitted heating system meets its geothermal requirement", () => {
    const localCfg = freshConfig();
    localCfg.heat.heatingSystemTypes[0]!.requirements = { geothermal: true };
    const input = freshInput();
    input.heat = {
      heatingSystemType: "boiler",
      hasGeothermalAvailability: true,
    };

    assertPassed(validateInput(input, localCfg));
  });

  test("fails when the effective thermal base rate exceeds the total cost", () => {
    const input = freshInput();
    input.heat = { userThermalTotalCost: 50 };

    assertFailed(validateInput(input, cfg), "heat.userThermalBaseRate");
  });

  test("fails when the effective thermal unit rate is not positive", () => {
    const input = freshInput();
    input.heat = { userThermalTotalCost: 200, userThermalUnitRate: 0 };

    assertFailed(validateInput(input, cfg), "heat.userThermalUnitRate");
  });

  test("passes when effective thermal rates are consistent with the total cost", () => {
    const input = freshInput();
    input.heat = {
      userThermalTotalCost: 200,
      userThermalBaseRate: 100,
      userThermalUnitRate: 0.08,
    };

    assertPassed(validateInput(input, cfg));
  });
});

// ── Electricity cross-check ───────────────────────────────────────────────────

describe("validateInput — electricity", () => {
  test("fails when electricityType is not in config electricity types", () => {
    const input = freshInput();
    input.electricity = { electricityType: "solar" };
    assertFailed(validateInput(input, cfg), "electricity.electricityType");
  });

  test("passes when electricityType is valid", () => {
    const input = freshInput();
    input.electricity = { electricityType: "grid" };
    assertPassed(validateInput(input, cfg));
  });
});

// ── PreRenovationValues cross-checks ──────────────────────────────────────────

describe("validateInput — preRenovationValues", () => {
  test("fails when preRenovationValues.primaryEnergyCarrier is not in carriers", () => {
    const input = freshInput();
    input.preRenovationValues = { ...basePreRenovation(), primaryEnergyCarrier: "oil" };
    assertFailed(validateInput(input, cfg), "preRenovationValues.primaryEnergyCarrier");
  });

  test("fails when preRenovationValues.heatingSystemType is not in system types", () => {
    const input = freshInput();
    input.preRenovationValues = { ...basePreRenovation(), heatingSystemType: "heatPump" };
    assertFailed(validateInput(input, cfg), "preRenovationValues.heatingSystemType");
  });

  test("passes when preRenovationValues has valid carrier and system type", () => {
    const input = freshInput();
    input.preRenovationValues = basePreRenovation();
    assertPassed(validateInput(input, cfg));
  });
});

// ── Component cross-checks ────────────────────────────────────────────────────

describe("validateInput — components", () => {
  test("fails when roof.constructionType is not in config roof.constructionTypes", () => {
    const input = freshInput();
    input.roof = { area: 100, constructionType: "tileRoof" };
    assertFailed(validateInput(input, cfg), "roof.constructionType");
  });

  test("passes when roof.constructionType is valid", () => {
    const input = freshInput();
    input.roof = { area: 100, constructionType: "rafter" };
    assertPassed(validateInput(input, cfg));
  });

  test("passes when roof.isFlatRoof is boolean", () => {
    const input = freshInput();
    input.roof.isFlatRoof = true;
    assertPassed(validateInput(input, cfg));
  });

  test("fails when roof.isFlatRoof is not boolean", () => {
    const input = freshInput() as any;
    input.roof.isFlatRoof = "yes";
    assertFailed(validateInput(input, cfg), "roof.isFlatRoof");
  });

  test("fails when topFloor.topFloorType is not in config topFloor.topFloorTypes", () => {
    const input = freshInput();
    input.topFloor = { area: 100, topFloorType: "pitchedRoof" };
    assertFailed(validateInput(input, cfg), "topFloor.topFloorType");
  });

  test("passes when topFloor.topFloorType is valid", () => {
    const input = freshInput();
    input.topFloor = { area: 100, topFloorType: "flatRoof" };
    assertPassed(validateInput(input, cfg));
  });

  test("fails when outerWall.constructionType is not in config outerWall.constructionTypes", () => {
    const input = freshInput();
    input.outerWall = {
      area: 200,
      areaWithoutAttic: 180,
      atticArea: 20,
      constructionType: "timber",
    };
    assertFailed(validateInput(input, cfg), "outerWall.constructionType");
  });

  test("passes when outerWall.constructionType is valid", () => {
    const input = freshInput();
    input.outerWall = {
      area: 200,
      areaWithoutAttic: 180,
      atticArea: 20,
      constructionType: "brick",
    };
    assertPassed(validateInput(input, cfg));
  });

  test("fails when bottomFloor.constructionType is not in config bottomFloor.constructionTypes", () => {
    const input = freshInput();
    input.bottomFloor = { area: 100, constructionType: "gravel" };
    assertFailed(validateInput(input, cfg), "bottomFloor.constructionType");
  });

  test("passes when bottomFloor.constructionType is valid", () => {
    const input = freshInput();
    input.bottomFloor = { area: 100, constructionType: "concrete" };
    assertPassed(validateInput(input, cfg));
  });

  test("fails when exteriorWallWindows.windowType is not in config windows.windowTypes", () => {
    const input = freshInput();
    input.exteriorWallWindows = { windowType: "single" };
    assertFailed(validateInput(input, cfg), "exteriorWallWindows.windowType");
  });

  test("passes when exteriorWallWindows.windowType is valid", () => {
    const input = freshInput();
    input.exteriorWallWindows = { windowType: "double" };
    assertPassed(validateInput(input, cfg));
  });

  test("fails when roofWindows.windowType is not in config windows.windowTypes", () => {
    const input = freshInput();
    input.roofWindows = { windowType: "single" };
    assertFailed(validateInput(input, cfg), "roofWindows.windowType");
  });

  test("passes when roofWindows.windowType is valid", () => {
    const input = freshInput();
    input.roofWindows = { windowType: "double" };
    assertPassed(validateInput(input, cfg));
  });

  test("fails when roof-window area exceeds roof area", () => {
    const input = freshInput();
    input.roofWindows.area = 101;

    assertFailed(validateInput(input, cfg), "roofWindows.area");
  });

  test("fails when roof area is smaller than top-floor area", () => {
    const input = freshInput();
    input.roof.area = 99;

    assertFailed(validateInput(input, cfg), "roof.area");
  });
});

// ── Basic numeric constraints ────────────────────────────────────────────────

describe("validateInput — basic numeric constraints", () => {
  test("fails when numberOfStories is less than one", () => {
    const input = freshInput();
    input.general.numberOfStories = 0;

    assertFailed(validateInput(input, cfg), "general.numberOfStories");
  });

  test("fails when numberOfStories is not an integer", () => {
    const input = freshInput();
    input.general.numberOfStories = 1.5;

    assertFailed(validateInput(input, cfg), "general.numberOfStories");
  });

  test("fails when buildingBaseArea is not positive", () => {
    const input = freshInput();
    input.general.buildingBaseArea = 0;

    assertFailed(validateInput(input, cfg), "general.buildingBaseArea");
  });

  test("fails when numberOfApartments is zero or not an integer", () => {
    const zero = freshInput();
    zero.general.numberOfApartments = 0;
    assertFailed(validateInput(zero, cfg), "general.numberOfApartments");

    const fraction = freshInput();
    fraction.general.type = "multiFamily";
    fraction.general.numberOfApartments = 1.5;
    assertFailed(validateInput(fraction, cfg), "general.numberOfApartments");
  });

  test("accepts zero people but rejects negative or fractional counts", () => {
    const zero = freshInput();
    zero.general.numberOfPeople = 0;
    assertPassed(validateInput(zero, cfg));

    const negative = freshInput();
    negative.general.numberOfPeople = -1;
    assertFailed(validateInput(negative, cfg), "general.numberOfPeople");

    const fraction = freshInput();
    fraction.general.numberOfPeople = 1.5;
    assertFailed(validateInput(fraction, cfg), "general.numberOfPeople");
  });

  test("fails when a numeric calendar year is not an integer", () => {
    const input = freshInput();
    input.roof.year = 2005.5;

    assertFailed(validateInput(input, cfg), "roof.year");
  });
});

// ── Renovation chronology ────────────────────────────────────────────────────

describe("validateInput — renovation chronology", () => {
  const cases: Array<{
    path: string;
    setYear: (input: Input, year: number) => void;
  }> = [
    {
      path: "heat.heatingSystemConstructionYear",
      setYear: (input, year) => { input.heat.heatingSystemConstructionYear = year; },
    },
    { path: "roof.year", setYear: (input, year) => { input.roof.year = year; } },
    { path: "roofWindows.year", setYear: (input, year) => { input.roofWindows.year = year; } },
    {
      path: "exteriorWallWindows.year",
      setYear: (input, year) => { input.exteriorWallWindows.year = year; },
    },
    { path: "topFloor.year", setYear: (input, year) => { input.topFloor.year = year; } },
    { path: "outerWall.year", setYear: (input, year) => { input.outerWall.year = year; } },
    { path: "bottomFloor.year", setYear: (input, year) => { input.bottomFloor.year = year; } },
  ];

  for (const { path, setYear } of cases) {
    test(`fails when ${path} predates the building`, () => {
      const input = freshInput();
      setYear(input, 2004);

      assertFailed(validateInput(input, cfg), path);
    });
  }

  test("passes when component years equal the building year", () => {
    const input = freshInput();
    for (const { setYear } of cases) setYear(input, 2005);

    assertPassed(validateInput(input, cfg));
  });

  test("does not compare numeric component years with a building-year range", () => {
    const input = freshInput();
    input.general.buildingYear = { from: 2000, to: 2010 };
    input.roof.year = 1990;

    assertPassed(validateInput(input, cfg));
  });
});
