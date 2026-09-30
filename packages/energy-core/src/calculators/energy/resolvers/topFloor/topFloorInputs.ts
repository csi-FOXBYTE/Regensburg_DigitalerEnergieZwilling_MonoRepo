import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";
import type { RangeKey } from "../../../../types/range-bands.js";
import { resolveKeyedValue } from "../../../../types/keyed-values.js";

declare module "../../" {
  interface DETCalculatorRegistry {
    topFloorYear: number | RangeKey;
    topFloorArea: number;
    hasAttic: boolean;
    isAtticHeated: boolean;
    topFloorHasInsulation: boolean;
    topFloorInsulationThickness: number;
  }
}

export const topFloorYear = {
  key: "topFloorYear",
  resolve: (ctx) => {
    const override = ctx.input.input.topFloor.year;
    if (override != null) return override;
    return ctx.get("buildingYear");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "topFloorYear">;

export const topFloorArea = {
  key: "topFloorArea",
  resolve: (ctx) => ctx.input.input.topFloor.area,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "topFloorArea">;

export const hasAttic = {
  key: "hasAttic",
  resolve: (ctx) => {
    const override = ctx.input.input.topFloor.hasAttic;
    if (override != null) return override;
    return resolveKeyedValue(
      ctx.input.config.topFloor.defaultHasAtticByIsFlatRoof,
      ctx.get("isFlatRoof"),
    );
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "hasAttic">;

export const isAtticHeated = {
  key: "isAtticHeated",
  resolve: (ctx) =>
    ctx.input.input.topFloor.isAtticHeated ??
    ctx.input.config.topFloor.defaultIsAtticHeated,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "isAtticHeated">;

export const topFloorHasInsulation = {
  key: "topFloorHasInsulation",
  resolve: (ctx) => ctx.input.input.topFloor.hasInsulation ?? false,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "topFloorHasInsulation">;

export const topFloorInsulationThickness = {
  key: "topFloorInsulationThickness",
  resolve: (ctx) => {
    const override = ctx.input.input.topFloor.insulationThickness;
    if (override != null) return override;
    return ctx.input.config.topFloor.assumedInsulationThickness;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "topFloorInsulationThickness">;

export default [topFloorYear, topFloorArea, hasAttic, isAtticHeated, topFloorHasInsulation, topFloorInsulationThickness];
