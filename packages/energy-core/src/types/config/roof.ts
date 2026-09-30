import { z } from "zod";
import { keyedValues } from "../keyed-values.js";
import { yearBands } from "../range-bands.js";
import { RoofInsulationTypeSchema } from "../roof-insulation-type.js";
import { SelectionSchema } from "../selection.js";

export const DETRoofConfigSchema = z.object({
  heatLossFactor: z.number(),
  defaultInsulationType: RoofInsulationTypeSchema,
  constructionTypes: z.array(SelectionSchema),
  defaultIsFlatRoof: z.boolean(),
  defaultConstructionTypeByIsFlatRoof: keyedValues(z.boolean(), z.string()),
  assumedInsulationThickness: z.number(),
  thermalConductivity: z.number(),
  insulationReductionFactor: z.number(),
  uValue: keyedValues(z.string(), yearBands(z.number())),
});

export type DETRoofConfig = z.infer<typeof DETRoofConfigSchema>;
