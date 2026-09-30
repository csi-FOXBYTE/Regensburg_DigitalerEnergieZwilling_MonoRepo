import type { Resolver } from "../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../";

declare module "../" {
  interface DETCalculatorRegistry {
    heatingDegreeDays: number;
  }
}

export default {
  key: "heatingDegreeDays",
  resolve: (ctx) => ctx.input.config.heat.heatingDegreeDays,
} satisfies Resolver<
  DETCalculatorContext,
  DETCalculatorRegistry,
  "heatingDegreeDays"
>;
