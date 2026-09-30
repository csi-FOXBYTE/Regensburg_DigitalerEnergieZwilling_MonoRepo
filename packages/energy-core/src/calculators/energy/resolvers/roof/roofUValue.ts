import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";
import { HeatFlowDirection } from "../../../../types/heat-flow-direction.js";
import { resolveKeyedValue } from "../../../../types/keyed-values.js";
import { resolveYearBand } from "../../../../types/range-bands.js";
import { RoofInsulationType } from "../../../../types/roof-insulation-type.js";

declare module "../../" {
  interface DETCalculatorRegistry {
    roofConstructionType: string;
    roofConstructionUValue: number;
    roofConstructionResistance: number;
    roofThermalConductivity: number;
    roofInnerSurfaceThermalResistance: number;
    roofOuterSurfaceThermalResistance: number;
    roofInsulationReductionFactor: number;
    roofInsulationResistance: number;
    betweenRafterRoofResistance: number;
    roofTotalThermalResistance: number;
    roofUValue: number;
  }
}

export const roofConstructionType = {
  key: "roofConstructionType",
  resolve: (ctx) => {
    const override = ctx.input.input.roof.constructionType;
    if (override != null) return override;
    return resolveKeyedValue(
      ctx.input.config.roof.defaultConstructionTypeByIsFlatRoof,
      ctx.get("isFlatRoof"),
    );
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofConstructionType">;

export const roofConstructionUValue = {
  key: "roofConstructionUValue",
  resolve: (ctx) => {
    const yearBands = resolveKeyedValue(
      ctx.input.config.roof.uValue,
      ctx.get("roofConstructionType"),
    );
    const result = resolveYearBand(yearBands, ctx.get("roofYear"));
    if (result == null) throw new Error("Failed to resolve roofConstructionUValue");
    return result;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofConstructionUValue">;

export const roofConstructionResistance = {
  key: "roofConstructionResistance",
  resolve: (ctx) => 1 / ctx.get("roofConstructionUValue"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofConstructionResistance">;

export const roofThermalConductivity = {
  key: "roofThermalConductivity",
  resolve: (ctx) => ctx.input.config.roof.thermalConductivity,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofThermalConductivity">;

export const roofInnerSurfaceThermalResistance = {
  key: "roofInnerSurfaceThermalResistance",
  resolve: (ctx) =>
    resolveKeyedValue(
      ctx.input.config.heat.innerSurfaceThermalResistance,
      HeatFlowDirection.UPWARD,
    ),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofInnerSurfaceThermalResistance">;

export const roofOuterSurfaceThermalResistance = {
  key: "roofOuterSurfaceThermalResistance",
  resolve: (ctx) =>
    resolveKeyedValue(
      ctx.input.config.heat.outerSurfaceThermalResistance,
      HeatFlowDirection.UPWARD,
    ),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofOuterSurfaceThermalResistance">;

export const roofInsulationReductionFactor = {
  key: "roofInsulationReductionFactor",
  resolve: (ctx) => ctx.input.config.roof.insulationReductionFactor,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofInsulationReductionFactor">;

export const roofInsulationResistance = {
  key: "roofInsulationResistance",
  resolve: (ctx) => {
    if (!ctx.get("roofHasInsulation")) return 0;
    // Rsi and Rse are already included in the construction U-value and must not be counted again.
    return ctx.get("roofInsulationThickness") / ctx.get("roofThermalConductivity");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofInsulationResistance">;

export const betweenRafterRoofResistance = {
  key: "betweenRafterRoofResistance",
  resolve: (ctx) =>
    ctx.get("roofInsulationResistance") / (ctx.get("roofInsulationReductionFactor") + 1),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "betweenRafterRoofResistance">;

export const roofTotalThermalResistance = {
  key: "roofTotalThermalResistance",
  resolve: (ctx) => {
    if (ctx.get("roofInsulationType") === RoofInsulationType.BETWEEN_RAFTER) {
      return ctx.get("betweenRafterRoofResistance");
    }
    return ctx.get("roofConstructionResistance") + ctx.get("roofInsulationResistance");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofTotalThermalResistance">;

export const roofUValue = {
  key: "roofUValue",
  resolve: (ctx) => {
    const override = ctx.input.input.roof.uValue;
    if (override != null) return override;
    return 1 / ctx.get("roofTotalThermalResistance");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofUValue">;

export default [
  roofConstructionType,
  roofConstructionUValue,
  roofConstructionResistance,
  roofThermalConductivity,
  roofInnerSurfaceThermalResistance,
  roofOuterSurfaceThermalResistance,
  roofInsulationReductionFactor,
  roofInsulationResistance,
  betweenRafterRoofResistance,
  roofTotalThermalResistance,
  roofUValue,
];
