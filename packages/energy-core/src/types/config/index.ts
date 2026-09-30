import { z } from "zod";
import { DETGeneralConfigSchema } from "./general.js";
import { DETHeatConfigSchema } from "./heat.js";
import { DETRoofConfigSchema } from "./roof.js";
import { DETTopFloorConfigSchema } from "./topFloor.js";
import { DETOuterWallConfigSchema } from "./outerWall.js";
import { DETBottomFloorConfigSchema } from "./bottomFloor.js";
import { DETWindowsConfigSchema } from "./windows.js";
import { DETRenovationConfigSchema } from "../renovation/renovation.js";

export const DETConfigSchema = z.object({
  general: DETGeneralConfigSchema,
  heat: DETHeatConfigSchema,
  roof: DETRoofConfigSchema,
  topFloor: DETTopFloorConfigSchema,
  outerWall: DETOuterWallConfigSchema,
  bottomFloor: DETBottomFloorConfigSchema,
  windows: DETWindowsConfigSchema,
  renovation: DETRenovationConfigSchema,
});

export type DETConfig = z.infer<typeof DETConfigSchema>;
