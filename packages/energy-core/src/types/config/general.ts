import { z } from "zod";
import { BuildingTypeSchema } from "../building-type.js";
import { keyedValues } from "../keyed-values.js";
import { EnergyEfficiencyClassSchema } from "../energy-efficiency-class.js";
import { rangeBands, RangesSchema } from "../range-bands.js";

export const DETGeneralConfigSchema = z.object({
  supportedLocales: z.array(z.string()),
  generalYearBands: RangesSchema,
  energyEfficiencyClasses: rangeBands(EnergyEfficiencyClassSchema),
  energyEfficiencyClassColors: keyedValues(EnergyEfficiencyClassSchema, z.string()),

  assumedFloorSlabThickness: z.number(),
  assumedInteriorStoryHeight: z.number(),
  defaultNumberOfApartments: keyedValues(BuildingTypeSchema, z.number().int().positive()),
  defaultPeoplePerApartment: z.number().positive(),

  heatedAirVolumeCorrectionFactor: rangeBands(z.number()),
  usableFloorAreaFactor: z.number(),

  netFloorAreaFromUsableFloorAreaFactor: keyedValues(
    BuildingTypeSchema,
    keyedValues(z.boolean(), z.number()),
  ),
  netFloorAreaFromLivingAreaFactor: z.number(),
});

export type DETGeneralConfig = z.infer<typeof DETGeneralConfigSchema>;
