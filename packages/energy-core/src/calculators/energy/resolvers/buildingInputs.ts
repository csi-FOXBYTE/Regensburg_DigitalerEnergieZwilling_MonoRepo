import type { Resolver } from "../../../engine/index.js";
import type { BuildingType } from "../../../types/building-type.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../";
import type { RangeKey } from "../../../types/range-bands.js";
import { resolveKeyedValue } from "../../../types/keyed-values.js";

declare module "../" {
  interface DETCalculatorRegistry {
    buildingYear: number | RangeKey;
    buildingHeight: number;
    lowestEaveHeight: number;
    buildingBaseArea: number;
    buildingType: BuildingType;
    livingArea: number | null;
    numberOfApartments: number;
    numberOfPeople: number;
    averagePeoplePerApartment: number;
    isBasementHeated: boolean;
  }
}

export const buildingYear = {
  key: "buildingYear",
  resolve: (ctx) => ctx.input.input.general.buildingYear,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "buildingYear">;

export const buildingHeight = {
  key: "buildingHeight",
  resolve: (ctx) => ctx.input.input.general.buildingHeight,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "buildingHeight">;

export const lowestEaveHeight = {
  key: "lowestEaveHeight",
  resolve: (ctx) => ctx.input.input.general.lowestEaveHeight,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "lowestEaveHeight">;

export const buildingBaseArea = {
  key: "buildingBaseArea",
  resolve: (ctx) => ctx.input.input.general.buildingBaseArea,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "buildingBaseArea">;

export const buildingType = {
  key: "buildingType",
  resolve: (ctx) => ctx.input.input.general.type,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "buildingType">;

export const livingArea = {
  key: "livingArea",
  resolve: (ctx) => ctx.input.input.general.livingArea ?? null,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "livingArea">;

export const numberOfApartments = {
  key: "numberOfApartments",
  resolve: (ctx) =>
    ctx.input.input.general.numberOfApartments ??
    resolveKeyedValue(ctx.input.config.general.defaultNumberOfApartments, ctx.get("buildingType")),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "numberOfApartments">;

export const numberOfPeople = {
  key: "numberOfPeople",
  resolve: (ctx) =>
    ctx.input.input.general.numberOfPeople ??
    ctx.get("numberOfApartments") * ctx.input.config.general.defaultPeoplePerApartment,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "numberOfPeople">;

export const averagePeoplePerApartment = {
  key: "averagePeoplePerApartment",
  resolve: (ctx) => ctx.get("numberOfPeople") / ctx.get("numberOfApartments"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "averagePeoplePerApartment">;

export const isBasementHeated = {
  key: "isBasementHeated",
  resolve: (ctx) =>
    ctx.get("hasBasement") && (ctx.input.input.bottomFloor.isBasementHeated ?? false),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "isBasementHeated">;

export default [buildingYear, buildingHeight, lowestEaveHeight, buildingBaseArea, buildingType, livingArea, numberOfApartments, numberOfPeople, averagePeoplePerApartment, isBasementHeated];
