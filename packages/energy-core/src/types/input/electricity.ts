import { z } from "zod";

export const DETElectricityInputSchema = z.object({
  electricityType: z.string().nullable().optional(),
  electricityUnitRate: z.number().nullable().optional(),
  userElectricityBaseRate: z.number().nullable().optional(),
  userElectricityConsumption: z.number().nullable().optional(),
});

export type DETElectricityInput = z.infer<typeof DETElectricityInputSchema>;
