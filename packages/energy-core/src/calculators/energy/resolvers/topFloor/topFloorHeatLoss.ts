import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";

declare module "../../" {
  interface DETCalculatorRegistry {
    topFloorHeatLossFactor: number;
    topFloorHeatLoss: number;
  }
}

export const topFloorHeatLossFactor = {
  key: "topFloorHeatLossFactor",
  resolve: (ctx) => ctx.input.config.topFloor.heatLossFactor,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "topFloorHeatLossFactor">;

export const topFloorHeatLoss = {
  key: "topFloorHeatLoss",
  resolve: (ctx) =>
    ctx.get("isSpaceBelowRoofHeated")
      ? 0
      : ctx.get("topFloorArea") * ctx.get("topFloorUValue") * ctx.get("topFloorHeatLossFactor"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "topFloorHeatLoss">;

export default [topFloorHeatLossFactor, topFloorHeatLoss];
