import { z } from "zod";

export const HeatFlowDirection = {
  UPWARD: "upward",
  HORIZONTAL: "horizontal",
  DOWNWARD: "downward",
} as const;

export const HeatFlowDirectionSchema = z.nativeEnum(HeatFlowDirection);
export type HeatFlowDirection = z.infer<typeof HeatFlowDirectionSchema>;
