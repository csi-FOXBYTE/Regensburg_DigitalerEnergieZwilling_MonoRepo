import type { Resolver } from "../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../";
import type { PrimaryEnergyCarrierData } from "../../../types/config/heat.js";
import { resolveKeyedValue } from "../../../types/keyed-values.js";

declare module "../" {
  interface DETCalculatorRegistry {
    preRenovationCarrierData: PrimaryEnergyCarrierData;
    preRenovationElectricalRatio: number;
    preRenovationHasInternalGains: boolean;
    preRenovationInternalGainsFactor: number;
    userThermalConsumption: number | null;
    userThermalEnergyDemand: number;
    userTotalEnergyDemand: number;
    renovationFactor: number;
  }
}

export const preRenovationCarrierData = {
  key: "preRenovationCarrierData",
  resolve: (ctx) => {
    const carrier =
      ctx.input.input.preRenovationValues?.primaryEnergyCarrier ?? ctx.get("primaryEnergyCarrier");
    return resolveKeyedValue(ctx.input.config.heat.primaryEnergyCarrierData, carrier);
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "preRenovationCarrierData">;

export const preRenovationElectricalRatio = {
  key: "preRenovationElectricalRatio",
  resolve: (ctx) => {
    const sysType =
      ctx.input.input.preRenovationValues?.heatingSystemType ?? ctx.get("heatingSystemType");
    return resolveKeyedValue(ctx.input.config.heat.electricalRatio, sysType);
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "preRenovationElectricalRatio">;

export const preRenovationHasInternalGains = {
  key: "preRenovationHasInternalGains",
  resolve: (ctx) => {
    const sysType =
      ctx.input.input.preRenovationValues?.heatingSystemType ?? ctx.get("heatingSystemType");
    return resolveKeyedValue(ctx.input.config.heat.hasInternalGains, sysType);
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "preRenovationHasInternalGains">;

export const preRenovationInternalGainsFactor = {
  key: "preRenovationInternalGainsFactor",
  resolve: (ctx) => {
    if (!ctx.get("preRenovationHasInternalGains")) return 1;
    return resolveKeyedValue(
      ctx.input.config.heat.internalGainsFactorByBuildingType,
      ctx.get("buildingType"),
    );
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "preRenovationInternalGainsFactor">;

export const userThermalConsumption = {
  key: "userThermalConsumption",
  resolve: (ctx) => {
    const total = ctx.input.input.heat.userThermalTotalCost;
    if (total == null) return null;
    const carrierData = ctx.get("preRenovationCarrierData");
    const rate = ctx.input.input.heat.userThermalUnitRate ?? carrierData.unitRate;
    const base = ctx.input.input.heat.userThermalBaseRate ?? carrierData.baseRate;
    if (rate === 0) return null;
    return (total - base) / rate;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "userThermalConsumption">;

export const userThermalEnergyDemand = {
  key: "userThermalEnergyDemand",
  resolve: (ctx) =>
    (ctx.get("userThermalConsumption") ?? 0) * ctx.get("preRenovationCarrierData").energyPerUnit,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "userThermalEnergyDemand">;

export const userTotalEnergyDemand = {
  key: "userTotalEnergyDemand",
  resolve: (ctx) =>
    ctx.get("userThermalEnergyDemand") /
    ((1 - ctx.get("preRenovationElectricalRatio")) * ctx.get("preRenovationInternalGainsFactor")),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "userTotalEnergyDemand">;

export const renovationFactor = {
  key: "renovationFactor",
  resolve: (ctx) => {
    const preRenovationTotal = ctx.input.input.preRenovationValues?.totalEnergyDemand;
    if (preRenovationTotal == null || preRenovationTotal === 0) return 1;
    return ctx.get("calculatedThermalBaseline") / preRenovationTotal;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "renovationFactor">;

export default [
  preRenovationCarrierData,
  preRenovationElectricalRatio,
  preRenovationHasInternalGains,
  preRenovationInternalGainsFactor,
  userThermalConsumption,
  userThermalEnergyDemand,
  userTotalEnergyDemand,
  renovationFactor,
];
