import { z } from "zod";
import { keyedValues } from "../keyed-values.js";
import { yearBands } from "../range-bands.js";
import { InterpolatedNumberSchema, LinearInterpolationSchema } from "../interpolated-number.js";
import { HeatFlowDirectionSchema } from "../heat-flow-direction.js";
import { BuildingTypeSchema } from "../building-type.js";
import { SelectionSchema, selectionFilter } from "../selection.js";
import type { DETInput } from "../input/index.js";

export const CarrierRequirementsSchema = z.object({
  storage: z.boolean().optional(),
  gas: z.boolean().optional(),
});
export type CarrierRequirements = z.infer<typeof CarrierRequirementsSchema>;

export const CarrierSelectionSchema = SelectionSchema.extend({
  requirements: CarrierRequirementsSchema.optional(),
  excludeFromSystemRenewal: z.boolean().optional(),
});
export type CarrierSelection = z.infer<typeof CarrierSelectionSchema>;

export const HeatingSystemRequirementsSchema = z.object({
  geothermal: z.literal(true).optional(),
});
export type HeatingSystemRequirements = z.infer<typeof HeatingSystemRequirementsSchema>;

export const HeatingSystemSelectionSchema = SelectionSchema.extend({
  requirements: HeatingSystemRequirementsSchema.optional(),
  excludeFromSystemRenewal: z.boolean().optional(),
});
export type HeatingSystemSelection = z.infer<typeof HeatingSystemSelectionSchema>;

export const PrimaryEnergyCarrierDataSchema = z.object({
  energyPerUnit: z.number(),
  unit: z.string(),
  unitRate: z.number(),
  baseRate: z.number(),
  co2Factor: z.number(),
  primaryEnergyFactor: z.number(),
  source: z.string().optional(),
  date: z.string().optional(),
});
export type PrimaryEnergyCarrierData = z.infer<typeof PrimaryEnergyCarrierDataSchema>;

export const ElectricityTypeDataSchema = z.object({
  co2Factor: z.number(),
  unitRate: z.number(),
  baseRate: z.number(),
  primaryEnergyFactor: z.number(),
  source: z.string().optional(),
  date: z.string().optional(),
});
export type ElectricityTypeData = z.infer<typeof ElectricityTypeDataSchema>;

export const DETHeatConfigSchema = z.object({
  primaryEnergyCarriers: z.array(CarrierSelectionSchema),
  heatingSystemTypes: z.array(HeatingSystemSelectionSchema),
  heatingSurfaceTypes: z.array(SelectionSchema),
  allowedHeatingSystemTypesByCarrier: selectionFilter(z.string(), z.string()),
  electricityTypes: z.array(SelectionSchema),
  defaultElectricityType: z.string(),
  electricityTypeData: keyedValues(z.string(), ElectricityTypeDataSchema),
  electricalRatio: keyedValues(z.string(), z.number()),
  hasInternalGains: keyedValues(z.string(), z.boolean()),
  internalGainsFactorByBuildingType: keyedValues(z.string(), z.number()),

  hotWaterEnergyDemandFromAreaFactor: keyedValues(BuildingTypeSchema, z.number()),
  householdElectricityPerApartment: keyedValues(BuildingTypeSchema, LinearInterpolationSchema),
  ventilationHeatLossCorrectionFactor: z.number(),
  heatingDegreeDays: z.number(),
  defaultPrimaryEnergyCarrier: z.string(),
  defaultHeatingSystemType: keyedValues(z.string(), z.string()),
  defaultHeatingSurfaceType: z.string(),
  globalDefaultSource: z.string(),
  globalDefaultDate: z.string(),
  heatingPerformanceFactor: keyedValues(z.string(), yearBands(InterpolatedNumberSchema)),
  temperatureControlPerformanceFactor: keyedValues(z.string(), yearBands(keyedValues(z.string(), z.number()))),
  primaryEnergyCarrierData: keyedValues(z.string(), PrimaryEnergyCarrierDataSchema),
  innerSurfaceThermalResistance: keyedValues(HeatFlowDirectionSchema, z.number()),
  outerSurfaceThermalResistance: keyedValues(HeatFlowDirectionSchema, z.number()),
});
export type DETHeatConfig = z.infer<typeof DETHeatConfigSchema>;

export function isCarrierCompatible(carrier: CarrierSelection, input: DETInput): boolean {
  const { requirements } = carrier;
  if (!requirements) return true;
  if (requirements.storage !== undefined && requirements.storage !== (input.heat.hasStorage ?? false)) return false;
  if (requirements.gas !== undefined && requirements.gas !== (input.heat.hasGasSupply ?? true)) return false;
  return true;
}

export function isHeatingSystemCompatible(
  system: HeatingSystemSelection,
  input: DETInput,
): boolean {
  if (system.requirements?.geothermal !== true) return true;
  return input.heat.hasGeothermalAvailability ?? false;
}
