import type { Resolver } from "../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../";
import type { PrimaryEnergyCarrierData } from "../../../types/config/heat.js";
import { resolveKeyedValue } from "../../../types/keyed-values.js";

declare module "../" {
  interface DETCalculatorRegistry {
    primaryEnergyCarrier: string;
    primaryEnergyCarrierData: PrimaryEnergyCarrierData;
    primaryEnergyCarrierEfficiencyFactor: number;
    co2Factor: number;
  }
}

export const primaryEnergyCarrier = {
  key: "primaryEnergyCarrier",
  resolve: (ctx) => {
    const override = ctx.input.input.heat.primaryEnergyCarrier;
    if (override != null) return override;
    return ctx.input.config.heat.defaultPrimaryEnergyCarrier;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "primaryEnergyCarrier">;

export const primaryEnergyCarrierData = {
  key: "primaryEnergyCarrierData",
  resolve: (ctx) =>
    resolveKeyedValue(
      ctx.input.config.heat.primaryEnergyCarrierData,
      ctx.get("primaryEnergyCarrier"),
    ),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "primaryEnergyCarrierData">;

export const primaryEnergyCarrierEfficiencyFactor = {
  key: "primaryEnergyCarrierEfficiencyFactor",
  resolve: (ctx) => ctx.get("primaryEnergyCarrierData").primaryEnergyFactor,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "primaryEnergyCarrierEfficiencyFactor">;

export const co2Factor = {
  key: "co2Factor",
  resolve: (ctx) => ctx.get("primaryEnergyCarrierData").co2Factor,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "co2Factor">;

export default [primaryEnergyCarrier, primaryEnergyCarrierData, primaryEnergyCarrierEfficiencyFactor, co2Factor];
