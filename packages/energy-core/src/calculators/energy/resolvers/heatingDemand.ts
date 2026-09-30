import type { Resolver } from "../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../";
import { resolveKeyedValue } from "../../../types/keyed-values.js";

declare module "../" {
  interface DETCalculatorRegistry {
    totalHeatLoss: number;
    rawSpaceHeatingDemand: number;
    spaceHeatingDemand: number;
    hotWaterEnergyDemandFromAreaFactor: number;
    hotWaterEnergyDemand: number;
    calculatedThermalBaseline: number;
    thermalBaseline: number;
  }
}

export const totalHeatLoss = {
  key: "totalHeatLoss",
  resolve: (ctx) =>
    ctx.get("ventilationHeatLoss") +
    ctx.get("roofHeatLoss") +
    ctx.get("topFloorHeatLoss") +
    ctx.get("roofWindowsHeatLoss") +
    ctx.get("exteriorWallWindowsHeatLoss") +
    ctx.get("outerWallHeatLoss") +
    ctx.get("bottomFloorHeatLoss"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "totalHeatLoss">;

export const rawSpaceHeatingDemand = {
  key: "rawSpaceHeatingDemand",
  resolve: (ctx) => ctx.get("totalHeatLoss") * ctx.get("heatingDegreeDays") * 0.024,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "rawSpaceHeatingDemand">;

// NOTE: may be replaced with a more precise calculation method soon
export const spaceHeatingDemand = {
  key: "spaceHeatingDemand",
  resolve: (ctx) => ctx.get("rawSpaceHeatingDemand"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "spaceHeatingDemand">;

export const hotWaterEnergyDemandFromAreaFactor = {
  key: "hotWaterEnergyDemandFromAreaFactor",
  resolve: (ctx) =>
    resolveKeyedValue(
      ctx.input.config.heat.hotWaterEnergyDemandFromAreaFactor,
      ctx.get("buildingType"),
    ),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "hotWaterEnergyDemandFromAreaFactor">;

export const hotWaterEnergyDemand = {
  key: "hotWaterEnergyDemand",
  resolve: (ctx) => ctx.get("netFloorArea") * ctx.get("hotWaterEnergyDemandFromAreaFactor"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "hotWaterEnergyDemand">;

export const calculatedThermalBaseline = {
  key: "calculatedThermalBaseline",
  resolve: (ctx) =>
    ctx.get("spaceHeatingDemand") * ctx.get("combinedHeatingPerformanceFactor") +
    ctx.get("hotWaterEnergyDemand"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "calculatedThermalBaseline">;

export const thermalBaseline = {
  key: "thermalBaseline",
  resolve: (ctx) => {
    if (ctx.get("userThermalConsumption") != null) {
      return ctx.get("userTotalEnergyDemand") * ctx.get("renovationFactor");
    }
    return ctx.get("calculatedThermalBaseline");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "thermalBaseline">;

export default [
  totalHeatLoss,
  rawSpaceHeatingDemand,
  spaceHeatingDemand,
  hotWaterEnergyDemandFromAreaFactor,
  hotWaterEnergyDemand,
  calculatedThermalBaseline,
  thermalBaseline,
];
