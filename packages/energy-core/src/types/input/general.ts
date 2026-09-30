import { z } from "zod";
import { BuildingTypeSchema } from "../building-type.js";
import { YearInputSchema } from "../range-bands.js";

export const DETGeneralInputSchema = z.object({
  buildingYear: YearInputSchema,
  numberOfStories: z.number().int().min(1).nullable().optional(),
  buildingHeight: z.number(),
  lowestEaveHeight: z.number(),
  buildingBaseArea: z.number().positive(),
  livingArea: z.number().nullable().optional(),
  numberOfApartments: z.number().int().positive().nullable().optional(),
  numberOfPeople: z.number().int().nonnegative().nullable().optional(),
  type: BuildingTypeSchema,
});

export type DETGeneralInput = z.infer<typeof DETGeneralInputSchema>;
