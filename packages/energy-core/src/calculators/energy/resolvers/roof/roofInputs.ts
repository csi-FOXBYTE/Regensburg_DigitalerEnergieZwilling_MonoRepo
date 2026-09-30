import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";
import type { RangeKey } from "../../../../types/range-bands.js";
import type { RoofInsulationType } from "../../../../types/roof-insulation-type.js";

declare module "../../" {
  interface DETCalculatorRegistry {
    roofYear: number | RangeKey;
    roofArea: number;
    isFlatRoof: boolean;
    roofHasInsulation: boolean;
    roofInsulationThickness: number;
    roofInsulationType: RoofInsulationType;
    isSpaceBelowRoofHeated: boolean;
  }
}

export const roofYear = {
  key: "roofYear",
  resolve: (ctx) => {
    const override = ctx.input.input.roof.year;
    if (override != null) return override;
    return ctx.get("buildingYear");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofYear">;

export const roofArea = {
  key: "roofArea",
  resolve: (ctx) => ctx.input.input.roof.area,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofArea">;

export const isFlatRoof = {
  key: "isFlatRoof",
  resolve: (ctx) =>
    ctx.input.input.roof.isFlatRoof ?? ctx.input.config.roof.defaultIsFlatRoof,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "isFlatRoof">;

export const roofHasInsulation = {
  key: "roofHasInsulation",
  resolve: (ctx) => ctx.input.input.roof.hasInsulation ?? false,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofHasInsulation">;

export const roofInsulationThickness = {
  key: "roofInsulationThickness",
  resolve: (ctx) => {
    const override = ctx.input.input.roof.insulationThickness;
    if (override != null) return override;
    return ctx.input.config.roof.assumedInsulationThickness;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofInsulationThickness">;

export const roofInsulationType = {
  key: "roofInsulationType",
  resolve: (ctx) => {
    const override = ctx.input.input.roof.insulationType;
    if (override != null) return override;
    return ctx.input.config.roof.defaultInsulationType;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofInsulationType">;

export const isSpaceBelowRoofHeated = {
  key: "isSpaceBelowRoofHeated",
  resolve: (ctx) => {
    if (!ctx.get("hasAttic")) return true;
    return ctx.get("isAtticHeated");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "isSpaceBelowRoofHeated">;

export default [roofYear, roofArea, isFlatRoof, roofHasInsulation, roofInsulationThickness, roofInsulationType, isSpaceBelowRoofHeated];
