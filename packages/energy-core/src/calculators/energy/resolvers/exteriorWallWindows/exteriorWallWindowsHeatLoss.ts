import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";

declare module "../../" {
  interface DETCalculatorRegistry {
    exteriorWallWindowsHeatLossFactor: number;
    exteriorWallWindowsHeatLoss: number;
  }
}

export const exteriorWallWindowsHeatLossFactor = {
  key: "exteriorWallWindowsHeatLossFactor",
  resolve: (ctx) => ctx.input.config.windows.exteriorWallWindowsHeatLossFactor,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "exteriorWallWindowsHeatLossFactor">;

export const exteriorWallWindowsHeatLoss = {
  key: "exteriorWallWindowsHeatLoss",
  resolve: (ctx) =>
    ctx.get("exteriorWallWindowsHeatLossFactor") *
    ctx.get("exteriorWallWindowsUValue") *
    ctx.get("exteriorWallWindowsArea"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "exteriorWallWindowsHeatLoss">;

export default [exteriorWallWindowsHeatLossFactor, exteriorWallWindowsHeatLoss];
