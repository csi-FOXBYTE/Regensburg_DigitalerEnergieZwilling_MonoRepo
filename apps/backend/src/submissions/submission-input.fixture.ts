// Test fixtures for the public submission input, kept outside *.test.ts so
// several test files can share them.

/** The calculation core's minimal valid input (test/validators/fixtures.ts). */
export const coreBaseInput = () => ({
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
});

/**
 * What the public client's $calculationInput sends for the LOD2 building of
 * apps/frontend/tests/calculation-input.test.ts after a user filled every
 * form field: year bands instead of years, placeholders of 0 and nulls.
 */
export const publicClientInput = () => ({
  general: {
    buildingBaseArea: 100,
    buildingHeight: 12,
    lowestEaveHeight: 6,
    type: "singleFamily",
    buildingYear: { from: 1969, to: 1978 },
    numberOfStories: 2,
    livingArea: 180.5,
  },
  heat: {
    heatingSurfaceType: "free_heat_emitter",
    hasGeothermalAvailability: true,
    heatingSystemConstructionYear: { from: 2007 },
    primaryEnergyCarrier: "natural_gas",
    heatingSystemType: "condensing_boiler_70_55",
    hasGasSupply: true,
    hasStorage: false,
    userThermalTotalCost: 2400.5,
    userThermalUnitRate: 0.12,
    userThermalBaseRate: 150,
  },
  electricity: {
    electricityType: "grid",
    electricityUnitRate: 0.35,
    userElectricityBaseRate: 120,
    userElectricityConsumption: 3500,
  },
  bottomFloor: {
    area: 100,
    year: { to: 1918 },
    hasInsulation: true,
    insulationThickness: 0.08,
    hasBasement: true,
    isBasementHeated: false,
    uValue: null,
  },
  exteriorWallWindows: { area: 25.5, year: { from: 1995, to: 2001 }, uValue: 1.3 },
  roofWindows: { area: 0, uValue: 1.4 },
  outerWall: {
    areaWithoutAttic: 20,
    atticArea: 0,
    adjacentWallArea: 270,
    hasInsulation: false,
    insulationThickness: 0,
  },
  roof: { area: 120, isFlatRoof: false, insulationType: "betweenRafter", hasInsulation: true },
  topFloor: { area: 100, hasAttic: false, isAtticHeated: false, insulationThickness: 0.12 },
});

export const validSubmission = (input: unknown = coreBaseInput()) => ({
  input,
  configName: "DEFAULT",
  buildingId: "DEBY_LOD2_4959465",
  address: "Domplatz 1, 93047 Regensburg",
  longitude: 12.0989,
  latitude: 49.0195,
});
