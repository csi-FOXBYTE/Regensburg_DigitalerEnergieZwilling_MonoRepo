import { z } from "zod";
import { YearInputSchema } from "../range-bands.js";

export const DETHeatInputSchema = z.object({
  heatingSystemConstructionYear: YearInputSchema.nullable().optional(),
  primaryEnergyCarrier: z.string().nullable().optional(),
  heatingSystemType: z.string().nullable().optional(),
  heatingSurfaceType: z.string().nullable().optional(),
  hasGasSupply: z.boolean().nullable().optional(),
  hasStorage: z.boolean().nullable().optional(),
  hasGeothermalAvailability: z.boolean().nullable().optional(),
  userThermalUnitRate: z.number().nullable().optional(),
  userThermalTotalCost: z.number().nullable().optional(),
  userThermalBaseRate: z.number().nullable().optional(),
});

export type DETHeatInput = z.infer<typeof DETHeatInputSchema>;
