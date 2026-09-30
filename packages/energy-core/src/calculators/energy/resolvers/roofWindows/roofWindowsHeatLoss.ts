import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";

declare module "../../" {
  interface DETCalculatorRegistry {
    roofWindowsHeatLossFactor: number;
    roofWindowsHeatLoss: number;
  }
}

export const roofWindowsHeatLossFactor = {
  key: "roofWindowsHeatLossFactor",
  resolve: (ctx) => ctx.input.config.windows.roofWindowsHeatLossFactor,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofWindowsHeatLossFactor">;

export const roofWindowsHeatLoss = {
  key: "roofWindowsHeatLoss",
  resolve: (ctx) =>
    ctx.get("isSpaceBelowRoofHeated")
      ? ctx.get("roofWindowsHeatLossFactor") *
        ctx.get("roofWindowsUValue") *
        ctx.get("roofWindowsArea")
      : 0,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofWindowsHeatLoss">;

export default [roofWindowsHeatLossFactor, roofWindowsHeatLoss];
