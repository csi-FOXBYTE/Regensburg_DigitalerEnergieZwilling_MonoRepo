import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";
import { HeatFlowDirection } from "../../../../types/heat-flow-direction.js";
import { resolveKeyedValue } from "../../../../types/keyed-values.js";
import { resolveYearBand } from "../../../../types/range-bands.js";

declare module "../../" {
  interface DETCalculatorRegistry {
    outerWallConstructionType: string;
    outerWallConstructionUValue: number;
    outerWallConstructionResistance: number;
    outerWallThermalConductivity: number;
    outerWallInnerSurfaceThermalResistance: number;
    outerWallOuterSurfaceThermalResistance: number;
    outerWallInsulationResistance: number;
    outerWallThermalResistance: number;
    outerWallUValue: number;
  }
}

export const outerWallConstructionType = {
  key: "outerWallConstructionType",
  resolve: (ctx) => {
    const override = ctx.input.input.outerWall.constructionType;
    if (override != null) return override;
    const result = resolveYearBand(
      ctx.input.config.outerWall.defaultConstructionType,
      ctx.get("outerWallYear"),
    );
    if (result == null) throw new Error("Failed to resolve outerWallConstructionType");
    return result;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "outerWallConstructionType">;

export const outerWallConstructionUValue = {
  key: "outerWallConstructionUValue",
  resolve: (ctx) => {
    const yearBands = resolveKeyedValue(
      ctx.input.config.outerWall.uValue,
      ctx.get("outerWallConstructionType"),
    );
    const result = resolveYearBand(yearBands, ctx.get("outerWallYear"));
    if (result == null) throw new Error("Failed to resolve outerWallConstructionUValue");
    return result;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "outerWallConstructionUValue">;

export const outerWallConstructionResistance = {
  key: "outerWallConstructionResistance",
  resolve: (ctx) => 1 / ctx.get("outerWallConstructionUValue"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "outerWallConstructionResistance">;

export const outerWallThermalConductivity = {
  key: "outerWallThermalConductivity",
  resolve: (ctx) => ctx.input.config.outerWall.thermalConductivity,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "outerWallThermalConductivity">;

export const outerWallInnerSurfaceThermalResistance = {
  key: "outerWallInnerSurfaceThermalResistance",
  resolve: (ctx) =>
    resolveKeyedValue(
      ctx.input.config.heat.innerSurfaceThermalResistance,
      HeatFlowDirection.HORIZONTAL,
    ),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "outerWallInnerSurfaceThermalResistance">;

export const outerWallOuterSurfaceThermalResistance = {
  key: "outerWallOuterSurfaceThermalResistance",
  resolve: (ctx) =>
    resolveKeyedValue(
      ctx.input.config.heat.outerSurfaceThermalResistance,
      HeatFlowDirection.HORIZONTAL,
    ),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "outerWallOuterSurfaceThermalResistance">;

export const outerWallInsulationResistance = {
  key: "outerWallInsulationResistance",
  resolve: (ctx) => {
    if (!ctx.get("outerWallHasInsulation")) return 0;
    // Rsi and Rse are already included in the construction U-value and must not be counted again.
    return ctx.get("outerWallInsulationThickness") / ctx.get("outerWallThermalConductivity");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "outerWallInsulationResistance">;

export const outerWallThermalResistance = {
  key: "outerWallThermalResistance",
  resolve: (ctx) =>
    ctx.get("outerWallConstructionResistance") + ctx.get("outerWallInsulationResistance"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "outerWallThermalResistance">;

export const outerWallUValue = {
  key: "outerWallUValue",
  resolve: (ctx) => {
    const override = ctx.input.input.outerWall.uValue;
    if (override != null) return override;
    return 1 / ctx.get("outerWallThermalResistance");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "outerWallUValue">;

export default [
  outerWallConstructionType,
  outerWallConstructionUValue,
  outerWallConstructionResistance,
  outerWallThermalConductivity,
  outerWallInnerSurfaceThermalResistance,
  outerWallOuterSurfaceThermalResistance,
  outerWallInsulationResistance,
  outerWallThermalResistance,
  outerWallUValue,
];
