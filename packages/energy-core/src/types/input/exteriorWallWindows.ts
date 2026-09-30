import { z } from "zod";
import { YearInputSchema } from "../range-bands.js";

export const DETExteriorWallWindowsInputSchema = z.object({
  area: z.number().optional(),
  year: YearInputSchema.nullable().optional(),
  windowType: z.string().nullable().optional(),
  uValue: z.number().nullable().optional(),
});

export type DETExteriorWallWindowsInput = z.infer<typeof DETExteriorWallWindowsInputSchema>;
