import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";

declare module "../../" {
  interface DETCalculatorRegistry {
    bottomFloorHeatingDemand: number;
  }
}

export default {
  key: "bottomFloorHeatingDemand",
  resolve: (ctx) =>
    ctx.get("bottomFloorHeatLoss") * ctx.get("heatingDegreeDays") * 0.024,
} satisfies Resolver<
  DETCalculatorContext,
  DETCalculatorRegistry,
  "bottomFloorHeatingDemand"
>;
