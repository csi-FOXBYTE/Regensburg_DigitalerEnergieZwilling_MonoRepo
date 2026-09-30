import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";
import type { RangeKey } from "../../../../types/range-bands.js";
import { resolveKeyedValue } from "../../../../types/keyed-values.js";
import { resolveYearBand } from "../../../../types/range-bands.js";

declare module "../../" {
  interface DETCalculatorRegistry {
    roofWindowsYear: number | RangeKey;
    roofWindowsArea: number;
    roofWindowsType: string;
    roofWindowsUValue: number;
  }
}

export const roofWindowsYear = {
  key: "roofWindowsYear",
  resolve: (ctx) => {
    const override = ctx.input.input.roofWindows.year;
    if (override != null) return override;
    return ctx.get("buildingYear");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofWindowsYear">;

export const roofWindowsArea = {
  key: "roofWindowsArea",
  resolve: (ctx) =>
    ctx.input.input.roofWindows.area ??
    ctx.get("roofArea") * ctx.input.config.windows.roofAreaFactor,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofWindowsArea">;

export const roofWindowsType = {
  key: "roofWindowsType",
  resolve: (ctx) => {
    const override = ctx.input.input.roofWindows.windowType;
    if (override != null) return override;
    const result = resolveYearBand(
      ctx.input.config.windows.defaultWindowType,
      ctx.get("roofWindowsYear"),
    );
    if (result == null) throw new Error("Failed to resolve roofWindowsType");
    return result;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofWindowsType">;

export const roofWindowsUValue = {
  key: "roofWindowsUValue",
  resolve: (ctx) => {
    const override = ctx.input.input.roofWindows.uValue;
    if (override != null) return override;
    const yearBands = resolveKeyedValue(
      ctx.input.config.windows.uValue,
      ctx.get("roofWindowsType"),
    );
    const result = resolveYearBand(yearBands, ctx.get("roofWindowsYear"));
    if (result == null) throw new Error("Failed to resolve roofWindowsUValue");
    return result;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "roofWindowsUValue">;

export default [roofWindowsYear, roofWindowsArea, roofWindowsType, roofWindowsUValue];
