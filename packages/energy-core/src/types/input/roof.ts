import { z } from "zod";
import { YearInputSchema } from "../range-bands.js";
import { RoofInsulationTypeSchema } from "../roof-insulation-type.js";

export const DETRoofInputSchema = z.object({
  area: z.number(),
  isFlatRoof: z.boolean().nullable().optional(),
  year: YearInputSchema.nullable().optional(),
  hasInsulation: z.boolean().nullable().optional(),
  insulationType: RoofInsulationTypeSchema.nullable().optional(),
  constructionType: z.string().nullable().optional(),
  insulationThickness: z.number().nullable().optional(),
  uValue: z.number().nullable().optional(),
});

export type DETRoofInput = z.infer<typeof DETRoofInputSchema>;
