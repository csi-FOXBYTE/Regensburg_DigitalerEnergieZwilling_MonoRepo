import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";
import { HeatFlowDirection } from "../../../../types/heat-flow-direction.js";
import { resolveKeyedValue } from "../../../../types/keyed-values.js";
import { resolveYearBand } from "../../../../types/range-bands.js";

declare module "../../" {
  interface DETCalculatorRegistry {
    topFloorType: string;
    topFloorConstructionUValue: number;
    topFloorConstructionResistance: number;
    topFloorThermalConductivity: number;
    topFloorInnerSurfaceThermalResistance: number;
    topFloorOuterSurfaceThermalResistance: number;
    topFloorInsulationResistance: number;
    topFloorThermalResistance: number;
    topFloorUValue: number;
  }
}

export const topFloorType = {
  key: "topFloorType",
  resolve: (ctx) => {
    const override = ctx.input.input.topFloor.topFloorType;
    if (override != null) return override;
    const result = resolveYearBand(
      ctx.input.config.topFloor.defaultTopFloorType,
      ctx.get("topFloorYear"),
    );
    if (result == null) throw new Error("Failed to resolve topFloorType");
    return result;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "topFloorType">;

export const topFloorConstructionUValue = {
  key: "topFloorConstructionUValue",
  resolve: (ctx) => {
    const yearBands = resolveKeyedValue(
      ctx.input.config.topFloor.uValue,
      ctx.get("topFloorType"),
    );
    const result = resolveYearBand(yearBands, ctx.get("topFloorYear"));
    if (result == null) throw new Error("Failed to resolve topFloorConstructionUValue");
    return result;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "topFloorConstructionUValue">;

export const topFloorConstructionResistance = {
  key: "topFloorConstructionResistance",
  resolve: (ctx) => 1 / ctx.get("topFloorConstructionUValue"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "topFloorConstructionResistance">;

export const topFloorThermalConductivity = {
  key: "topFloorThermalConductivity",
  resolve: (ctx) => ctx.input.config.topFloor.thermalConductivity,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "topFloorThermalConductivity">;

export const topFloorInnerSurfaceThermalResistance = {
  key: "topFloorInnerSurfaceThermalResistance",
  resolve: (ctx) =>
    resolveKeyedValue(
      ctx.input.config.heat.innerSurfaceThermalResistance,
      HeatFlowDirection.UPWARD,
    ),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "topFloorInnerSurfaceThermalResistance">;

export const topFloorOuterSurfaceThermalResistance = {
  key: "topFloorOuterSurfaceThermalResistance",
  resolve: (ctx) =>
    resolveKeyedValue(
      ctx.input.config.heat.outerSurfaceThermalResistance,
      HeatFlowDirection.UPWARD,
    ),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "topFloorOuterSurfaceThermalResistance">;

export const topFloorInsulationResistance = {
  key: "topFloorInsulationResistance",
  resolve: (ctx) => {
    if (!ctx.get("topFloorHasInsulation")) return 0;
    // Rsi and Rse are already included in the construction U-value and must not be counted again.
    return ctx.get("topFloorInsulationThickness") / ctx.get("topFloorThermalConductivity");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "topFloorInsulationResistance">;

export const topFloorThermalResistance = {
  key: "topFloorThermalResistance",
  resolve: (ctx) =>
    ctx.get("topFloorConstructionResistance") + ctx.get("topFloorInsulationResistance"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "topFloorThermalResistance">;

export const topFloorUValue = {
  key: "topFloorUValue",
  resolve: (ctx) => {
    const override = ctx.input.input.topFloor.uValue;
    if (override != null) return override;
    return 1 / ctx.get("topFloorThermalResistance");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "topFloorUValue">;

export default [
  topFloorType,
  topFloorConstructionUValue,
  topFloorConstructionResistance,
  topFloorThermalConductivity,
  topFloorInnerSurfaceThermalResistance,
  topFloorOuterSurfaceThermalResistance,
  topFloorInsulationResistance,
  topFloorThermalResistance,
  topFloorUValue,
];
