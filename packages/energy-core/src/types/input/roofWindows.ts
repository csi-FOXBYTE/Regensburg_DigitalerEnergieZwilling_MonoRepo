import { z } from "zod";
import { YearInputSchema } from "../range-bands.js";

export const DETRoofWindowsInputSchema = z.object({
  area: z.number().optional(),
  year: YearInputSchema.nullable().optional(),
  windowType: z.string().nullable().optional(),
  uValue: z.number().nullable().optional(),
});

export type DETRoofWindowsInput = z.infer<typeof DETRoofWindowsInputSchema>;
