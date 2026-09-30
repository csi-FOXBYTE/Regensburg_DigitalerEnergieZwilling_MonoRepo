import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";

declare module "../../" {
  interface DETCalculatorRegistry {
    topFloorHeatingDemand: number;
  }
}

export default {
  key: "topFloorHeatingDemand",
  resolve: (ctx) =>
    ctx.get("topFloorHeatLoss") * ctx.get("heatingDegreeDays") * 0.024,
} satisfies Resolver<
  DETCalculatorContext,
  DETCalculatorRegistry,
  "topFloorHeatingDemand"
>;
