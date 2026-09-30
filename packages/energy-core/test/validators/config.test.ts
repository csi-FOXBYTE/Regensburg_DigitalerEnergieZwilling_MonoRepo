import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { validateConfig } from "../../src/validators/index.js";
import type { ValidationResult } from "../../src/validators/index.js";
import { DEFAULT_CONFIG } from "../../src/types/config/default-config.js";
import { baseConfig } from "./fixtures.js";

function fresh() {
  return structuredClone(baseConfig());
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

// ── Happy path ────────────────────────────────────────────────────────────────

describe("validateConfig — happy path", () => {
  test("passes for DEFAULT_CONFIG", () => {
    assertPassed(validateConfig(DEFAULT_CONFIG));
  });

  test("passes for a fully valid config", () => {
    assertPassed(validateConfig(baseConfig()));
  });
});

// ── Zod shape failures ────────────────────────────────────────────────────────

describe("validateConfig — shape failures", () => {
  test("fails when data is null", () => {
    const result = validateConfig(null);
    assert.strictEqual(result.success, false);
  });

  test("fails when data is a string", () => {
    const result = validateConfig("not-an-object");
    assert.strictEqual(result.success, false);
  });

  test("fails when a required top-level section is missing", () => {
    const cfg = fresh() as Record<string, unknown>;
    delete cfg.heat;
    const result = validateConfig(cfg);
    assert.strictEqual(result.success, false);
  });

  test("maps Zod errors to ValidationIssue shape", () => {
    const result = validateConfig({ general: "wrong" });
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.ok(result.issues.length > 0);
      assert.ok(typeof result.issues[0]!.path === "string");
      assert.ok(typeof result.issues[0]!.message === "string");
    }
  });
});

// ── General defaults ─────────────────────────────────────────────────────────

describe("validateConfig — general defaults", () => {
  test("fails when a building type has no apartment default", () => {
    const cfg = fresh();
    cfg.general.defaultNumberOfApartments = [{ key: "singleFamily", value: 1 }];
    assertFailed(validateConfig(cfg), "general.defaultNumberOfApartments");
  });

  test("fails when a default apartment count is not a positive integer", () => {
    const cfg = fresh();
    cfg.general.defaultNumberOfApartments[0]!.value = 1.5;
    assertFailed(validateConfig(cfg), "general.defaultNumberOfApartments.0.value");
  });

  test("fails when defaultPeoplePerApartment is not positive", () => {
    const cfg = fresh();
    cfg.general.defaultPeoplePerApartment = 0;
    assertFailed(validateConfig(cfg), "general.defaultPeoplePerApartment");
  });
});

describe("validateConfig — household electricity", () => {
  test("fails when a building type has no household-electricity interpolation", () => {
    const cfg = fresh();
    cfg.heat.householdElectricityPerApartment = [
      cfg.heat.householdElectricityPerApartment[0]!,
    ];
    assertFailed(validateConfig(cfg), "heat.householdElectricityPerApartment");
  });
});

// ── Multiple issues accumulate ────────────────────────────────────────────────

describe("validateConfig — multiple simultaneous issues", () => {
  test("collects all issues before returning", () => {
    const cfg = fresh();
    cfg.heat.defaultPrimaryEnergyCarrier = "x";
    cfg.heat.defaultElectricityType = "y";
    const result = validateConfig(cfg);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.ok(result.issues.some((i) => i.path === "heat.defaultPrimaryEnergyCarrier"));
      assert.ok(result.issues.some((i) => i.path === "heat.defaultElectricityType"));
      assert.ok(result.issues.length >= 2);
    }
  });
});

// ── Heat: catalogue self-consistency ─────────────────────────────────────────

describe("validateConfig — heat catalogue", () => {
  test("fails when a carrier has no primaryEnergyCarrierData entry", () => {
    const cfg = fresh();
    cfg.heat.primaryEnergyCarrierData = [];
    assertFailed(validateConfig(cfg), "heat.primaryEnergyCarrierData");
  });

  test("fails when defaultPrimaryEnergyCarrier is not in primaryEnergyCarriers", () => {
    const cfg = fresh();
    cfg.heat.defaultPrimaryEnergyCarrier = "oil";
    assertFailed(validateConfig(cfg), "heat.defaultPrimaryEnergyCarrier");
  });

  test("fails when a heatingSystemType has no heatingPerformanceFactor entry", () => {
    const cfg = fresh();
    cfg.heat.heatingPerformanceFactor = [];
    assertFailed(validateConfig(cfg), "heat.heatingPerformanceFactor");
  });

  test("fails when a heatingSystemType has no temperatureControlPerformanceFactor entry", () => {
    const cfg = fresh();
    cfg.heat.temperatureControlPerformanceFactor = [];
    assertFailed(validateConfig(cfg), "heat.temperatureControlPerformanceFactor");
  });

  test("fails when a heatingSystemType has no electricalRatio entry", () => {
    const cfg = fresh();
    cfg.heat.electricalRatio = [];
    assertFailed(validateConfig(cfg), "heat.electricalRatio");
  });

  test("fails when a heatingSystemType has no hasInternalGains entry", () => {
    const cfg = fresh();
    cfg.heat.hasInternalGains = [];
    assertFailed(validateConfig(cfg), "heat.hasInternalGains");
  });

  test("fails when a carrier has no defaultHeatingSystemType entry", () => {
    const cfg = fresh();
    cfg.heat.defaultHeatingSystemType = [];
    assertFailed(validateConfig(cfg), "heat.defaultHeatingSystemType");
  });

  test("fails when defaultHeatingSurfaceType is not in heatingSurfaceTypes", () => {
    const cfg = fresh();
    cfg.heat.defaultHeatingSurfaceType = "floorHeating";
    assertFailed(validateConfig(cfg), "heat.defaultHeatingSurfaceType");
  });

  test("fails when an electricityType has no electricityTypeData entry", () => {
    const cfg = fresh();
    cfg.heat.electricityTypeData = [];
    assertFailed(validateConfig(cfg), "heat.electricityTypeData");
  });

  test("fails when defaultElectricityType is not in electricityTypes", () => {
    const cfg = fresh();
    cfg.heat.defaultElectricityType = "solar";
    assertFailed(validateConfig(cfg), "heat.defaultElectricityType");
  });

  test("fails when allowedHeatingSystemTypesByCarrier contains an unknown carrier key", () => {
    const cfg = fresh();
    cfg.heat.allowedHeatingSystemTypesByCarrier = [{ key: "oil", allowedValues: ["boiler"] }];
    assertFailed(validateConfig(cfg), "heat.allowedHeatingSystemTypesByCarrier");
  });

  test("fails when allowedHeatingSystemTypesByCarrier contains an unknown system type value", () => {
    const cfg = fresh();
    cfg.heat.allowedHeatingSystemTypesByCarrier = [{ key: "gas", allowedValues: ["heatPump"] }];
    assertFailed(validateConfig(cfg), "heat.allowedHeatingSystemTypesByCarrier");
  });
});

// ── Heat: year bands ──────────────────────────────────────────────────────────

describe("validateConfig — heat year bands", () => {
  test("fails when heatingPerformanceFactor yearBands cannot resolve a generalYearBand key", () => {
    const cfg = fresh();
    // Only covers { to: 2000 }, leaving { from: 2000 } unresolvable
    cfg.heat.heatingPerformanceFactor = [{
      key: "boiler",
      // @ts-expect-error single-entry band is intentionally incomplete
      value: [{ to: 2000, value: 0.85 }],
    }];
    assertFailed(validateConfig(cfg), "heat.heatingPerformanceFactor[boiler]");
  });

  test("fails when temperatureControlPerformanceFactor yearBands cannot resolve a generalYearBand key", () => {
    const cfg = fresh();
    cfg.heat.temperatureControlPerformanceFactor = [{
      key: "boiler",
      // @ts-expect-error single-entry band is intentionally incomplete
      value: [{ to: 2000, value: [{ key: "radiator", value: 1.0 }] }],
    }];
    assertFailed(validateConfig(cfg), "heat.temperatureControlPerformanceFactor[boiler]");
  });
});

// ── Renovation ────────────────────────────────────────────────────────────────

describe("validateConfig — renovation", () => {
  test("fails when a primaryEnergyCarrierTarget is not in carriers", () => {
    const cfg = fresh();
    cfg.renovation.primaryEnergyCarrierTargets = ["oil"];
    assertFailed(validateConfig(cfg), "renovation.primaryEnergyCarrierTargets");
  });

  test("fails when heatingRenovation.targetCarrier is not a valid carrier", () => {
    const cfg = fresh();
    cfg.renovation.heatingRenovations = [{ targetCarrier: "oil", targetSystem: "boiler", priority: 1 }];
    assertFailed(validateConfig(cfg), "renovation.heatingRenovations");
  });

  test("fails when heatingRenovation.targetSystem is not a valid heatingSystemType", () => {
    const cfg = fresh();
    cfg.renovation.heatingRenovations = [{ targetCarrier: "gas", targetSystem: "heatPump", priority: 1 }];
    assertFailed(validateConfig(cfg), "renovation.heatingRenovations");
  });

  test("fails when heatingSurfaceRenovation.targetSurfaceType is not a valid surface type", () => {
    const cfg = fresh();
    cfg.renovation.heatingSurfaceRenovations = [{ targetSurfaceType: "underfloor", localization: {}, recommendedForSystems: [] }];
    assertFailed(validateConfig(cfg), "renovation.heatingSurfaceRenovations");
  });

  test("passes when renovation arrays are empty", () => {
    const cfg = fresh();
    cfg.renovation.primaryEnergyCarrierTargets = [];
    cfg.renovation.heatingRenovations = [];
    cfg.renovation.heatingSurfaceRenovations = [];
    assertPassed(validateConfig(cfg));
  });
});

// ── Roof ──────────────────────────────────────────────────────────────────────

describe("validateConfig — roof", () => {
  test("fails when a uValue key is not in constructionTypes", () => {
    const cfg = fresh();
    cfg.roof.uValue = [{ key: "tileRoof", value: [{ to: 2000, value: 1.5 }, { from: 2000, value: 1.2 }] }];
    assertFailed(validateConfig(cfg), "roof.uValue");
  });

  test("fails when a roof-shape construction default is not in constructionTypes", () => {
    const cfg = fresh();
    cfg.roof.defaultConstructionTypeByIsFlatRoof[0]!.value = "tileRoof";
    assertFailed(validateConfig(cfg), "roof.defaultConstructionTypeByIsFlatRoof");
  });

  test("fails when a roof-shape construction default is missing", () => {
    const cfg = fresh();
    cfg.roof.defaultConstructionTypeByIsFlatRoof = [
      { key: true, value: "rafter" },
    ];
    assertFailed(validateConfig(cfg), "roof.defaultConstructionTypeByIsFlatRoof");
  });

  test("fails when uValue yearBands cannot resolve a generalYearBand key", () => {
    const cfg = fresh();
    // @ts-expect-error single-entry band is intentionally incomplete
    cfg.roof.uValue = [{ key: "rafter", value: [{ to: 2000, value: 1.5 }] }];
    assertFailed(validateConfig(cfg), "roof.uValue[rafter]");
  });
});

// ── TopFloor ──────────────────────────────────────────────────────────────────

describe("validateConfig — topFloor", () => {
  test("fails when a roof-shape attic default is missing", () => {
    const cfg = fresh();
    cfg.topFloor.defaultHasAtticByIsFlatRoof = [{ key: true, value: false }];
    assertFailed(validateConfig(cfg), "topFloor.defaultHasAtticByIsFlatRoof");
  });

  test("fails when a defaultTopFloorType band value is not in topFloorTypes", () => {
    const cfg = fresh();
    cfg.topFloor.defaultTopFloorType = [
      { to: 2000, value: "pitchedRoof" },
      { from: 2000, value: "flatRoof" },
    ];
    assertFailed(validateConfig(cfg), "topFloor.defaultTopFloorType");
  });

  test("fails when a uValue key is not in topFloorTypes", () => {
    const cfg = fresh();
    cfg.topFloor.uValue = [{ key: "pitchedRoof", value: [{ to: 2000, value: 1.5 }, { from: 2000, value: 1.2 }] }];
    assertFailed(validateConfig(cfg), "topFloor.uValue");
  });

  test("fails when defaultTopFloorType yearBands cannot resolve a generalYearBand key", () => {
    const cfg = fresh();
    // Only covers { to: 2000 }
    // @ts-expect-error single-entry band is intentionally incomplete
    cfg.topFloor.defaultTopFloorType = [{ to: 2000, value: "flatRoof" }];
    assertFailed(validateConfig(cfg), "topFloor.defaultTopFloorType");
  });

  test("fails when uValue yearBands cannot resolve a generalYearBand key", () => {
    const cfg = fresh();
    // @ts-expect-error single-entry band is intentionally incomplete
    cfg.topFloor.uValue = [{ key: "flatRoof", value: [{ to: 2000, value: 1.5 }] }];
    assertFailed(validateConfig(cfg), "topFloor.uValue[flatRoof]");
  });
});

// ── OuterWall ─────────────────────────────────────────────────────────────────

describe("validateConfig — outerWall", () => {
  test("fails when a defaultConstructionType band value is not in constructionTypes", () => {
    const cfg = fresh();
    cfg.outerWall.defaultConstructionType = [
      { to: 2000, value: "timber" },
      { from: 2000, value: "brick" },
    ];
    assertFailed(validateConfig(cfg), "outerWall.defaultConstructionType");
  });

  test("fails when a uValue key is not in constructionTypes", () => {
    const cfg = fresh();
    cfg.outerWall.uValue = [{ key: "timber", value: [{ to: 2000, value: 1.5 }, { from: 2000, value: 1.2 }] }];
    assertFailed(validateConfig(cfg), "outerWall.uValue");
  });

  test("fails when defaultConstructionType yearBands cannot resolve a generalYearBand key", () => {
    const cfg = fresh();
    // @ts-expect-error single-entry band is intentionally incomplete
    cfg.outerWall.defaultConstructionType = [{ to: 2000, value: "brick" }];
    assertFailed(validateConfig(cfg), "outerWall.defaultConstructionType");
  });

  test("fails when uValue yearBands cannot resolve a generalYearBand key", () => {
    const cfg = fresh();
    // @ts-expect-error single-entry band is intentionally incomplete
    cfg.outerWall.uValue = [{ key: "brick", value: [{ to: 2000, value: 1.5 }] }];
    assertFailed(validateConfig(cfg), "outerWall.uValue[brick]");
  });
});

// ── BottomFloor ───────────────────────────────────────────────────────────────

describe("validateConfig — bottomFloor", () => {
  test("fails when allowedConstructionTypesByHeatedCellar contains an unknown construction type", () => {
    const cfg = fresh();
    cfg.bottomFloor.allowedConstructionTypesByHeatedCellar = [
      { key: true, allowedValues: ["gravel"] },
    ];
    assertFailed(validateConfig(cfg), "bottomFloor.allowedConstructionTypesByHeatedCellar");
  });

  test("fails when a defaultConstructionType band value is not in constructionTypes", () => {
    const cfg = fresh();
    cfg.bottomFloor.defaultConstructionType = [
      { key: true,  value: [{ to: 2000, value: "gravel" }, { from: 2000, value: "concrete" }] },
      { key: false, value: [{ to: 2000, value: "concrete" }, { from: 2000, value: "concrete" }] },
    ];
    assertFailed(validateConfig(cfg), "bottomFloor.defaultConstructionType");
  });

  test("fails when a uValue key is not in constructionTypes", () => {
    const cfg = fresh();
    cfg.bottomFloor.uValue = [{ key: "gravel", value: [{ to: 2000, value: 1.5 }, { from: 2000, value: 1.2 }] }];
    assertFailed(validateConfig(cfg), "bottomFloor.uValue");
  });

  test("fails when defaultConstructionType yearBands cannot resolve a generalYearBand key", () => {
    const cfg = fresh();
    cfg.bottomFloor.defaultConstructionType = [
      // @ts-expect-error single-entry band is intentionally incomplete
      { key: true,  value: [{ to: 2000, value: "concrete" }] },
      { key: false, value: [{ to: 2000, value: "concrete" }, { from: 2000, value: "concrete" }] },
    ];
    assertFailed(validateConfig(cfg), "bottomFloor.defaultConstructionType[key=true]");
  });

  test("fails when uValue yearBands cannot resolve a generalYearBand key", () => {
    const cfg = fresh();
    // @ts-expect-error single-entry band is intentionally incomplete
    cfg.bottomFloor.uValue = [{ key: "concrete", value: [{ to: 2000, value: 1.5 }] }];
    assertFailed(validateConfig(cfg), "bottomFloor.uValue[concrete]");
  });
});

// ── Windows ───────────────────────────────────────────────────────────────────

describe("validateConfig — windows", () => {
  test("fails when a defaultWindowType band value is not in windowTypes", () => {
    const cfg = fresh();
    cfg.windows.defaultWindowType = [
      { to: 2000, value: "single" },
      { from: 2000, value: "double" },
    ];
    assertFailed(validateConfig(cfg), "windows.defaultWindowType");
  });

  test("fails when a uValue key is not in windowTypes", () => {
    const cfg = fresh();
    cfg.windows.uValue = [{ key: "single", value: [{ to: 2000, value: 3.0 }, { from: 2000, value: 2.5 }] }];
    assertFailed(validateConfig(cfg), "windows.uValue");
  });

  test("fails when defaultWindowType yearBands cannot resolve a generalYearBand key", () => {
    const cfg = fresh();
    // @ts-expect-error single-entry band is intentionally incomplete
    cfg.windows.defaultWindowType = [{ to: 2000, value: "double" }];
    assertFailed(validateConfig(cfg), "windows.defaultWindowType");
  });

  test("fails when uValue yearBands cannot resolve a generalYearBand key", () => {
    const cfg = fresh();
    // @ts-expect-error single-entry band is intentionally incomplete
    cfg.windows.uValue = [{ key: "double", value: [{ to: 2000, value: 2.0 }] }];
    assertFailed(validateConfig(cfg), "windows.uValue[double]");
  });
});
