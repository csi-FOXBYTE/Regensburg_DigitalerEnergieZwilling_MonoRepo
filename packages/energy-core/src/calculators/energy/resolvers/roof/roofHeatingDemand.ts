import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";

declare module "../../" {
  interface DETCalculatorRegistry {
    roofHeatingDemand: number;
  }
}

export default {
  key: "roofHeatingDemand",
  resolve: (ctx) =>
    ctx.get("roofHeatLoss") * ctx.get("heatingDegreeDays") * 0.024,
} satisfies Resolver<
  DETCalculatorContext,
  DETCalculatorRegistry,
  "roofHeatingDemand"
>;
