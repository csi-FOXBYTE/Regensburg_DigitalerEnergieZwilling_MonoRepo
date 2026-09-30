import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";

declare module "../../" {
  interface DETCalculatorRegistry {
    bottomFloorHeatLossFactor: number;
    bottomFloorHeatLoss: number;
  }
}

export const bottomFloorHeatLossFactor = {
  key: "bottomFloorHeatLossFactor",
  resolve: (ctx) => ctx.input.config.bottomFloor.heatLossFactor,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "bottomFloorHeatLossFactor">;

export const bottomFloorHeatLoss = {
  key: "bottomFloorHeatLoss",
  resolve: (ctx) =>
    ctx.get("bottomFloorArea") *
    ctx.get("bottomFloorUValue") *
    ctx.get("bottomFloorHeatLossFactor"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "bottomFloorHeatLoss">;

export default [bottomFloorHeatLossFactor, bottomFloorHeatLoss];
