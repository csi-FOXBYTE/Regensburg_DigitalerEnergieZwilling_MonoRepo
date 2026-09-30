import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";

declare module "../../" {
  interface DETCalculatorRegistry {
    exteriorWallWindowsHeatingDemand: number;
  }
}

export default {
  key: "exteriorWallWindowsHeatingDemand",
  resolve: (ctx) =>
    ctx.get("exteriorWallWindowsHeatLoss") * ctx.get("heatingDegreeDays") * 0.024,
} satisfies Resolver<
  DETCalculatorContext,
  DETCalculatorRegistry,
  "exteriorWallWindowsHeatingDemand"
>;
