import type { Resolver } from "../../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../../";
import type { RangeKey } from "../../../../types/range-bands.js";
import { resolveKeyedValue } from "../../../../types/keyed-values.js";
import { resolveYearBand } from "../../../../types/range-bands.js";

declare module "../../" {
  interface DETCalculatorRegistry {
    exteriorWallWindowsYear: number | RangeKey;
    exteriorWallWindowsArea: number;
    exteriorWallWindowsType: string;
    exteriorWallWindowsUValue: number;
  }
}

export const exteriorWallWindowsYear = {
  key: "exteriorWallWindowsYear",
  resolve: (ctx) => {
    const override = ctx.input.input.exteriorWallWindows.year;
    if (override != null) return override;
    return ctx.get("buildingYear");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "exteriorWallWindowsYear">;

export const exteriorWallWindowsArea = {
  key: "exteriorWallWindowsArea",
  resolve: (ctx) =>
    ctx.input.input.exteriorWallWindows.area ??
    Math.max(
      0,
      ctx.get("outerWallArea") * ctx.input.config.windows.exteriorWallAreaFactor,
    ),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "exteriorWallWindowsArea">;

export const exteriorWallWindowsType = {
  key: "exteriorWallWindowsType",
  resolve: (ctx) => {
    const override = ctx.input.input.exteriorWallWindows.windowType;
    if (override != null) return override;
    const result = resolveYearBand(
      ctx.input.config.windows.defaultWindowType,
      ctx.get("exteriorWallWindowsYear"),
    );
    if (result == null) throw new Error("Failed to resolve exteriorWallWindowsType");
    return result;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "exteriorWallWindowsType">;

export const exteriorWallWindowsUValue = {
  key: "exteriorWallWindowsUValue",
  resolve: (ctx) => {
    const override = ctx.input.input.exteriorWallWindows.uValue;
    if (override != null) return override;
    const yearBands = resolveKeyedValue(
      ctx.input.config.windows.uValue,
      ctx.get("exteriorWallWindowsType"),
    );
    const result = resolveYearBand(yearBands, ctx.get("exteriorWallWindowsYear"));
    if (result == null) throw new Error("Failed to resolve exteriorWallWindowsUValue");
    return result;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "exteriorWallWindowsUValue">;

export default [exteriorWallWindowsYear, exteriorWallWindowsArea, exteriorWallWindowsType, exteriorWallWindowsUValue];
