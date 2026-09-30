import type { Resolver } from "../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../";
import type { ElectricityTypeData } from "../../../types/config/heat.js";
import { resolveKeyedValue } from "../../../types/keyed-values.js";
import {
  fitLinearRegression,
  resolveInterpolatedNumber,
  type LinearInterpolation,
  type LinearRegression,
} from "../../../types/interpolated-number.js";
import { BuildingType } from "../../../types/building-type.js";

export const OccupancyWarning = {
  AVERAGE_PEOPLE_PER_APARTMENT_ABOVE_SIX:
    "averagePeoplePerApartmentAboveSix",
  POSSIBLE_VACANCY: "possibleVacancy",
} as const;

export type OccupancyWarning =
  (typeof OccupancyWarning)[keyof typeof OccupancyWarning];

declare module "../" {
  interface DETCalculatorRegistry {
    electricityType: string;
    electricityTypeData: ElectricityTypeData;
    electricityCo2Factor: number;
    electricityUnitRate: number;
    electricityBaseRate: number;
    householdElectricityTable: LinearInterpolation;
    householdElectricityRegression: LinearRegression;
    householdElectricityPerApartment: number;
    occupancyWarnings: OccupancyWarning[];
    baseElectricalLoad: number;
    baseElectricalLoadCost: number;
    electricityCost: number;
    electricityCo2Emissions: number;
    electricalPrimaryEnergyDemand: number;
  }
}

export const electricityType = {
  key: "electricityType",
  resolve: (ctx) => {
    const override = ctx.input.input.electricity.electricityType;
    if (override != null) return override;
    return ctx.input.config.heat.defaultElectricityType;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "electricityType">;

export const electricityTypeData = {
  key: "electricityTypeData",
  resolve: (ctx) =>
    resolveKeyedValue(ctx.input.config.heat.electricityTypeData, ctx.get("electricityType")),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "electricityTypeData">;

export const electricityCo2Factor = {
  key: "electricityCo2Factor",
  resolve: (ctx) => ctx.get("electricityTypeData").co2Factor,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "electricityCo2Factor">;

export const electricityUnitRate = {
  key: "electricityUnitRate",
  resolve: (ctx) => {
    const override = ctx.input.input.electricity.electricityUnitRate;
    if (override != null) return override;
    return ctx.get("electricityTypeData").unitRate;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "electricityUnitRate">;

export const electricityBaseRate = {
  key: "electricityBaseRate",
  resolve: (ctx) => {
    const override = ctx.input.input.electricity.userElectricityBaseRate;
    if (override != null) return override;
    return ctx.get("electricityTypeData").baseRate;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "electricityBaseRate">;

export const householdElectricityTable = {
  key: "householdElectricityTable",
  resolve: (ctx) =>
    resolveKeyedValue(
      ctx.input.config.heat.householdElectricityPerApartment,
      ctx.get("numberOfApartments") <= 2
        ? BuildingType.SINGLE_FAMILY
        : BuildingType.MULTI_FAMILY,
    ),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "householdElectricityTable">;

export const householdElectricityRegression = {
  key: "householdElectricityRegression",
  resolve: (ctx) => fitLinearRegression(ctx.get("householdElectricityTable")),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "householdElectricityRegression">;

export const householdElectricityPerApartment = {
  key: "householdElectricityPerApartment",
  resolve: (ctx) => {
    const numberOfApartments = ctx.get("numberOfApartments");
    const numberOfPeople = ctx.get("numberOfPeople");
    const table = ctx.get("householdElectricityTable");
    const firstPoint = table.points[0];
    const lastPoint = table.points[table.points.length - 1]!;

    if (
      numberOfApartments === 1 &&
      numberOfPeople >= firstPoint.at &&
      numberOfPeople <= lastPoint.at
    ) {
      return resolveInterpolatedNumber(table, numberOfPeople);
    }
    if (numberOfApartments === 1 && numberOfPeople < firstPoint.at) {
      return firstPoint.value;
    }

    const { a, b } = ctx.get("householdElectricityRegression");
    return a + ctx.get("averagePeoplePerApartment") * b;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "householdElectricityPerApartment">;

export const occupancyWarnings = {
  key: "occupancyWarnings",
  resolve: (ctx) => {
    const warnings: OccupancyWarning[] = [];
    if (ctx.get("averagePeoplePerApartment") > 6) {
      warnings.push(OccupancyWarning.AVERAGE_PEOPLE_PER_APARTMENT_ABOVE_SIX);
    }
    if (ctx.get("numberOfPeople") < ctx.get("numberOfApartments")) {
      warnings.push(OccupancyWarning.POSSIBLE_VACANCY);
    }
    return warnings;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "occupancyWarnings">;

export const baseElectricalLoad = {
  key: "baseElectricalLoad",
  resolve: (ctx) => {
    const preRenovationValues = ctx.input.input.preRenovationValues;
    if (preRenovationValues != null) {
      return preRenovationValues.electricityOffset;
    }
    const userElectricityConsumption = ctx.input.input.electricity.userElectricityConsumption;
    if (userElectricityConsumption != null) {
      return userElectricityConsumption - ctx.get("electricalHeatingEnergyDemand");
    }
    return ctx.get("householdElectricityPerApartment") * ctx.get("numberOfApartments");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "baseElectricalLoad">;

export const baseElectricalLoadCost = {
  key: "baseElectricalLoadCost",
  resolve: (ctx) => ctx.get("baseElectricalLoad") * ctx.get("electricityUnitRate"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "baseElectricalLoadCost">;

export const electricityCost = {
  key: "electricityCost",
  resolve: (ctx) =>
    ctx.get("electricalEnergyDemand") * ctx.get("electricityUnitRate") +
    ctx.get("electricityBaseRate"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "electricityCost">;

export const electricityCo2Emissions = {
  key: "electricityCo2Emissions",
  resolve: (ctx) =>
    ctx.get("electricalEnergyDemand") * ctx.get("electricityCo2Factor") * 0.000001,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "electricityCo2Emissions">;

export const electricalPrimaryEnergyDemand = {
  key: "electricalPrimaryEnergyDemand",
  resolve: (ctx) =>
    ctx.get("electricalEnergyDemand") * ctx.get("electricityTypeData").primaryEnergyFactor,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "electricalPrimaryEnergyDemand">;

export default [
  electricityType,
  electricityTypeData,
  electricityCo2Factor,
  electricityUnitRate,
  electricityBaseRate,
  householdElectricityTable,
  householdElectricityRegression,
  householdElectricityPerApartment,
  occupancyWarnings,
  baseElectricalLoad,
  baseElectricalLoadCost,
  electricityCost,
  electricityCo2Emissions,
  electricalPrimaryEnergyDemand,
];
