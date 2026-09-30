import { z } from "zod";
import type { DETInput } from "../input/index.js";
import { RangeKeySchema } from "../range-bands.js";

export const insulationKeys = [
  "roof",
  "topFloor",
  "bottomFloor",
  "outerWalls",
  "outerWindows",
  "roofWindows",
] as const;

export type InsulationRenovationKeys = (typeof insulationKeys)[number];

export const InsulationRenovationConfigSchema = z.object({
  uValue: z.number(),
  recommendYearRange: RangeKeySchema,
});
export type InsulationRenovationConfig = z.infer<typeof InsulationRenovationConfigSchema>;

export const InsulationRenovationConfigsSchema = z.object({
  roof: InsulationRenovationConfigSchema,
  topFloor: InsulationRenovationConfigSchema,
  bottomFloor: InsulationRenovationConfigSchema,
  outerWalls: InsulationRenovationConfigSchema,
  outerWindows: InsulationRenovationConfigSchema,
  roofWindows: InsulationRenovationConfigSchema,
});
export type InsulationRenovationConfigs = z.infer<typeof InsulationRenovationConfigsSchema>;

export const HeatingRenovationConfigSchema = z.object({
  targetCarrier: z.string(),
  targetSystem: z.string(),
  priority: z.number(),
});
export type HeatingRenovationConfig = z.infer<typeof HeatingRenovationConfigSchema>;

export const HeatingRenovationLabelTemplatesSchema = z.object({
  carrierAndSystem: z.record(z.string()),
  carrierOnly: z.record(z.string()),
  systemOnly: z.record(z.string()),
});
export type HeatingRenovationLabelTemplates = z.infer<typeof HeatingRenovationLabelTemplatesSchema>;

export const HeatingSurfaceRenovationConfigSchema = z.object({
  targetSurfaceType: z.string(),
  localization: z.record(z.string()),
  recommendedForSystems: z.array(z.string()),
});
export type HeatingSurfaceRenovationConfig = z.infer<typeof HeatingSurfaceRenovationConfigSchema>;

export const DETRenovationConfigSchema = z.object({
  primaryEnergyCarrierTargets: z.array(z.string()),
  heatingRenovations: z.array(HeatingRenovationConfigSchema),
  heatingRenovationLabelTemplates: HeatingRenovationLabelTemplatesSchema,
  insulationRenovations: InsulationRenovationConfigsSchema,
  heatingSurfaceRenovations: z.array(HeatingSurfaceRenovationConfigSchema),
});
export type DETRenovationConfig = z.infer<typeof DETRenovationConfigSchema>;

// Hand-written types — internal renovation system, not part of validation API
export type InputPatch = {
  [K in keyof DETInput]?: Partial<DETInput[K]>;
};

export interface Renovation {
  id: string;
  label: string;
  patch: InputPatch;
  recommended: boolean;
}
