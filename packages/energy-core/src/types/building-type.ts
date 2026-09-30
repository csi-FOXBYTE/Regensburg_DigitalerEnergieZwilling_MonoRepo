import { z } from "zod";

export const BuildingType = {
  SINGLE_FAMILY: "singleFamily",
  MULTI_FAMILY: "multiFamily",
} as const;

export const BuildingTypeSchema = z.nativeEnum(BuildingType);
export type BuildingType = z.infer<typeof BuildingTypeSchema>;
