import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";

declare module "../../" {
  interface DETCalculatorRegistry {
    roofWindowsHeatingDemand: number;
  }
}

export default {
  key: "roofWindowsHeatingDemand",
  resolve: (ctx) =>
    ctx.get("roofWindowsHeatLoss") * ctx.get("heatingDegreeDays") * 0.024,
} satisfies Resolver<
  DETCalculatorContext,
  DETCalculatorRegistry,
  "roofWindowsHeatingDemand"
>;
