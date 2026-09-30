import { z } from "zod";
import { YearInputSchema } from "../range-bands.js";

export const DETOuterWallInputSchema = z.object({
  area: z.number().nullable().optional(),
  areaWithoutAttic: z.number(),
  atticArea: z.number(),
  adjacentWallArea: z.number().nullable().optional(),
  year: YearInputSchema.nullable().optional(),
  hasInsulation: z.boolean().nullable().optional(),
  constructionType: z.string().nullable().optional(),
  insulationThickness: z.number().nullable().optional(),
  uValue: z.number().nullable().optional(),
});

export type DETOuterWallInput = z.infer<typeof DETOuterWallInputSchema>;
