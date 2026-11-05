import { Type, type TSchema } from "@sinclair/typebox";

// Request-level bounds for the calculation input of a public submission. The
// shape mirrors DETInputSchema of the calculation core (validateInput still
// runs the core's own type and catalogue checks afterwards); the core has no
// ranges, so these keep a submission finite and plausible before it is
// calculated and stored. submission-input.test.ts fails when the core gains
// or loses a field.
//
// Unknown keys are rejected with 400 (see buildValidator in
// lib/request-guards.ts), so nothing beyond these fields reaches rawInput.

// The public client caps every number field at this absolute value
// (MAX_ABSOLUTE_INPUT_VALUE in apps/frontend/src/components/ui/number-input.tsx).
export const MAX_INPUT_QUANTITY = 1_000_000;
// Heights come from the LOD2 model, not from a form field.
export const MAX_BUILDING_HEIGHT_M = 1_000;
// Pre-renovation baselines are calculated values (kWh/a), not typed in.
export const MAX_ENERGY_KWH = 1_000_000_000;
export const MIN_YEAR = 1000;
export const maxYear = (now = new Date()) => now.getUTCFullYear() + 5;
const MAX_CATALOGUE_VALUE_LENGTH = 128;

const strictObject = <T extends Parameters<typeof Type.Object>[0]>(properties: T) =>
  Type.Object(properties, { additionalProperties: false });
const nullish = <T extends TSchema>(schema: T) =>
  Type.Optional(Type.Union([schema, Type.Null()]));

const quantity = (maximum = MAX_INPUT_QUANTITY) => Type.Number({ minimum: 0, maximum });
const catalogueValue = () => Type.String({ maxLength: MAX_CATALOGUE_VALUE_LENGTH });

// Evaluated once at startup; the five-year margin covers a long-running process.
const yearValue = (integer: boolean) =>
  (integer ? Type.Integer : Type.Number)({ minimum: MIN_YEAR, maximum: maxYear() });
// A year or a band of the config's year ranges ({ to: 1918 }, { from: 2007 }).
const YearInputDto = Type.Union([
  yearValue(true),
  strictObject({
    from: Type.Optional(yearValue(false)),
    to: Type.Optional(yearValue(false)),
  }),
]);

const GeneralInputDto = strictObject({
  buildingYear: YearInputDto,
  numberOfStories: nullish(Type.Integer({ minimum: 1, maximum: MAX_INPUT_QUANTITY })),
  buildingHeight: quantity(MAX_BUILDING_HEIGHT_M),
  lowestEaveHeight: quantity(MAX_BUILDING_HEIGHT_M),
  buildingBaseArea: Type.Number({ exclusiveMinimum: 0, maximum: MAX_INPUT_QUANTITY }),
  livingArea: nullish(quantity()),
  numberOfApartments: nullish(Type.Integer({ minimum: 1, maximum: MAX_INPUT_QUANTITY })),
  numberOfPeople: nullish(Type.Integer({ minimum: 0, maximum: MAX_INPUT_QUANTITY })),
  type: Type.Union([Type.Literal("singleFamily"), Type.Literal("multiFamily")]),
});

const HeatInputDto = strictObject({
  heatingSystemConstructionYear: nullish(YearInputDto),
  primaryEnergyCarrier: nullish(catalogueValue()),
  heatingSystemType: nullish(catalogueValue()),
  heatingSurfaceType: nullish(catalogueValue()),
  hasGasSupply: nullish(Type.Boolean()),
  hasStorage: nullish(Type.Boolean()),
  hasGeothermalAvailability: nullish(Type.Boolean()),
  userThermalUnitRate: nullish(quantity()),
  userThermalTotalCost: nullish(quantity()),
  userThermalBaseRate: nullish(quantity()),
});

const ElectricityInputDto = strictObject({
  electricityType: nullish(catalogueValue()),
  electricityUnitRate: nullish(quantity()),
  userElectricityBaseRate: nullish(quantity()),
  userElectricityConsumption: nullish(quantity()),
});

const RoofInputDto = strictObject({
  area: quantity(),
  isFlatRoof: nullish(Type.Boolean()),
  year: nullish(YearInputDto),
  hasInsulation: nullish(Type.Boolean()),
  insulationType: nullish(Type.Union([Type.Literal("betweenRafter"), Type.Literal("aboveRafter")])),
  constructionType: nullish(catalogueValue()),
  insulationThickness: nullish(quantity()),
  uValue: nullish(quantity()),
});

const WindowsInputDto = strictObject({
  area: Type.Optional(quantity()),
  year: nullish(YearInputDto),
  windowType: nullish(catalogueValue()),
  uValue: nullish(quantity()),
});

const TopFloorInputDto = strictObject({
  area: quantity(),
  year: nullish(YearInputDto),
  isAtticHeated: nullish(Type.Boolean()),
  topFloorType: nullish(catalogueValue()),
  hasInsulation: nullish(Type.Boolean()),
  insulationThickness: nullish(quantity()),
  hasAttic: nullish(Type.Boolean()),
  uValue: nullish(quantity()),
});

const OuterWallInputDto = strictObject({
  area: nullish(quantity()),
  areaWithoutAttic: quantity(),
  atticArea: quantity(),
  adjacentWallArea: nullish(quantity()),
  year: nullish(YearInputDto),
  hasInsulation: nullish(Type.Boolean()),
  constructionType: nullish(catalogueValue()),
  insulationThickness: nullish(quantity()),
  uValue: nullish(quantity()),
});

const BottomFloorInputDto = strictObject({
  area: quantity(),
  year: nullish(YearInputDto),
  isHeated: nullish(Type.Boolean()),
  hasInsulation: nullish(Type.Boolean()),
  constructionType: nullish(catalogueValue()),
  insulationThickness: nullish(quantity()),
  hasBasement: nullish(Type.Boolean()),
  isBasementHeated: nullish(Type.Boolean()),
  uValue: nullish(quantity()),
});

const PreRenovationValuesDto = strictObject({
  totalEnergyDemand: quantity(MAX_ENERGY_KWH),
  primaryEnergyCarrier: catalogueValue(),
  heatingSystemType: catalogueValue(),
  electricityOffset: Type.Number({ minimum: -MAX_ENERGY_KWH, maximum: MAX_ENERGY_KWH }),
  hadInternalGains: Type.Boolean(),
});

export const SubmissionCalculationInputDto = strictObject({
  general: GeneralInputDto,
  heat: HeatInputDto,
  electricity: ElectricityInputDto,
  roof: RoofInputDto,
  roofWindows: WindowsInputDto,
  exteriorWallWindows: WindowsInputDto,
  topFloor: TopFloorInputDto,
  outerWall: OuterWallInputDto,
  bottomFloor: BottomFloorInputDto,
  preRenovationValues: nullish(PreRenovationValuesDto),
});
