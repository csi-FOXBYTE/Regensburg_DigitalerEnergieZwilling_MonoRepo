import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";

declare module "../../" {
  interface DETCalculatorRegistry {
    outerWallHeatLossFactor: number;
    adjacentWallUValue: number;
    outerWallHeatLoss: number;
  }
}

export const outerWallHeatLossFactor = {
  key: "outerWallHeatLossFactor",
  resolve: (ctx) => ctx.input.config.outerWall.heatLossFactor,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "outerWallHeatLossFactor">;

export const adjacentWallUValue = {
  key: "adjacentWallUValue",
  resolve: () => 0,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "adjacentWallUValue">;

export const outerWallHeatLoss = {
  key: "outerWallHeatLoss",
  resolve: (ctx) => {
    const freeArea = Math.max(
      0,
      ctx.get("outerWallArea") - ctx.get("exteriorWallWindowsArea"),
    );
    return freeArea * ctx.get("outerWallUValue") * ctx.get("outerWallHeatLossFactor");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "outerWallHeatLoss">;

export default [outerWallHeatLossFactor, adjacentWallUValue, outerWallHeatLoss];
