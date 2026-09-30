import type { Resolver } from "../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../";

declare module "../" {
  interface DETCalculatorRegistry {
    thermalCarrierDemand: number;
    thermalUnitRate: number;
    thermalBaseRate: number;
    thermalCarrierCost: number;
    thermalCo2Emissions: number;
    thermalPrimaryEnergyDemand: number;
  }
}

export const thermalCarrierDemand = {
  key: "thermalCarrierDemand",
  resolve: (ctx) =>
    ctx.get("thermalEnergyDemand") / ctx.get("primaryEnergyCarrierData").energyPerUnit,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "thermalCarrierDemand">;

export const thermalUnitRate = {
  key: "thermalUnitRate",
  resolve: (ctx) => {
    const override = ctx.input.input.heat.userThermalUnitRate;
    if (override != null) {
      const bundlePresent = ctx.input.input.preRenovationValues != null;
      if (!bundlePresent) return override;
      const preRenovCarrier = ctx.input.input.preRenovationValues?.primaryEnergyCarrier;
      if (preRenovCarrier == null || preRenovCarrier === ctx.get("primaryEnergyCarrier")) {
        return override;
      }
    }
    return ctx.get("primaryEnergyCarrierData").unitRate;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "thermalUnitRate">;

export const thermalBaseRate = {
  key: "thermalBaseRate",
  resolve: (ctx) => {
    const override = ctx.input.input.heat.userThermalBaseRate;
    if (override != null) {
      const bundlePresent = ctx.input.input.preRenovationValues != null;
      if (!bundlePresent) return override;
      const preRenovCarrier = ctx.input.input.preRenovationValues?.primaryEnergyCarrier;
      if (preRenovCarrier == null || preRenovCarrier === ctx.get("primaryEnergyCarrier")) {
        return override;
      }
    }
    return ctx.get("primaryEnergyCarrierData").baseRate;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "thermalBaseRate">;

export const thermalCarrierCost = {
  key: "thermalCarrierCost",
  resolve: (ctx) =>
    ctx.get("thermalCarrierDemand") * ctx.get("thermalUnitRate") + ctx.get("thermalBaseRate"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "thermalCarrierCost">;

export const thermalCo2Emissions = {
  key: "thermalCo2Emissions",
  resolve: (ctx) =>
    ctx.get("thermalEnergyDemand") * ctx.get("primaryEnergyCarrierData").co2Factor * 0.000001,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "thermalCo2Emissions">;

export const thermalPrimaryEnergyDemand = {
  key: "thermalPrimaryEnergyDemand",
  resolve: (ctx) =>
    ctx.get("thermalEnergyDemand") * ctx.get("primaryEnergyCarrierData").primaryEnergyFactor,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "thermalPrimaryEnergyDemand">;

export default [
  thermalCarrierDemand,
  thermalUnitRate,
  thermalBaseRate,
  thermalCarrierCost,
  thermalCo2Emissions,
  thermalPrimaryEnergyDemand,
];
