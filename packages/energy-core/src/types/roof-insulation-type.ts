import { z } from "zod";

export const RoofInsulationType = {
  BETWEEN_RAFTER: "betweenRafter",
  ABOVE_RAFTER: "aboveRafter",
} as const;

export const RoofInsulationTypeSchema = z.nativeEnum(RoofInsulationType);
export type RoofInsulationType = z.infer<typeof RoofInsulationTypeSchema>;
