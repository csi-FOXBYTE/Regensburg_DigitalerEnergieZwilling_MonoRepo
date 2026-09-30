import type { Resolver } from "../../../engine/index.js";
import type { DETCalculatorRegistry, DETCalculatorContext } from "../";
import type { EnergyEfficiencyClass } from "../../../types/energy-efficiency-class.js";

declare module "../" {
  interface DETCalculatorRegistry {
    totalEnergyDemand: number;
    totalEnergyDemandPerSquareMeter: number;
    primaryEnergyDemand: number;
    primaryEnergyDemandPerSquareMeter: number;
    totalCost: number;
    totalHeatingCost: number;
    totalCo2Emissions: number;
    energyEfficiencyClass: EnergyEfficiencyClass;
  }
}

export const totalEnergyDemand = {
  key: "totalEnergyDemand",
  resolve: (ctx) => ctx.get("thermalEnergyDemand") + ctx.get("electricalEnergyDemand"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "totalEnergyDemand">;

export const totalEnergyDemandPerSquareMeter = {
  key: "totalEnergyDemandPerSquareMeter",
  resolve: (ctx) => ctx.get("totalEnergyDemand") / ctx.get("usableFloorArea"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "totalEnergyDemandPerSquareMeter">;

export const primaryEnergyDemand = {
  key: "primaryEnergyDemand",
  resolve: (ctx) =>
    ctx.get("thermalPrimaryEnergyDemand") + ctx.get("electricalPrimaryEnergyDemand"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "primaryEnergyDemand">;

export const primaryEnergyDemandPerSquareMeter = {
  key: "primaryEnergyDemandPerSquareMeter",
  resolve: (ctx) => ctx.get("primaryEnergyDemand") / ctx.get("usableFloorArea"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "primaryEnergyDemandPerSquareMeter">;

export const totalCost = {
  key: "totalCost",
  resolve: (ctx) => ctx.get("thermalCarrierCost") + ctx.get("electricityCost"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "totalCost">;

export const totalHeatingCost = {
  key: "totalHeatingCost",
  resolve: (ctx) =>
    ctx.get("thermalCarrierCost") +
    ctx.get("electricalHeatingEnergyDemand") * ctx.get("electricityUnitRate"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "totalHeatingCost">;

export const totalCo2Emissions = {
  key: "totalCo2Emissions",
  resolve: (ctx) => ctx.get("thermalCo2Emissions") + ctx.get("electricityCo2Emissions"),
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "totalCo2Emissions">;

export const energyEfficiencyClass = {
  key: "energyEfficiencyClass",
  resolve: (ctx) => {
    const demand = ctx.get("totalEnergyDemandPerSquareMeter");
    const result = ctx.input.config.general.energyEfficiencyClasses.find((band) => {
      const upperBound = "to" in band ? band.to : undefined;
      return typeof upperBound !== "number" || demand <= upperBound;
    })?.value;
    if (result == null) throw new Error("Failed to resolve energyEfficiencyClass");
    return result;
  },
} satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "energyEfficiencyClass">;

export default [
  totalEnergyDemand,
  totalEnergyDemandPerSquareMeter,
  primaryEnergyDemand,
  primaryEnergyDemandPerSquareMeter,
  totalCost,
  totalHeatingCost,
  totalCo2Emissions,
  energyEfficiencyClass,
];
