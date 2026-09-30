import { z } from "zod";
import { DETGeneralInputSchema } from "./general.js";
import { DETHeatInputSchema } from "./heat.js";
import { DETElectricityInputSchema } from "./electricity.js";
import { DETRoofInputSchema } from "./roof.js";
import { DETRoofWindowsInputSchema } from "./roofWindows.js";
import { DETExteriorWallWindowsInputSchema } from "./exteriorWallWindows.js";
import { DETTopFloorInputSchema } from "./topFloor.js";
import { DETOuterWallInputSchema } from "./outerWall.js";
import { DETBottomFloorInputSchema } from "./bottomFloor.js";
import { PreRenovationValuesSchema } from "./preRenovation.js";

export const DETInputSchema = z.object({
  general: DETGeneralInputSchema,
  heat: DETHeatInputSchema,
  electricity: DETElectricityInputSchema,
  roof: DETRoofInputSchema,
  roofWindows: DETRoofWindowsInputSchema,
  exteriorWallWindows: DETExteriorWallWindowsInputSchema,
  topFloor: DETTopFloorInputSchema,
  outerWall: DETOuterWallInputSchema,
  bottomFloor: DETBottomFloorInputSchema,
  preRenovationValues: PreRenovationValuesSchema.nullable().optional(),
});

export type DETInput = z.infer<typeof DETInputSchema>;
