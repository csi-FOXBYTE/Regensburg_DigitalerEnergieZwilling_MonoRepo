import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";
import { HeatFlowDirection } from "../../../../types/heat-flow-direction.js";
import { resolveKeyedValue } from "../../../../types/keyed-values.js";
import { resolveYearBand } from "../../../../types/range-bands.js";

declare module "../../" {
  interface DETCalculatorRegistry {
    bottomFloorConstructionType: string;
    bottomFloorConstructionUValue: number;
    bottomFloorConstructionResistance: number;
    bottomFloorThermalConductivity: number;
    bottomFloorInnerSurfaceThermalResistance: number;
    bottomFloorOuterSurfaceThermalResistance: number;
    bottomFloorInsulationResistance: number;
    bottomFloorThermalResistance: number;
    bottomFloorUValue: number;
  }
}

export const bottomFloorConstructionType = {
  key: "bottomFloorConstructionType",
  resolve: (ctx) => {
    const override = ctx.input.input.bottomFloor.constructionType;
    if (override != null) return override;
    const yearBands = resolveKeyedValue(
      ctx.input.config.bottomFloor.defaultConstructionType,
      ctx.get("isSpaceAboveBaseSlabHeated"),
    );
    const result = resolveYearBand(yearBands, ctx.get("bottomFloorYear"));
    if (result == null) throw new Error("Failed to resolve bottomFloorConstructionType");
    return result;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "bottomFloorConstructionType">;

export const bottomFloorConstructionUValue = {
  key: "bottomFloorConstructionUValue",
  resolve: (ctx) => {
    const yearBands = resolveKeyedValue(
      ctx.input.config.bottomFloor.uValue,
      ctx.get("bottomFloorConstructionType"),
    );
    const result = resolveYearBand(yearBands, ctx.get("bottomFloorYear"));
    if (result == null) throw new Error("Failed to resolve bottomFloorConstructionUValue");
    return result;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "bottomFloorConstructionUValue">;

export const bottomFloorConstructionResistance = {
  key: "bottomFloorConstructionResistance",
  resolve: (ctx) => 1 / ctx.get("bottomFloorConstructionUValue"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "bottomFloorConstructionResistance">;

export const bottomFloorThermalConductivity = {
  key: "bottomFloorThermalConductivity",
  resolve: (ctx) => ctx.input.config.bottomFloor.thermalConductivity,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "bottomFloorThermalConductivity">;

export const bottomFloorInnerSurfaceThermalResistance = {
  key: "bottomFloorInnerSurfaceThermalResistance",
  resolve: (ctx) =>
    resolveKeyedValue(
      ctx.input.config.heat.innerSurfaceThermalResistance,
      HeatFlowDirection.DOWNWARD,
    ),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "bottomFloorInnerSurfaceThermalResistance">;

export const bottomFloorOuterSurfaceThermalResistance = {
  key: "bottomFloorOuterSurfaceThermalResistance",
  resolve: (ctx) =>
    resolveKeyedValue(
      ctx.input.config.heat.outerSurfaceThermalResistance,
      HeatFlowDirection.DOWNWARD,
    ),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "bottomFloorOuterSurfaceThermalResistance">;

export const bottomFloorInsulationResistance = {
  key: "bottomFloorInsulationResistance",
  resolve: (ctx) => {
    if (!ctx.get("bottomFloorHasInsulation")) return 0;
    // Rsi and Rse are already included in the construction U-value and must not be counted again.
    return ctx.get("bottomFloorInsulationThickness") / ctx.get("bottomFloorThermalConductivity");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "bottomFloorInsulationResistance">;

export const bottomFloorThermalResistance = {
  key: "bottomFloorThermalResistance",
  resolve: (ctx) =>
    ctx.get("bottomFloorConstructionResistance") + ctx.get("bottomFloorInsulationResistance"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "bottomFloorThermalResistance">;

export const bottomFloorUValue = {
  key: "bottomFloorUValue",
  resolve: (ctx) => {
    const override = ctx.input.input.bottomFloor.uValue;
    if (override != null) return override;
    return 1 / ctx.get("bottomFloorThermalResistance");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "bottomFloorUValue">;

export default [
  bottomFloorConstructionType,
  bottomFloorConstructionUValue,
  bottomFloorConstructionResistance,
  bottomFloorThermalConductivity,
  bottomFloorInnerSurfaceThermalResistance,
  bottomFloorOuterSurfaceThermalResistance,
  bottomFloorInsulationResistance,
  bottomFloorThermalResistance,
  bottomFloorUValue,
];
