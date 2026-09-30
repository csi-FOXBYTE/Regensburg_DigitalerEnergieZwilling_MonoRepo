import { z } from "zod";
import { keyedValues } from "../keyed-values.js";
import { yearBands } from "../range-bands.js";
import { SelectionSchema } from "../selection.js";

export const DETTopFloorConfigSchema = z.object({
  topFloorTypes: z.array(SelectionSchema),
  defaultTopFloorType: yearBands(z.string()),
  defaultHasAtticByIsFlatRoof: keyedValues(z.boolean(), z.boolean()),
  defaultIsAtticHeated: z.boolean(),
  thermalConductivity: z.number(),
  assumedInsulationThickness: z.number(),
  uValue: keyedValues(z.string(), yearBands(z.number())),
  heatLossFactor: z.number(),
});

export type DETTopFloorConfig = z.infer<typeof DETTopFloorConfigSchema>;
