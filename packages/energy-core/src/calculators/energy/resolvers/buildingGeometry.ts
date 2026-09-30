import type { Resolver } from "../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../";
import { resolveKeyedValue } from "../../../types/keyed-values.js";
import { resolveRangeBand } from "../../../types/range-bands.js";

declare module "../" {
  interface DETCalculatorRegistry {
    floorSlabThickness: number;
    interiorStoryHeight: number;
    numberOfStories: number;
    numberOfHeatedStories: number;
    aboveGroundHeatedHeight: number;
    totalStoryHeight: number;
    grossHeatedVolume: number;
    heatedAirVolumeCorrectionFactor: number;
    heatedAirVolume: number;
    usableFloorAreaFactor: number;
    usableFloorArea: number;
    netFloorAreaFromLivingAreaFactor: number;
    netFloorAreaFromUsableFloorAreaFactor: number;
    netFloorArea: number;
  }
}

export const floorSlabThickness = {
  key: "floorSlabThickness",
  resolve: (ctx) => ctx.input.config.general.assumedFloorSlabThickness,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "floorSlabThickness">;

export const interiorStoryHeight = {
  key: "interiorStoryHeight",
  resolve: (ctx) => {
    const stories = ctx.get("numberOfStories");
    const heatedAttic = ctx.get("hasAttic") && ctx.get("isAtticHeated");
    const heatedAboveGroundStories = stories + (heatedAttic ? 1 : 0);
    // A heated attic has no additional slab above it.
    return (
      (ctx.get("aboveGroundHeatedHeight") - stories * ctx.get("floorSlabThickness")) /
      heatedAboveGroundStories
    );
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "interiorStoryHeight">;

export const numberOfStories = {
  key: "numberOfStories",
  resolve: (ctx) => {
    const override = ctx.input.input.general.numberOfStories;
    if (override != null) return override;
    return Math.max(
      1,
      Math.round(
        ctx.get("lowestEaveHeight") /
          (ctx.input.config.general.assumedInteriorStoryHeight + ctx.get("floorSlabThickness")),
      ),
    );
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "numberOfStories">;

export const numberOfHeatedStories = {
  key: "numberOfHeatedStories",
  resolve: (ctx) =>
    ctx.get("numberOfStories") +
    (ctx.get("hasAttic") && ctx.get("isAtticHeated") ? 1 : 0) +
    (ctx.get("hasBasement") && ctx.get("isBasementHeated") ? 1 : 0),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "numberOfHeatedStories">;

export const aboveGroundHeatedHeight = {
  key: "aboveGroundHeatedHeight",
  resolve: (ctx) =>
    ctx.get("hasAttic") && ctx.get("isAtticHeated")
      ? ctx.get("buildingHeight")
      : ctx.get("lowestEaveHeight"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "aboveGroundHeatedHeight">;

export const totalStoryHeight = {
  key: "totalStoryHeight",
  resolve: (ctx) => {
    const basementHeight = ctx.get("hasBasement") && ctx.get("isBasementHeated")
      ? ctx.get("interiorStoryHeight") + ctx.get("floorSlabThickness")
      : 0;
    return ctx.get("aboveGroundHeatedHeight") + basementHeight;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "totalStoryHeight">;

export const grossHeatedVolume = {
  key: "grossHeatedVolume",
  resolve: (ctx) => ctx.get("buildingBaseArea") * ctx.get("totalStoryHeight"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "grossHeatedVolume">;

export const heatedAirVolumeCorrectionFactor = {
  key: "heatedAirVolumeCorrectionFactor",
  resolve: (ctx) => {
    const result = resolveRangeBand(
      ctx.input.config.general.heatedAirVolumeCorrectionFactor,
      ctx.get("numberOfStories"),
    );
    if (result == null) throw new Error("Failed to resolve heatedAirVolumeCorrectionFactor");
    return result;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "heatedAirVolumeCorrectionFactor">;

export const heatedAirVolume = {
  key: "heatedAirVolume",
  resolve: (ctx) => ctx.get("grossHeatedVolume") * ctx.get("heatedAirVolumeCorrectionFactor"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "heatedAirVolume">;

export const usableFloorAreaFactor = {
  key: "usableFloorAreaFactor",
  resolve: (ctx) => ctx.input.config.general.usableFloorAreaFactor,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "usableFloorAreaFactor">;

export const usableFloorArea = {
  key: "usableFloorArea",
  resolve: (ctx) => ctx.get("grossHeatedVolume") * ctx.get("usableFloorAreaFactor"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "usableFloorArea">;

export const netFloorAreaFromLivingAreaFactor = {
  key: "netFloorAreaFromLivingAreaFactor",
  resolve: (ctx) => ctx.input.config.general.netFloorAreaFromLivingAreaFactor,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "netFloorAreaFromLivingAreaFactor">;

export const netFloorAreaFromUsableFloorAreaFactor = {
  key: "netFloorAreaFromUsableFloorAreaFactor",
  resolve: (ctx) => {
    const byBuildingType = resolveKeyedValue(
      ctx.input.config.general.netFloorAreaFromUsableFloorAreaFactor,
      ctx.get("buildingType"),
    );
    return resolveKeyedValue(byBuildingType, ctx.get("isBasementHeated"));
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "netFloorAreaFromUsableFloorAreaFactor">;

export const netFloorArea = {
  key: "netFloorArea",
  resolve: (ctx) => {
    const livingArea = ctx.get("livingArea");
    if (livingArea != null) {
      return livingArea * ctx.get("netFloorAreaFromLivingAreaFactor");
    }
    return ctx.get("usableFloorArea") * ctx.get("netFloorAreaFromUsableFloorAreaFactor");
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "netFloorArea">;

export default [
  floorSlabThickness,
  interiorStoryHeight,
  numberOfStories,
  numberOfHeatedStories,
  aboveGroundHeatedHeight,
  totalStoryHeight,
  grossHeatedVolume,
  heatedAirVolumeCorrectionFactor,
  heatedAirVolume,
  usableFloorAreaFactor,
  usableFloorArea,
  netFloorAreaFromLivingAreaFactor,
  netFloorAreaFromUsableFloorAreaFactor,
  netFloorArea,
];
