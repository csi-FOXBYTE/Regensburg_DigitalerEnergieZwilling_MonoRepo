import type { DETConfig } from "../../src/types/config/index.js";
import type { DETInput } from "../../src/types/input/index.js";

/** Minimal valid config fixture. All year bands align with generalYearBands [{ to: 2000 }, { from: 2000 }]. */
export function baseConfig(): DETConfig {
  return {
    general: {
      supportedLocales: ["de"],
      generalYearBands: [{ to: 2000 }, { from: 2000 }],
      energyEfficiencyClasses: [{ value: "A" }],
      energyEfficiencyClassColors: [{ key: "A", value: "#00ff00" }],
      assumedFloorSlabThickness: 0.2,
      assumedInteriorStoryHeight: 2.8,
      defaultNumberOfApartments: [
        { key: "singleFamily", value: 1 },
        { key: "multiFamily", value: 2 },
      ],
      defaultPeoplePerApartment: 3,
      heatedAirVolumeCorrectionFactor: [{ value: 0.8 }],
      usableFloorAreaFactor: 0.85,
      netFloorAreaFromUsableFloorAreaFactor: [
        { key: "singleFamily", value: [{ key: true, value: 0.9 }, { key: false, value: 0.8 }] },
        { key: "multiFamily",  value: [{ key: true, value: 0.9 }, { key: false, value: 0.8 }] },
      ],
      netFloorAreaFromLivingAreaFactor: 1.0,
    },
    heat: {
      primaryEnergyCarriers: [{ value: "gas", localization: {} }],
      heatingSystemTypes: [{ value: "boiler", localization: {} }],
      heatingSurfaceTypes: [{ value: "radiator", localization: {} }],
      allowedHeatingSystemTypesByCarrier: [{ key: "gas", allowedValues: ["boiler"] }],
      electricityTypes: [{ value: "grid", localization: {} }],
      defaultElectricityType: "grid",
      electricityTypeData: [{ key: "grid", value: { co2Factor: 0.5, unitRate: 0.3, baseRate: 100, primaryEnergyFactor: 1.8 } }],
      electricalRatio: [{ key: "boiler", value: 0.01 }],
      hasInternalGains: [{ key: "boiler", value: true }],
      internalGainsFactorByBuildingType: [{ key: "singleFamily", value: 0.5 }, { key: "multiFamily", value: 0.4 }],
      hotWaterEnergyDemandFromAreaFactor: [
        { key: "singleFamily", value: 20 },
        { key: "multiFamily", value: 25 },
      ],
      householdElectricityPerApartment: [
        {
          key: "singleFamily",
          value: {
            points: [
              { at: 1, value: 1800 },
              { at: 2, value: 2700 },
              { at: 3, value: 3500 },
              { at: 4, value: 3800 },
              { at: 5, value: 4500 },
            ],
          },
        },
        {
          key: "multiFamily",
          value: {
            points: [
              { at: 1, value: 1200 },
              { at: 2, value: 1900 },
              { at: 3, value: 2400 },
              { at: 4, value: 2600 },
              { at: 5, value: 3100 },
            ],
          },
        },
      ],
      ventilationHeatLossCorrectionFactor: 0.8,
      heatingDegreeDays: 3000,
      defaultPrimaryEnergyCarrier: "gas",
      defaultHeatingSystemType: [{ key: "gas", value: "boiler" }],
      defaultHeatingSurfaceType: "radiator",
      globalDefaultSource: "unbekannter Quelle",
      globalDefaultDate: new Date().toISOString(),
      // outer yearBands: [{ to: 2000 }, { from: 2000 }] — matches generalYearBands
      heatingPerformanceFactor: [{
        key: "boiler",
        value: [
          { to: 2000, value: 0.85 },
          { from: 2000, value: 0.9 },
        ],
      }],
      temperatureControlPerformanceFactor: [{
        key: "boiler",
        value: [
          { to: 2000, value: [{ key: "radiator", value: 1.0 }] },
          { from: 2000, value: [{ key: "radiator", value: 1.0 }] },
        ],
      }],
      primaryEnergyCarrierData: [{
        key: "gas",
        value: { energyPerUnit: 10, unit: "kWh", unitRate: 0.08, baseRate: 100, co2Factor: 0.2, primaryEnergyFactor: 1.1 },
      }],
      innerSurfaceThermalResistance: [
        { key: "upward", value: 0.1 },
        { key: "horizontal", value: 0.13 },
        { key: "downward", value: 0.17 },
      ],
      outerSurfaceThermalResistance: [
        { key: "upward", value: 0.04 },
        { key: "horizontal", value: 0.04 },
        { key: "downward", value: 0.04 },
      ],
    },
    roof: {
      heatLossFactor: 1.0,
      defaultInsulationType: "betweenRafter",
      constructionTypes: [{ value: "rafter", localization: {} }],
      defaultIsFlatRoof: false,
      defaultConstructionTypeByIsFlatRoof: [
        { key: true, value: "rafter" },
        { key: false, value: "rafter" },
      ],
      assumedInsulationThickness: 0.1,
      thermalConductivity: 0.04,
      insulationReductionFactor: 1.0,
      uValue: [{ key: "rafter", value: [{ to: 2000, value: 1.5 }, { from: 2000, value: 1.2 }] }],
    },
    topFloor: {
      topFloorTypes: [{ value: "flatRoof", localization: {} }],
      defaultTopFloorType: [{ to: 2000, value: "flatRoof" }, { from: 2000, value: "flatRoof" }],
      defaultHasAtticByIsFlatRoof: [
        { key: true, value: false },
        { key: false, value: true },
      ],
      defaultIsAtticHeated: false,
      thermalConductivity: 0.04,
      assumedInsulationThickness: 0.1,
      uValue: [{ key: "flatRoof", value: [{ to: 2000, value: 1.5 }, { from: 2000, value: 1.2 }] }],
      heatLossFactor: 1.0,
    },
    outerWall: {
      constructionTypes: [{ value: "brick", localization: {} }],
      defaultConstructionType: [{ to: 2000, value: "brick" }, { from: 2000, value: "brick" }],
      uValue: [{ key: "brick", value: [{ to: 2000, value: 1.5 }, { from: 2000, value: 1.2 }] }],
      thermalConductivity: 0.04,
      assumedInsulationThickness: 0.1,
      heatLossFactor: 1.0,
    },
    bottomFloor: {
      constructionTypes: [{ value: "concrete", localization: {} }],
      allowedConstructionTypesByHeatedCellar: [
        { key: true,  allowedValues: ["concrete"] },
        { key: false, allowedValues: ["concrete"] },
      ],
      defaultConstructionType: [
        { key: true,  value: [{ to: 2000, value: "concrete" }, { from: 2000, value: "concrete" }] },
        { key: false, value: [{ to: 2000, value: "concrete" }, { from: 2000, value: "concrete" }] },
      ],
      uValue: [{ key: "concrete", value: [{ to: 2000, value: 1.5 }, { from: 2000, value: 1.2 }] }],
      thermalConductivity: 0.04,
      assumedInsulationThickness: 0.1,
      heatLossFactor: 1.0,
    },
    windows: {
      windowTypes: [{ value: "double", localization: {} }],
      defaultWindowType: [{ to: 2000, value: "double" }, { from: 2000, value: "double" }],
      uValue: [{ key: "double", value: [{ to: 2000, value: 2.0 }, { from: 2000, value: 1.5 }] }],
      roofWindowsHeatLossFactor: 1.0,
      exteriorWallWindowsHeatLossFactor: 1.0,
      roofAreaFactor: 0.1,
      exteriorWallAreaFactor: 0.2,
    },
    renovation: {
      primaryEnergyCarrierTargets: ["gas"],
      heatingRenovations: [{ targetCarrier: "gas", targetSystem: "boiler", priority: 1 }],
      heatingRenovationLabelTemplates: {
        carrierAndSystem: { de: "{{system}} mit {{carrier}}" },
        carrierOnly: { de: "{{carrier}}" },
        systemOnly: { de: "{{system}}" },
      },
      insulationRenovations: {
        roof:         { uValue: 0.2,  recommendYearRange: { from: 1980 } },
        topFloor:     { uValue: 0.2,  recommendYearRange: { from: 1980 } },
        bottomFloor:  { uValue: 0.3,  recommendYearRange: { from: 1980 } },
        outerWalls:   { uValue: 0.24, recommendYearRange: { from: 1980 } },
        outerWindows: { uValue: 1.3,  recommendYearRange: { from: 1980 } },
        roofWindows:  { uValue: 1.3,  recommendYearRange: { from: 1980 } },
      },
      heatingSurfaceRenovations: [{ targetSurfaceType: "radiator", localization: {}, recommendedForSystems: [] }],
    },
  };
}

/** Minimal valid input fixture — no optional selection fields set. */
export function baseInput(): DETInput {
  return {
    general: {
      buildingYear: 2005,
      buildingHeight: 6,
      lowestEaveHeight: 6,
      buildingBaseArea: 100,
      type: "singleFamily",
    },
    heat: {},
    electricity: {},
    roof: { area: 100 },
    roofWindows: {},
    exteriorWallWindows: {},
    topFloor: { area: 100 },
    outerWall: { area: 200, areaWithoutAttic: 180, atticArea: 20 },
    bottomFloor: { area: 100 },
    preRenovationValues: null,
  };
}

/** Valid preRenovationValues that reference known catalogue entries. */
export function basePreRenovation() {
  return {
    totalEnergyDemand: 10000,
    primaryEnergyCarrier: "gas",
    heatingSystemType: "boiler",
    electricityOffset: 0,
    hadInternalGains: true,
  };
}
