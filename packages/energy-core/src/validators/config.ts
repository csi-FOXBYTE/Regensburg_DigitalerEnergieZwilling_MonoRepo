import { DETConfigSchema } from "../types/config/index.js";
import type { DETConfig } from "../types/config/index.js";
import { resolveRangeBand } from "../types/range-bands.js";
import type { RangeBands, RangeKey, Ranges } from "../types/range-bands.js";
import { BuildingType } from "../types/building-type.js";
import { mapZodError, type ValidationIssue, type ValidationResult } from "./types.js";

function toRangeKeys(ranges: Ranges): RangeKey[] {
  return Array.from(ranges).map((band) => {
    const b = band as { from?: number; to?: number };
    const key: RangeKey = {};
    if (b.from !== undefined) key.from = b.from;
    if (b.to !== undefined) key.to = b.to;
    return key;
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkYearBands(bands: RangeBands<any>, rangeKeys: RangeKey[], path: string, issues: ValidationIssue[]): void {
  for (const key of rangeKeys) {
    if (resolveRangeBand(bands, key) == null) {
      issues.push({ path, message: `Cannot resolve generalYearBand ${JSON.stringify(key)}` });
    }
  }
}

export function validateConfig(data: unknown): ValidationResult<DETConfig> {
  const result = DETConfigSchema.safeParse(data);
  if (!result.success) {
    return { success: false, issues: mapZodError(result.error) };
  }

  const config = result.data;
  const { general, heat, renovation, roof, topFloor, outerWall, bottomFloor, windows } = config;
  const issues: ValidationIssue[] = [];

  const generalRangeKeys = toRangeKeys(general.generalYearBands);

  for (const buildingType of Object.values(BuildingType)) {
    if (!general.defaultNumberOfApartments.some((entry) => entry.key === buildingType)) {
      issues.push({ path: "general.defaultNumberOfApartments", message: `No defaultNumberOfApartments entry for building type "${buildingType}"` });
    }
    if (!heat.householdElectricityPerApartment.some((entry) => entry.key === buildingType)) {
      issues.push({ path: "heat.householdElectricityPerApartment", message: `No householdElectricityPerApartment entry for building type "${buildingType}"` });
    }
  }

  const carrierValues = heat.primaryEnergyCarriers.map((c) => c.value);
  const systemTypeValues = heat.heatingSystemTypes.map((s) => s.value);
  const surfaceTypeValues = heat.heatingSurfaceTypes.map((s) => s.value);
  const electricityTypeValues = heat.electricityTypes.map((e) => e.value);

  const performanceTables = {
    heatingPerformanceFactor: heat.heatingPerformanceFactor,
    temperatureControlPerformanceFactor: heat.temperatureControlPerformanceFactor,
    electricalRatio: heat.electricalRatio,
    hasInternalGains: heat.hasInternalGains,
  } as const;
  const hasSystemData = (field: keyof typeof performanceTables, v: string) =>
    performanceTables[field].some((e) => e.key === v);

  // ── Heat: catalogue self-consistency ─────────────────────────────────────────

  for (const carrier of heat.primaryEnergyCarriers) {
    if (!heat.primaryEnergyCarrierData.some((e) => e.key === carrier.value)) {
      issues.push({ path: "heat.primaryEnergyCarrierData", message: `No primaryEnergyCarrierData entry for carrier "${carrier.value}"` });
    }
  }

  if (!carrierValues.includes(heat.defaultPrimaryEnergyCarrier)) {
    issues.push({ path: "heat.defaultPrimaryEnergyCarrier", message: `defaultPrimaryEnergyCarrier "${heat.defaultPrimaryEnergyCarrier}" is not in primaryEnergyCarriers` });
  }

  for (const system of heat.heatingSystemTypes) {
    for (const field of ["heatingPerformanceFactor", "temperatureControlPerformanceFactor", "electricalRatio", "hasInternalGains"] as const) {
      if (!hasSystemData(field, system.value)) {
        issues.push({ path: `heat.${field}`, message: `No ${field} entry for heatingSystemType "${system.value}"` });
      }
    }
  }

  for (const carrier of heat.primaryEnergyCarriers) {
    if (!heat.defaultHeatingSystemType.some((e) => e.key === carrier.value)) {
      issues.push({ path: "heat.defaultHeatingSystemType", message: `No defaultHeatingSystemType entry for carrier "${carrier.value}"` });
    }
  }

  if (!surfaceTypeValues.includes(heat.defaultHeatingSurfaceType)) {
    issues.push({ path: "heat.defaultHeatingSurfaceType", message: `defaultHeatingSurfaceType "${heat.defaultHeatingSurfaceType}" is not in heatingSurfaceTypes` });
  }

  for (const et of heat.electricityTypes) {
    if (!heat.electricityTypeData.some((e) => e.key === et.value)) {
      issues.push({ path: "heat.electricityTypeData", message: `No electricityTypeData entry for electricityType "${et.value}"` });
    }
  }

  if (!electricityTypeValues.includes(heat.defaultElectricityType)) {
    issues.push({ path: "heat.defaultElectricityType", message: `defaultElectricityType "${heat.defaultElectricityType}" is not in electricityTypes` });
  }

  for (const entry of heat.allowedHeatingSystemTypesByCarrier) {
    if (!carrierValues.includes(entry.key)) {
      issues.push({ path: "heat.allowedHeatingSystemTypesByCarrier", message: `allowedHeatingSystemTypesByCarrier key "${entry.key}" is not a valid carrier value` });
    }
    for (const allowed of entry.allowedValues) {
      if (!systemTypeValues.includes(allowed)) {
        issues.push({ path: "heat.allowedHeatingSystemTypesByCarrier", message: `allowedHeatingSystemTypesByCarrier value "${allowed}" for key "${entry.key}" is not a valid heatingSystemType` });
      }
    }
  }

  // ── Heat: year bands ──────────────────────────────────────────────────────────

  for (const entry of heat.heatingPerformanceFactor) {
    checkYearBands(entry.value, generalRangeKeys, `heat.heatingPerformanceFactor[${entry.key}]`, issues);
  }
  for (const entry of heat.temperatureControlPerformanceFactor) {
    checkYearBands(entry.value, generalRangeKeys, `heat.temperatureControlPerformanceFactor[${entry.key}]`, issues);
  }

  // ── Renovation: catalogue self-consistency ────────────────────────────────────

  for (const target of renovation.primaryEnergyCarrierTargets) {
    if (!carrierValues.includes(target)) {
      issues.push({ path: "renovation.primaryEnergyCarrierTargets", message: `primaryEnergyCarrierTarget "${target}" is not in primaryEnergyCarriers` });
    }
  }

  renovation.heatingRenovations.forEach((r, i) => {
    if (!carrierValues.includes(r.targetCarrier)) {
      issues.push({ path: "renovation.heatingRenovations", message: `heatingRenovations[${i}].targetCarrier "${r.targetCarrier}" is not a valid carrier` });
    }
    if (!systemTypeValues.includes(r.targetSystem)) {
      issues.push({ path: "renovation.heatingRenovations", message: `heatingRenovations[${i}].targetSystem "${r.targetSystem}" is not a valid heatingSystemType` });
    }
  });

  renovation.heatingSurfaceRenovations.forEach((r, i) => {
    if (!surfaceTypeValues.includes(r.targetSurfaceType)) {
      issues.push({ path: "renovation.heatingSurfaceRenovations", message: `heatingSurfaceRenovations[${i}].targetSurfaceType "${r.targetSurfaceType}" is not a valid heatingSurfaceType` });
    }
  });

  // ── Roof: catalogue self-consistency ─────────────────────────────────────────

  const roofConstructionTypeValues = roof.constructionTypes.map((c) => c.value);

  for (const isFlatRoof of [true, false]) {
    const entry = roof.defaultConstructionTypeByIsFlatRoof.find(
      (candidate) => candidate.key === isFlatRoof,
    );
    if (entry == null) {
      issues.push({
        path: "roof.defaultConstructionTypeByIsFlatRoof",
        message: `No defaultConstructionType entry for isFlatRoof=${isFlatRoof}`,
      });
    } else if (!roofConstructionTypeValues.includes(entry.value)) {
      issues.push({
        path: "roof.defaultConstructionTypeByIsFlatRoof",
        message: `defaultConstructionType "${entry.value}" for isFlatRoof=${isFlatRoof} is not in roof.constructionTypes`,
      });
    }
  }
  for (const entry of roof.uValue) {
    if (!roofConstructionTypeValues.includes(entry.key)) {
      issues.push({ path: "roof.uValue", message: `roof.uValue key "${entry.key}" is not in roof.constructionTypes` });
    }
  }

  // ── Roof: year bands ──────────────────────────────────────────────────────────

  for (const entry of roof.uValue) {
    checkYearBands(entry.value, generalRangeKeys, `roof.uValue[${entry.key}]`, issues);
  }

  // ── TopFloor: catalogue self-consistency ──────────────────────────────────────

  const topFloorTypeValues = topFloor.topFloorTypes.map((t) => t.value);

  for (const isFlatRoof of [true, false]) {
    if (
      !topFloor.defaultHasAtticByIsFlatRoof.some(
        (entry) => entry.key === isFlatRoof,
      )
    ) {
      issues.push({
        path: "topFloor.defaultHasAtticByIsFlatRoof",
        message: `No defaultHasAttic entry for isFlatRoof=${isFlatRoof}`,
      });
    }
  }

  for (const band of topFloor.defaultTopFloorType) {
    if (!topFloorTypeValues.includes(band.value)) {
      issues.push({ path: "topFloor.defaultTopFloorType", message: `defaultTopFloorType band value "${band.value}" is not in topFloor.topFloorTypes` });
    }
  }
  for (const entry of topFloor.uValue) {
    if (!topFloorTypeValues.includes(entry.key)) {
      issues.push({ path: "topFloor.uValue", message: `topFloor.uValue key "${entry.key}" is not in topFloor.topFloorTypes` });
    }
  }

  // ── TopFloor: year bands ──────────────────────────────────────────────────────

  checkYearBands(topFloor.defaultTopFloorType, generalRangeKeys, "topFloor.defaultTopFloorType", issues);
  for (const entry of topFloor.uValue) {
    checkYearBands(entry.value, generalRangeKeys, `topFloor.uValue[${entry.key}]`, issues);
  }

  // ── OuterWall: catalogue self-consistency ─────────────────────────────────────

  const outerWallConstructionTypeValues = outerWall.constructionTypes.map((c) => c.value);

  for (const band of outerWall.defaultConstructionType) {
    if (!outerWallConstructionTypeValues.includes(band.value)) {
      issues.push({ path: "outerWall.defaultConstructionType", message: `defaultConstructionType band value "${band.value}" is not in outerWall.constructionTypes` });
    }
  }
  for (const entry of outerWall.uValue) {
    if (!outerWallConstructionTypeValues.includes(entry.key)) {
      issues.push({ path: "outerWall.uValue", message: `outerWall.uValue key "${entry.key}" is not in outerWall.constructionTypes` });
    }
  }

  // ── OuterWall: year bands ─────────────────────────────────────────────────────

  checkYearBands(outerWall.defaultConstructionType, generalRangeKeys, "outerWall.defaultConstructionType", issues);
  for (const entry of outerWall.uValue) {
    checkYearBands(entry.value, generalRangeKeys, `outerWall.uValue[${entry.key}]`, issues);
  }

  // ── BottomFloor: catalogue self-consistency ───────────────────────────────────

  const bottomFloorConstructionTypeValues = bottomFloor.constructionTypes.map((c) => c.value);

  for (const entry of bottomFloor.allowedConstructionTypesByHeatedCellar) {
    for (const allowed of entry.allowedValues) {
      if (!bottomFloorConstructionTypeValues.includes(allowed)) {
        issues.push({ path: "bottomFloor.allowedConstructionTypesByHeatedCellar", message: `allowedConstructionTypesByHeatedCellar allowed value "${allowed}" for key ${entry.key} is not in bottomFloor.constructionTypes` });
      }
    }
  }
  for (const entry of bottomFloor.defaultConstructionType) {
    for (const band of entry.value) {
      if (!bottomFloorConstructionTypeValues.includes(band.value)) {
        issues.push({ path: "bottomFloor.defaultConstructionType", message: `defaultConstructionType band value "${band.value}" for key ${entry.key} is not in bottomFloor.constructionTypes` });
      }
    }
  }
  for (const entry of bottomFloor.uValue) {
    if (!bottomFloorConstructionTypeValues.includes(entry.key)) {
      issues.push({ path: "bottomFloor.uValue", message: `bottomFloor.uValue key "${entry.key}" is not in bottomFloor.constructionTypes` });
    }
  }

  // ── BottomFloor: year bands ───────────────────────────────────────────────────

  for (const entry of bottomFloor.defaultConstructionType) {
    checkYearBands(entry.value, generalRangeKeys, `bottomFloor.defaultConstructionType[key=${entry.key}]`, issues);
  }
  for (const entry of bottomFloor.uValue) {
    checkYearBands(entry.value, generalRangeKeys, `bottomFloor.uValue[${entry.key}]`, issues);
  }

  // ── Windows: catalogue self-consistency ──────────────────────────────────────

  const windowTypeValues = windows.windowTypes.map((w) => w.value);

  for (const band of windows.defaultWindowType) {
    if (!windowTypeValues.includes(band.value)) {
      issues.push({ path: "windows.defaultWindowType", message: `defaultWindowType band value "${band.value}" is not in windows.windowTypes` });
    }
  }
  for (const entry of windows.uValue) {
    if (!windowTypeValues.includes(entry.key)) {
      issues.push({ path: "windows.uValue", message: `windows.uValue key "${entry.key}" is not in windows.windowTypes` });
    }
  }

  // ── Windows: year bands ───────────────────────────────────────────────────────

  checkYearBands(windows.defaultWindowType, generalRangeKeys, "windows.defaultWindowType", issues);
  for (const entry of windows.uValue) {
    checkYearBands(entry.value, generalRangeKeys, `windows.uValue[${entry.key}]`, issues);
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }
  return { success: true, data: config };
}
