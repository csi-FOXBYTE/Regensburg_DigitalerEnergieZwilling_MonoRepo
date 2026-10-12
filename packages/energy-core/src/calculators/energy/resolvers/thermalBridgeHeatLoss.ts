import type { Resolver } from "../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../";

declare module "../" {
  interface DETCalculatorRegistry {
    thermalBridgeSurcharge: number;
    thermalEnvelopeArea: number;
    thermalBridgeHeatLoss: number;
    thermalBridgeHeatingDemand: number;
  }
}

export const thermalBridgeSurcharge = {
  key: "thermalBridgeSurcharge",
  resolve: (ctx) => ctx.input.config.heat.thermalBridgeSurcharge,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "thermalBridgeSurcharge">;

// Ages: sum of all component areas that enter the transmission heat loss,
// following the same roof/top-floor and window/opaque splits as the component resolvers
export const thermalEnvelopeArea = {
  key: "thermalEnvelopeArea",
  resolve: (ctx) => {
    const roofWindowsArea = ctx.get("roofWindowsArea");
    const exteriorWallWindowsArea = ctx.get("exteriorWallWindowsArea");
    const upperBoundaryArea = ctx.get("isSpaceBelowRoofHeated")
      ? Math.max(0, ctx.get("roofArea") - roofWindowsArea) + roofWindowsArea
      : ctx.get("topFloorArea");
    return (
      upperBoundaryArea +
      exteriorWallWindowsArea +
      Math.max(0, ctx.get("outerWallArea") - exteriorWallWindowsArea) +
      ctx.get("bottomFloorArea")
    );
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "thermalEnvelopeArea">;

export const thermalBridgeHeatLoss = {
  key: "thermalBridgeHeatLoss",
  resolve: (ctx) => ctx.get("thermalBridgeSurcharge") * ctx.get("thermalEnvelopeArea"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "thermalBridgeHeatLoss">;

export const thermalBridgeHeatingDemand = {
  key: "thermalBridgeHeatingDemand",
  resolve: (ctx) => ctx.get("thermalBridgeHeatLoss") * ctx.get("heatingDegreeDays") * 0.024,
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "thermalBridgeHeatingDemand">;

export default [
  thermalBridgeSurcharge,
  thermalEnvelopeArea,
  thermalBridgeHeatLoss,
  thermalBridgeHeatingDemand,
];
