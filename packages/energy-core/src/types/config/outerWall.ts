import { z } from "zod";
import { keyedValues } from "../keyed-values.js";
import { yearBands } from "../range-bands.js";
import { SelectionSchema } from "../selection.js";

export const OuterWallConstructionTypeSchema = SelectionSchema.extend({
  allowsAdditionalInsulation: z.boolean().optional(),
});
export type OuterWallConstructionType = z.infer<typeof OuterWallConstructionTypeSchema>;

export const DETOuterWallConfigSchema = z.object({
  constructionTypes: z.array(OuterWallConstructionTypeSchema),
  defaultConstructionType: yearBands(z.string()),
  uValue: keyedValues(z.string(), yearBands(z.number())),
  thermalConductivity: z.number(),
  assumedInsulationThickness: z.number(),
  heatLossFactor: z.number(),
});

export type DETOuterWallConfig = z.infer<typeof DETOuterWallConfigSchema>;
