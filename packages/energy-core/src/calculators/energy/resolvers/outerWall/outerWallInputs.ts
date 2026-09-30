import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";
import type { RangeKey } from "../../../../types/range-bands.js";

declare module "../../" {
  interface DETCalculatorRegistry {
    outerWallYear: number | RangeKey;
    outerWallAreaWithoutAttic: number;
    outerWallAtticArea: number;
    outerWallArea: number;
    adjacentWallArea: number;
    outerWallHasInsulation: boolean;
    outerWallInsulationThickness: number;
    outerWallAllowsAdditionalInsulation: boolean;
  }
}

export const outerWallYear = {
  key: "outerWallYear",
  resolve: (ctx) => {
    const override = ctx.input.input.outerWall.year;
    if (override != null) return override;
    return ctx.get("buildingYear");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "outerWallYear">;

export const outerWallArea = {
  key: "outerWallArea",
  resolve: (ctx) => {
    const override = ctx.input.input.outerWall.area;
    if (override != null) return override;
    return (
      ctx.get("outerWallAreaWithoutAttic") +
      (ctx.get("isAtticHeated") ? ctx.get("outerWallAtticArea") : 0)
    );
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "outerWallArea">;

export const outerWallAreaWithoutAttic = {
  key: "outerWallAreaWithoutAttic",
  resolve: (ctx) => ctx.input.input.outerWall.areaWithoutAttic,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "outerWallAreaWithoutAttic">;

export const outerWallAtticArea = {
  key: "outerWallAtticArea",
  resolve: (ctx) => ctx.input.input.outerWall.atticArea,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "outerWallAtticArea">;

export const adjacentWallArea = {
  key: "adjacentWallArea",
  resolve: (ctx) => ctx.input.input.outerWall.adjacentWallArea ?? 0,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "adjacentWallArea">;

export const outerWallHasInsulation = {
  key: "outerWallHasInsulation",
  resolve: (ctx) => ctx.input.input.outerWall.hasInsulation ?? false,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "outerWallHasInsulation">;

export const outerWallInsulationThickness = {
  key: "outerWallInsulationThickness",
  resolve: (ctx) => {
    const override = ctx.input.input.outerWall.insulationThickness;
    if (override != null) return override;
    return ctx.input.config.outerWall.assumedInsulationThickness;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "outerWallInsulationThickness">;

export const outerWallAllowsAdditionalInsulation = {
  key: "outerWallAllowsAdditionalInsulation",
  resolve: (ctx) => {
    const constructionType = ctx.input.config.outerWall.constructionTypes.find(
      (entry) => entry.value === ctx.get("outerWallConstructionType"),
    );
    return constructionType?.allowsAdditionalInsulation ?? true;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "outerWallAllowsAdditionalInsulation">;

export default [
  outerWallYear,
  outerWallAreaWithoutAttic,
  outerWallAtticArea,
  outerWallArea,
  adjacentWallArea,
  outerWallHasInsulation,
  outerWallInsulationThickness,
  outerWallAllowsAdditionalInsulation,
];
