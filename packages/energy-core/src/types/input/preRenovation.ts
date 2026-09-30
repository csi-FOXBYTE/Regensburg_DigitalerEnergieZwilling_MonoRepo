import { z } from "zod";

export const PreRenovationValuesSchema = z.object({
  totalEnergyDemand: z.number(),
  primaryEnergyCarrier: z.string(),
  heatingSystemType: z.string(),
  electricityOffset: z.number(),
  hadInternalGains: z.boolean(),
});

export type PreRenovationValues = z.infer<typeof PreRenovationValuesSchema>;
