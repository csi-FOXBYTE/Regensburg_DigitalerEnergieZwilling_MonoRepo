import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";

declare module "../../" {
  interface DETCalculatorRegistry {
    roofHeatLossFactor: number;
    roofHeatLoss: number;
  }
}

export const roofHeatLossFactor = {
  key: "roofHeatLossFactor",
  resolve: (ctx) => ctx.input.config.roof.heatLossFactor,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofHeatLossFactor">;

export const roofHeatLoss = {
  key: "roofHeatLoss",
  resolve: (ctx) =>
    ctx.get("isSpaceBelowRoofHeated")
      ? ctx.get("roofHeatLossFactor") *
        ctx.get("roofUValue") *
        Math.max(0, ctx.get("roofArea") - ctx.get("roofWindowsArea"))
      : 0,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofHeatLoss">;

export default [roofHeatLossFactor, roofHeatLoss];
