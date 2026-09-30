import { z } from "zod";
import { YearInputSchema } from "../range-bands.js";

export const DETBottomFloorInputSchema = z.object({
  area: z.number(),
  year: YearInputSchema.nullable().optional(),
  isHeated: z.boolean().nullable().optional(),
  hasInsulation: z.boolean().nullable().optional(),
  constructionType: z.string().nullable().optional(),
  insulationThickness: z.number().nullable().optional(),
  hasBasement: z.boolean().nullable().optional(),
  isBasementHeated: z.boolean().nullable().optional(),
  uValue: z.number().nullable().optional(),
});

export type DETBottomFloorInput = z.infer<typeof DETBottomFloorInputSchema>;
