import type { Resolver } from "../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../";

declare module "../" {
  interface DETCalculatorRegistry {
    airDensitySpecificHeatCapacityProduct: number;
    ventilationHeatLossCorrectionFactor: number;
    ventilationHeatLoss: number;
    ventilationHeatingDemand: number;
  }
}

export const airDensitySpecificHeatCapacityProduct = {
  key: "airDensitySpecificHeatCapacityProduct",
  resolve: () => 0.34,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "airDensitySpecificHeatCapacityProduct">;

export const ventilationHeatLossCorrectionFactor = {
  key: "ventilationHeatLossCorrectionFactor",
  resolve: (ctx) => ctx.input.config.heat.ventilationHeatLossCorrectionFactor,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "ventilationHeatLossCorrectionFactor">;

export const ventilationHeatLoss = {
  key: "ventilationHeatLoss",
  resolve: (ctx) =>
    ctx.get("heatedAirVolume") *
    ctx.get("ventilationHeatLossCorrectionFactor") *
    ctx.get("airDensitySpecificHeatCapacityProduct"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "ventilationHeatLoss">;

export const ventilationHeatingDemand = {
  key: "ventilationHeatingDemand",
  resolve: (ctx) => ctx.get("ventilationHeatLoss") * ctx.get("heatingDegreeDays") * 0.024,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "ventilationHeatingDemand">;

export default [airDensitySpecificHeatCapacityProduct, ventilationHeatLossCorrectionFactor, ventilationHeatLoss, ventilationHeatingDemand];
