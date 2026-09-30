import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";

declare module "../../" {
  interface DETCalculatorRegistry {
    outerWallHeatingDemand: number;
  }
}

export default {
  key: "outerWallHeatingDemand",
  resolve: (ctx) =>
    ctx.get("outerWallHeatLoss") * ctx.get("heatingDegreeDays") * 0.024,
} satisfies Resolver<
  DETCalculatorContext,
  DETCalculatorRegistry,
  "outerWallHeatingDemand"
>;
