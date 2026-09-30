import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";
import type { RangeKey } from "../../../../types/range-bands.js";

declare module "../../" {
  interface DETCalculatorRegistry {
    bottomFloorYear: number | RangeKey;
    bottomFloorArea: number;
    hasBasement: boolean;
    bottomFloorIsHeated: boolean;
    bottomFloorHasInsulation: boolean;
    bottomFloorInsulationThickness: number;
    isSpaceAboveBaseSlabHeated: boolean;
  }
}

export const bottomFloorYear = {
  key: "bottomFloorYear",
  resolve: (ctx) => {
    const override = ctx.input.input.bottomFloor.year;
    if (override != null) return override;
    return ctx.get("buildingYear");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "bottomFloorYear">;

export const bottomFloorArea = {
  key: "bottomFloorArea",
  resolve: (ctx) => ctx.input.input.bottomFloor.area,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "bottomFloorArea">;

export const hasBasement = {
  key: "hasBasement",
  resolve: (ctx) => ctx.input.input.bottomFloor.hasBasement ?? false,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "hasBasement">;

export const bottomFloorIsHeated = {
  key: "bottomFloorIsHeated",
  resolve: (ctx) => ctx.input.input.bottomFloor.isHeated ?? false,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "bottomFloorIsHeated">;

export const bottomFloorHasInsulation = {
  key: "bottomFloorHasInsulation",
  resolve: (ctx) => ctx.input.input.bottomFloor.hasInsulation ?? false,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "bottomFloorHasInsulation">;

export const bottomFloorInsulationThickness = {
  key: "bottomFloorInsulationThickness",
  resolve: (ctx) => {
    const override = ctx.input.input.bottomFloor.insulationThickness;
    if (override != null) return override;
    return ctx.input.config.bottomFloor.assumedInsulationThickness;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "bottomFloorInsulationThickness">;

export const isSpaceAboveBaseSlabHeated = {
  key: "isSpaceAboveBaseSlabHeated",
  resolve: (ctx) => {
    if (!ctx.get("hasBasement")) return true;
    return ctx.get("isBasementHeated");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "isSpaceAboveBaseSlabHeated">;

export default [
  bottomFloorYear,
  bottomFloorArea,
  hasBasement,
  bottomFloorIsHeated,
  bottomFloorHasInsulation,
  bottomFloorInsulationThickness,
  isSpaceAboveBaseSlabHeated,
];
