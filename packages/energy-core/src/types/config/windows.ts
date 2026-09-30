import { z } from "zod";
import { keyedValues } from "../keyed-values.js";
import { yearBands } from "../range-bands.js";
import { SelectionSchema } from "../selection.js";

export const DETWindowsConfigSchema = z.object({
  windowTypes: z.array(SelectionSchema),
  defaultWindowType: yearBands(z.string()),
  uValue: keyedValues(z.string(), yearBands(z.number())),
  roofWindowsHeatLossFactor: z.number(),
  exteriorWallWindowsHeatLossFactor: z.number(),
  roofAreaFactor: z.number(),
  exteriorWallAreaFactor: z.number(),
});

export type DETWindowsConfig = z.infer<typeof DETWindowsConfigSchema>;
