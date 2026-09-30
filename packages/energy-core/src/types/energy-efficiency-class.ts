import { z } from "zod";

export const EnergyEfficiencyClassSchema = z.string();
export type EnergyEfficiencyClass = z.infer<typeof EnergyEfficiencyClassSchema>;
