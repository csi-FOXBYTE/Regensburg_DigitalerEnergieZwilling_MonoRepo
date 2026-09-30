import { z } from "zod";
import { keyedValues } from "../keyed-values.js";
import { yearBands } from "../range-bands.js";
import { SelectionSchema, selectionFilter } from "../selection.js";

export const DETBottomFloorConfigSchema = z.object({
  constructionTypes: z.array(SelectionSchema),
  allowedConstructionTypesByHeatedCellar: selectionFilter(z.boolean(), z.string()),
  defaultConstructionType: keyedValues(z.boolean(), yearBands(z.string())),
  uValue: keyedValues(z.string(), yearBands(z.number())),
  thermalConductivity: z.number(),
  assumedInsulationThickness: z.number(),
  heatLossFactor: z.number(),
});

export type DETBottomFloorConfig = z.infer<typeof DETBottomFloorConfigSchema>;
